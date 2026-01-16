import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Venta } from '../db/db';
import { X, Clock, Package, User, DollarSign, TrendingUp } from 'lucide-react';

interface SaleDetailProps {
    venta: Venta;
    onClose: () => void;
}

export const SaleDetail: React.FC<SaleDetailProps> = ({ venta, onClose }) => {
    const producto = useLiveQuery(() => db.productos.get(venta.productoId), [venta.productoId]);
    const cliente = useLiveQuery(() => db.clientes.get(venta.clienteId), [venta.clienteId]);

    if (!producto || !cliente) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-2xl border border-white/20">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Detalle de Venta</h3>
                        <p className="text-[10px] text-primary-500 font-black uppercase tracking-widest">Información de Transacción</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Product & Client Info */}
                    <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100/50">
                        <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden shadow-sm border border-white">
                            {producto.foto && <img src={producto.foto} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entregado a</p>
                            <h4 className="font-black text-slate-900 text-sm leading-tight uppercase truncate">{cliente.apodo}</h4>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{cliente.nombre}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white border border-slate-100 p-5 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Producto</p>
                                    <h5 className="font-black text-slate-800 text-sm uppercase">{producto.nombre}</h5>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 p-5 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Fecha y Hora</p>
                                    <h5 className="font-black text-slate-800 text-sm uppercase">
                                        {venta.fecha.toLocaleDateString()} — {venta.fecha.toLocaleTimeString()}
                                    </h5>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900 p-5 rounded-[2rem] text-white">
                                <div className="flex items-center gap-2 mb-2 text-primary-400">
                                    <DollarSign size={14} strokeWidth={3} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Precio Venta</span>
                                </div>
                                <p className="text-xl font-black tracking-tighter">${venta.precioVenta.toFixed(2)}</p>
                            </div>
                            <div className="bg-primary-50 p-5 rounded-[2rem] border border-primary-100">
                                <div className="flex items-center gap-2 mb-2 text-primary-500">
                                    <TrendingUp size={14} strokeWidth={3} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Utilidad</span>
                                </div>
                                <p className="text-xl font-black tracking-tighter text-primary-600">${venta.utilidad.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="btn-primary w-full shadow-lg"
                >
                    Cerrar Detalle
                </button>
            </div>
        </div>
    );
};
