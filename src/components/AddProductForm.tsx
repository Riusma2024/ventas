import React, { useState } from 'react';
import { Camera, Save, X, Trash2, Star, Check, Plus } from 'lucide-react';
import { type Producto } from '../db/db';
import { api } from '../config/api';
import { resizeImage } from '../utils/imageUtils';
import { CropModal } from './CropModal';
import { Crop } from 'lucide-react';

interface AddProductFormProps {
    onClose: () => void;
    onSuccess: () => void;
    producto?: Producto; // Opcional para modo edición
}

export const AddProductForm: React.FC<AddProductFormProps> = ({ onClose, onSuccess, producto }) => {
    const [nombre, setNombre] = useState(producto?.nombre || '');
    const [costo, setCosto] = useState(producto?.costo.toString() || '');
    const [precio, setPrecio] = useState(producto?.precioSugerido.toString() || '');
    const [stock, setStock] = useState(producto?.stock.toString() || '1');
    const [foto, setFoto] = useState<string | undefined>(producto?.foto);
    const [imagenes, setImagenes] = useState<string[]>(producto?.imagenes || (producto?.foto ? [producto.foto] : []));
    const [descripcion, setDescripcion] = useState(producto?.descripcion || '');
    const [imageToCrop, setImageToCrop] = useState<{ src: string, index: number | null } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const resized = await resizeImage(reader.result as string);
                setImageToCrop({ src: resized, index: null });
            };
            reader.readAsDataURL(files[0]);
            // Limpiar input para permitir subir la misma imagen si se borra
            e.target.value = '';
        }
    };

    const onCropDone = (croppedImage: string) => {
        if (imageToCrop) {
            if (imageToCrop.index !== null) {
                // Editando una existente
                const newImages = [...imagenes];
                const oldImg = newImages[imageToCrop.index];
                newImages[imageToCrop.index] = croppedImage;
                setImagenes(newImages);
                if (foto === oldImg) {
                    setFoto(croppedImage);
                }
            } else {
                // Nueva imagen
                const newImages = [...imagenes, croppedImage];
                setImagenes(newImages);
                if (!foto) {
                    setFoto(croppedImage);
                }
            }
        }
        setImageToCrop(null);
    };

    const removeImage = (index: number) => {
        const imgToRemove = imagenes[index];
        const newImages = imagenes.filter((_, i) => i !== index);
        setImagenes(newImages);

        // Si la que borramos era la principal, mover la principal a la siguiente disponible
        if (foto === imgToRemove) {
            setFoto(newImages.length > 0 ? newImages[0] : undefined);
        }
    };

    const setAsMain = (img: string) => {
        setFoto(img);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const productData: Omit<Producto, 'id'> = {
                nombre,
                costo: Number(costo),
                precioSugerido: Number(precio),
                stock: Number(stock),
                foto,
                descripcion,
                imagenes
            };

            if (producto?.id) {
                await api.put(`/productos/${producto.id}`, productData);
            } else {
                await api.post('/productos', productData);
            }
            onSuccess();
        } catch (error) {
            console.error('Error al guardar producto:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white/20 my-auto">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                            {producto ? 'Editar Ítem' : 'Nuevo Ítem'}
                        </h3>
                        <p className="text-[10px] text-primary-500 font-black uppercase tracking-widest">
                            {producto ? 'Actualizar Datos' : 'Inventario Real'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Gallery section */}
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <div className="relative w-full aspect-video bg-slate-50 rounded-[2.5rem] border-3 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden group transition-all duration-500">
                                {foto ? (
                                    <>
                                        <img src={foto} alt="Main" className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/20 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-900">Portada</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-slate-300 flex flex-col items-center">
                                        <Camera size={48} strokeWidth={1.5} className="mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Sin Portada</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                            <label className="flex-shrink-0 w-20 h-20 bg-primary-50 border-2 border-dashed border-primary-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-primary-100 transition-colors">
                                <Plus size={24} className="text-primary-400" />
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                            {imagenes.map((img, idx) => (
                                <div key={idx} className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${foto === img ? 'border-primary-500 shadow-lg scale-95' : 'border-transparent'}`}>
                                    <img src={img} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                                        <div className="flex gap-1 justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setAsMain(img)}
                                                className="p-1 bg-white text-primary-500 rounded-lg hover:scale-110 transition-transform"
                                                title="Poner como principal"
                                            >
                                                <Star size={12} fill={foto === img ? "currentColor" : "none"} strokeWidth={3} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setImageToCrop({ src: img, index: idx })}
                                                className="p-1 bg-white text-slate-700 rounded-lg hover:scale-110 transition-transform"
                                                title="Recortar"
                                            >
                                                <Crop size={12} strokeWidth={3} />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="p-1 bg-white text-red-500 rounded-lg w-full hover:bg-red-50 transition-colors flex items-center justify-center"
                                        >
                                            <Trash2 size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                    {foto === img && (
                                        <div className="absolute top-1 right-1 bg-primary-500 text-white p-0.5 rounded-full">
                                            <Check size={10} strokeWidth={4} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {imageToCrop && (
                        <CropModal
                            image={imageToCrop.src}
                            onClose={() => setImageToCrop(null)}
                            onDone={onCropDone}
                        />
                    )}

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

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Descripción (Opcional)</label>
                            <textarea
                                className="input-field min-h-[80px] py-3 resize-none text-sm"
                                placeholder="Añade detalles del producto..."
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
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
                        {producto ? 'Guardar Cambios' : 'Finalizar Registro'}
                    </button>
                </form>
            </div>
        </div>
    );
};
