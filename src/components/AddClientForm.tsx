import React, { useState } from 'react';
import { UserPlus, Save, X } from 'lucide-react';
import { type Cliente } from '../db/db';
import { api } from '../config/api';

interface AddClientFormProps {
    cliente?: Cliente;
    onClose: () => void;
    onSuccess: (newClientId?: number) => void;
}

export const AddClientForm: React.FC<AddClientFormProps> = ({ cliente, onClose, onSuccess }) => {
    const [nombre, setNombre] = useState(cliente?.nombre || '');
    const [apodo, setApodo] = useState(cliente?.apodo || '');
    const [whatsapp, setWhatsapp] = useState(cliente?.whatsapp || '');
    const [facebook, setFacebook] = useState(cliente?.facebook || '');
    const [otro, setOtro] = useState(cliente?.otro || '');
    const [foto, setFoto] = useState(cliente?.foto || '');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const emojis = ['👩', '👨', '👵', '👴', '👧', '👦', '✨', '💖', '👑', '👠', '👜', '💄', '🌹', '🦋', '⭐', '💎'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            const clientData = {
                nombre,
                apodo,
                whatsapp,
                facebook,
                otro,
                foto,
                deudaTotal: cliente?.deudaTotal || 0
            };

            if (cliente?.id) {
                await api.put(`/clientes/${cliente.id}`, clientData);
                onSuccess(cliente.id);
            } else {
                const res = await api.post('/clientes', clientData);
                onSuccess(res.data.id);
            }
        } catch (err: any) {
            console.error('Error al guardar cliente:', err);
            setError(err.response?.data?.error || 'Ocurrió un error al guardar. Verifica los datos.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white/20">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </h3>
                        <p className="text-[10px] text-accent font-black uppercase tracking-widest">
                            {cliente ? 'Actualizar Directorio' : 'Base de Datos CRM'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90 transition-transform">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="w-24 h-24 bg-gradient-to-br from-accent/10 to-primary-500/10 rounded-[2rem] flex items-center justify-center text-accent border-2 border-dashed border-accent/20 cursor-pointer hover:border-accent/50 transition-all overflow-hidden shadow-inner"
                            >
                                {foto ? (
                                    foto.length > 2 ? (
                                        <img src={foto} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-5xl">{foto}</span>
                                    )
                                ) : (
                                    <UserPlus size={40} strokeWidth={2.5} />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-slate-400 hover:text-primary-500 transition-colors"
                            >
                                <Save size={14} />
                            </button>
                        </div>

                        {showEmojiPicker && (
                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 grid grid-cols-8 gap-2 animate-in fade-in zoom-in duration-200">
                                {emojis.map(e => (
                                    <button
                                        key={e}
                                        type="button"
                                        onClick={() => { setFoto(e); setShowEmojiPicker(false); }}
                                        className="text-2xl hover:scale-125 transition-transform"
                                    >
                                        {e}
                                    </button>
                                ))}
                                <div className="col-span-8 pt-2 border-t border-slate-200 mt-2 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="O pega link de foto aquí..."
                                        className="w-full text-[10px] p-2 rounded-lg border border-slate-200"
                                        value={foto.length > 30 ? 'Cargada desde dispositivo' : foto}
                                        onChange={(e) => setFoto(e.target.value)}
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="fileInput"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setFoto(reader.result as string);
                                                    setShowEmojiPicker(false);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="fileInput"
                                        className="w-full flex items-center justify-center gap-2 p-2 bg-slate-100 text-slate-500 text-[10px] font-black rounded-xl cursor-pointer hover:bg-slate-200 transition-colors border border-slate-200"
                                    >
                                        📷 USAR CÁMARA / GALERÍA
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 flex rounded-xl text-sm font-bold border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Nombre Completo</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                placeholder="Nombre real del cliente"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Apodo / Alias</label>
                            <input
                                type="text"
                                required
                                className="input-field font-black"
                                placeholder="Ej. Doña Mari"
                                value={apodo}
                                onChange={(e) => setApodo(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Telefono o Whatsapp</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Ej. 5512345678"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Perfil de Facebook</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="URL o nombre de perfil"
                                value={facebook}
                                onChange={(e) => setFacebook(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Otro</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Referencia u otro contacto"
                                value={otro}
                                onChange={(e) => setOtro(e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full bg-slate-900 hover:bg-slate-800 shadow-2xl disabled:opacity-50">
                        <Save size={20} strokeWidth={3} />
                        {isSubmitting ? 'Guardando...' : (cliente ? 'Guardar Cambios' : 'Guardar en Directorio')}
                    </button>
                </form>
            </div>
        </div>
    );
};
