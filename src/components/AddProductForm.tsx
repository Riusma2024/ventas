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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFoto(reader.result as string);
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 space-y-6 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Nuevo Producto</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Photo Upload */}
                    <div className="flex justify-center">
                        <label className="relative w-32 h-32 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                            {foto ? (
                                <img src={foto} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Camera size={32} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
                                    <span className="text-[10px] text-slate-400 mt-2 font-medium">SUBIR FOTO</span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-2">NOMBRE DEL PRODUCTO</label>
                        <input
                            type="text"
                            required
                            className="input-field w-full"
                            placeholder="Ej. Taza Personalizada"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-2">COSTO ($)</label>
                            <input
                                type="number"
                                required
                                className="input-field w-full"
                                placeholder="0.00"
                                value={costo}
                                onChange={(e) => setCosto(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-2">PRECIO VTA ($)</label>
                            <input
                                type="number"
                                required
                                className="input-field w-full"
                                placeholder="0.00"
                                value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-2">CANTIDAD EN STOCK</label>
                        <input
                            type="number"
                            required
                            className="input-field w-full"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                        <Save size={20} />
                        Guardar Producto
                    </button>
                </form>
            </div>
        </div>
    );
};
