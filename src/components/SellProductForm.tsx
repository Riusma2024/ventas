import React, { useState } from 'react';
import { ShoppingBag, Save, X, DollarSign } from 'lucide-react';
import { db, type Producto, type Cliente } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface SellProductFormProps {
    producto: Producto;
    onClose: () => void;
    onSuccess: () => void;
}

export const SellProductForm: React.FC<SellProductFormProps> = ({ producto, onClose, onSuccess }) => {
    const [precioVenta, setPrecioVenta] = useState(producto.precioSugerido.toString());
    const [clienteId, setClienteId] = useState<string>('');

    const clientes = useLiveQuery(() => db.clientes.toArray());

    const utilidad = Number(precioVenta) - producto.costo;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clienteId) return;

        try {
            await db.ventas.add({
                productoId: producto.id!,
                clienteId: Number(clienteId),
                precioVenta: Number(precioVenta),
                utilidad,
                fecha: new Date(),
                pagado: false
            });

            // Update product stock
            await db.productos.update(producto.id!, {
                stock: producto.stock - 1
            });

            onSuccess();
        } catch (error) {
            console.error('Error al registrar venta:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 space-y-6 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Registrar Venta</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-sm">
                        {producto.foto && <img src={producto.foto} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PRODUCTO</p>
                        <h4 className="font-bold text-slate-800">{producto.nombre}</h4>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-2">CLIENTE</label>
                        <select
                            required
                            className="input-field w-full appearance-none bg-no-repeat bg-right pr-10"
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clientes?.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre} ({c.apodo})</option>
                            ))}
                        </select>
                        {(!clientes || clientes.length === 0) && (
                            <p className="text-[10px] text-primary-500 font-bold ml-2">¡Debes agregar clientes primero!</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-2">PRECIO DE VENTA ($)</label>
                        <input
                            type="number"
                            required
                            className="input-field w-full"
                            value={precioVenta}
                            onChange={(e) => setPrecioVenta(e.target.value)}
                        />
                    </div>

                    <div className="bg-primary-50 p-4 rounded-3xl flex justify-between items-center border border-primary-100">
                        <div>
                            <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">UTILIDAD ESTIMADA</p>
                            <h4 className="text-xl font-bold text-primary-600">${utilidad.toFixed(2)}</h4>
                        </div>
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white">
                            <DollarSign size={20} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!clienteId}
                        className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                        <ShoppingBag size={20} />
                        Confirmar Venta
                    </button>
                </form>
            </div>
        </div>
    );
};
