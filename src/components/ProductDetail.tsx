import React, { useState } from 'react';
import { type Producto, type Cliente } from '../db/db';
import { X, ShoppingBag, Share2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductDetailProps {
    producto: Producto;
    cliente?: Cliente; // Opcional: si viene de un historial de cliente
    onClose: () => void;
    onSellAgain?: (producto: Producto, cliente: Cliente) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ producto, cliente, onClose, onSellAgain }) => {
    const [activeImage, setActiveImage] = useState<string | null>(producto.foto || null);
    const [quantity, setQuantity] = useState(1);

    const shareProduct = () => {
        const url = `${window.location.origin}/catalogo/${producto.tenant_id || ''}`;
        if (navigator.share) {
            navigator.share({
                title: producto.nombre,
                text: `Mira este producto: ${producto.nombre}`,
                url: url
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-4 bg-white/80 backdrop-blur-md text-slate-900 rounded-3xl z-20 shadow-lg active:scale-95 transition-all"
                >
                    <X size={24} strokeWidth={3} />
                </button>

                <div className="overflow-y-auto no-scrollbar">
                    <div className="relative w-full aspect-square bg-slate-100">
                        {activeImage ? (
                            <img src={activeImage} className="w-full h-full object-contain" alt={producto.nombre} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ShoppingBag size={80} />
                            </div>
                        )}

                        {/* Gallery overlap */}
                        {producto.imagenes && producto.imagenes.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 px-4">
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
                                    {producto.imagenes.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(img)}
                                            className={`w-16 h-16 rounded-xl border-2 shadow-lg overflow-hidden flex-shrink-0 active:scale-90 transition-all ${activeImage === img ? 'border-primary-500 scale-105 z-10' : 'border-white'}`}
                                        >
                                            <img src={img} className="w-full h-full object-contain" alt={`${producto.nombre} - ${idx}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1">
                                    {producto.categoria || 'Producto'}
                                </p>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                    {producto.nombre}
                                </h2>
                            </div>
                            <button
                                onClick={shareProduct}
                                className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                            >
                                <Share2 size={24} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-6 border-y border-slate-50">
                            <div className="space-y-1">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                    ${Number(producto.precioSugerido).toLocaleString()}
                                </span>
                                <p className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Precio Público</p>
                            </div>
                            <div className="text-right">
                                <div className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest ${producto.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {producto.stock > 0 ? `Stock: ${producto.stock}` : 'Agotado'}
                                </div>
                                {(producto as any).costo && (
                                    <p className="text-[8px] text-slate-300 font-bold mt-2 uppercase tracking-tight">Costo: ${(producto as any).costo}</p>
                                )}
                            </div>
                        </div>

                        {producto.descripcion && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</h4>
                                <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-[2rem]">
                                    {producto.descripcion}
                                </p>
                            </div>
                        )}

                        {onSellAgain && cliente && producto.stock > 0 && (
                            <div className="flex gap-4 pt-4 border-t border-slate-50 mt-4">
                                <div className="flex items-center bg-slate-100 rounded-[2rem] px-4 py-2 border border-slate-200">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-slate-500"><Minus size={20} strokeWidth={3} /></button>
                                    <span className="w-12 text-center font-black text-xl">{quantity}</span>
                                    <button onClick={() => setQuantity(Math.min(producto.stock, quantity + 1))} className="p-3 text-slate-500"><Plus size={20} strokeWidth={3} /></button>
                                </div>
                                <button
                                    onClick={() => onSellAgain(producto, cliente)}
                                    className="flex-1 bg-primary-500 text-white rounded-[2rem] font-black uppercase tracking-wider shadow-2xl shadow-primary-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm"
                                >
                                    <ShoppingCart size={20} />
                                    Vender a {cliente.nombre.split(' ')[0]}
                                </button>
                            </div>
                        )}

                        {producto.stock <= 0 && onSellAgain && (
                            <div className="w-full py-5 bg-slate-100 text-slate-400 rounded-[2rem] text-center font-black uppercase tracking-widest text-xs">
                                Producto sin existencias
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
