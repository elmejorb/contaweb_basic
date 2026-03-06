<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';
    protected $primaryKey = 'id_producto';

    protected $fillable = [
        'id_empresa',
        'codvb6',
        'id_categoria',
        'id_impuesto',
        'codigo_producto',
        'nombre_producto',
        'descripcion_producto',
        'precio_compra',
        'precio_venta',
        'precio_venta_2',
        'precio_venta_3',
        'precio_venta_4',
        'precio_minimo',
        'stock_actual',
        'stock_minimo',
        'unidad_medida',
        'ubicacion',
        'imagen_producto',
        'maneja_inventario',
        'estado'
    ];

    protected $casts = [
        'precio_compra' => 'decimal:2',
        'precio_venta' => 'decimal:2',
        'precio_venta_2' => 'decimal:2',
        'precio_venta_3' => 'decimal:2',
        'precio_venta_4' => 'decimal:2',
        'precio_minimo' => 'decimal:2',
        'stock_actual' => 'integer',
        'stock_minimo' => 'integer',
        'maneja_inventario' => 'boolean',
        'estado' => 'boolean',
    ];

    /**
     * Relación con Empresa
     */
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    /**
     * Relación con Categoria
     */
    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'id_categoria', 'id_categoria');
    }

    /**
     * Relación con Impuesto
     */
    public function impuesto()
    {
        return $this->belongsTo(Impuesto::class, 'id_impuesto', 'id_impuesto');
    }

    /**
     * Scope para productos activos
     */
    public function scopeActivos($query)
    {
        return $query->where('estado', 1);
    }

    /**
     * Scope para productos con stock bajo
     */
    public function scopeStockBajo($query)
    {
        return $query->whereColumn('stock_actual', '<=', 'stock_minimo');
    }

    /**
     * Scope para buscar productos por código o nombre
     */
    public function scopeBuscar($query, $termino)
    {
        return $query->where(function($q) use ($termino) {
            $q->where('codigo_producto', 'like', "%{$termino}%")
              ->orWhere('nombre_producto', 'like', "%{$termino}%");
        });
    }
}
