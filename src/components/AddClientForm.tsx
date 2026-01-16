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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 space-y-6 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Nuevo Cliente</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-2">NOMBRE COMPLETO</label>
                        <input
                            type="text"
                            required
                            className="input-field w-full"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-2">APODO / ALIAS</label>
                        <input
                            type="text"
                            required
                            className="input-field w-full"
                            placeholder="Ej. Doña Mari"
                            value={apodo}
                            onChange={(e) => setApodo(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-2">CONTACTO (WHATSAPP/FB)</label>
                        <input
                            type="text"
                            className="input-field w-full"
                            value={contacto}
                            onChange={(e) => setContacto(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                        <UserPlus size={20} />
                        Registrar Cliente
                    </button>
                </form>
            </div>
        </div>
    );
};
