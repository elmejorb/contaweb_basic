import React, { useState, useEffect, useRef, FC } from 'react';
import { Chart } from 'chart.js/auto';
import { ventaService, ReporteMensualResponse } from '../services/ventaService';
import { PrintIcon, DownloadIcon } from '../components/icons/IconComponents';

interface PageProps {
  setActivePage: (page: string) => void;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatDate = (fecha: string): string => {
  const [y, m, d] = fecha.split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
};

const getUserEmpresa = () => {
  const id = localStorage.getItem('empresa_activa_id');
  if (id) return parseInt(id);
  const userData = localStorage.getItem('user_data');
  if (userData) return JSON.parse(userData).id_empresa || 1;
  return 1;
};

const VentasDiariasChart: FC<{ datos: ReporteMensualResponse['ventas_por_dia'] }> = ({ datos }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || datos.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) chartRef.current.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(d => {
          const parts = d.fecha.split('T')[0].split('-');
          return parseInt(parts[2]).toString();
        }),
        datasets: [
          {
            label: 'Contado',
            data: datos.map(d => d.contado),
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderRadius: 4,
          },
          {
            label: 'Credito',
            data: datos.map(d => d.credito),
            backgroundColor: 'rgba(96, 165, 250, 0.7)',
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle' } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw as number)}`
            }
          }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
          y: {
            stacked: true,
            grid: { color: '#e2e8f0' },
            ticks: {
              color: '#64748b',
              callback: (v) => typeof v === 'number' ? (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v.toString()) : v
            }
          }
        }
      }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [datos]);

  return <canvas ref={canvasRef}></canvas>;
};

