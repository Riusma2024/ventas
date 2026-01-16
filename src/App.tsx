import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Layout } from './components/Layout';
import { db, type Producto } from './db/db';
import { AddProductForm } from './components/AddProductForm';
import { AddClientForm } from './components/AddClientForm';
import { SellProductForm } from './components/SellProductForm';
import { TandaManager } from './components/TandaManager';
import { Plus, TrendingUp, Wallet, AlertCircle, Package, Users, UserPlus, Search, PieChart, Activity, ZoomIn, X } from 'lucide-react';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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
                        <div className="grid grid-cols-2 gap-4 pb-32">
                            {productos.map((prod) => (
                                <div key={prod.id} className="card-premium flex flex-col gap-3 group animate-fade-in">
                                    <div
                                        className="aspect-square bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-50 cursor-pointer relative"
                                        onClick={() => prod.foto && setZoomedImage(prod.foto)}
                                    >
                                        {prod.foto ? (
                                            <img src={prod.foto} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <Package size={32} />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 rounded-xl text-[9px] font-black shadow-lg backdrop-blur-md ${prod.stock > 0 ? 'bg-white/90 text-slate-800' : 'bg-red-500 text-white'}`}>
                                                {prod.stock > 0 ? `${prod.stock} DISP.` : 'AGOTADO'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-bold text-slate-800 text-[10px] leading-tight line-clamp-2 min-h-[1.5rem] group-hover:text-primary-500 transition-colors uppercase tracking-tight">{prod.nombre}</h4>
                                        <div className="flex justify-between items-center">
                                            <p className="text-base font-black text-slate-900 tracking-tighter">${prod.precioSugerido}</p>
                                            <button
                                                onClick={() => setSelectedProduct(prod)}
                                                className="bg-primary-500 text-white p-2.5 rounded-xl active:scale-90 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-20"
                                                disabled={prod.stock <= 0}
                                            >
                                                <Plus size={16} strokeWidth={3} />
                                            </button>
                                        </div>
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
                        <h3 className="text-3xl font-bold mb-2">En Desarrollo</h3>
                        <p className="text-slate-400 text-sm">Pronto verás aquí tus márgenes de utilidad y proyecciones.</p>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isAddProductOpen && <AddProductForm onClose={() => setIsAddProductOpen(false)} onSuccess={() => setIsAddProductOpen(false)} />}
            {isAddClientOpen && <AddClientForm onClose={() => setIsAddClientOpen(false)} onSuccess={() => setIsAddClientOpen(false)} />}
            {selectedProduct && <SellProductForm producto={selectedProduct} onClose={() => setSelectedProduct(null)} onSuccess={() => setSelectedProduct(null)} />}

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 bg-slate-900/95 z-[100] flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="relative max-w-full max-h-full">
                        <img
                            src={zoomedImage}
                            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border-4 border-white/10"
                            alt="Zoom"
                        />
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                            <X size={24} />
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default App;
