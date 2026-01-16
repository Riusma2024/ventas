import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Layout } from './components/Layout';
import { db, type Producto } from './db/db';
import { AddProductForm } from './components/AddProductForm';
import { AddClientForm } from './components/AddClientForm';
import { SellProductForm } from './components/SellProductForm';
import { TandaManager } from './components/TandaManager';
import { Plus, TrendingUp, Wallet, AlertCircle, Package, Users, UserPlus, Search, BarChart3, Activity, ZoomIn, X, RefreshCw } from 'lucide-react';
import { ReportsView } from './components/ReportsView';
import { syncAllDebts } from './utils/dbUtils';
import { ClientAccountStatement } from './components/ClientAccountStatement';
import { SaleDetail } from './components/SaleDetail';
import { type Cliente, type Venta } from './db/db';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [selectedClientAccount, setSelectedClientAccount] = useState<Cliente | null>(null);
    const [selectedSale, setSelectedSale] = useState<Venta | null>(null);

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
                        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all"></div>
                            <TrendingUp size={24} className="mb-4 text-primary-400" />
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Ventas Hoy</p>
                            <h3 className="text-3xl font-black tracking-tighter">${totalVendidoHoy.toFixed(2)}</h3>
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-premium relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all"></div>
                            <Wallet size={24} className="mb-4 text-accent" />
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Utilidad Hoy</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">${utilidadHoy.toFixed(2)}</h3>
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
                                    <div
                                        key={v.id}
                                        onClick={() => setSelectedSale(v)}
                                        className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm cursor-pointer active:scale-95 transition-all hover:border-primary-100"
                                    >
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
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    await syncAllDebts();
                                    alert('Deudas sincronizadas correctamente');
                                }}
                                title="Sincronizar Deudas"
                                className="bg-slate-100 p-3 rounded-2xl text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <RefreshCw size={20} />
                            </button>
                            <button
                                onClick={() => setIsAddClientOpen(true)}
                                className="bg-accent p-3 rounded-2xl text-white shadow-lg"
                            >
                                <UserPlus size={20} />
                            </button>
                        </div>
                    </div>

                    {!clientes || clientes.length === 0 ? (
                        <div className="glass-card text-center py-12 border-dashed border-2 border-slate-200">
                            <Users size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">No hay clientes registrados</p>
                            <button onClick={() => setIsAddClientOpen(true)} className="text-accent font-bold mt-2">Agregar Cliente</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 pb-32">
                            {clientes.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedClientAccount(c)}
                                    className="card-premium flex items-center gap-4 hover:translate-y-[-2px] cursor-pointer active:scale-95 transition-all"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-accent/20">
                                        {c.nombre[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-900 text-base tracking-tighter">{c.apodo}</h4>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">{c.nombre}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Deuda</p>
                                        <p className="font-black text-red-500 text-lg tracking-tighter">${c.deudaTotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'tandas' && <TandaManager />}

            {activeTab === 'reports' && <ReportsView />}

            {/* Modals */}
            {isAddProductOpen && <AddProductForm onClose={() => setIsAddProductOpen(false)} onSuccess={() => setIsAddProductOpen(false)} />}
            {isAddClientOpen && <AddClientForm onClose={() => setIsAddClientOpen(false)} onSuccess={() => setIsAddClientOpen(false)} />}
            {selectedProduct && <SellProductForm producto={selectedProduct} onClose={() => setSelectedProduct(null)} onSuccess={() => setSelectedProduct(null)} />}
            {selectedClientAccount && <ClientAccountStatement cliente={selectedClientAccount} onClose={() => setSelectedClientAccount(null)} />}
            {selectedSale && <SaleDetail venta={selectedSale} onClose={() => setSelectedSale(null)} />}

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
