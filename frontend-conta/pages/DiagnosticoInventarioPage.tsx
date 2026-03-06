import React, { useState, useEffect, useMemo, useRef, useCallback, FC } from 'react';
import { Chart } from 'chart.js/auto';
import { productoService, ProductoDiagnostico } from '../services/productoService';
import { SearchIcon } from '../components/icons/IconComponents';

interface PageProps {
  setActivePage: (page: string) => void;
}

type FiltroTipo = 'todos' | 'danger' | 'warning' | 'success' | 'info' | 'revisar';
type SortKey = 'nombre' | 'existencia' | 'precio_costo' | 'precio_venta' | 'margen' | 'unidades_vendidas' | 'veces_vendido' | 'capital_invertido';
type SortDir = 'asc' | 'desc';

const FILTROS: { key: FiltroTipo; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: 'todos', label: 'Todos', color: 'text-white', bgColor: 'bg-indigo-600', borderColor: 'border-indigo-600' },
  { key: 'danger', label: 'Problemas graves', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-300' },
  { key: 'warning', label: 'Requiere atención', color: 'text-yellow-700', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300' },
  { key: 'success', label: 'Alta rot. / Buen margen', color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
  { key: 'info', label: 'Aceptable', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  { key: 'revisar', label: 'Sin clasificar', color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' },
];

const TIPO_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  success: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  warning: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  danger: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  info: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  ok: { dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' },
};

const MARGEN_OBJETIVO = 25; // margen % objetivo para sugerencias

const formatCurrency = (value: number): string => {
  return '$ ' + value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const calcularPrecioSugerido = (precioCosto: number, margenObjetivo: number): number => {
  if (precioCosto <= 0) return 0;
  return Math.ceil(precioCosto / (1 - margenObjetivo / 100));
};

const MargenBadge: FC<{ margen: number }> = ({ margen }) => {
  let bg = 'bg-green-100 text-green-800';
  if (margen <= 0) bg = 'bg-red-100 text-red-800';
  else if (margen < 15) bg = 'bg-red-100 text-red-700';
  else if (margen < 25) bg = 'bg-yellow-100 text-yellow-700';
  else if (margen > 80) bg = 'bg-purple-100 text-purple-700';

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bg}`}>
      {margen.toFixed(2)}%
    </span>
  );
};

const SortIcon: FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => (
  <span className={`inline-block ml-1 ${active ? 'text-yellow-300' : 'text-indigo-300'}`}>
    {active ? (dir === 'asc' ? '\u25B2' : '\u25BC') : '\u25BC'}
  </span>
);

// --- Donut Chart Component ---
const DiagnosticoDonutChart: FC<{ productos: ProductoDiagnostico[] }> = ({ productos }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || productos.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) chartRef.current.destroy();

    // Count by diagnostico
    const counts: Record<string, number> = {};
    productos.forEach(p => {
      counts[p.diagnostico] = (counts[p.diagnostico] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    // Map diagnostico to colors
    const colorMap: Record<string, string> = {
      'Costo inválido': '#EF4444',
      'Precio ≤ Costo': '#DC2626',
      'Margen sospechoso': '#F59E0B',
      'Alta rot. / Buen margen': '#22C55E',
      'Alta rot. / Margen bajo - Ajustar': '#EAB308',
      'Rotación media / Aceptable': '#3B82F6',
      'Rotación media / Bajo': '#F97316',
      'Baja rot. / Aceptable': '#6366F1',
      'Baja rot. / Insuficiente': '#BE123C',
    };

    const bgColors = labels.map(l => colorMap[l] || '#9CA3AF');

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { size: 11 },
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 10,
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          }
        }
      }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [productos]);

  return <canvas ref={canvasRef} />;
};

// --- Main Page ---
const DiagnosticoInventarioPage: FC<PageProps> = ({ setActivePage }) => {
  const [productos, setProductos] = useState<ProductoDiagnostico[]>([]);
  const [contadores, setContadores] = useState({
    total: 0, alta_rotacion: 0, rotacion_media: 0, baja_rotacion: 0, problemas: 0, capital_total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscar, setBuscar] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<FiltroTipo>('todos');
  const [dias, setDias] = useState(30);
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showSugerencias, setShowSugerencias] = useState(false);

  const getUserEmpresa = () => {
    const empresaActivaId = localStorage.getItem('empresa_activa_id');
    if (empresaActivaId) return parseInt(empresaActivaId);
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id_empresa || 1;
    }
    return 1;
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const id_empresa = getUserEmpresa();
      const response = await productoService.diagnostico(id_empresa, dias);
      setProductos(response.productos);
      setContadores(response.contadores);
    } catch (err: any) {
      setError(err.mensaje || 'Error al cargar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [dias]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'nombre' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const productosFiltrados = useMemo(() => {
    let lista = productos;

    if (buscar.trim()) {
      const term = buscar.toLowerCase();
      lista = lista.filter(p =>
        p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term)
      );
    }

    if (filtroActivo !== 'todos') {
      if (filtroActivo === 'revisar') {
        lista = lista.filter(p => p.tipo === 'ok');
      } else {
        lista = lista.filter(p => p.tipo === filtroActivo);
      }
    }

    // Sort
    lista = [...lista].sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return lista;
  }, [productos, buscar, filtroActivo, sortKey, sortDir]);

  // Export CSV
  const exportarCSV = useCallback(() => {
    if (productosFiltrados.length === 0) return;

    const headers = ['Código', 'Artículo', 'Existencia', 'P. Costo', 'P. Venta', 'Margen %', 'Uni. Vendidas', 'Veces Vendido', 'Capital Inv.', 'Rotación', 'Diagnóstico'];
    if (showSugerencias) headers.push('P. Sugerido (25%)');

    const rows = productosFiltrados.map(p => {
      const row = [
        p.codigo,
        `"${p.nombre.replace(/"/g, '""')}"`,
        p.existencia,
        p.precio_costo,
        p.precio_venta,
        p.margen,
        p.unidades_vendidas,
        p.veces_vendido,
        p.capital_invertido,
        p.rotacion,
        `"${p.diagnostico}"`,
      ];
      if (showSugerencias) {
        row.push(p.margen < MARGEN_OBJETIVO && p.precio_costo > 0
          ? calcularPrecioSugerido(p.precio_costo, MARGEN_OBJETIVO)
          : '' as any);
      }
      return row.join(';');
    });

    const bom = '\uFEFF';
    const csv = bom + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostico_inventario_${dias}dias.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [productosFiltrados, dias, showSugerencias]);

  const ThSortable: FC<{ label: string; field: SortKey; align?: string }> = ({ label, field, align }) => (
    <th
      className={`px-4 py-3 font-semibold cursor-pointer hover:bg-indigo-700 transition-colors select-none ${align || ''}`}
      onClick={() => handleSort(field)}
    >
      {label}
      <SortIcon active={sortKey === field} dir={sortDir} />
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Diagnóstico de Inventario ({dias} días)</h1>
          <p className="text-gray-500 mt-1">Análisis de salud del inventario y márgenes de utilidad</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={dias}
            onChange={(e) => setDias(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={7}>7 días</option>
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </select>
          <button
            onClick={() => setShowSugerencias(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
              showSugerencias
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Sugerencias
          </button>
          <button
            onClick={exportarCSV}
            disabled={productosFiltrados.length === 0}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </button>
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refrescar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre de artículo o código..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => {
          // Count per filter
          let count = 0;
          if (f.key === 'todos') count = productos.length;
          else if (f.key === 'revisar') count = productos.filter(p => p.tipo === 'ok').length;
          else count = productos.filter(p => p.tipo === f.key).length;

          return (
            <button
              key={f.key}
              onClick={() => setFiltroActivo(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filtroActivo === f.key
                  ? `${f.bgColor} ${f.color} ${f.borderColor} shadow-sm`
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label} <span className="ml-1 opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Contadores + Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contadores */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Mostrando</span>
            <span className="text-xl font-bold text-gray-800">{productosFiltrados.length} / {contadores.total}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Alta rotación</span>
            <span className="text-xl font-bold text-green-600">{contadores.alta_rotacion}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Rotación media</span>
            <span className="text-xl font-bold text-blue-600">{contadores.rotacion_media}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Baja rotación</span>
            <span className="text-xl font-bold text-gray-600">{contadores.baja_rotacion}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Problemas</span>
            <span className="text-xl font-bold text-red-600">{contadores.problemas}</span>
          </div>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl px-5 py-4 text-white">
            <div className="text-sm text-indigo-100">Capital invertido</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(contadores.capital_total)}</div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Distribución de diagnósticos</h3>
          <div className="h-72">
            {productos.length > 0 ? (
              <DiagnosticoDonutChart productos={productos} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">Sin datos</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-600 text-white text-left">
                  <ThSortable label="ARTÍCULO" field="nombre" />
                  <ThSortable label="EXIST." field="existencia" align="text-center" />
                  <ThSortable label="P. COSTO" field="precio_costo" align="text-right" />
                  <ThSortable label="P. VENTA" field="precio_venta" align="text-right" />
                  <ThSortable label="MARGEN %" field="margen" align="text-center" />
                  <ThSortable label="UNI. VEND." field="unidades_vendidas" align="text-center" />
                  <ThSortable label="VECES" field="veces_vendido" align="text-center" />
                  <ThSortable label="CAPITAL INV." field="capital_invertido" align="text-right" />
                  {showSugerencias && (
                    <th className="px-4 py-3 font-semibold text-right">P. SUGERIDO</th>
                  )}
                  <th className="px-4 py-3 font-semibold">DIAGNÓSTICO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={showSugerencias ? 10 : 9} className="px-4 py-12 text-center text-gray-400">
                      No se encontraron productos con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p) => {
                    const colors = TIPO_COLORS[p.tipo] || TIPO_COLORS.ok;
                    const precioSugerido = p.margen < MARGEN_OBJETIVO && p.precio_costo > 0
                      ? calcularPrecioSugerido(p.precio_costo, MARGEN_OBJETIVO)
                      : null;
                    const diferenciaVenta = precioSugerido ? precioSugerido - p.precio_venta : 0;

                    return (
                      <tr key={p.id_producto} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{p.nombre}</div>
                          {p.codigo && (
                            <div className="text-xs text-gray-400">{p.codigo}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          <span className={p.existencia === 0 ? 'text-red-500 font-semibold' : 'text-gray-700'}>
                            {p.existencia}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700">
                          {formatCurrency(p.precio_costo)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700">
                          {formatCurrency(p.precio_venta)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <MargenBadge margen={p.margen} />
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-gray-700">
                          {p.unidades_vendidas}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-gray-700">
                          {p.veces_vendido}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700">
                          {formatCurrency(p.capital_invertido)}
                        </td>
                        {showSugerencias && (
                          <td className="px-4 py-3 text-right font-mono">
                            {precioSugerido ? (
                              <div>
                                <div className="text-amber-700 font-semibold">{formatCurrency(precioSugerido)}</div>
                                <div className="text-xs text-amber-500">+{formatCurrency(diferenciaVenta)}</div>
                              </div>
                            ) : (
                              <span className="text-green-500 text-xs">OK</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                            {p.diagnostico}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals footer */}
          {productosFiltrados.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <span className="text-gray-500">
                <strong className="text-gray-800">{productosFiltrados.length}</strong> productos
              </span>
              <span className="text-gray-500">
                Capital: <strong className="text-gray-800">{formatCurrency(productosFiltrados.reduce((s, p) => s + p.capital_invertido, 0))}</strong>
              </span>
              <span className="text-gray-500">
                Uni. vendidas: <strong className="text-gray-800">{productosFiltrados.reduce((s, p) => s + p.unidades_vendidas, 0).toLocaleString('es-CO')}</strong>
              </span>
              <span className="text-gray-500">
                Margen promedio: <strong className="text-gray-800">
                  {(productosFiltrados.reduce((s, p) => s + p.margen, 0) / productosFiltrados.length).toFixed(1)}%
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosticoInventarioPage;
