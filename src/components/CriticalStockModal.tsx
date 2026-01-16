import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Producto } from '../db/db';
import { X, AlertTriangle, Package, Edit } from 'lucide-react';

interface CriticalStockModalProps {
    onClose: () => void;
    onEditProduct: (p: Producto) => void;
}

export const CriticalStockModal: React.FC<CriticalStockModalProps> = ({ onClose, onEditProduct }) => {
    const products = useLiveQuery(() =>
        db.productos.filter(p => p.stock <= 2).toArray()
    );

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-2xl border border-white/20 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Stock Crítico</h3>
                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Atención Inmediata</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
                    {!products || products.length === 0 ? (
                        <div className="text-center py-10 space-y-4">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                <Package size={32} />
                            </div>
                            <p className="text-slate-400 font-medium italic">Todo el inventario está al día</p>
                        </div>
                    ) : (
                        products.map(p => (
                            <div key={p.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-4 group">
                                <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0">
                                    {p.foto ? (
                                        <img src={p.foto} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <Package size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-900 text-xs uppercase truncate mb-1">{p.nombre}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${p.stock === 0 ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-600'}`}>
                                            {p.stock === 0 ? 'AGOTADO' : `${p.stock} UNIDADES`}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onEditProduct(p)}
                                    className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100 hover:text-primary-500 hover:border-primary-200 transition-all active:scale-90"
                                >
                                    <Edit size={16} strokeWidth={3} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="btn-primary w-full shadow-lg"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};
