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
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                    <div className="flex justify-center mb-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-accent/10 to-primary-500/10 rounded-[2rem] flex items-center justify-center text-accent">
                            <UserPlus size={40} strokeWidth={2.5} />
                        </div>
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
