
import React, { useState, useMemo, FC, useRef, useEffect } from 'react';
import { PlusIcon, SaveIcon, PrintIcon, CancelIcon, TrashIcon, SearchIcon, XIcon, ShoppingCartIcon } from '../components/icons/IconComponents';

interface PageProps {
  setActivePage: (page: string) => void;
}

// --- TYPES ---
interface Client {
  id: number;
  code: string;
  name: string;
  nit: string;
  phone: string;
  address: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  stock: number;
}

interface OrderItem {
  id: string;
  product: Product | null;
  productCode: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: 'percent' | 'amount';
}

// --- DUMMY DATA ---
const DUMMY_CLIENTS: Client[] = [
  { id: 1, code: 'C001', name: 'Constructora XYZ S.A.S', nit: '900.123.456-7', phone: '3101234567', address: 'Calle 10 # 20-30' },
  { id: 2, code: 'C002', name: 'Ana María López', nit: '1.098.765.432-1', phone: '3157654321', address: 'Carrera 5 # 15-25' },
  { id: 3, code: 'C003', name: 'Pedro Pérez', nit: '79.123.456-0', phone: '3009876543', address: 'Avenida Siempre Viva 123' },
];

const DUMMY_PRODUCTS: Product[] = [
  { id: 1, code: 'P001', name: 'Cemento Gris 50kg', price: 28000, stock: 150 },
  { id: 2, code: 'P002', name: 'Ladrillo Prensado', price: 800, stock: 12000 },
  { id: 3, code: 'P003', name: 'Varilla de Acero 1/2"', price: 35000, stock: 300 },
  { id: 4, code: 'P004', name: 'Arena por Metro Cúbico', price: 90000, stock: 50 },
  { id: 5, code: 'P005', name: 'Teja de Barro', price: 1500, stock: 4500 },
  { id: 6, code: 'P006', name: 'Pintura Blanca 5G', price: 125000, stock: 40 },
];

// --- HELPER COMPONENTS ---
const InputGroup: FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="mb-1 text-sm font-medium text-gray-600">{label}</label>
    {children}
  </div>
);

const ClientSearchModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
}> = ({ isOpen, onClose, onSelectClient }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredClients = DUMMY_CLIENTS.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nit.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl transform transition-all"
           style={{maxHeight: '90vh'}}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center"><SearchIcon className="h-6 w-6 mr-2"/>Buscar Cliente</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="h-6 w-6 text-gray-600"/>
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="overflow-y-auto" style={{maxHeight: 'calc(90vh - 150px)'}}>
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIT/Cédula</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map(client => (
                <tr key={client.id} onClick={() => onSelectClient(client)} className="hover:bg-blue-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.nit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProductSearchModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}> = ({ isOpen, onClose, onSelectProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredProducts = DUMMY_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl transform transition-all"
           style={{maxHeight: '90vh'}}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <SearchIcon className="h-6 w-6 mr-2"/>Buscar Producto
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="h-6 w-6 text-gray-600"/>
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="overflow-y-auto" style={{maxHeight: 'calc(90vh - 150px)'}}>
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} onClick={() => onSelectProduct(product)} className="hover:bg-blue-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{product.code}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{product.stock}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN ORDERS PAGE COMPONENT ---
const OrdersPage: React.FC<PageProps> = ({ setActivePage }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [currentItemIdForSearch, setCurrentItemIdForSearch] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState('Contado');
  const [items, setItems] = useState<OrderItem[]>([
    { id: `item-${Date.now()}`, product: null, productCode: '', productName: '', quantity: 1, price: 0, discount: 0, discountType: 'percent' }
  ]);

  const [priceDisplayValues, setPriceDisplayValues] = useState<{ [key: string]: string }>({});
  const [priceFocusedItem, setPriceFocusedItem] = useState<string | null>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(false);
  };

  const handleOpenProductSearch = (itemId: string) => {
    setCurrentItemIdForSearch(itemId);
    setIsProductModalOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    if (currentItemIdForSearch) {
      setItems(prevItems => prevItems.map(item => {
        if (item.id === currentItemIdForSearch) {
          return {
            ...item,
            product: product,
            productName: product.name,
            price: product.price,
            productCode: product.code
          };
        }
        return item;
      }));
    }
    setIsProductModalOpen(false);
    setCurrentItemIdForSearch(null);

    // Enfocar el campo de cantidad después de seleccionar el producto
    setTimeout(() => {
      if (currentItemIdForSearch) {
        const quantityInput = document.getElementById(`quantity-${currentItemIdForSearch}`);
        if (quantityInput) {
          quantityInput.focus();
          (quantityInput as HTMLInputElement).select();
        }
      }
    }, 50);
  };

  const formatPriceForDisplay = (price: number): string => {
    if (price === 0) return '';
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handlePriceFocus = (itemId: string, e: React.FocusEvent<HTMLInputElement>) => {
    setPriceFocusedItem(itemId);
    // Usar setTimeout para seleccionar después de que el valor cambie
    setTimeout(() => {
      e.target.select();
    }, 0);
  };

  const handlePriceBlur = (itemId: string, price: number) => {
    setPriceFocusedItem(null);
    setPriceDisplayValues(prev => ({
      ...prev,
      [itemId]: formatPriceForDisplay(price)
    }));
  };

  const getPriceDisplayValue = (itemId: string, price: number): string => {
    if (priceFocusedItem === itemId) {
      return price === 0 ? '' : price.toString();
    }
    return priceDisplayValues[itemId] !== undefined
      ? priceDisplayValues[itemId]
      : formatPriceForDisplay(price);
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if(field === 'productName') {
            // Autocomplete logic: if the name matches exactly, fill other fields
            const foundProduct = DUMMY_PRODUCTS.find(p => p.name.toLowerCase() === value.toLowerCase());
            if(foundProduct){
                updatedItem.product = foundProduct;
                updatedItem.price = foundProduct.price;
                updatedItem.productCode = foundProduct.code;
            } else {
                 updatedItem.product = null;
                 if(value === '') {
                    updatedItem.price = 0;
                    updatedItem.productCode = '';
                 }
            }
        }
        return updatedItem;
      }
      return item;
    }));
  };
  
  const toggleDiscountType = (id: string) => {
      setItems(prevItems => prevItems.map(item => {
          if (item.id === id) {
              return { ...item, discountType: item.discountType === 'percent' ? 'amount' : 'percent' };
          }
          return item;
      }));
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, field: string, itemId: string) => {
      if (e.key === 'Enter') {
          e.preventDefault();

          // Lógica para búsqueda por Código
          if (field === 'productCode') {
              const code = e.currentTarget.value.trim();
              const foundProduct = DUMMY_PRODUCTS.find(p => p.code.toLowerCase() === code.toLowerCase());

              if (foundProduct) {
                   setItems(prevItems => prevItems.map(item => {
                      if (item.id === itemId) {
                        return {
                          ...item,
                          product: foundProduct,
                          productName: foundProduct.name,
                          price: foundProduct.price,
                          productCode: foundProduct.code 
                        };
                      }
                      return item;
                    }));
                    
                    // Pasar el foco al campo de cantidad
                    setTimeout(() => {
                        const quantityInput = document.getElementById(`quantity-${itemId}`);
                        if (quantityInput) {
                            quantityInput.focus();
                            (quantityInput as HTMLInputElement).select();
                        }
                    }, 50);
              } else {
                  // Limpiar datos si no se encuentra
                  setItems(prevItems => prevItems.map(item => {
                      if (item.id === itemId) {
                        return {
                          ...item,
                          product: null,
                          productName: '',
                          price: 0,
                          // Mantenemos el código para que el usuario pueda corregirlo
                        };
                      }
                      return item;
                  }));
                  alert("Producto no encontrado con ese código.");
              }
              return;
          }

          // Navegación secuencial: Cantidad -> Precio -> Descuento -> Nueva Fila
          if (field === 'quantity') {
               const priceInput = document.getElementById(`price-${itemId}`);
               if (priceInput) {
                   priceInput.focus();
                   (priceInput as HTMLInputElement).select();
               }
               return;
          }

          if (field === 'price') {
               const discountInput = document.getElementById(`discount-${itemId}`);
               if (discountInput) {
                   discountInput.focus();
                   (discountInput as HTMLInputElement).select();
               }
               return;
          }

          if (field === 'discount') {
             if (index === items.length - 1) {
                 // Si es la última fila, agregar nueva
                 handleAddItem();
             } else {
                 // Si no, pasar a la siguiente fila (campo código)
                 const nextItemId = items[index + 1].id;
                 setTimeout(() => {
                     const nextCodeInput = document.getElementById(`code-${nextItemId}`);
                     if (nextCodeInput) nextCodeInput.focus();
                 }, 50);
             }
          }
      }
  };

  const handleAddItem = () => {
    const newItemId = `item-${Date.now()}`;
    setItems(prev => [...prev, { id: newItemId, product: null, productCode: '', productName: '', quantity: 1, price: 0, discount: 0, discountType: 'percent' }]);
    
    // Enfocar automáticamente el campo Código de la nueva fila y scrollear
    setTimeout(() => {
        const codeInput = document.getElementById(`code-${newItemId}`);
        if(codeInput) codeInput.focus();

        // Auto-scroll to bottom
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
        }
    }, 100);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
        setItems(items.filter(item => item.id !== id));
    } else {
        setItems([{ id: `item-${Date.now()}`, product: null, productCode: '', productName: '', quantity: 1, price: 0, discount: 0, discountType: 'percent' }]);
    }
  };
  
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const { subtotalGross, totalDiscount, subtotalNet, taxes, grandTotal } = useMemo(() => {
    let subtotalGross = 0;
    let totalDiscount = 0;

    items.forEach(item => {
        const lineTotalGross = item.quantity * item.price;
        subtotalGross += lineTotalGross;

        const lineDiscount = item.discountType === 'percent' 
            ? lineTotalGross * (item.discount / 100) 
            : item.discount;
        
        totalDiscount += lineDiscount;
    });

    const subtotalNet = subtotalGross - totalDiscount;
    const taxes = subtotalNet * 0.19; // Assumed 19% IVA for example on the net amount
    const grandTotal = subtotalNet + taxes;

    return { subtotalGross, totalDiscount, subtotalNet, taxes, grandTotal };
  }, [items]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  };

  return (
    <>
      <ClientSearchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelectClient={handleSelectClient} />
      <ProductSearchModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSelectProduct={handleSelectProduct} />
      <div className="bg-white rounded-lg shadow-md w-full mx-auto p-0 flex flex-col h-[calc(100vh-5.5rem)]">
        {/* Window Title Bar */}
        <div className="bg-indigo-50 p-3 rounded-t-lg border-b border-indigo-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-indigo-800 flex items-center">
              <ShoppingCartIcon className="h-6 w-6 mr-2" /> 
              Nuevo Pedido
          </h2>
          <span className="text-sm text-indigo-500 font-medium bg-white px-3 py-1 rounded-full border border-indigo-100">
            Borrador
          </span>
        </div>

        {/* Form Content */}
        <div className="p-4 flex-grow overflow-y-auto bg-slate-50/50 flex flex-col">
          {/* Header Inputs */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                <InputGroup label="Fecha del Pedido">
                  <input type="date" defaultValue={getTodayDate()} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"/>
                </InputGroup>
                
                <InputGroup label="Forma de Pago">
                  <div className="relative">
                      <select 
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white transition-all"
                      >
                        <option value="Contado">Contado</option>
                        <option value="Crédito">Crédito</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                  </div>
                </InputGroup>

                <InputGroup label="Cliente">
                    <div className="relative group">
                       <input 
                            type="text" 
                            readOnly 
                            value={selectedClient?.name || ''} 
                            placeholder="Seleccione un cliente..." 
                            className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none cursor-pointer group-hover:bg-gray-100 transition-colors"
                            onClick={() => setIsModalOpen(true)}
                        />
                       <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-indigo-500 hover:text-indigo-700"
                        >
                         <SearchIcon className="h-5 w-5"/>
                       </button>
                    </div>
                </InputGroup>
              </div>
              
              {selectedClient && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center"><span className="font-medium mr-1 text-gray-700">NIT:</span> {selectedClient.nit}</span>
                      <span className="flex items-center"><span className="font-medium mr-1 text-gray-700">Tel:</span> {selectedClient.phone}</span>
                      <span className="flex items-center"><span className="font-medium mr-1 text-gray-700">Dir:</span> {selectedClient.address}</span>
                  </div>
              )}
          </div>

          {/* Line Items Table Container with Fixed Height and Scroll */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[400px] shrink-0">
            <div 
                ref={tableContainerRef} 
                className="overflow-x-auto overflow-y-auto flex-grow"
            >
              <table className="min-w-full divide-y divide-gray-200 relative">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32 bg-gray-50">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Producto (Escriba para buscar)</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-24 bg-gray-50">Cant.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32 bg-gray-50">Precio Unit.</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-32 bg-gray-50">Desc.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32 bg-gray-50">Subtotal</th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-12 bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {items.map((item, index) => {
                     const lineTotalGross = item.quantity * item.price;
                     const lineDiscount = item.discountType === 'percent' ? lineTotalGross * (item.discount / 100) : item.discount;
                     const total = Math.max(0, lineTotalGross - lineDiscount);

                     return (
                        <tr key={item.id} className="group hover:bg-indigo-50/30 transition-colors">
                          <td className="px-4 py-2 align-top">
                            <input
                              id={`code-${item.id}`}
                              type="text"
                              value={item.productCode}
                              onChange={(e) => handleItemChange(item.id, 'productCode', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'productCode', item.id)}
                              placeholder="Código"
                              autoFocus={index === items.length - 1 && item.productCode === ''}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono"
                            />
                          </td>
                          <td className="px-4 py-2 align-top">
                            <div className="relative flex items-center gap-1">
                                <div className="relative flex-1">
                                  <input
                                  type="text"
                                  list={`product-list-${item.id}`}
                                  value={item.productName}
                                  onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                                  placeholder="Escriba el nombre del producto..."
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                                  />
                                  <datalist id={`product-list-${item.id}`}>
                                  {DUMMY_PRODUCTS.map(p => <option key={p.id} value={p.name} />)}
                                  </datalist>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenProductSearch(item.id)}
                                  className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                                  title="Buscar producto"
                                >
                                  <SearchIcon className="h-4 w-4" />
                                </button>
                            </div>
                          </td>
                          <td className="px-4 py-2 align-top">
                            <input 
                              id={`quantity-${item.id}`}
                              type="number"
                              value={item.quantity}
                              onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => handleKeyDown(e, index, 'quantity', item.id)}
                              className="w-full text-right px-3 py-1.5 border border-gray-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium"
                              min="1"
                            />
                          </td>
                           <td className="px-4 py-2 align-top">
                            <input
                                id={`price-${item.id}`}
                                type="text"
                                value={getPriceDisplayValue(item.id, item.price)}
                                onChange={e => {
                                  const value = e.target.value.replace(/\./g, '');
                                  handleItemChange(item.id, 'price', parseFloat(value) || 0);
                                }}
                                onFocus={(e) => handlePriceFocus(item.id, e)}
                                onBlur={() => handlePriceBlur(item.id, item.price)}
                                onKeyDown={(e) => handleKeyDown(e, index, 'price', item.id)}
                                className="w-full text-right px-3 py-1.5 border border-gray-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                            />
                          </td>
                           <td className="px-4 py-2 align-top">
                             <div className="flex rounded-md shadow-sm">
                                <input 
                                    id={`discount-${item.id}`}
                                    type="number" 
                                    value={item.discount} 
                                    onChange={e => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)} 
                                    onKeyDown={(e) => handleKeyDown(e, index, 'discount', item.id)}
                                    className="w-full min-w-0 flex-1 block rounded-l-md text-right px-2 py-1.5 border border-r-0 border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                                />
                                <button
                                    onClick={() => toggleDiscountType(item.id)}
                                    type="button"
                                    className="inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    {item.discountType === 'percent' ? '%' : '$'}
                                </button>
                             </div>
                          </td>
                           <td className="px-4 py-2 text-right font-bold text-gray-700 text-sm align-top pt-3">
                             {formatCurrency(total)}
                           </td>
                          <td className="px-2 py-2 text-center align-top pt-2">
                            <button 
                                onClick={() => handleRemoveItem(item.id)} 
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar fila"
                            >
                              <TrashIcon className="h-4 w-4"/>
                            </button>
                          </td>
                        </tr>
                     )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-2 bg-gray-50 border-t border-gray-100 shrink-0 z-10">
                <button onClick={handleAddItem} className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                    <PlusIcon className="h-4 w-4 mr-1.5"/> Agregar otra línea
                </button>
            </div>
          </div>

          {/* Totals Section */}
          <div className="mt-6 flex justify-end shrink-0">
            <div className="w-full max-w-xs bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="text-gray-800 font-semibold">{formatCurrency(subtotalGross)}</span>
              </div>
               <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Descuentos</span>
                <span className="text-red-600 font-semibold">-{formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">IVA (19%)</span>
                <span className="text-gray-800 font-semibold">{formatCurrency(taxes)}</span>
              </div>
              <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                <span className="text-base font-bold text-gray-800">Total</span>
                <span className="text-xl font-bold text-indigo-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-lg shrink-0">
            <div className="flex space-x-2">
                 <button onClick={() => setActivePage('Listado de Ventas')} className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900 transition-colors text-sm">
                    Volver al listado
                </button>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-bold py-2.5 px-5 rounded-lg hover:bg-gray-50 transition duration-150 shadow-sm">
                    <CancelIcon className="h-5 w-5 mr-2 text-gray-500" /> Cancelar
                </button>
                <button className="flex-1 sm:flex-none flex items-center justify-center bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    <SaveIcon className="h-5 w-5 mr-2" /> Guardar Pedido
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

export default OrdersPage;
