import React, { useState, FC, useMemo, useEffect, useCallback } from 'react';
import { PlusIcon, DotsVerticalIcon, EditIcon, TrashIcon, SearchIcon, SelectorIcon, SaveIcon, XIcon, ChevronDownIcon } from '../components/icons/IconComponents';
import Tooltip from '../components/Tooltip';
import { productoService, Producto as ApiProducto } from '../services/productoService';
import { categoriaService, Categoria } from '../services/categoriaService';
import impuestoService, { Impuesto } from '../services/impuestoService';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface PageProps {
  setActivePage: (page: string) => void;
}

// --- TYPES ---
type ProductStatus = 'Activo' | 'Inactivo';

interface Product {
  id: number;
  code: string;
  name: string; // The main description, as seen in the "Descripción" field of the image
  category: string;
  provider: string;
  reference: string; // The "Referencia" text field
  unitOfMeasure: string; // The "Unid. de medida" select field
  location: string;
  status: ProductStatus;
  stock: number;
  minStock: number;
  costNoIva: number;
  id_impuesto: number; // ID del impuesto seleccionado
  ivaPercent: number; // Porcentaje del impuesto (para cálculos)
  price1Percent: number;
  price2Percent: number;
  price3Percent: number;
  minPricePercent: number;
  isInventoried: boolean;
  isService: boolean;
  canBeDiscounted: boolean;
  isForInternalUse: boolean;
}

// --- DUMMY DATA ---
const DUMMY_PROVIDERS = ['Todos', 'CEMEX', 'Argos', 'Pintuco', 'DeWalt'];
const DUMMY_UNITS = ['unidad', 'caja', 'bulto', 'galón', 'atado', 'metro'];


// --- HELPER & UI COMPONENTS ---

const StatusBadge: FC<{ status: ProductStatus }> = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full capitalize inline-block";
  const statusClasses = {
    'Activo': 'bg-green-100 text-green-700',
    'Inactivo': 'bg-gray-100 text-gray-700',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};