const FormaPagoChart: FC<{ datos: ReporteMensualResponse['por_forma_pago'] }> = ({ datos }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || datos.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) chartRef.current.destroy();

    const colores: Record<string, string> = {
      'contado': '#22c55e', 'efectivo': '#22c55e', 'credito': '#60a5fa',
      'tarjeta': '#f59e0b', 'transferencia': '#8b5cf6', 'nequi': '#e11d48'
    };

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: datos.map(d => (d.forma_pago || 'Otro').charAt(0).toUpperCase() + (d.forma_pago || 'otro').slice(1)),
        datasets: [{
          data: datos.map(d => d.total),
          backgroundColor: datos.map(d => colores[d.forma_pago] || '#94a3b8'),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 15 } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw as number)}` } }
        },
        cutout: '60%'
      }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [datos]);

  return <canvas ref={canvasRef}></canvas>;
};

const ReporteMensualPage: FC<PageProps> = () => {
  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [reporte, setReporte] = useState<ReporteMensualResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const cargarReporte = async (a: number, m: number) => {
    setLoading(true);
    try {
      const resp = await ventaService.reporteMensual({ id_empresa: getUserEmpresa(), anio: a, mes: m });
      setReporte(resp);
    } catch (e) {
      console.error('Error cargando reporte:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarReporte(anio, mes); }, [anio, mes]);

  const cambiarMes = (delta: number) => {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAnio++; }
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAnio--; }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
  };

  const cambioVentas = reporte && reporte.mes_anterior.total > 0
    ? ((reporte.total_mes.total - reporte.mes_anterior.total) / reporte.mes_anterior.total * 100)
    : null;

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5 print:space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reporte Mensual de Ventas</h2>
          <p className="text-sm text-gray-500 mt-1">{MESES[mes - 1]} {anio}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => cambiarMes(-1)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            &larr; Anterior
          </button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            {MESES.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
          </select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => cambiarMes(1)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Siguiente &rarr;
          </button>
          <button onClick={handlePrint} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-1 print:hidden">
            <PrintIcon className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : reporte ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-xs font-medium text-gray-500 uppercase">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(reporte.total_mes.total)}</p>
              {cambioVentas !== null && (
                <p className={`text-xs font-semibold mt-1 ${cambioVentas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cambioVentas >= 0 ? '+' : ''}{cambioVentas.toFixed(1)}% vs mes anterior
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-xs font-medium text-gray-500 uppercase">Utilidad Neta</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(reporte.total_mes.utilidad)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Margen: {reporte.total_mes.total > 0 ? ((reporte.total_mes.utilidad / reporte.total_mes.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-xs font-medium text-gray-500 uppercase">Facturas</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{reporte.total_mes.cantidad}</p>
              <p className="text-xs text-gray-500 mt-1">
                Promedio: {reporte.total_mes.cantidad > 0 ? formatCurrency(reporte.total_mes.total / reporte.total_mes.cantidad) : '$0'}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-xs font-medium text-gray-500 uppercase">Mes Anterior</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{formatCurrency(reporte.mes_anterior.total)}</p>
              <p className="text-xs text-gray-500 mt-1">{reporte.mes_anterior.cantidad} facturas</p>
            </div>
          </div>

          {/* Contado vs Credito summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-green-600">Ventas de Contado</p>
                  <p className="text-xl font-bold text-green-800 mt-1">{formatCurrency(reporte.total_mes.contado)}</p>
                </div>
                <span className="text-2xl font-bold text-green-300">
                  {reporte.total_mes.total > 0 ? ((reporte.total_mes.contado / reporte.total_mes.total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-600">Ventas a Credito</p>
                  <p className="text-xl font-bold text-blue-800 mt-1">{formatCurrency(reporte.total_mes.credito)}</p>
                </div>
                <span className="text-2xl font-bold text-blue-300">
                  {reporte.total_mes.total > 0 ? ((reporte.total_mes.credito / reporte.total_mes.total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas Diarias</h3>
              <div className="h-64">
                {reporte.ventas_por_dia.length > 0 ? (
                  <VentasDiariasChart datos={reporte.ventas_por_dia} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">Sin datos</div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Forma de Pago</h3>
              <div className="h-64">
                {reporte.por_forma_pago.length > 0 ? (
                  <FormaPagoChart datos={reporte.por_forma_pago} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">Sin datos</div>
                )}
              </div>
            </div>
          </div>

          {/* Top Clientes */}
          {reporte.top_clientes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Top 10 Clientes del Mes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase text-center">Facturas</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase text-right">Total</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase text-right">% del Mes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.top_clientes.map((c, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-500 font-medium">{i + 1}</td>
                        <td className="px-5 py-3 font-medium text-gray-800">{c.cliente || 'Cliente General'}</td>
                        <td className="px-5 py-3 text-center text-gray-600">{c.cantidad_ventas}</td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-800">{formatCurrency(c.total)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {reporte.total_mes.total > 0 ? ((c.total / reporte.total_mes.total) * 100).toFixed(1) : 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detalle diario */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Detalle Diario</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Facturas</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Contado</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Credito</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Total</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Utilidad</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.ventas_por_dia.map((d, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-700 font-medium">{formatDate(d.fecha)}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{d.cantidad}</td>
                      <td className="px-4 py-2.5 text-right text-green-700">{formatCurrency(d.contado)}</td>
                      <td className="px-4 py-2.5 text-right text-blue-700">{formatCurrency(d.credito)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{formatCurrency(d.total)}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-700">{formatCurrency(d.utilidad)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">
                        {d.total > 0 ? ((d.utilidad / d.total) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr className="border-t-2">
                    <td className="px-4 py-3 text-gray-800">TOTAL</td>
                    <td className="px-4 py-3 text-center text-gray-800">{reporte.total_mes.cantidad}</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatCurrency(reporte.total_mes.contado)}</td>
                    <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(reporte.total_mes.credito)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(reporte.total_mes.total)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(reporte.total_mes.utilidad)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {reporte.total_mes.total > 0 ? ((reporte.total_mes.utilidad / reporte.total_mes.total) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Impuestos y Descuentos */}
          {(reporte.total_mes.impuestos > 0 || reporte.total_mes.descuentos > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm font-medium text-amber-600">Total Impuestos</p>
                <p className="text-xl font-bold text-amber-800 mt-1">{formatCurrency(reporte.total_mes.impuestos)}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm font-medium text-purple-600">Total Descuentos</p>
                <p className="text-xl font-bold text-purple-800 mt-1">{formatCurrency(reporte.total_mes.descuentos)}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-400 py-16">No se pudo cargar el reporte</div>
      )}
    </div>
  );
};

export default ReporteMensualPage;
