import React from 'react';
import { type Cliente, type Abono, type Producto } from '../db/db';
import { X, Clock, Package, DollarSign, Wallet, Phone, Facebook, Globe, Plus, CheckCircle, XCircle, Image as ImageIcon, Edit } from 'lucide-react';
import { AddAbonoForm } from './AddAbonoForm';
import { EditAbonoForm } from './EditAbonoForm';
import { useState, useEffect } from 'react';
import { api } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface ClientAccountStatementProps {
    cliente: Cliente;
    onClose: () => void;
    onSelectProduct?: (producto: Producto) => void;
}

export const ClientAccountStatement: React.FC<ClientAccountStatementProps> = ({ cliente, onClose, onSelectProduct }) => {
    const { user } = useAuth();
    const [isAddAbonoOpen, setIsAddAbonoOpen] = useState(false);
    const [editingAbono, setEditingAbono] = useState<Abono | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const [clienteActualizado, setClienteActualizado] = useState<Cliente | null>(null);
    const [ventasDetalladas, setVentasDetalladas] = useState<any[]>([]);
    const [abonos, setAbonos] = useState<Abono[]>([]);
    const [activeTab, setActiveTab] = useState<'compras' | 'abonos'>('compras');

    const loadData = async () => {
        try {
            const ts = Date.now();
            const [cliRes, ventRes, prodRes, abonRes] = await Promise.all([
                api.get(`/clientes?t=${ts}`),
                api.get(`/ventas?t=${ts}`),
                api.get(`/productos?t=${ts}`),
                api.get(`/abonos?clienteId=${cliente.id}&t=${ts}`)
            ]);

            const updatedClient = cliRes.data.find((c: Cliente) => c.id === cliente.id);
            if (updatedClient) setClienteActualizado(updatedClient);

            const allProducts = prodRes.data.map((p: any) => ({
                ...p,
                imagenes: p.imagenes ? (typeof p.imagenes === 'string' ? JSON.parse(p.imagenes) : p.imagenes) : []
            }));
            const clientSales = ventRes.data
                .filter((v: any) => String(v.clienteId) === String(cliente.id))
                .map((v: any) => {
                    return { ...v, producto: allProducts.find((p: any) => String(p.id) === String(v.productoId)), fecha: new Date(v.fecha) };
                });
            setVentasDetalladas(clientSales);

            const abonosData = abonRes.data.map((a: any) => ({ ...a, fecha: new Date(a.fecha) }));
            setAbonos(abonosData);
        } catch (error) {
            console.error('Error fetching statement data', error);
        }
    };

    useEffect(() => {
        loadData();
    }, [cliente.id]);

    const clienteDisplay = clienteActualizado || cliente;

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-2xl h-[85vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-start flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary-500 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl shadow-accent/20">
                                {clienteDisplay.nombre ? clienteDisplay.nombre[0].toUpperCase() : '?'}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{clienteDisplay.apodo || clienteDisplay.nombre}</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                    Estado de Cuenta • <span className="text-primary-500">ID: {clienteDisplay.codigo_cliente}</span>
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3 px-1 flex-shrink-0">
                        {clienteDisplay.whatsapp && (
                            <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-2xl border border-green-100 shadow-sm">
                                <Phone size={16} strokeWidth={3} />
                                <span className="text-sm font-black uppercase tracking-tight">{clienteDisplay.whatsapp}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden flex-shrink-0">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Deuda Total</p>
                                {Number(clienteDisplay.deudaTotal || 0) <= 0 ? (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="text-green-400" size={24} />
                                        <h2 className="text-3xl font-black tracking-tighter text-green-400 uppercase">Sin Adeudo</h2>
                                    </div>
                                ) : (
                                    <h2 className="text-4xl font-black tracking-tighter text-red-400">${Number(clienteDisplay.deudaTotal || 0).toFixed(2)}</h2>
                                )}
                            </div>
                            <button
                                onClick={() => setIsAddAbonoOpen(true)}
                                className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 active:scale-90 transition-all"
                            >
                                <Plus className="text-white" size={28} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-2xl flex-shrink-0">
                        <button 
                            onClick={() => setActiveTab('compras')}
                            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'compras' ? 'bg-white text-primary-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Compras
                        </button>
                        <button 
                            onClick={() => setActiveTab('abonos')}
                            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'abonos' ? 'bg-white text-primary-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Abonos
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20">
                        {activeTab === 'compras' ? (
                            ventasDetalladas && ventasDetalladas.length > 0 ? (
                                ventasDetalladas.map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => {
                                            // ABRIR CATALOGO PÚBLICO
                                            const url = `${window.location.origin}/catalogo/${v.tenant_id || user?.tenant_id || user?.id}#producto-${v.productoId}`;
                                            window.open(url, '_blank');
                                        }}
                                        className={`bg-slate-50 p-4 rounded-3xl border border-slate-100 flex gap-4 items-center cursor-pointer hover:bg-slate-100 active:scale-[0.98] transition-all group`}
                                    >
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                            {v.producto?.foto ? (
                                                <img src={v.producto.foto} alt={v.producto.nombre} className="w-full h-full object-contain" />
                                            ) : (
                                                <Package className="text-slate-400" size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-black text-slate-800 text-sm tracking-tighter truncate leading-tight">{v.producto?.nombre || 'Producto'}</h5>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{v.fecha.toLocaleDateString()} • {v.estado}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-primary-500 text-lg tracking-tighter">${Number(v.precioVenta || 0).toFixed(2)}</p>
                                            <span className="text-[8px] font-black text-primary-300 uppercase tracking-widest">Catálogo</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-slate-400 italic text-sm bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                                    Sin compras registradas
                                </div>
                            )
                        ) : (
                            abonos && abonos.length > 0 ? (
                                abonos.map((abono) => (
                                    <div
                                        key={abono.id}
                                        className={`p-4 rounded-[2.5rem] border flex gap-4 items-center group relative overflow-hidden ${abono.verificado
                                            ? 'bg-white border-slate-100'
                                            : 'bg-amber-50/50 border-amber-100'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${abono.verificado ? 'bg-green-500 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                            }`}>
                                            {abono.evidencia ? (
                                                <div className="w-full h-full rounded-2xl overflow-hidden cursor-pointer" onClick={() => setZoomedImage(abono.evidencia!)}>
                                                    <img src={abono.evidencia} className="w-full h-full object-cover" alt="Comprobante" />
                                                </div>
                                            ) : (
                                                <Wallet size={20} strokeWidth={3} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-[9px] font-black uppercase tracking-tighter ${abono.verificado ? 'text-green-600' : 'text-amber-600'
                                                    }`}>
                                                    {abono.fecha.toLocaleDateString()}
                                                </span>
                                                {abono.verificado && <CheckCircle size={10} className="text-green-500" />}
                                            </div>
                                            <p className={`font-black text-base tracking-tighter ${abono.verificado ? 'text-slate-900' : 'text-amber-900'
                                                }`}>+${Number(abono.monto || 0).toFixed(2)}</p>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end">
                                            <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest ${abono.verificado ? 'bg-green-50 text-green-500' : 'bg-amber-100 text-amber-600'}`}>
                                                {abono.verificado ? 'Verificado' : 'Pendiente'}
                                            </span>
                                            <button
                                                onClick={() => setEditingAbono(abono)}
                                                className={`p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100`}
                                            >
                                                <Edit size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-slate-400 italic text-sm bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                                    <Wallet size={32} className="mx-auto mb-2 opacity-20" />
                                    Sin abonos registrados
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {isAddAbonoOpen && (
                <AddAbonoForm
                    cliente={clienteDisplay}
                    onClose={() => setIsAddAbonoOpen(false)}
                    onSuccess={() => { setIsAddAbonoOpen(false); loadData(); }}
                />
            )}
            {editingAbono && (
                <EditAbonoForm
                    abono={editingAbono}
                    cliente={clienteDisplay}
                    onClose={() => setEditingAbono(null)}
                    onSuccess={() => { setEditingAbono(null); loadData(); }}
                />
            )}

            {zoomedImage && (
                <div 
                    className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 cursor-zoom-out animate-zoom-in"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative w-full max-w-2xl">
                        <img 
                            src={zoomedImage} 
                            className="w-full h-auto max-h-[85vh] object-contain rounded-[2rem] shadow-2xl border-4 border-white/10" 
                            alt="Comprobante" 
                        />
                        <button 
                            onClick={() => setZoomedImage(null)}
                            className="absolute -top-12 right-0 p-3 bg-white/20 text-white rounded-2xl"
                        >
                            <X size={24} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
