import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Trash2, CheckCircle, Users, UserPlus } from 'lucide-react';
import { type Cliente, type Producto } from '../db/db';
import { api } from '../config/api';
import { AddClientForm } from './AddClientForm';

export interface CartItem {
    id: string;
    producto: Producto;
    cantidad: number;
    precioVenta: number;
    utilidad: number;
}

interface CartModalProps {
    items: CartItem[];
    onClose: () => void;
    onRemoveItem: (id: string) => void;
    onClearCart: () => void;
    onSuccess: () => void;
    initialClienteId?: string;
}

export const CartModal: React.FC<CartModalProps> = ({ items, onClose, onRemoveItem, onClearCart, onSuccess, initialClienteId }) => {
    const [clienteId, setClienteId] = useState<string>(initialClienteId || '');
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [showAddClient, setShowAddClient] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchClientes = async (selectId?: string | number) => {
        try {
            const res = await api.get('/clientes');
            setClientes(res.data);
            if (selectId) setClienteId(selectId.toString());
        } catch (err) {
            console.error('Error fetching clients', err);
        }
    };

    useEffect(() => {
        fetchClientes();
    }, []);

    const totalCobrar = items.reduce((acc, item) => acc + (item.precioVenta * item.cantidad), 0);
    const totalUtilidad = items.reduce((acc, item) => acc + item.utilidad, 0);

    const handleCheckout = async () => {
        const idClie = Number(clienteId);
        if (!idClie || items.length === 0) return;

        setIsSubmitting(true);
        try {
            // Register each venta independently
            for (const item of items) {
                await api.post('/ventas', {
                    productoId: item.producto.id,
                    clienteId: idClie,
                    precioVenta: item.precioVenta,
                    utilidad: item.utilidad, // This is total utility for this item stack or per unit?
                    // In SellProductForm it was per stack.
                    // Wait, createVenta takes 'cantidad'. In createVenta: utilidad is inserted as-is for each unit?
                    // Let's check how createVenta works. It does `INSERT ... VALUES (utilidad)`.
                    // SellProductForm calculates: utilidad = (precio - costo) * cantidad. Then calls createVenta.
                    // Wait, if createVenta duplicates rows 'cantidad' times, putting 'utilidad' (total) into EACH row will multiply the profit incorrectly!
                    cantidad: item.cantidad
                });
            }

            // Sync client debt
            const client = clientes.find((c) => c.id === idClie);
            if (client) {
                await api.put(`/clientes/${client.id}`, {
                    ...client,
                    deudaTotal: Number(client.deudaTotal || 0) + totalCobrar
                });
            }

            onClearCart();
            onSuccess();
        } catch (error) {
            console.error('Error in checkout:', error);
            alert('Hubo un error al procesar el carrito');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-[3.5rem] p-8 space-y-6 animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar flex flex-col">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="text-primary-500" />
                            Carrito ({items.length})
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-95">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <ShoppingCart size={40} className="mx-auto mb-2 text-slate-400" />
                        <p className="font-bold">El carrito está vacío</p>
                    </div>
                ) : (
                    <div className="space-y-4 flex-1">
                        <div className="space-y-2 max-h-[30vh] overflow-y-auto no-scrollbar pr-2">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex-shrink-0">
                                        {item.producto.foto ? <img src={item.producto.foto} className="w-full h-full object-contain" /> : <ShoppingCart size={16} className="m-auto opacity-20" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black uppercase truncate text-slate-900">{item.producto.nombre}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold">{item.cantidad}x ${(item.precioVenta).toFixed(2)} c/u</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-sm text-slate-900 tracking-tighter">${(item.precioVenta * item.cantidad).toFixed(2)}</p>
                                        <button onClick={() => onRemoveItem(item.id)} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Quitar</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Total a Cobrar</span>
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">${totalCobrar.toFixed(2)}</span>
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Cobrar a Cliente</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            className="input-field appearance-none w-full"
                                            value={clienteId}
                                            onChange={(e) => setClienteId(e.target.value)}
                                        >
                                            <option value="">Seleccionar cliente...</option>
                                            {clientes?.map(c => (
                                                <option key={c.id} value={c.id}>{c.apodo} — {c.nombre}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <Users size={18} />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddClient(true)}
                                        className="bg-primary-50 text-primary-500 rounded-[1.5rem] px-5 flex items-center justify-center border border-primary-100"
                                    >
                                        <UserPlus size={20} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={!clienteId || isSubmitting}
                                className="btn-primary w-full shadow-2xl disabled:opacity-30 disabled:grayscale"
                            >
                                <CheckCircle size={20} strokeWidth={3} />
                                {isSubmitting ? 'Procesando...' : 'Finalizar y Cargar a Cuenta'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showAddClient && (
                <AddClientForm
                    onClose={() => setShowAddClient(false)}
                    onSuccess={(newClientId?: number) => {
                        setShowAddClient(false);
                        fetchClientes(newClientId);
                    }}
                />
            )}
        </div>
    );
};
