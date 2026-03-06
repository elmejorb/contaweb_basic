import React, { FC, useEffect, useRef, CSSProperties, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { Chart } from 'chart.js/auto';
import { WalletIcon, CurrencyDollarIcon, ArchiveBoxArrowDownIcon, ChevronDownIcon } from '../components/icons/IconComponents';
import { ventaService, VentaResumenResponse } from '../services/ventaService';
import { productoService } from '../services/productoService';
import { clienteService } from '../services/clienteService';
import { carteraClienteService } from '../services/carteraClienteService';

interface PageProps {
  setActivePage: (page: string) => void;
}

type PeriodoTipo = 'este_mes' | 'mes_anterior' | 'ultimos_3_meses' | 'ultimos_6_meses' | 'este_año';

interface PeriodoOption {
  value: PeriodoTipo;
  label: string;
}

const PERIODOS: PeriodoOption[] = [
  { value: 'este_mes', label: 'Este mes' },
  { value: 'mes_anterior', label: 'Mes anterior' },
  { value: 'ultimos_3_meses', label: 'Últimos 3 meses' },
  { value: 'ultimos_6_meses', label: 'Últimos 6 meses' },
  { value: 'este_año', label: 'Este año' },
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  footerText: string;
  className?: string;
  style?: CSSProperties;
}

const StatCard: FC<StatCardProps> = ({ title, value, change, changeType, icon, footerText, className, style }) => {
  const changeColor = {
    increase: 'text-green-500',
    decrease: 'text-red-500',
    neutral: 'text-slate-500'
  }[changeType];

  return (
    <div
      className={`bg-white p-5 rounded-xl shadow-sm flex items-center space-x-4 ${className || ''}`}
      style={style}
    >
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <div className="flex items-center space-x-1 mt-1">
          <span className={`text-xs font-semibold ${changeColor}`}>{change}</span>
          <span className="text-xs text-slate-400">{footerText}</span>
        </div>
      </div>
    </div>
  );
};

const VentasMensualesChart: FC<{ datos: { mes: string; contado: number; credito: number }[] }> = ({ datos }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!canvasRef.current || datos.length === 0) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const gradient1 = ctx.createLinearGradient(0, 0, 0, 300);
        gradient1.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
        gradient1.addColorStop(1, 'rgba(34, 197, 94, 0)');

        const gradient2 = ctx.createLinearGradient(0, 0, 0, 300);
        gradient2.addColorStop(0, 'rgba(96, 165, 250, 0.3)');
        gradient2.addColorStop(1, 'rgba(96, 165, 250, 0)');

        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: datos.map(d => d.mes),
                datasets: [
                    {
                        label: 'Contado',
                        data: datos.map(d => d.contado),
                        borderColor: '#22c55e',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#22c55e',
                        pointBorderColor: '#fff',
                        pointHoverBorderColor: '#22c55e',
                        pointHoverBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.4,
                        fill: true,
                        backgroundColor: gradient1,
                    },
                    {
                        label: 'Crédito',
                        data: datos.map(d => d.credito),
                        borderColor: '#60a5fa',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#60a5fa',
                        pointBorderColor: '#fff',
                        pointHoverBorderColor: '#60a5fa',
                        pointHoverBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.4,
                        borderDash: [5, 5],
                        fill: true,
                        backgroundColor: gradient2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = formatCurrency(context.raw as number);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e2e8f0' },
                        ticks: {
                            color: '#64748b',
                            callback: (value) => {
                                if (typeof value === 'number') {
                                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                                    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                                }
                                return value;
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [datos]);

    return <canvas ref={canvasRef}></canvas>;
};

const VentasSemanaChart: FC<{ datos: { dia: string; total: number }[] }> = ({ datos }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');

        chartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datos.map(d => d.dia),
                datasets: [{
                    label: 'Ventas',
                    data: datos.map(d => d.total),
                    backgroundColor: gradient,
                    borderColor: '#8B5CF6',
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 30,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return formatCurrency(context.raw as number);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e2e8f0' },
                        ticks: {
                            color: '#64748b',
                            callback: (value) => {
                                if (typeof value === 'number') {
                                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                                    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                                }
                                return value;
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [datos]);

    return <canvas ref={canvasRef}></canvas>;
};

const calcularPorcentajeCambio = (actual: number, anterior: number): { valor: string; tipo: 'increase' | 'decrease' | 'neutral' } => {
  if (anterior === 0) {
    if (actual > 0) return { valor: '+100%', tipo: 'increase' };
    return { valor: '0%', tipo: 'neutral' };
  }
  const cambio = ((actual - anterior) / anterior) * 100;
  if (cambio > 0) return { valor: `+${cambio.toFixed(1)}%`, tipo: 'increase' };
  if (cambio < 0) return { valor: `${cambio.toFixed(1)}%`, tipo: 'decrease' };
  return { valor: '0%', tipo: 'neutral' };
};

// Calcular estadísticas del período seleccionado a partir de ventas_mensuales
const calcularEstadisticasPeriodo = (
  mensuales: VentaResumenResponse['ventas_mensuales'],
  periodo: PeriodoTipo
) => {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1; // 1-12

  let mesesActual: number[] = [];
  let mesesAnterior: number[] = [];

  switch (periodo) {
    case 'este_mes':
      mesesActual = [mesActual];
      mesesAnterior = [mesActual - 1 > 0 ? mesActual - 1 : 12];
      break;
    case 'mes_anterior':
      mesesActual = [mesActual - 1 > 0 ? mesActual - 1 : 12];
      mesesAnterior = [mesActual - 2 > 0 ? mesActual - 2 : 12 + (mesActual - 2)];
      break;
    case 'ultimos_3_meses': {
      for (let i = 0; i < 3; i++) {
        const m = mesActual - i;
        mesesActual.push(m > 0 ? m : 12 + m);
      }
      for (let i = 3; i < 6; i++) {
        const m = mesActual - i;
        mesesAnterior.push(m > 0 ? m : 12 + m);
      }
      break;
    }
    case 'ultimos_6_meses': {
      for (let i = 0; i < 6; i++) {
        const m = mesActual - i;
        mesesActual.push(m > 0 ? m : 12 + m);
      }
      for (let i = 6; i < 12; i++) {
        const m = mesActual - i;
        mesesAnterior.push(m > 0 ? m : 12 + m);
      }
      break;
    }
    case 'este_año':
    default:
      mesesActual = Array.from({ length: 12 }, (_, i) => i + 1);
      // año anterior uses total_anterior
      break;
  }

  const sumar = (meses: number[], campo: 'contado' | 'credito' | 'total' | 'utilidad') =>
    mensuales.filter(m => meses.includes(m.mes)).reduce((acc, m) => acc + m[campo], 0);

  const sumarAnterior = (meses: number[]) =>
    mensuales.filter(m => meses.includes(m.mes)).reduce((acc, m) => acc + m.total_anterior, 0);

  if (periodo === 'este_año') {
    return {
      actual: {
        total: sumar(mesesActual, 'total'),
        contado: sumar(mesesActual, 'contado'),
        credito: sumar(mesesActual, 'credito'),
        utilidad: sumar(mesesActual, 'utilidad'),
      },
      anterior: {
        total: mensuales.reduce((acc, m) => acc + m.total_anterior, 0),
      }
    };
  }

  return {
    actual: {
      total: sumar(mesesActual, 'total'),
      contado: sumar(mesesActual, 'contado'),
      credito: sumar(mesesActual, 'credito'),
      utilidad: sumar(mesesActual, 'utilidad'),
    },
    anterior: {
      total: sumarAnterior(mesesAnterior) || sumar(mesesAnterior, 'total'),
    }
  };
};

const DashboardPage: React.FC<PageProps> = ({ setActivePage }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<VentaResumenResponse | null>(null);
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState(0);
  const [productosStockBajo, setProductosStockBajo] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [ventasSemana, setVentasSemana] = useState<{ dia: string; total: number }[]>([]);
  const [ventasMensuales, setVentasMensuales] = useState<{ mes: string; contado: number; credito: number }[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<PeriodoTipo>('este_mes');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const getUserEmpresa = () => {
    const empresaActivaId = localStorage.getItem('empresa_activa_id');
    if (empresaActivaId) return parseInt(empresaActivaId);
    const userData = localStorage.getItem('user_data');
    if (userData) return JSON.parse(userData).id_empresa || 1;
    return 1;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const id_empresa = getUserEmpresa();

        const [resumenResp, productosResp, clientesResp, carteraResp] = await Promise.all([
          ventaService.resumen(id_empresa),
          productoService.listar({ id_empresa, perPage: 1000 }),
          clienteService.listar({ id_empresa, perPage: 1 }),
          carteraClienteService.resumen(id_empresa).catch(() => null)
        ]);

        setResumen(resumenResp);

        // Ventas últimos 7 días → gráfico semanal
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const hoy = new Date();
        const ventasPorFecha: { [key: string]: number } = {};
        (resumenResp.ventas_semana || []).forEach(v => {
          const fecha = v.fecha.split('T')[0];
          ventasPorFecha[fecha] = Number(v.total) || 0;
        });

        const datosGrafico: { dia: string; total: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const fecha = new Date(hoy);
          fecha.setDate(fecha.getDate() - i);
          const y = fecha.getFullYear();
          const m = String(fecha.getMonth() + 1).padStart(2, '0');
          const d = String(fecha.getDate()).padStart(2, '0');
          const fechaStr = `${y}-${m}-${d}`;
          datosGrafico.push({
            dia: `${diasSemana[fecha.getDay()]} ${fecha.getDate()}`,
            total: ventasPorFecha[fechaStr] || 0,
          });
        }
        setVentasSemana(datosGrafico);

        // Ventas mensuales → gráfico anual
        const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        setVentasMensuales(
          (resumenResp.ventas_mensuales || []).map(m => ({
            mes: mesesNombres[m.mes - 1],
            contado: m.contado,
            credito: m.credito,
          }))
        );

        // Productos con stock bajo
        const conStockBajo = productosResp.productos.filter(
          (p: any) => Number(p.cantidad) <= Number(p.cantidad_minima) && Number(p.cantidad_minima) > 0
        );
        setProductosStockBajo(conStockBajo.length);

        setTotalClientes(clientesResp.total || 0);

        if (carteraResp && !carteraResp.error && carteraResp.resumen) {
          setCuentasPorCobrar(carteraResp.resumen.clientes?.total_por_cobrar || 0);
        }
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const periodoActualLabel = PERIODOS.find(p => p.value === periodoSeleccionado)?.label || 'Este mes';

  const ventasHoy = resumen?.ventas_hoy?.total || 0;
  const ventasMes = resumen?.ventas_mes?.total || 0;
  const utilidadMes = resumen?.ventas_mes?.utilidad || 0;

  // Estadísticas del período
  const estadisticas = resumen
    ? calcularEstadisticasPeriodo(resumen.ventas_mensuales, periodoSeleccionado)
    : { actual: { total: 0, contado: 0, credito: 0, utilidad: 0 }, anterior: { total: 0 } };

  return (
    <div className="space-y-6">
      {/* Header con selector de período */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Resumen de tu negocio</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setDropdownAbierto(!dropdownAbierto)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">{periodoActualLabel}</span>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${dropdownAbierto ? 'rotate-180' : ''}`} />
          </button>
          {dropdownAbierto && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {PERIODOS.map((periodo) => (
                <button
                  key={periodo.value}
                  onClick={() => {
                    setPeriodoSeleccionado(periodo.value);
                    setDropdownAbierto(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-violet-50 transition-colors ${
                    periodoSeleccionado === periodo.value
                      ? 'bg-violet-100 text-violet-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {periodo.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          className="animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
          title="Ventas del Dia"
          value={loading ? 'Cargando...' : formatCurrency(ventasHoy)}
          change={ventasHoy > 0 ? '+' + ((ventasHoy / (ventasMes || 1)) * 100).toFixed(0) + '%' : '0%'}
          changeType={ventasHoy > 0 ? 'increase' : 'neutral'}
          footerText="del mes"
          icon={<div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center"><CurrencyDollarIcon className="w-6 h-6 text-violet-600"/></div>}
        />
        <StatCard
          className="animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
          title="Ventas del Mes"
          value={loading ? 'Cargando...' : formatCurrency(ventasMes)}
          change={`${resumen?.ventas_mes?.cantidad || 0} facturas`}
          changeType="increase"
          footerText="acumulado"
          icon={<div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center"><CurrencyDollarIcon className="w-6 h-6 text-purple-600"/></div>}
        />
        <StatCard
          className="animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
          title="Utilidad del Mes"
          value={loading ? 'Cargando...' : formatCurrency(utilidadMes)}
          change={ventasMes > 0 ? ((utilidadMes / ventasMes) * 100).toFixed(1) + '%' : '0%'}
          changeType={utilidadMes > 0 ? 'increase' : 'neutral'}
          footerText="margen"
          icon={<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center"><WalletIcon className="w-6 h-6 text-emerald-600"/></div>}
        />
        <StatCard
          className="animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
          title="Productos Stock Bajo"
          value={loading ? 'Cargando...' : productosStockBajo.toString()}
          change={productosStockBajo > 0 ? 'Necesitan reorden' : 'Todo OK'}
          changeType={productosStockBajo > 0 ? 'decrease' : 'increase'}
          footerText="items"
          icon={<div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center"><ArchiveBoxArrowDownIcon className="w-6 h-6 text-amber-600"/></div>}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '500ms' }}>
           <div className="flex justify-between items-start mb-4">
              <div>
                 <h3 className="text-xl font-bold text-slate-800">Ventas del Ano</h3>
                 <p className="text-sm text-slate-500">Contado vs Credito por mes</p>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-600 font-medium">
                <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>Contado</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>Credito</span>
              </div>
            </div>
           <div className="h-72">
              {loading ? (
                  <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                  </div>
              ) : ventasMensuales.length > 0 ? (
                  <VentasMensualesChart datos={ventasMensuales} />
              ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                      Sin datos de ventas del ano
                  </div>
              )}
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Ventas de la Semana</h3>
                <span className="text-sm text-slate-500">Ultimos 7 dias</span>
            </div>
            <div className="h-52">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                    </div>
                ) : ventasSemana.length > 0 ? (
                    <VentasSemanaChart datos={ventasSemana} />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        Sin datos de ventas
                    </div>
                )}
            </div>
            {!loading && ventasSemana.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Total semana</span>
                        <span className="text-lg font-bold text-violet-600">
                            {formatCurrency(ventasSemana.reduce((acc, d) => acc + d.total, 0))}
                        </span>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Estadisticas del Periodo */}
      <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in-up" style={{ animationDelay: '650ms' }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Estadisticas del Periodo</h3>
            <p className="text-sm text-slate-500">{periodoActualLabel} vs periodo anterior</p>
          </div>
          {loading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Ventas */}
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-violet-600 font-medium">Total Ventas</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                calcularPorcentajeCambio(estadisticas.actual.total, estadisticas.anterior.total).tipo === 'increase'
                  ? 'bg-green-100 text-green-700'
                  : calcularPorcentajeCambio(estadisticas.actual.total, estadisticas.anterior.total).tipo === 'decrease'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {calcularPorcentajeCambio(estadisticas.actual.total, estadisticas.anterior.total).valor}
              </span>
            </div>
            <p className="text-xl font-bold text-violet-800">
              {loading ? '...' : formatCurrency(estadisticas.actual.total)}
            </p>
            <p className="text-xs text-violet-500 mt-1">
              Anterior: {formatCurrency(estadisticas.anterior.total)}
            </p>
          </div>

          {/* Ventas Contado */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-600 font-medium">Ventas Contado</span>
            </div>
            <p className="text-xl font-bold text-green-800">
              {loading ? '...' : formatCurrency(estadisticas.actual.contado)}
            </p>
            <p className="text-xs text-green-500 mt-1">
              {estadisticas.actual.total > 0 ? ((estadisticas.actual.contado / estadisticas.actual.total) * 100).toFixed(1) : 0}% del total
            </p>
          </div>

          {/* Ventas Credito */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-600 font-medium">Ventas Credito</span>
            </div>
            <p className="text-xl font-bold text-blue-800">
              {loading ? '...' : formatCurrency(estadisticas.actual.credito)}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              {estadisticas.actual.total > 0 ? ((estadisticas.actual.credito / estadisticas.actual.total) * 100).toFixed(1) : 0}% del total
            </p>
          </div>

          {/* Utilidad */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-amber-600 font-medium">Utilidad</span>
            </div>
            <p className="text-xl font-bold text-amber-800">
              {loading ? '...' : formatCurrency(estadisticas.actual.utilidad)}
            </p>
            <p className="text-xs text-amber-500 mt-1">
              Margen: {estadisticas.actual.total > 0 ? ((estadisticas.actual.utilidad / estadisticas.actual.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Barra de resumen */}
        {!loading && estadisticas.actual.total > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Proporcion Contado vs Credito</span>
              <span className="text-gray-700 font-medium">
                {((estadisticas.actual.contado / estadisticas.actual.total) * 100).toFixed(1)}% / {((estadisticas.actual.credito / estadisticas.actual.total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 h-full transition-all duration-500"
                style={{ width: `${(estadisticas.actual.contado / estadisticas.actual.total) * 100}%` }}
              />
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${(estadisticas.actual.credito / estadisticas.actual.total) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-green-600">Contado: {formatCurrency(estadisticas.actual.contado)}</span>
              <span className="text-blue-600">Credito: {formatCurrency(estadisticas.actual.credito)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Resumen Anual */}
      {!loading && resumen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm p-6 text-white animate-fade-in-up" style={{ animationDelay: '670ms' }}>
            <h3 className="text-lg font-semibold opacity-90">Total Ventas {new Date().getFullYear()}</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(resumen.anio_actual.total)}</p>
            <div className="mt-4 flex items-center gap-4 text-sm opacity-80">
              <span>Contado: {formatCurrency(resumen.anio_actual.contado)}</span>
              <span>Credito: {formatCurrency(resumen.anio_actual.credito)}</span>
            </div>
            {resumen.anio_anterior.total > 0 && (
              <div className="mt-2 text-sm opacity-70">
                Ano anterior: {formatCurrency(resumen.anio_anterior.total)}
                {' '}({calcularPorcentajeCambio(resumen.anio_actual.total, resumen.anio_anterior.total).valor})
              </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-sm p-6 text-white animate-fade-in-up" style={{ animationDelay: '680ms' }}>
            <h3 className="text-lg font-semibold opacity-90">Utilidad {new Date().getFullYear()}</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(resumen.anio_actual.utilidad)}</p>
            <div className="mt-4 text-sm opacity-80">
              <span>Margen: {resumen.anio_actual.total > 0 ? ((resumen.anio_actual.utilidad / resumen.anio_actual.total) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="mt-2 text-sm opacity-70">
              {totalClientes} clientes registrados
            </div>
          </div>
        </div>
      )}

      {/* Cuentas por Cobrar Card */}
      {cuentasPorCobrar > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-sm p-6 animate-fade-in-up" style={{ animationDelay: '690ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Cuentas por Cobrar</h3>
              <p className="text-sm text-red-600 mt-1">Total pendiente de clientes</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-700">{formatCurrency(cuentasPorCobrar)}</p>
              <button
                onClick={() => setActivePage('Cartera de Clientes')}
                className="text-sm text-red-600 hover:text-red-800 underline mt-1"
              >
                Ver detalles →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
