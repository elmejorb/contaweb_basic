import React, { useState } from 'react';
import { ShoppingCartIcon, SearchIcon, DotsVerticalIcon, EditIcon, TrashIcon, EyeIcon, CheckCircleIcon } from '../components/icons/IconComponents';

interface PageProps {
  setActivePage: (page: string) => void;
}

interface Order {
  id: number;
  orderNumber: string;
  clientName: string;
  clientNit: string;
  date: string;
  total: number;
  status: 'Pendiente' | 'Confirmado' | 'Facturado' | 'Cancelado';
  items: number;
}

const DUMMY_ORDERS: Order[] = [
  {
    id: 1,
    orderNumber: 'PED-001',
    clientName: 'Constructora XYZ S.A.S',
    clientNit: '900.123.456-7',
    date: '2024-11-20',
    total: 2450000,
    status: 'Pendiente',
    items: 5
  },
  {
    id: 2,
    orderNumber: 'PED-002',
    clientName: 'Ana María López',
    clientNit: '1.098.765.432-1',
    date: '2024-11-19',
    total: 850000,
    status: 'Confirmado',
    items: 3
  },
  {
    id: 3,
    orderNumber: 'PED-003',
    clientName: 'Pedro Pérez',
    clientNit: '79.123.456-0',
    date: '2024-11-18',
    total: 1200000,
    status: 'Facturado',
    items: 8
  },
  {
    id: 4,
    orderNumber: 'PED-004',
    clientName: 'Comercial del Caribe',
    clientNit: '890.456.789-2',
    date: '2024-11-17',
    total: 450000,
    status: 'Cancelado',
    items: 2
  }
];

const OrdersListPage: React.FC<PageProps> = ({ setActivePage }) => {
  const [orders] = useState<Order[]>(DUMMY_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientNit.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmado':
        return 'bg-blue-100 text-blue-800';
      case 'Facturado':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleViewOrder = (orderId: number) => {
    console.log('Ver pedido:', orderId);
    // TODO: Implementar vista de detalle del pedido
  };

  const handleEditOrder = (orderId: number) => {
    console.log('Editar pedido:', orderId);
    // TODO: Implementar edición del pedido
  };

  const handleConvertToInvoice = (orderId: number) => {
    console.log('Convertir a factura:', orderId);
    // TODO: Implementar conversión a factura
  };

  const handleCancelOrder = (orderId: number) => {
    if (confirm('¿Está seguro de cancelar este pedido?')) {
      console.log('Cancelar pedido:', orderId);
      // TODO: Implementar cancelación del pedido
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Listado de Pedidos</h1>
            <p className="text-sm text-gray-500">Gestiona los pedidos de tus clientes</p>
          </div>
        </div>
        <button
          onClick={() => setActivePage('Nuevo Pedido')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ShoppingCartIcon className="h-5 w-5" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente o NIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Facturado">Facturado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron pedidos
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{order.clientName}</div>
                    <div className="text-sm text-gray-500">{order.clientNit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.items}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <DotsVerticalIcon className="h-5 w-5 text-gray-500" />
                      </button>

                      {openMenuId === order.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleViewOrder(order.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <EyeIcon className="h-4 w-4" />
                                <span>Ver detalles</span>
                              </button>

                              {order.status === 'Pendiente' && (
                                <>
                                  <button
                                    onClick={() => {
                                      handleEditOrder(order.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                  >
                                    <EditIcon className="h-4 w-4" />
                                    <span>Editar pedido</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleCancelOrder(order.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                    <span>Cancelar pedido</span>
                                  </button>
                                </>
                              )}

                              {order.status === 'Confirmado' && (
                                <button
                                  onClick={() => {
                                    handleConvertToInvoice(order.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center space-x-2"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                  <span>Convertir a factura</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Pedidos</p>
            <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredOrders.filter(o => o.status === 'Pendiente').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Confirmados</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredOrders.filter(o => o.status === 'Confirmado').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Facturados</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredOrders.filter(o => o.status === 'Facturado').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersListPage;
