import React, { useState } from 'react';
import { ShoppingBag, X, Users, UserPlus, ShoppingCart } from 'lucide-react';
import { type Producto, type Cliente } from '../db/db';
import { api } from '../config/api';
import { useEffect } from 'react';
import { AddClientForm } from './AddClientForm';

interface SellProductFormProps {
    producto: Producto;
    onClose: () => void;
    onSuccess: () => void;
    onAddToCart?: (item: { producto: Producto; cantidad: number; precioVenta: number; utilidad: number; clienteId?: string }) => void;
    cartClienteId?: string;
}

export const SellProductForm: React.FC<SellProductFormProps> = ({ producto, onClose, onSuccess, onAddToCart, cartClienteId }) => {
    const [precioVenta, setPrecioVenta] = useState(producto.precioSugerido.toString());
    const [clienteId, setClienteId] = useState<string>(cartClienteId || '');
    const [cantidad, setCantidad] = useState(1);
    const [showAddClient, setShowAddClient] = useState(false);

    const [clientes, setClientes] = useState<Cliente[]>([]);

    const utilidad = (Number(precioVenta) - producto.costo) * cantidad;
    const precioVentaTotal = Number(precioVenta) * cantidad;

    const handleAddToCart = () => {
        if (cartClienteId && clienteId && cartClienteId !== clienteId) {
            alert('¡Ojo! Tienes un carrito de compras pendiente con otro cliente distinto.\n\nPor favor usa el cliente del carrito que ya empezaste, o ve a tu carrito y vacíalo antes de cambiar de cliente para evitar errores de envío.');
            return;
        }

        if (onAddToCart) {
            onAddToCart({
                producto,
                cantidad,
                precioVenta: Number(precioVenta),
                utilidad,
                clienteId: clienteId || undefined
            });
        }
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const idClie = Number(clienteId);
        if (!idClie) return;

        try {
            await api.post('/ventas', {
                productoId: producto.id,
                clienteId: idClie,
                precioVenta: Number(precioVenta),
                utilidad: Number(utilidad),
                cantidad: cantidad
            });

            // Actualizar deuda del cliente manualmente en esta vista
            const client = clientes.find((c) => c.id === idClie);
            if (client) {
                await api.put(`/clientes/${client.id}`, {
                    ...client,
                    deudaTotal: Number(client.deudaTotal || 0) + precioVentaTotal
                });
            }

            onSuccess();
        } catch (error) {
            console.error('Error en el proceso de venta:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white/20 overflow-y-auto no-scrollbar max-h-[90vh]">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Registrar Venta</h3>
                        <p className="text-[10px] text-primary-500 font-black uppercase tracking-widest">Cargo a Cuenta</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100/50">
                    <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden shadow-sm border border-white">
                        {producto.foto && <img src={producto.foto} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Producto a Entregar</p>
                        <h4 className="font-black text-slate-900 text-sm leading-tight uppercase tracking-tighter">{producto.nombre}</h4>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Asignar a Cliente (Opcional si usas carrito)</label>
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
                                className="bg-primary-50 text-primary-500 rounded-[1.5rem] px-5 flex items-center justify-center border border-primary-100 hover:bg-primary-100 transition-colors active:scale-95"
                                title="Añadir nuevo cliente"
                            >
                                <UserPlus size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        {(!clientes || clientes.length === 0) && (
                            <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-tighter">¡No hay clientes registrados!</p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Precio Final c/u</label>
                            <input
                                type="number"
                                required
                                className="input-field font-black text-slate-900 text-lg"
                                value={precioVenta}
                                onChange={(e) => setPrecioVenta(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 w-32">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Cantidad</label>
                            <input
                                type="number"
                                min="1"
                                max={producto.stock}
                                required
                                className="input-field font-black text-slate-900 text-lg text-center"
                                value={cantidad}
                                onChange={(e) => setCantidad(Math.min(producto.stock, Math.max(1, Number(e.target.value))))}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group overflow-hidden relative">
                        <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-slate-200/50 rounded-full blur-xl group-hover:bg-slate-300/50 transition-all"></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Subtotal a Cobrar</p>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tighter">${precioVentaTotal.toFixed(2)}</h4>
                        </div>
                        <div className="w-12 h-12 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shadow-sm">
                            <ShoppingBag size={20} strokeWidth={3} />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {onAddToCart && (
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                className="flex-1 bg-slate-50 text-slate-900 font-bold p-4 rounded-2xl border border-slate-200 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={20} />
                                Al Carrito
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!clienteId}
                            className={`${onAddToCart ? 'flex-1' : 'w-full'} btn-primary shadow-2xl disabled:opacity-30 disabled:grayscale`}
                        >
                            <ShoppingBag size={20} strokeWidth={3} />
                            Vender Ahora
                        </button>
                    </div>
                </form>
            </div>

            {showAddClient && (
                <AddClientForm
                    onClose={() => setShowAddClient(false)}
                    onSuccess={(newClientId?: number) => {
                        setShowAddClient(false);
                        if (newClientId) {
                            fetchClientes(newClientId);
                        } else {
                            fetchClientes();
                        }
                    }}
                />
            )}
        </div>
    );
};
