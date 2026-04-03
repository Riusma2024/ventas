import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../config/api';
import { ShoppingBag, ChevronRight, Gift } from 'lucide-react';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        negocio_nombre: '',
        codigo_cupon: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data } = await api.post('/auth/register', formData);
            setSuccess(`¡Registro exitoso! Tu catálogo está en: miss-ventas.com/catalogo/${data.slug}`);
            setTimeout(() => navigate('/login'), 5000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 animate-slide-up">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary-100 rounded-[1.5rem] mx-auto flex items-center justify-center mb-6 shadow-sm">
                        <ShoppingBag className="text-primary-600" size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Empieza a Vender</h2>
                    <p className="text-slate-500 mt-2 font-medium">Crea tu cuenta de vendedor independiente</p>
                </div>

                {success ? (
                    <div className="bg-green-50 p-8 rounded-3xl border border-green-100 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ChevronRight size={32} />
                        </div>
                        <h3 className="text-green-800 font-black text-xl mb-4">¡Todo listo!</h3>
                        <p className="text-green-700 text-sm leading-relaxed mb-6">{success}</p>
                        <Link to="/login" className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-bold">Ir al Login</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Tu Nombre</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold outline-none"
                                    placeholder="Nombre"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Nombre de tu Negocio</label>
                                <input
                                    type="text"
                                    value={formData.negocio_nombre}
                                    onChange={(e) => setFormData({ ...formData, negocio_nombre: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold outline-none"
                                    placeholder="Ej: Zapatería Rius"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold outline-none"
                                    placeholder="hola@negocio.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">Contraseña</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block flex items-center gap-1.5">
                                    <Gift size={12} className="text-primary-500" /> Código de Regalo (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.codigo_cupon}
                                    onChange={(e) => setFormData({ ...formData, codigo_cupon: e.target.value.toUpperCase() })}
                                    className="w-full px-5 py-4 rounded-2xl bg-primary-50/50 border-2 border-dashed border-primary-200 text-primary-700 focus:bg-white focus:border-primary-600 transition-all font-black uppercase outline-none placeholder:text-primary-300"
                                    placeholder="TRIAL15"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-500 text-white rounded-2xl py-5 font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-70 mt-6"
                        >
                            {loading ? 'Creando Cuenta...' : 'Registrarme Ahora'}
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-slate-500 text-sm font-bold">
                                ¿Ya tienes cuenta? <Link to="/login" className="text-primary-600 hover:underline">Inicia Sesión</Link>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Register;
