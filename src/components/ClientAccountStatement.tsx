import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Cliente } from '../db/db';
import { X, Clock, Package, DollarSign, Wallet, Phone, Facebook, Globe, Plus, CheckCircle, XCircle, Image as ImageIcon, Edit } from 'lucide-react';
import { AddAbonoForm } from './AddAbonoForm';
import { EditAbonoForm } from './EditAbonoForm';
import { useState } from 'react';
import { type Abono } from '../db/db';

interface ClientAccountStatementProps {
    cliente: Cliente;
    onClose: () => void;
}

export const ClientAccountStatement: React.FC<ClientAccountStatementProps> = ({ cliente, onClose }) => {
    const [isAddAbonoOpen, setIsAddAbonoOpen] = useState(false);
    const [editingAbono, setEditingAbono] = useState<Abono | null>(null);

    // Obtener datos actualizados del cliente en tiempo real
    const clienteActualizado = useLiveQuery(
        () => db.clientes.get(cliente.id!),
        [cliente.id]
    );

    const ventas = useLiveQuery(() =>
        db.ventas.where('clienteId').equals(cliente.id!).reverse().toArray()
    );
    const productos = useLiveQuery(() => db.productos.toArray());
    const abonos = useLiveQuery(() =>
        db.abonos.where('clienteId').equals(cliente.id!).reverse().toArray()
    );

    // Usar el cliente actualizado si está disponible, sino usar el prop
    const clienteDisplay = clienteActualizado || cliente;

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
                            {clienteDisplay.nombre[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{clienteDisplay.apodo || clienteDisplay.nombre}</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Estado de Cuenta</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Contact Info Chips */}
                <div className="flex flex-wrap gap-2 px-1 flex-shrink-0">
                    {clienteDisplay.whatsapp && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1.5 rounded-xl border border-green-100">
                            <Phone size={12} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{clienteDisplay.whatsapp}</span>
                        </div>
                    )}
                    {clienteDisplay.facebook && (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100">
                            <Facebook size={12} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[100px]">{clienteDisplay.facebook}</span>
                        </div>
                    )}
                    {clienteDisplay.otro && (
                        <div className="flex items-center gap-2 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Globe size={12} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[100px]">{clienteDisplay.otro}</span>
                        </div>
                    )}
                </div>

                {/* Summary Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Deuda Total</p>
                            <h2 className="text-4xl font-black tracking-tighter text-red-400">${clienteDisplay.deudaTotal.toFixed(2)}</h2>
                        </div>
                        <button
                            onClick={() => setIsAddAbonoOpen(true)}
                            className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 active:scale-90 transition-all"
                        >
                            <Plus className="text-white" size={28} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Tabs and Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                    {/* Payment History */}
                    {abonos && abonos.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Historial de Abonos</h4>
                            {abonos.map((abono) => (
                                <div
                                    key={abono.id}
                                    className={`p-4 rounded-3xl border flex gap-4 items-center group ${abono.verificado
                                        ? 'bg-green-50 border-green-100'
                                        : 'bg-amber-50 border-amber-200'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${abono.verificado ? 'bg-green-500' : 'bg-amber-500'
                                        }`}>
                                        <DollarSign className="text-white" size={20} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <Clock size={10} className={abono.verificado ? 'text-green-600' : 'text-amber-600'} />
                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${abono.verificado ? 'text-green-600' : 'text-amber-600'
                                                }`}>
                                                {abono.fecha.toLocaleDateString()}
                                            </span>
                                            {abono.verificado ? (
                                                <CheckCircle size={12} className="text-green-600" />
                                            ) : (
                                                <XCircle size={12} className="text-amber-600" />
                                            )}
                                        </div>
                                        <p className={`font-black text-base tracking-tighter ${abono.verificado ? 'text-green-700' : 'text-amber-700'
                                            }`}>+${abono.monto.toFixed(2)}</p>
                                        {abono.evidencia && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <ImageIcon size={10} className={abono.verificado ? 'text-green-600' : 'text-amber-600'} />
                                                <span className={`text-[8px] font-bold uppercase ${abono.verificado ? 'text-green-600' : 'text-amber-600'
                                                    }`}>Con evidencia</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <p className={`text-[8px] font-black uppercase tracking-widest ${abono.verificado ? 'text-green-600' : 'text-amber-600'
                                            }`}>
                                            {abono.verificado ? 'Verificado' : '⚠ Pendiente'}
                                        </p>
                                        <button
                                            onClick={() => setEditingAbono(abono)}
                                            className={`p-2 rounded-xl active:scale-90 transition-all opacity-0 group-hover:opacity-100 ${abono.verificado
                                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                                }`}
                                        >
                                            <Edit size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sales History */}
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Detalle de Compras</h4>
                    {!ventasDetalladas || ventasDetalladas.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic text-sm">
                            Sin compras registradas
                        </div>
                    ) : (
                        ventasDetalladas.map(v => (
                            <div key={v.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex gap-4 items-center">
                                <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {v.producto?.foto ? (
                                        <img src={v.producto.foto} alt={v.producto.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="text-slate-400" size={20} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <Clock size={10} className="text-slate-400" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                            {v.fecha.toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h5 className="font-black text-slate-900 text-sm tracking-tighter truncate">
                                        {v.producto?.nombre || 'Producto eliminado'}
                                    </h5>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Total</p>
                                    <p className="font-black text-slate-900 text-lg tracking-tighter">${v.precioVenta.toFixed(2)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Abono Modal */}
                {isAddAbonoOpen && (
                    <AddAbonoForm
                        cliente={clienteDisplay}
                        onClose={() => setIsAddAbonoOpen(false)}
                        onSuccess={() => setIsAddAbonoOpen(false)}
                    />
                )}
                {editingAbono && (
                    <EditAbonoForm
                        abono={editingAbono}
                        cliente={clienteDisplay}
                        onClose={() => setEditingAbono(null)}
                        onSuccess={() => setEditingAbono(null)}
                    />
                )}
            </div>
        </div>
    );
};
