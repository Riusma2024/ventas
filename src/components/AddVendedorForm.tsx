import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Lock } from 'lucide-react';
import { api } from '../config/api';

interface AddVendedorFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddVendedorForm: React.FC<AddVendedorFormProps> = ({ onClose, onSuccess }) => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('/users', {
                nombre,
                email,
                password,
                rol: 'vendedor'
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al crear vendedor');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-2xl">

                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Nuevo Vendedor</h3>
                        <p className="text-[10px] text-primary-500 font-black uppercase tracking-widest">Crear cuenta de acceso</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Nombre Completo</label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-primary-300 focus:bg-white transition-all"
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Correo Electrónico</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-primary-300 focus:bg-white transition-all"
                                placeholder="vendedor1@missventas.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Contraseña</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-primary-300 focus:bg-white transition-all"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full shadow-lg shadow-primary-500/30 flex items-center justify-center h-14"
                    >
                        {loading ? 'Creando...' : 'Crear Vendedor'}
                    </button>
                </form>

            </div>
        </div>,
        document.body
    );
};
