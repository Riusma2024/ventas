import React, { useState } from 'react';
import { UserPlus, Save, X } from 'lucide-react';
import { db } from '../db/db';

interface AddClientFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddClientForm: React.FC<AddClientFormProps> = ({ onClose, onSuccess }) => {
    const [nombre, setNombre] = useState('');
    const [apodo, setApodo] = useState('');
    const [contacto, setContacto] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.clientes.add({
                nombre,
                apodo,
                contacto,
                deudaTotal: 0
            });
            onSuccess();
        } catch (error) {
            console.error('Error al guardar cliente:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white/20">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Nuevo Cliente</h3>
                        <p className="text-[10px] text-accent font-black uppercase tracking-widest">Base de Datos CRM</p>
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
                            <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Contacto (Redes/Tel)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="WhatsApp o Facebook"
                                value={contacto}
                                onChange={(e) => setContacto(e.target.value)}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full bg-slate-900 hover:bg-slate-800 shadow-2xl">
                        <Save size={20} strokeWidth={3} />
                        Guardar en Directorio
                    </button>
                </form>
            </div>
        </div>
    );
};
