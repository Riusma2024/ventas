import React, { useState } from 'react';
import { Camera, Save, X, Maximize2 } from 'lucide-react';
import { db, type Producto } from '../db/db';
import { resizeImage } from '../utils/imageUtils';

interface AddProductFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({ onClose, onSuccess }) => {
    const [nombre, setNombre] = useState('');
    const [costo, setCosto] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('1');
    const [foto, setFoto] = useState<string | undefined>(undefined);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const resized = await resizeImage(reader.result as string);
                setFoto(resized);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.productos.add({
                nombre,
                costo: Number(costo),
                precioSugerido: Number(precio),
                stock: Number(stock),
                foto
            });
            onSuccess();
        } catch (error) {
            console.error('Error al guardar producto:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white/20">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Nuevo Ítem</h3>
                        <p className="text-[10px] text-primary-500 font-black uppercase tracking-widest">Inventario Real</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Photo Upload */}
                    <div className="flex justify-center">
                        <label className="relative w-40 h-40 bg-slate-50 rounded-[2.5rem] border-3 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-primary-400 transition-all duration-500">
                            {foto ? (
                                <img src={foto} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 group-hover:text-primary-500 transition-colors mb-2">
                                        <Camera size={24} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase">Cargar Imagen</span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Nombre del Producto</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                placeholder="Ej. Bolso de Piel"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Costo</label>
                                <input
                                    type="number"
                                    required
                                    className="input-field"
                                    placeholder="$0"
                                    value={costo}
                                    onChange={(e) => setCosto(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Venta</label>
                                <input
                                    type="number"
                                    required
                                    className="input-field font-black text-primary-600"
                                    placeholder="$0"
                                    value={precio}
                                    onChange={(e) => setPrecio(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Unidades Stock</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full shadow-2xl hover:translate-y-[-2px]">
                        <Save size={20} strokeWidth={3} />
                        Finalizar Registro
                    </button>
                </form>
            </div>
        </div>
    );
};
