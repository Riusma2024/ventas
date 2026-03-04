import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users, Settings, Plus, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../config/api';
import { AddGestionadorForm } from '../components/AddGestionadorForm';
import { EditGestionadorForm } from '../components/EditGestionadorForm';

export const SuperadminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [gestionadores, setGestionadores] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingGestionador, setEditingGestionador] = useState<any | null>(null);

    const loadGestionadores = async () => {
        try {
            const res = await api.get('/users/gestionadores');
            setGestionadores(res.data);
        } catch (error) {
            console.error('Error al cargar gestionadores:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadGestionadores();
    }, []);

    const handleDelete = async (id: number, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar al gestionador ${nombre}?`)) {
            try {
                await api.delete(`/users/gestionadores/${id}`);
                loadGestionadores();
            } catch (error: any) {
                alert(error.response?.data?.error || 'Error al eliminar el gestionador');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-primary-200 selection:text-primary-900 flex flex-col items-center">
            {/* Cabecera */}
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-sm w-full">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <span className="text-white font-black text-xs">SA</span>
                        </div>
                        <div>
                            <h1 className="font-black text-white text-base tracking-tighter hover:text-primary-400 transition-colors cursor-pointer">
                                Panel Superadmin
                            </h1>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{user?.nombre}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={logout}
                            className="p-2 sm:px-4 sm:py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-bold text-xs flex items-center gap-2 group active:scale-95"
                        >
                            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-8 animate-fade-in mt-6">

                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Gestionadores Activos</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">Administra a los usuarios que usan la plataforma</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 hover:text-primary-500 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-100 group-hover:scale-110 transition-all">
                            <UserPlus size={28} />
                        </div>
                        <span className="font-black text-sm uppercase tracking-widest">Crear Gestionador</span>
                    </button>

                    {isLoading ? (
                        <div className="bg-white border border-slate-100 rounded-3xl p-8 flex items-center justify-center text-slate-400 font-bold">
                            Cargando...
                        </div>
                    ) : (
                        gestionadores.map(g => (
                            <div key={g.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative group overflow-hidden flex flex-col justify-between">
                                {/* Acciones (hover) */}
                                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingGestionador(g)}
                                        className="p-2 bg-slate-50 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-colors"
                                        title="Editar Gestionador"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(g.id, g.nombre)}
                                        className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Eliminar Gestionador"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">
                                            {g.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="pr-16">
                                            <h3 className="font-black text-slate-900 text-lg truncate">{g.nombre}</h3>
                                            <p className="text-xs font-bold text-slate-400 truncate">{g.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-4 border-t border-slate-50 mt-auto">
                                    <span>ID: #{g.id}</span>
                                    <span>Creado: {new Date(g.creado_en).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </main>

            {isAdding && (
                <AddGestionadorForm
                    onClose={() => setIsAdding(false)}
                    onSuccess={() => {
                        setIsAdding(false);
                        loadGestionadores();
                    }}
                />
            )}

            {editingGestionador && (
                <EditGestionadorForm
                    gestionador={editingGestionador}
                    onClose={() => setEditingGestionador(null)}
                    onSuccess={() => {
                        setEditingGestionador(null);
                        loadGestionadores();
                    }}
                />
            )}
        </div>
    );
};

export default SuperadminDashboard;
