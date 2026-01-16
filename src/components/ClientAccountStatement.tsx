import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Cliente } from '../db/db';
import { X, Clock, Package, DollarSign, Wallet } from 'lucide-react';

interface ClientAccountStatementProps {
    cliente: Cliente;
    onClose: () => void;
}

export const ClientAccountStatement: React.FC<ClientAccountStatementProps> = ({ cliente, onClose }) => {
    const ventas = useLiveQuery(() =>
        db.ventas.where('clienteId').equals(cliente.id!).reverse().toArray()
    );
    const productos = useLiveQuery(() => db.productos.toArray());

    const ventasDetalladas = ventas?.map(v => ({
        ...v,
        producto: productos?.find(p => p.id === v.productoId)
    }));

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-2xl h-[85vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary-500 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl shadow-accent/20">
                            {cliente.nombre[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{cliente.apodo}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Estado de Cuenta</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Summary Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Deuda Total</p>
                            <h2 className="text-4xl font-black tracking-tighter text-red-400">${cliente.deudaTotal.toFixed(2)}</h2>
                        </div>
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <Wallet className="text-white" size={28} />
                        </div>
                    </div>
                </div>

                {/* Details List */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Detalle de Compras</h4>
                    {!ventasDetalladas || ventasDetalladas.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic text-sm">
                            No hay compras registradas para este cliente.
                        </div>
                    ) : (
                        ventasDetalladas.map((v) => (
                            <div key={v.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex gap-4 items-center group">
                                <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
                                    {v.producto?.foto ? (
                                        <img src={v.producto.foto} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <Package size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <Clock size={10} className="text-slate-400" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                            {v.fecha.toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h5 className="font-black text-slate-800 text-sm truncate uppercase tracking-tighter">
                                        {v.producto?.nombre || 'Producto Eliminado'}
                                    </h5>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        Precio pactado: <span className="text-primary-500">${v.precioVenta.toFixed(2)}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 text-base tracking-tighter">${v.precioVenta.toFixed(2)}</p>
                                    <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">PENDIENTE</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
