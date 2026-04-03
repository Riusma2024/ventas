import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../config/api';
import { Mail, ShieldCheck, ChevronLeft, Key } from 'lucide-react';

const ForgotPassword: React.FC = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al enviar el código');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post('/auth/reset-password', { email, token: code, newPassword });
            setSuccess('Contraseña restablecida con éxito. Ya puedes iniciar sesión.');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Código incorrecto o expirado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 animate-slide-up">
                <div className="mb-8">
                    <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm">
                        <ChevronLeft size={18} /> Volver al Inicio
                    </Link>
                </div>

                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary-100 rounded-[1.5rem] mx-auto flex items-center justify-center mb-6 shadow-sm">
                        {step === 1 ? <Mail className="text-primary-600" size={32} /> : <ShieldCheck className="text-primary-600" size={32} />}
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                        {step === 1 ? 'Recuperar Cuenta' : 'Verifica tu Código'}
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">
                        {step === 1 ? 'Ingresa tu correo para recibir un código de acceso' : 'Ingresa el código enviado a tu correo'}
                    </p>
                </div>

                {success ? (
                    <div className="text-center space-y-6">
                        <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-green-700 font-bold">
                            {success}
                        </div>
                        <Link to="/login" className="w-full block bg-primary-500 text-white rounded-2xl py-5 font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 hover:bg-primary-600">
                            Iniciar Sesión
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 mb-6 text-center animate-shake">
                                {error}
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleRequestCode} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Correo de Registro</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold outline-none"
                                            placeholder="tunombre@email.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-500 text-white rounded-2xl py-5 font-black uppercase tracking-widest shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-all disabled:opacity-70"
                                >
                                    {loading ? 'Enviando...' : 'Enviar Código de Recuperación'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Código de 6 dígitos</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-black text-center text-3xl tracking-[0.5em] outline-none"
                                        placeholder="000000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Nueva Contraseña</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary-600 text-white rounded-2xl py-5 font-black uppercase tracking-widest shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-all disabled:opacity-70"
                                >
                                    {loading ? 'Restableciendo...' : 'Actualizar Contraseña'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