// --- PRODUCT MODAL ---
const ProductModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product: Product | null;
  categorias: Categoria[];
  impuestos: Impuesto[];
}> = ({ isOpen, onClose, onSave, product, categorias, impuestos }) => {
    const [formData, setFormData] = useState<Product | null>(null);
    // Estados locales para los inputs de precio (mientras se escribe)
    const [editingPrices, setEditingPrices] = useState<{
        price1?: string;
        price2?: string;
        price3?: string;
        priceMin?: string;
    }>({});

    const [editingPercents, setEditingPercents] = useState<{
        percent1?: string;
        percent2?: string;
        percent3?: string;
        percentMin?: string;
    }>({});

    const [editingCosts, setEditingCosts] = useState<{
        costNoIva?: string;
        costWithIva?: string;
    }>({});

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData(product);
                setEditingPrices({}); // Resetear precios en edición
                setEditingPercents({}); // Resetear porcentajes en edición
                setEditingCosts({}); // Resetear costos en edición
            } else {
                // Default new product structure
                // Buscar el primer impuesto o usar valor por defecto
                const defaultImpuesto = impuestos.find(imp => imp.estado) || impuestos[0];
                setFormData({
                    id: 0, // Se asignará automáticamente por la BD
                    code: '', name: '', category: 'Sin categoría', provider: DUMMY_PROVIDERS[1],
                    reference: '', unitOfMeasure: 'unidad', location: '', status: 'Activo',
                    stock: 0, minStock: 1,
                    costNoIva: 0,
                    id_impuesto: defaultImpuesto?.id_impuesto || 1,
                    ivaPercent: defaultImpuesto?.porcentaje || 19,
                    price1Percent: 0, price2Percent: 0, price3Percent: 0, minPricePercent: 0,
                    isInventoried: true, isService: false, canBeDiscounted: true, isForInternalUse: false,
                });
                setEditingPrices({});
                setEditingPercents({});
                setEditingCosts({});
            }
        }
    }, [product, isOpen]);

    const handleChange = (field: keyof Product, value: string | number) => {
        if (!formData) return;
        setFormData({ ...formData, [field]: value });
    };

    const handleCheckboxChange = (field: keyof Product, checked: boolean) => {
        if (!formData) return;
        setFormData({ ...formData, [field]: checked });
    };

    // Cálculo del costo con IVA
    const costWithIva = useMemo(() => {
        if (!formData) return 0;
        return formData.costNoIva * (1 + formData.ivaPercent / 100);
    }, [formData?.costNoIva, formData?.ivaPercent]);

    // Manejar cambio en Costo sin IVA (mientras escribe)
    const handleCostNoIvaChange = (value: string) => {
        // Permitir números, punto decimal y string vacío
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setEditingCosts({
                ...editingCosts,
                costNoIva: value
            });
        }
    };

    // Manejar cuando sale del campo Costo sin IVA (onBlur)
    const handleCostNoIvaBlur = () => {
        if (!formData) return;

        if (editingCosts.costNoIva !== undefined) {
            const inputValue = editingCosts.costNoIva?.trim() || '';

            if (inputValue !== '') {
                const costValue = parseFloat(inputValue);
                if (!isNaN(costValue)) {
                    setFormData({ ...formData, costNoIva: costValue });
                }
            }

            setEditingCosts({
                ...editingCosts,
                costNoIva: undefined
            });
        }
    };

    // Manejar cambio en impuesto IVA (select)
    const handleImpuestoChange = (id_impuesto: number) => {
        if (!formData) return;

        // Buscar el impuesto seleccionado para obtener su porcentaje
        const impuestoSeleccionado = impuestos.find(imp => imp.id_impuesto === id_impuesto);
        const ivaPercent = impuestoSeleccionado?.porcentaje || 19;

        setFormData({
            ...formData,
            id_impuesto,
            ivaPercent
        });
    };

    // Manejar cambio en Costo con IVA (mientras escribe)
    const handleCostWithIvaChange = (value: string) => {
        // Permitir números, punto decimal y string vacío
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setEditingCosts({
                ...editingCosts,
                costWithIva: value
            });
        }
    };

    // Manejar cuando sale del campo Costo con IVA (onBlur)
    const handleCostWithIvaBlur = () => {
        if (!formData) return;

        if (editingCosts.costWithIva !== undefined) {
            const inputValue = editingCosts.costWithIva?.trim() || '';

            if (inputValue !== '') {
                const costWithIvaValue = parseFloat(inputValue);
                if (!isNaN(costWithIvaValue)) {
                    // Calcular costo sin IVA desde el costo con IVA
                    const costNoIva = costWithIvaValue / (1 + formData.ivaPercent / 100);
                    setFormData({ ...formData, costNoIva });
                }
            }

            setEditingCosts({
                ...editingCosts,
                costWithIva: undefined
            });
        }
    };

    // Calcular precio de venta con IVA basado en % de incremento
    const calculateSalePrice = useCallback((percentIncrement: number) => {
        if (!formData) return 0;
        const costWithIvaValue = formData.costNoIva * (1 + formData.ivaPercent / 100);
        return costWithIvaValue * (1 + percentIncrement / 100);
    }, [formData]);

    // Calcular % de incremento basado en precio de venta
    const calculatePercentFromSalePrice = useCallback((salePrice: number) => {
        if (!formData) return 0;
        const costWithIvaValue = formData.costNoIva * (1 + formData.ivaPercent / 100);
        if (costWithIvaValue === 0) return 0;
        return ((salePrice - costWithIvaValue) / costWithIvaValue) * 100;
    }, [formData]);

    // Calcular utilidad
    const calculateUtility = useCallback((salePrice: number) => {
        if (!formData) return 0;
        const costWithIvaValue = formData.costNoIva * (1 + formData.ivaPercent / 100);
        return salePrice - costWithIvaValue;
    }, [formData]);

    // Manejar cambio en % de incremento (mientras escribe)
    const handlePercentChange = (percentKey: 'percent1' | 'percent2' | 'percent3' | 'percentMin', value: string) => {
        // Permitir números, punto decimal, signo menos y string vacío
        if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) {
            setEditingPercents({
                ...editingPercents,
                [percentKey]: value
            });
        }
    };

    // Manejar cuando sale del campo de porcentaje (onBlur)
    const handlePercentBlur = (percentField: keyof Product, percentKey: 'percent1' | 'percent2' | 'percent3' | 'percentMin') => {
        if (!formData) return;

        // Si hay un valor siendo editado, procesarlo
        if (editingPercents[percentKey] !== undefined) {
            const inputValue = editingPercents[percentKey]?.trim() || '';

            // Solo actualizar si hay un valor válido
            if (inputValue !== '' && inputValue !== '-') {
                const percentValue = parseFloat(inputValue);
                if (!isNaN(percentValue)) {
                    setFormData({
                        ...formData,
                        [percentField]: percentValue
                    });
                }
            }

            // Limpiar el estado de edición
            setEditingPercents({
                ...editingPercents,
                [percentKey]: undefined
            });
        }
    };

    // Manejar cambio en precio de venta (mientras escribe)
    const handleSalePriceChange = (priceKey: 'price1' | 'price2' | 'price3' | 'priceMin', value: string) => {
        // Permitir números, punto decimal y string vacío
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setEditingPrices({
                ...editingPrices,
                [priceKey]: value
            });
        }
    };

    // Manejar cuando sale del campo de precio (onBlur)
    const handleSalePriceBlur = (percentField: keyof Product, priceKey: 'price1' | 'price2' | 'price3' | 'priceMin') => {
        if (!formData) return;

        // Si hay un valor siendo editado, procesarlo
        if (editingPrices[priceKey] !== undefined) {
            const inputValue = editingPrices[priceKey]?.trim() || '';

            // Solo actualizar si hay un valor válido
            if (inputValue !== '') {
                const priceValue = parseFloat(inputValue);
                if (!isNaN(priceValue)) {
                    const newPercent = calculatePercentFromSalePrice(priceValue);
                    setFormData({
                        ...formData,
                        [percentField]: newPercent
                    });
                }
            }

            // Limpiar el estado de edición
            setEditingPrices({
                ...editingPrices,
                [priceKey]: undefined
            });
        }
    };

    if (!isOpen || !formData) return null;

    const priceFields = [
        { label: 'Precio al Público 1', percentField: 'price1Percent' as keyof Product, priceKey: 'price1' as const, percentKey: 'percent1' as const },
        { label: 'Precio al Público 2', percentField: 'price2Percent' as keyof Product, priceKey: 'price2' as const, percentKey: 'percent2' as const },
        { label: 'Precio al Público 3', percentField: 'price3Percent' as keyof Product, priceKey: 'price3' as const, percentKey: 'percent3' as const },
        { label: 'Precio Mínimo', percentField: 'minPricePercent' as keyof Product, priceKey: 'priceMin' as const, percentKey: 'percentMin' as const },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(formData){
            onSave(formData);
        }
    };

    const handleNewProduct = () => {
        // Crear un nuevo producto con valores por defecto
        const defaultImpuesto = impuestos.find(imp => imp.estado) || impuestos[0];
        setFormData({
            id: 0, // Se asignará automáticamente por la BD
            code: '', name: '', category: 'Sin categoría', provider: DUMMY_PROVIDERS[1],
            reference: '', unitOfMeasure: 'unidad', location: '', status: 'Activo',
            stock: 0, minStock: 1,
            costNoIva: 0,
            id_impuesto: defaultImpuesto?.id_impuesto || 1,
            ivaPercent: defaultImpuesto?.porcentaje || 19,
            price1Percent: 0, price2Percent: 0, price3Percent: 0, minPricePercent: 0,
            isInventoried: true, isService: false, canBeDiscounted: true, isForInternalUse: false,
        });
        setEditingPrices({});
        setEditingPercents({});
        setEditingCosts({});
    };

    const inputBaseStyle = "block w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition";
    const readOnlyInputStyle = `${inputBaseStyle} bg-slate-100 cursor-not-allowed`;
    const labelBaseStyle = "block text-sm font-medium text-slate-700 mb-1";
    const sectionTitleStyle = "text-base font-semibold text-indigo-700 absolute -top-3 bg-slate-50 px-2";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-modal-backdrop">
            <div className="bg-slate-50 rounded-lg shadow-2xl w-full max-w-6xl animate-modal-content" style={{ maxHeight: '95vh' }}>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-600 via-purple-700 to-blue-600 rounded-t-lg border-b border-slate-600">
                    <h3 className="text-lg font-semibold text-white">Producto</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-300 hover:bg-slate-700"><XIcon className="h-6 w-6" /></button>
                </div>
                <form id="product-form" onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 128px)' }}>
                    <div className="p-5 space-y-4">
                        
                        {/* Section: Datos del Producto */}
                        <div className="border border-slate-300 rounded-md p-4 bg-white relative">
                            <h4 className={sectionTitleStyle}>Datos del Producto</h4>
                             <div className="grid grid-cols-12 gap-x-6 gap-y-4 items-center pt-2">
                                <div className="col-span-6 sm:col-span-2">
                                    <label className={labelBaseStyle}>Items</label>
                                    <input type="text" value={formData.id === 0 ? 'Nuevo' : formData.id} readOnly className={readOnlyInputStyle} />
                                </div>
                                <div className="col-span-6 sm:col-span-4">
                                    <label className={labelBaseStyle}>Código</label>
                                    <input type="text" value={formData.code} onChange={e => handleChange('code', e.target.value)} className={inputBaseStyle} />
                                </div>
                                <div className="col-span-12 sm:col-span-6"></div>

                                <div className="col-span-12">
                                    <label className={labelBaseStyle}>Descripción</label>
                                    <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={inputBaseStyle} required />
                                </div>

                                <div className="col-span-12 sm:col-span-4">
                                    <label className={labelBaseStyle}>Proveedor</label>
                                    <select value={formData.provider} onChange={e => handleChange('provider', e.target.value)} className={inputBaseStyle}>
                                        {DUMMY_PROVIDERS.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                
                                <div className="col-span-12 sm:col-span-4">
                                    <label className={labelBaseStyle}>Categoría</label>
                                    <select value={formData.category} onChange={e => handleChange('category', e.target.value)} className={inputBaseStyle}>
                                        <option value="Sin categoría">Sin categoría</option>
                                        {categorias.map(c => <option key={c.id_categoria} value={c.nombre_categoria}>{c.nombre_categoria}</option>)}
                                    </select>
                                </div>
                                
                                <div className="col-span-12 sm:col-span-4">
                                    <label className={labelBaseStyle}>Unidad de Medida</label>
                                    <select value={formData.unitOfMeasure} onChange={e => handleChange('unitOfMeasure', e.target.value)} className={inputBaseStyle}>
                                        {DUMMY_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Section: Ubicación */}
                             <div className="border border-slate-300 rounded-md p-4 bg-white relative">
                                <h4 className={sectionTitleStyle}>Ubicación</h4>
                                <div className="pt-2">
                                    <label className={labelBaseStyle}>Estante</label>
                                    <input type="text" value={formData.location} onChange={e => handleChange('location', e.target.value)} className={inputBaseStyle} />
                                </div>
                            </div>
                            {/* Section: Existencias */}
                             <div className="border border-slate-300 rounded-md p-4 bg-white relative">
                                <h4 className={sectionTitleStyle}>Existencias</h4>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                     <div>
                                        <label className={labelBaseStyle}>Cantidad</label>
                                        <input type="number" value={formData.stock} onChange={e => handleChange('stock', parseFloat(e.target.value))} className={`${inputBaseStyle} bg-blue-100 border-blue-300`} />
                                    </div>
                                    <div>
                                        <label className={labelBaseStyle}>Existencia mínima</label>
                                        <input type="number" value={formData.minStock} onChange={e => handleChange('minStock', parseFloat(e.target.value))} className={`${inputBaseStyle} bg-red-100 border-red-300`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Detalle */}
                        <div className="border border-slate-300 rounded-md p-4 bg-white relative">
                            <h4 className={sectionTitleStyle}>Detalle</h4>
                            <div className="pt-2 space-y-2">
                                {/* Cost/IVA Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 mb-2">
                                    <div className="grid grid-cols-3 gap-2 items-end">
                                        <div>
                                            <label className={labelBaseStyle}>Costo sin Iva</label>
                                            <input
                                                type="text"
                                                value={editingCosts.costNoIva !== undefined
                                                    ? editingCosts.costNoIva
                                                    : formData.costNoIva.toFixed(2)}
                                                onChange={e => handleCostNoIvaChange(e.target.value)}
                                                onBlur={handleCostNoIvaBlur}
                                                className={`${inputBaseStyle} bg-yellow-100 border-yellow-300`}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelBaseStyle}>IVA</label>
                                            <select
                                                value={formData.id_impuesto}
                                                onChange={e => handleImpuestoChange(parseInt(e.target.value))}
                                                className={inputBaseStyle}
                                            >
                                                {impuestos.map(imp => (
                                                    <option key={imp.id_impuesto} value={imp.id_impuesto}>
                                                        {imp.nombre_impuesto} ({imp.porcentaje}%)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelBaseStyle}>Costo Con IVA</label>
                                            <input
                                                type="text"
                                                value={editingCosts.costWithIva !== undefined
                                                    ? editingCosts.costWithIva
                                                    : costWithIva.toFixed(2)}
                                                onChange={e => handleCostWithIvaChange(e.target.value)}
                                                onBlur={handleCostWithIvaBlur}
                                                className={`${inputBaseStyle} bg-green-100 border-green-300`}
                                            />
                                        </div>
                                    </div>
                                    <div></div>
                                </div>

                                {/* Price & Utility Rows */}
                                {priceFields.map((pf) => {
                                    const percentIncrement = formData[pf.percentField] as number;
                                    const salePrice = calculateSalePrice(percentIncrement);
                                    const utility = calculateUtility(salePrice);

                                    // Usar el valor en edición o el valor calculado
                                    const displayPercent = editingPercents[pf.percentKey] !== undefined
                                        ? editingPercents[pf.percentKey]
                                        : percentIncrement.toFixed(2);

                                    const displayPrice = editingPrices[pf.priceKey] !== undefined
                                        ? editingPrices[pf.priceKey]
                                        : salePrice.toFixed(2);

                                    return (
                                        <div key={pf.label} className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2">
                                            {/* Left: Price inputs */}
                                            <div className="grid grid-cols-12 gap-2 items-center">
                                                <label className={`${labelBaseStyle} col-span-12 sm:col-span-6 mb-0`}>{pf.label}</label>
                                                <div className="col-span-6 sm:col-span-2">
                                                    <input
                                                        type="text"
                                                        placeholder="%"
                                                        value={displayPercent}
                                                        onChange={e => handlePercentChange(pf.percentKey, e.target.value)}
                                                        onBlur={() => handlePercentBlur(pf.percentField, pf.percentKey)}
                                                        className={`${inputBaseStyle} text-right p-1.5`}
                                                    />
                                                </div>
                                                <div className="col-span-6 sm:col-span-4">
                                                    <input
                                                        type="text"
                                                        placeholder="$"
                                                        value={displayPrice}
                                                        onChange={e => handleSalePriceChange(pf.priceKey, e.target.value)}
                                                        onBlur={() => handleSalePriceBlur(pf.percentField, pf.priceKey)}
                                                        className={`${inputBaseStyle} text-right p-1.5`}
                                                    />
                                                </div>
                                            </div>
                                            {/* Right: Utility display */}
                                            <div className="grid grid-cols-12 gap-2 items-center lg:pl-4">
                                                <div className="col-span-12">
                                                  <Tooltip text="Utilidad (Precio Venta - Costo con IVA)">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={formatCurrency(utility)}
                                                        className={readOnlyInputStyle}
                                                    />
                                                  </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Checkboxes Row */}
                            <div className="pt-4 mt-4 border-t border-slate-200 flex items-center space-x-6">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={!formData.canBeDiscounted} onChange={e => handleCheckboxChange('canBeDiscounted', !e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="font-medium text-slate-700">Sin descuento</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.isService} onChange={e => handleCheckboxChange('isService', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="font-medium text-slate-700">Servicio</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.isForInternalUse} onChange={e => handleCheckboxChange('isForInternalUse', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="font-medium text-slate-700">Uso</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
                <div className="p-3 bg-slate-100 rounded-b-lg border-t flex justify-start space-x-2">
                    <button type="button" onClick={handleNewProduct} className="flex items-center bg-green-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-sm"><PlusIcon className="h-4 w-4 mr-2" />Nuevo</button>
                    <button type="button" className="flex items-center bg-orange-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors text-sm"><EditIcon className="h-4 w-4 mr-2" />Modificar</button>
                    <button type="submit" form="product-form" className="flex items-center bg-indigo-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm"><SaveIcon className="h-4 w-4 mr-2" />Guardar</button>
                    <button type="button" className="flex items-center bg-blue-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm">Relacionados</button>
                    <button type="button" onClick={onClose} className="bg-red-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-red-600 transition-colors text-sm">Salir</button>
                </div>
            </div>
        </div>
    );
};


const DeleteConfirmationModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product: Product | null;
}> = ({ isOpen, onClose, onConfirm, product }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-modal-backdrop">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-modal-content">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Confirmar Eliminación</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="h-6 w-6 text-gray-600"/>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el producto <span className="font-bold">"{product.name}"</span>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
            <TrashIcon className="h-5 w-5 mr-2" />
            Eliminar Producto
          </button>
        </div>
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
const ProductsPage: FC<PageProps> = ({ setActivePage }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [impuestos, setImpuestos] = useState<Impuesto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Estado para estadísticas globales (calculadas en el backend)
  const [estadisticas, setEstadisticas] = useState({
    total_productos: 0,
    total_inventario: 0,
    productos_agotados: 0,
    productos_stock_bajo: 0,
    promedio_utilidad: 0
  });

  // Hook de notificaciones
  const { toasts, removeToast, success, error: showError } = useToast();

  // Obtener id_empresa de la empresa activa seleccionada
  const getUserEmpresa = () => {
    const empresaActivaId = localStorage.getItem('empresa_activa_id');
    if (empresaActivaId) {
      return parseInt(empresaActivaId);
    }
    // Fallback: obtener del user_data si no hay empresa activa
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id_empresa || 1;
    }
    return 1;
  };

  // Cargar categorías e impuestos al montar el componente
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await categoriaService.listar({ perPage: 100, estado: 1 });
        setCategorias(response.categorias);
      } catch (err: any) {
        console.error('Error al cargar categorías:', err);
      }
    };

    const fetchImpuestos = async () => {
      try {
        const response = await impuestoService.listar({ per_page: 100, estado: 1 });
        setImpuestos(response.impuestos);
      } catch (err: any) {
        console.error('Error al cargar impuestos:', err);
      }
    };

    fetchCategorias();
    fetchImpuestos();
  }, []);

  // Función para convertir producto de API a formato local
  const convertApiProductToLocal = (apiProduct: ApiProducto): Product => {
    const ivaPercent = apiProduct.impuesto?.porcentaje || 19;
    // precio_compra en BD es el costo CON IVA
    const costoConIva = apiProduct.precio_compra;
    // Calcular costo sin IVA desde el costo con IVA
    const costoSinIva = costoConIva / (1 + ivaPercent / 100);

    // Calcular % de incremento desde los precios de venta
    const price1Percent = costoConIva > 0
      ? ((apiProduct.precio_venta / costoConIva) - 1) * 100
      : 0;

    const price2Percent = costoConIva > 0 && apiProduct.precio_venta_2
      ? ((apiProduct.precio_venta_2 / costoConIva) - 1) * 100
      : 0;

    const price3Percent = costoConIva > 0 && apiProduct.precio_venta_3
      ? ((apiProduct.precio_venta_3 / costoConIva) - 1) * 100
      : 0;

    const minPricePercent = costoConIva > 0 && apiProduct.precio_minimo
      ? ((apiProduct.precio_minimo / costoConIva) - 1) * 100
      : 0;

    return {
      id: apiProduct.id_producto,
      code: apiProduct.codigo_producto,
      name: apiProduct.nombre_producto,
      category: apiProduct.categoria?.nombre_categoria || 'Sin categoría',
      provider: '', // No disponible en API
      reference: '', // No disponible en API
      unitOfMeasure: apiProduct.unidad_medida || 'unidad',
      location: apiProduct.ubicacion || '',
      status: apiProduct.estado ? 'Activo' : 'Inactivo',
      stock: apiProduct.stock_actual,
      minStock: apiProduct.stock_minimo,
      costNoIva: costoSinIva,
      id_impuesto: apiProduct.id_impuesto || 1,
      ivaPercent: ivaPercent,
      price1Percent: price1Percent,
      price2Percent: price2Percent,
      price3Percent: price3Percent,
      minPricePercent: minPricePercent,
      isInventoried: apiProduct.maneja_inventario,
      isService: !apiProduct.maneja_inventario,
      canBeDiscounted: true,
      isForInternalUse: false,
    };
  };

  // Cargar productos desde la API
  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const id_empresa = getUserEmpresa();
      const response = await productoService.listar({
        page: currentPage,
        perPage: itemsPerPage,
        search: searchTerm || undefined,
        id_categoria: categoryFilter !== 'Todos' ? categorias.find(c => c.nombre_categoria === categoryFilter)?.id_categoria : undefined,
        id_empresa,
        estado: 1,
      });

      const convertedProducts = response.productos.map(convertApiProductToLocal);
      setProducts(convertedProducts);
      setTotalItems(response.total);
    } catch (err: any) {
      console.error('Error al cargar productos:', err);
      setError('Error al cargar productos. Por favor, intente nuevamente.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas desde la API
  const fetchEstadisticas = async () => {
    try {
      const id_empresa = getUserEmpresa();
      const response = await productoService.estadisticas(id_empresa);
      if (!response.error) {
        setEstadisticas(response.estadisticas);
      }
    } catch (err: any) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    fetchEstadisticas();
  }, []);

  // Cargar productos cuando cambien los filtros
  useEffect(() => {
    fetchProductos();
  }, [currentPage, searchTerm, categoryFilter]);


  // Los productos ya vienen filtrados y paginados del servidor
  const sortedProducts = useMemo(() => {
    let sortableItems = [...products];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [products, sortConfig]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const requestSort = (key: keyof Product) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleOpenModal = (product: Product | null) => {
      setEditingProduct(product);
      setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingProduct(null);
  }

  const handleSaveProduct = async (productData: Product) => {
    if(!productData) return;

    try {
      const id_empresa = getUserEmpresa();
      const isNew = productData.id === 0; // Si el id es 0, es un producto nuevo

      // Validaciones básicas
      if (!productData.code || !productData.name) {
        error('El código y el nombre del producto son obligatorios.');
        return;
      }

      // Calcular costo con IVA (este es el que guardamos en BD)
      const costoConIva = productData.costNoIva * (1 + productData.ivaPercent / 100);

      // Calcular los 4 precios de venta basados en los porcentajes
      const precio_venta_1 = costoConIva * (1 + productData.price1Percent / 100);
      const precio_venta_2 = costoConIva * (1 + productData.price2Percent / 100);
      const precio_venta_3 = costoConIva * (1 + productData.price3Percent / 100);
      const precio_minimo = costoConIva * (1 + productData.minPricePercent / 100);

      // Preparar datos para la API
      // precio_compra guarda el costo CON IVA
      const apiData = {
        id_empresa,
        id_categoria: categorias.find(c => c.nombre_categoria === productData.category)?.id_categoria,
        id_impuesto: productData.id_impuesto,
        codigo_producto: productData.code,
        nombre_producto: productData.name,
        descripcion_producto: productData.name,
        precio_compra: costoConIva, // Guardar costo CON IVA
        precio_venta: precio_venta_1,
        precio_venta_2: precio_venta_2,
        precio_venta_3: precio_venta_3,
        precio_venta_4: 0, // No se usa por ahora
        precio_minimo: precio_minimo,
        stock_actual: productData.stock,
        stock_minimo: productData.minStock,
        unidad_medida: productData.unitOfMeasure,
        ubicacion: productData.location,
        maneja_inventario: productData.isInventoried,
        estado: productData.status === 'Activo',
      };

      if (isNew) {
        await productoService.crear(apiData);
        success('Producto creado exitosamente');
      } else {
        await productoService.actualizar(productData.id, apiData);
        success('Producto actualizado exitosamente');
      }

      // Recargar productos y estadísticas
      await fetchProductos();
      await fetchEstadisticas();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error al guardar producto:', err);
      showError(err.mensaje || 'Error al guardar el producto. Por favor, intente nuevamente.');
    }
  };

  const handleOpenDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
      setDeletingProduct(null);
      setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;

    try {
      await productoService.eliminar(deletingProduct.id);
      success('Producto eliminado exitosamente');
      await fetchProductos();
      await fetchEstadisticas();
      handleCloseDeleteModal();
    } catch (err: any) {
      console.error('Error al eliminar producto:', err);
      showError(err.mensaje || 'Error al eliminar el producto. Por favor, intente nuevamente.');
    }
  };

  const SortableHeader: FC<{ children: React.ReactNode; sortKey: keyof Product }> = ({ children, sortKey }) => (
    <th className="px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort(sortKey)}>
      <div className="flex items-center">
        <span>{children}</span>
        <SelectorIcon className={`w-4 h-4 ml-2 text-gray-400 ${sortConfig?.key === sortKey ? 'text-gray-800' : ''}`} />
      </div>
    </th>
  );
  
  return (
    <>
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <ProductModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveProduct} product={editingProduct} categorias={categorias} impuestos={impuestos} />
      <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          product={deletingProduct}
      />
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Inventario */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-100">Total Inventario</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(estadisticas.total_inventario)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Productos Agotados */}
        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-100">Agotados</p>
              <p className="text-2xl font-bold mt-1">{estadisticas.productos_agotados}</p>
              <p className="text-xs text-red-200 mt-1">Sin existencias</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-100">Stock Bajo</p>
              <p className="text-2xl font-bold mt-1">{estadisticas.productos_stock_bajo}</p>
              <p className="text-xs text-amber-200 mt-1">Por debajo del mínimo</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Promedio Utilidad */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-100">Utilidad Promedio</p>
              <p className="text-2xl font-bold mt-1">{estadisticas.promedio_utilidad.toFixed(1)}%</p>
              <p className="text-xs text-emerald-200 mt-1">Margen de ganancia</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full mr-3"></span>
              <h2 className="text-2xl font-bold text-gray-800">Listado de Productos</h2>
          </div>
          <button onClick={() => handleOpenModal(null)} className="w-full md:w-auto flex items-center justify-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-150 text-sm">
            <PlusIcon className="h-5 w-5 mr-2" /> Nuevo Artículo
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
           <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar por código o nombre..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div>
                 <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                     <option value="Todos">Todos</option>
                     {categorias.map(cat => <option key={cat.id_categoria} value={cat.nombre_categoria}>{cat.nombre_categoria}</option>)}
                </select>
            </div>
            <div className="flex items-center justify-center md:justify-end text-sm font-medium text-gray-600 bg-white border rounded-lg px-4 py-2">
                Nº de Artículos: <span className="font-bold text-indigo-600 ml-2">{totalItems}</span>
            </div>
        </div>
        
        <div className="mt-4 border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader sortKey="name">Artículo</SortableHeader>
                  <SortableHeader sortKey="code">Código</SortableHeader>
                  <SortableHeader sortKey="stock">Exist.</SortableHeader>
                  <SortableHeader sortKey="costNoIva">Costo</SortableHeader>
                  <th className="px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Precio V1</th>
                  <SortableHeader sortKey="price1Percent">% Utilidad</SortableHeader>
                  <th className="px-4 py-3 bg-gray-100 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-600">Cargando productos...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : sortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-600">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : sortedProducts.map(product => {
                    const priceV1 = (product.costNoIva * (1 + product.price1Percent / 100)) * (1 + product.ivaPercent / 100);
                    return (
                        <tr key={product.id} className="bg-white hover:bg-gray-50">
                            <td className="border-t border-gray-200 px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-bold">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.category}</div>
                            </td>
                            <td className="border-t border-gray-200 px-4 py-3 text-gray-700 text-sm font-mono">{product.code}</td>
                            <td className="border-t border-gray-200 px-4 py-3 text-gray-700 text-sm">{product.stock}</td>
                            <td className="border-t border-gray-200 px-4 py-3 text-gray-700 text-sm">{formatCurrency(product.costNoIva)}</td>
                            <td className="border-t border-gray-200 px-4 py-3 text-gray-700 text-sm font-semibold">{formatCurrency(priceV1)}</td>
                            <td className="border-t border-gray-200 px-4 py-3 text-sm font-semibold">
                              <span className={`px-2 py-1 rounded ${product.price1Percent > 0 ? 'bg-green-100 text-green-700' : product.price1Percent < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                {product.price1Percent.toFixed(1)}%
                              </span>
                            </td>
                            <td className="border-t border-gray-200 px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                                <button onClick={() => handleOpenModal(product)} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                                <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleOpenDeleteModal(product)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                            </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-end items-center">
            <nav className="flex items-center space-x-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 border disabled:opacity-50">Anterior</button>
                <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 border disabled:opacity-50">Siguiente</button>
            </nav>
        </div>
      </div>
    </>
  );
};

export default ProductsPage;