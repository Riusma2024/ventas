import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users, Plus, UserPlus, Pencil, Trash2, Ticket, Check, X, ShieldCheck } from 'lucide-react';
import { api } from '../config/api';
import { AddVendedorForm } from '../components/AddVendedorForm';
import { EditVendedorForm } from '../components/EditVendedorForm';

export const SuperadminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [vendedores, setVendedores] = useState<any[]>([]);
    const [cupones, setCupones] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isAddingCupon, setIsAddingCupon] = useState(false);
    const [editingVendedor, setEditingVendedor] = useState<any | null>(null);

    const [newCupon, setNewCupon] = useState({
        codigo: '',
        dias_regalo: 15,
        limite_usos: 100
    });

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, cuponesRes] = await Promise.all([
                api.get('/users/vendedores'),
                api.get('/admin/cupones')
            ]);
            setVendedores(usersRes.data);
            setCupones(cuponesRes.data);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteUser = async (id: number, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar al vendedor ${nombre}?`)) {
            await api.delete(`/users/vendedores/${id}`);
            loadData();
        }
    };

    const handleCreateCupon = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/cupones', newCupon);
            setIsAddingCupon(false);
            setNewCupon({ codigo: '', dias_regalo: 15, limite_usos: 100 });
            loadData();
        } catch (error) {
            alert('Error al crear el cupón');
        }
    };

    const handleDeleteCupon = async (id: number) => {
        if (window.confirm('¿Eliminar este cupón permanentemente?')) {
            await api.delete(`/admin/cupones/${id}`);
            loadData();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 flex flex-col items-center">
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-sm w-full">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg">
                            <ShieldCheck className="text-white" size={18} />
                        </div>
                        <div>
                            <h1 className="font-black text-white text-base tracking-tighter">Panel Superadmin</h1>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Global Control</p>
                        </div>
                    </div>
                    <button onClick={logout} className="p-2 px-4 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-bold text-xs flex items-center gap-2">
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </header>

            <main className="w-full max-w-5xl mx-auto p-6 space-y-12 mt-6 animate-fade-in">
                <section className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter underline decoration-primary-500 decoration-4 underline-offset-8">Vendedores</h2>
                            <p className="text-sm font-medium text-slate-500 mt-3">Administra a los usuarios independientes de la plataforma</p>
                        </div>
                        <button onClick={() => setIsAdding(true)} className="bg-primary-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg hover:bg-primary-600 transition-all">
                            <Plus size={16} /> Añadir Vendedor
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            <div className="col-span-full py-12 text-center text-slate-400 font-bold">Cargando...</div>
                        ) : vendedores.map(g => (
                            <div key={g.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative group">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingVendedor(g)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-primary-500 hover:bg-primary-50"><Pencil size={14} /></button>
                                    <button onClick={() => handleDeleteUser(g.id, g.nombre)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">{g.nombre.charAt(0)}</div>
                                    <div>
                                        <h3 className="font-black text-slate-800 truncate max-w-[150px]">{g.nombre}</h3>
                                        <p className="text-xs font-bold text-slate-400">{g.email}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-[10px] font-black uppercase text-slate-400">
                                    <span>#{g.id}</span>
                                    <span>{new Date(g.creado_en).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter underline decoration-pink-500 decoration-4 underline-offset-8">Cupones de Regalo</h2>
                            <p className="text-sm font-medium text-slate-500 mt-3">Gestiona códigos de días gratuitos para promoción</p>
                        </div>
                        <button onClick={() => setIsAddingCupon(!isAddingCupon)} className="bg-pink-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg hover:bg-pink-600 transition-all">
                            {isAddingCupon ? <X size={16} /> : <Ticket size={16} />}
                            {isAddingCupon ? 'Cancelar' : 'Crear Cupón'}
                        </button>
                    </div>

                    {isAddingCupon && (
                        <div className="bg-white border-2 border-pink-100 rounded-[2rem] p-8 shadow-xl animate-scale-in">
                            <form onSubmit={handleCreateCupon} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end font-bold">
                                <div>
                                    <label className="text-[10px] uppercase text-slate-400 mb-2 block">Código (Ej: TRIAL15)</label>
                                    <input type="text" value={newCupon.codigo} onChange={(e) => setNewCupon({...newCupon, codigo: e.target.value})} className="w-full bg-slate-50 px-5 py-3 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none uppercase" required />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-400 mb-2 block">Días de Regalo</label>
                                    <input type="number" value={newCupon.dias_regalo} onChange={(e) => setNewCupon({...newCupon, dias_regalo: Number(e.target.value)})} className="w-full bg-slate-50 px-5 py-3 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-400 mb-2 block">Límite de Usos</label>
                                    <input type="number" value={newCupon.limite_usos} onChange={(e) => setNewCupon({...newCupon, limite_usos: Number(e.target.value)})} className="w-full bg-slate-50 px-5 py-3 rounded-xl border-2 border-transparent focus:border-pink-500 outline-none" />
                                </div>
                                <button type="submit" className="bg-pink-600 text-white py-3.5 rounded-xl font-black uppercase text-xs shadow-lg shadow-pink-500/30">Guardar Cupón</button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="px-8 py-4">Código</th>
                                    <th className="px-8 py-4">Beneficio</th>
                                    <th className="px-8 py-4">Uso</th>
                                    <th className="px-8 py-4">Estado</th>
                                    <th className="px-8 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {cupones.length === 0 ? (
                                    <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-300 font-bold">No hay cupones activos</td></tr>
                                ) : cupones.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-black text-pink-600 tracking-wider uppercase">{c.codigo}</td>
                                        <td className="px-8 py-5 font-bold text-slate-700">{c.dias_regalo} días gratis</td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-pink-500" style={{width: `${(c.usos_actuales/c.limite_usos)*100}%`}}></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{c.usos_actuales} / {c.limite_usos} usos</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 w-fit">
                                                <Check size={10} /> Activo
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => handleDeleteCupon(c.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {isAdding && (
                <AddVendedorForm onClose={() => setIsAdding(false)} onSuccess={() => { setIsAdding(false); loadData(); }} />
            )}
            {editingVendedor && (
                <EditVendedorForm vendedor={editingVendedor} onClose={() => setEditingVendedor(null)} onSuccess={() => { setEditingVendedor(null); loadData(); }} />
            )}
        </div>
    );
};

export default SuperadminDashboard;
