import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Layout } from './components/Layout';
import { db, type Producto } from './db/db';
import { AddProductForm } from './components/AddProductForm';
import { AddClientForm } from './components/AddClientForm';
import { SellProductForm } from './components/SellProductForm';
import { TandaManager } from './components/TandaManager';
import { Plus, TrendingUp, Wallet, AlertCircle, Package, Users, UserPlus, Search, PieChart, Activity } from 'lucide-react';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

    const productos = useLiveQuery(() => db.productos.toArray());
    const clientes = useLiveQuery(() => db.clientes.toArray());
    const ventasHoy = useLiveQuery(() =>
        db.ventas.where('fecha').above(new Date(new Date().setHours(0, 0, 0, 0))).toArray()
    );

    const totalVendidoHoy = ventasHoy?.reduce((acc, v) => acc + v.precioVenta, 0) || 0;
    const utilidadHoy = ventasHoy?.reduce((acc, v) => acc + v.utilidad, 0) || 0;

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {activeTab === 'home' && (
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <section className="grid grid-cols-2 gap-4">
                        <div className="bg-primary-500 rounded-[2rem] p-5 text-white shadow-lg shadow-primary-500/20">
                            <TrendingUp size={24} className="mb-2 opacity-80" />
                            <p className="text-xs opacity-80 font-medium">Ventas Hoy</p>
                            <h3 className="text-2xl font-bold">${totalVendidoHoy.toFixed(2)}</h3>
                        </div>
                        <div className="bg-accent rounded-[2rem] p-5 text-white shadow-lg shadow-accent/20">
                            <Wallet size={24} className="mb-2 opacity-80" />
                            <p className="text-xs opacity-80 font-medium">Utilidad Hoy</p>
                            <h3 className="text-2xl font-bold">${utilidadHoy.toFixed(2)}</h3>
                        </div>
                    </section>

                    {/* Tandas Alert */}
                    <div className="bg-white rounded-3xl p-5 border-2 border-slate-100 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform" onClick={() => setActiveTab('tandas')}>
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Sección de Tandas</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">¡Nueva Funcionalidad!</p>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Actividad Reciente</h2>
                            <button className="text-sm font-semibold text-primary-500">Ver todo</button>
                        </div>
                        <div className="space-y-3 pb-10">
                            {ventasHoy && ventasHoy.length > 0 ? (
                                ventasHoy.reverse().slice(0, 5).map(v => (
                                    <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-500">
                                                <Activity size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">Venta</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{v.fecha.toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-primary-500">+${v.precioVenta}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 flex items-center gap-4 text-slate-400 italic text-sm justify-center py-10">
                                    Aún no hay movimientos hoy
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800">Inventario</h2>
                        <button onClick={() => setIsAddProductOpen(true)} className="bg-primary-500 p-3 rounded-2xl text-white shadow-lg"><Plus size={20} /></button>
                    </div>
                    {!productos || productos.length === 0 ? (
                        <div className="glass-card text-center py-12 border-dashed border-2 border-slate-200">
                            <Package size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">Inventario vacío</p>
                            <button onClick={() => setIsAddProductOpen(true)} className="text-primary-500 font-bold mt-2">Agregar Producto</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 pb-20">
                            {productos.map((prod) => (
                                <div key={prod.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                                        {prod.foto ? <img src={prod.foto} className="w-full h-full object-cover" /> : <Package size={24} className="m-auto mt-4 text-slate-200" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800">{prod.nombre}</h4>
                                        <p className="text-xs text-slate-400 font-medium">Stock: {prod.stock}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-primary-500">${prod.precioSugerido}</p>
                                        <button onClick={() => setSelectedProduct(prod)} className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full font-bold uppercase disabled:opacity-30" disabled={prod.stock <= 0}>
                                            {prod.stock > 0 ? 'Vender' : 'Agotado'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'crm' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
                        <button
                            onClick={() => setIsAddClientOpen(true)}
                            className="bg-accent p-3 rounded-2xl text-white shadow-lg"
                        >
                            <UserPlus size={20} />
                        </button>
                    </div>

                    {!clientes || clientes.length === 0 ? (
                        <div className="glass-card text-center py-12 border-dashed border-2 border-slate-200">
                            <Users size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">No hay clientes registrados</p>
                            <button onClick={() => setIsAddClientOpen(true)} className="text-accent font-bold mt-2">Agregar Cliente</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 pb-20">
                            {clientes.map(c => (
                                <div key={c.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center font-bold text-lg">
                                        {c.nombre[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{c.apodo}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.nombre}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-xs font-bold text-slate-400">DEUDA</p>
                                        <p className="font-bold text-red-500">${c.deudaTotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'tandas' && <TandaManager />}

            {activeTab === 'reports' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Resumen Financiero</h2>
                    <div className="glass-card bg-slate-900 text-white p-8">
                        <PieChart size={40} className="text-primary-400 mb-4 opacity-50" />
                        <h3 className="text-3xl font-bold 