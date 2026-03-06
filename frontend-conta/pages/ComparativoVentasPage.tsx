import React, { useState, useEffect, useRef } from 'react';
import { ventaService, ComparativoResponse } from '../services/ventaService';
import { Chart } from 'chart.js/auto';

interface PageProps {
  setActivePage: (page: string) => void;
}

const formatMoney = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
const formatPct = (actual: number, anterior: number) => {
  if (!anterior) return actual > 0 ? '+100%' : '0%';
  const pct = ((actual - anterior) / anterior) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
};
const pctColor = (actual: number, anterior: number) => {
  if (!anterior) return actual > 0 ? 'text-green-600' : 'text-gray-400';
  return actual >= anterior ? 'text-green-600' : 'text-red-600';
};

const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ComparativoVentasPage: React.FC<PageProps> = () => {
  const [data, setData] = useState<ComparativoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const barChartRef = useRef<HTMLCanvasElement>(null);
  const dayChartRef = useRef<HTMLCanvasElement>(null);
  const payChartRef = useRef<HTMLCanvasElement>(null);
  const barInstanceRef = useRef<Chart | null>(null);
  const dayInstanceRef = useRef<Chart | null>(null);
  const payInstanceRef = useRef<Chart | null>(null);

  const empresaId = Number(localStorage.getItem('empresa_activa_id'));

  const cargar = async () => {
    if (!empresaId) return;
    setLoading(true);
    setError('');
    try {
      const res = await ventaService.comparativo({ id_empresa: empresaId, anio, mes });
      setData(res);
    } catch (e: any) {
      setError(e.response?.data?.mensaje || 'Error al cargar comparativo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [anio, mes]);

  // Bar chart: monthly comparison
  useEffect(() => {
    if (!data || !barChartRef.current) return;
    barInstanceRef.current?.destroy();
    const ctx = barChartRef.current.getContext('2d');
    if (!ctx) return;
    barInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.mensuales.map(m => m.mes_nombre.substring(0, 3)),
        datasets: [
          { label: `${anio}`, data: data.mensuales.map(m => m.total_actual), backgroundColor: 'rgba(124,58,237,0.7)', borderRadius: 4 },
          { label: `${anio - 1}`, data: data.mensuales.map(m => m.total_anterior), backgroundColor: 'rgba(209,213,219,0.7)', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => '$' + Number(v).toLocaleString() } } },
      },
    });
    return () => { barInstanceRef.current?.destroy(); };
  }, [data]);

  // Day of week chart
  useEffect(() => {
    if (!data || !dayChartRef.current) return;
    dayInstanceRef.current?.destroy();
    const ctx = dayChartRef.current.getContext('2d');
    if (!ctx) return;
    const colors = data.por_dia_semana.map(d => {
      const max = Math.max(...data.por_dia_semana.map(x => x.total));
      const ratio = max > 0 ? d.total / max : 0;
      return `rgba(124,58,237,${0.3 + ratio * 0.7})`;
    });
    dayInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.por_dia_semana.map(d => d.dia),
        datasets: [{ label: 'Total Ventas', data: data.por_dia_semana.map(d => d.total), backgroundColor: colors, borderRadius: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => '$' + Number(v).toLocaleString() } } },
      },
    });
    return () => { dayInstanceRef.current?.destroy(); };
  }, [data]);

  // Payment method pie
  useEffect(() => {
    if (!data || !payChartRef.current) return;
    payInstanceRef.current?.destroy();
    const ctx = payChartRef.current.getContext('2d');
    if (!ctx) return;
    const bgColors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
    payInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.por_forma_pago.map(p => p.forma_pago),
        datasets: [{
          data: data.por_forma_pago.map(p => p.total),
          backgroundColor: bgColors.slice(0, data.por_forma_pago.length),
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    });
    return () => { payInstanceRef.current?.destroy(); };
  }, [data]);

  const exportarCSV = () => {
    if (!data) return;
    const BOM = '\uFEFF';
    let csv = BOM + 'COMPARATIVO DE VENTAS\n\n';

    csv += 'Periodo;Cantidad;Total;Utilidad;Contado;Credito\n';
    csv += `Mes actual;${data.mes_actual.cantidad};${data.mes_actual.total};${data.mes_actual.utilidad};${data.mes_actual.contado};${data.mes_actual.credito}\n`;
    csv += `Mes anterior;${data.mes_anterior.cantidad};${data.mes_anterior.total};${data.mes_anterior.utilidad};${data.mes_anterior.contado};${data.mes_anterior.credito}\n`;
    csv += `Mismo mes ano ant.;${data.mismo_mes_anio_anterior.cantidad};${data.mismo_mes_anio_anterior.total};${data.mismo_mes_anio_anterior.utilidad};${data.mismo_mes_anio_anterior.contado};${data.mismo_mes_anio_anterior.credito}\n\n`;

    csv += 'VENTAS MENSUALES\n';
    csv += 'Mes;Total Actual;Total Anterior;Utilidad;Cantidad\n';
    data.mensuales.forEach(m => {
      csv += `${m.mes_nombre};${m.total_actual};${m.total_anterior};${m.utilidad_actual};${m.cantidad_actual}\n`;
    });

    csv += '\nVENTAS POR DIA DE SEMANA\n';
    csv += 'Dia;Cantidad;Total;Promedio Diario\n';
    data.por_dia_semana.forEach(d => {
      csv += `${d.dia};${d.cantidad};${d.total};${d.promedio_diario}\n`;
    });

    csv += '\nFORMA DE PAGO\n';
    csv += 'Forma;Cantidad;Total\n';
    data.por_forma_pago.forEach(p => {
      csv += `${p.forma_pago};${p.cantidad};${p.total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparativo_ventas_${anio}_${mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button onClick={cargar} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Reintentar</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Comparativo de Ventas</h1>
        <div className="flex items-center gap-2">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            {meses.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={exportarCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mes actual vs anterior */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{meses[mes]} {anio}</h3>
          <p className="text-2xl font-bold text-gray-800">{formatMoney(data.mes_actual.total)}</p>
          <p className="text-sm text-gray-500 mt-1">{data.mes_actual.cantidad} ventas | Utilidad: {formatMoney(data.mes_actual.utilidad)}</p>
          <div className="mt-3 pt-3 border-t flex justify-between text-sm">
            <span className="text-gray-500">vs mes anterior</span>
            <span className={`font-semibold ${pctColor(data.mes_actual.total, data.mes_anterior.total)}`}>
              {formatPct(data.mes_actual.total, data.mes_anterior.total)}
            </span>
          </div>
        </div>

        {/* Mes anterior */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Mes Anterior</h3>
          <p className="text-2xl font-bold text-gray-600">{formatMoney(data.mes_anterior.total)}</p>
          <p className="text-sm text-gray-500 mt-1">{data.mes_anterior.cantidad} ventas | Utilidad: {formatMoney(data.mes_anterior.utilidad)}</p>
          <div className="mt-3 pt-3 border-t flex justify-between text-sm">
            <span className="text-gray-500">Contado / Credito</span>
            <span className="text-gray-600">{formatMoney(data.mes_anterior.contado)} / {formatMoney(data.mes_anterior.credito)}</span>
          </div>
        </div>

        {/* Mismo mes ano anterior */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{meses[mes]} {anio - 1}</h3>
          <p className="text-2xl font-bold text-gray-600">{formatMoney(data.mismo_mes_anio_anterior.total)}</p>
          <p className="text-sm text-gray-500 mt-1">{data.mismo_mes_anio_anterior.cantidad} ventas</p>
          <div className="mt-3 pt-3 border-t flex justify-between text-sm">
            <span className="text-gray-500">vs este ano</span>
            <span className={`font-semibold ${pctColor(data.mes_actual.total, data.mismo_mes_anio_anterior.total)}`}>
              {formatPct(data.mes_actual.total, data.mismo_mes_anio_anterior.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Year comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Acumulado {anio}</h3>
          <p className="text-2xl font-bold text-violet-700">{formatMoney(data.anio_actual.total)}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div><span className="text-gray-400">Utilidad</span><br/><span className="font-medium">{formatMoney(data.anio_actual.utilidad)}</span></div>
            <div><span className="text-gray-400">Contado</span><br/><span className="font-medium text-green-600">{formatMoney(data.anio_actual.contado)}</span></div>
            <div><span className="text-gray-400">Credito</span><br/><span className="font-medium text-orange-600">{formatMoney(data.anio_actual.credito)}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Acumulado {anio - 1}</h3>
          <p className="text-2xl font-bold text-gray-600">{formatMoney(data.anio_anterior.total)}</p>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="text-gray-400">Variacion interanual:</span>
            <span className={`font-bold text-lg ${pctColor(data.anio_actual.total, data.anio_anterior.total)}`}>
              {formatPct(data.anio_actual.total, data.anio_anterior.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly bar chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Ventas Mensuales: {anio} vs {anio - 1}</h3>
          <div style={{ height: '300px' }}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>

        {/* Day of week chart */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Ventas por Dia de la Semana (ultimos 90 dias)</h3>
          <div style={{ height: '300px' }}>
            <canvas ref={dayChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Payment method + Day table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment method */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Ventas por Forma de Pago ({meses[mes]})</h3>
          <div className="flex items-center gap-4">
            <div style={{ width: '200px', height: '200px' }}>
              <canvas ref={payChartRef}></canvas>
            </div>
            <div className="flex-1 space-y-2">
              {data.por_forma_pago.map(p => (
                <div key={p.forma_pago} className="flex justify-between text-sm">
                  <span className="text-gray-600">{p.forma_pago}</span>
                  <div className="text-right">
                    <span className="font-medium">{formatMoney(p.total)}</span>
                    <span className="text-gray-400 ml-2">({p.cantidad})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Day of week table */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Detalle por Dia de Semana</h3>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="py-2 text-left text-xs font-semibold text-gray-500">Dia</th>
                <th className="py-2 text-right text-xs font-semibold text-gray-500">Ventas</th>
                <th className="py-2 text-right text-xs font-semibold text-gray-500">Total</th>
                <th className="py-2 text-right text-xs font-semibold text-gray-500">Prom. Diario</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.por_dia_semana.map(d => {
                const maxTotal = Math.max(...data.por_dia_semana.map(x => x.total));
                const pct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0;
                return (
                  <tr key={d.dia_num}>
                    <td className="py-2 font-medium">{d.dia}</td>
                    <td className="py-2 text-right">{d.cantidad}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="font-medium w-28 text-right">{formatMoney(d.total)}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-gray-500">{formatMoney(d.promedio_diario)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly detail table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold text-gray-600">Detalle Mensual {anio}</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Mes</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Cantidad</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Total {anio}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Total {anio - 1}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Variacion</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Utilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.mensuales.map(m => (
              <tr key={m.mes} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{m.mes_nombre}</td>
                <td className="px-4 py-2 text-right">{m.cantidad_actual}</td>
                <td className="px-4 py-2 text-right font-bold">{formatMoney(m.total_actual)}</td>
                <td className="px-4 py-2 text-right text-gray-500">{formatMoney(m.total_anterior)}</td>
                <td className={`px-4 py-2 text-right font-semibold ${pctColor(m.total_actual, m.total_anterior)}`}>
                  {formatPct(m.total_actual, m.total_anterior)}
                </td>
                <td className="px-4 py-2 text-right text-blue-600">{formatMoney(m.utilidad_actual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparativoVentasPage;
