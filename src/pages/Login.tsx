import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../config/api';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data } = await api.post('/auth/login', { email, password });

            // Iniciar sesión
            login(data.token, data.usuario);

            // Redirigir según el rol
            if (data.usuario.rol === 'superadmin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                        <span className="text-primary-500 font-black text-2xl">MV</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Bienvenido de nuevo</h2>
                    <p className="text-slate-500 mt-2">Accede a tu panel de Miss Ventas</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-slate-700"
                            placeholder="tu@correo.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-slate-700"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-500 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center h-14 mt-4"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                    
                    <div className="flex flex-col gap-4 text-center mt-6">
                        <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-bold transition-all text-sm">
                            ¿Olvidaste tu contraseña?
                        </Link>
                        <hr className="border-slate-100" />
                        <p className="text-slate-500 text-sm font-medium">
                            ¿Aún no tienes cuenta? <Link to="/register" className="text-primary-600 hover:underline font-black">Regístrate como Vendedor</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
