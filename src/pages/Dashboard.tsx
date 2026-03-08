import React, { useState } from 'react';
import { useEffect } from 'react';
import { api } from '../config/api';
import { Layout } from '../components/Layout';
import { db, type Producto } from '../db/db';
import { AddProductForm } from '../components/AddProductForm';
import { AddClientForm } from '../components/AddClientForm';
import { SellProductForm } from '../components/SellProductForm';
import { TandaManager } from '../components/TandaManager';
import { Plus, TrendingUp, Wallet, AlertCircle, CheckCircle, Package, Users, UserPlus, Search, BarChart3, Activity, ZoomIn, X, RefreshCw, Edit, Share2, ShoppingCart } from 'lucide-react';
import { ReportsView } from '../components/ReportsView';
import { PendingRequestsManager } from '../components/PendingRequestsManager';
import { CartModal, type CartItem } from '../components/CartModal';
import { syncAllDebts } from '../utils/dbUtils';
import { useAuth } from '../context/AuthContext';
import { ClientAccountStatement } from '../components/ClientAccountStatement';
import { SaleDetail } from '../components/SaleDetail';
import { CriticalStockModal } from '../components/CriticalStockModal';
import { type Cliente, type Venta } from '../db/db';
import { ShareMenu } from '../components/ShareMenu';

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [selectedClientAccount, setSelectedClientAccount] = useState<Cliente | null>(null);
    const [selectedSale, setSelectedSale] = useState<Venta | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Cargar clientes vistos de localStorage
    const [vistosLocales, setVistosLocales] = useState<string[]>(() => {
        const saved = localStorage.getItem('clientes_vistos');
        return saved ? JSON.parse(saved) : [];
    });

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
    const [isCriticalStockOpen, setIsCriticalStockOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Cliente | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cartClienteId, setCartClienteId] = useState<string>('');

    const [productos, setProductos] = useState<Producto[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [ventasHoy, setVentasHoy] = useState<Venta[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [shareConfig, setShareConfig] = useState<{
        isOpen: boolean;
        title: string;
        text: string;
        url: string;
    }>({
        isOpen: false,
        title: '',
        text: '',
        url: ''
    });

    const openShareCatalog = () => {
        const url = `${window.location.origin}/catalogo/${user?.id}`;
        setShareConfig({
            isOpen: true,
            title: 'Mi Catálogo de Ventas',
            text: '¡Hola! Te comparto mi catálogo de productos para que los veas en línea:',
            url: url
        });
    };

    const loadData = async () => {
        try {
            setLoadingData(true);
            const [prodRes, cliRes, ventRes] = await Promise.all([
                api.get('/productos'),
                api.get('/clientes'),
                api.get('/ventas')
            ]);

            setProductos(prodRes.data);
            setClientes(cliRes.data);

            const ventasData = ventRes.data.map((v: any) => ({
                ...v,
                fecha: new Date(v.fecha)
            }));

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const hoyVentas = ventasData.filter((v: Venta) => v.fecha >= hoy);

            setVentasHoy(hoyVentas);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            showNotification('Error al cargar datos del dashboard.', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const ventasAutorizadasHoy = ventasHoy?.filter(v => v.estado !== 'apartado' && v.estado !== 'cancelado') || [];
    const totalVendidoHoy = ventasAutorizadasHoy.reduce((acc, v) => acc + Number(v.precioVenta), 0);
    const utilidadHoy = ventasAutorizadasHoy.reduce((acc, v) => acc + Number(v.utilidad), 0);

    const pendingRequestsCount = (ventasHoy || []).filter(v => v.estado === 'apartado').length;
    const newClientsCount = clientes.filter(c => !c.visto && !vistosLocales.includes(String(c.id))).length;

    return (
        <Layout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            badges={{
                requests: pendingRequestsCount,
                crm: newClientsCount
            }}
        >
            {activeTab === 'home' && (
                <div className="space-y-6">
                    {/* Quick Stats Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group flex items-center gap-6">
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl transition-all"></div>
                            <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 z-10 transition-transform group-hover:scale-110">
                                <TrendingUp size={40} className="text-primary-400" />
                            </div>
                            <div className="z-10">
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Ventas Hoy</p>
                                <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">${totalVendidoHoy.toFixed(2)}</h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium relative overflow-hidden group flex items-center gap-6">
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-accent/5 rounded-full blur-3xl transition-all"></div>
                            <div className="bg-accent/5 p-5 rounded-[1.5rem] border border-accent/5 z-10 transition-transform group-hover:scale-110">
                                <Wallet size={40} className="text-accent" />
                            </div>
                            <div className="z-10">
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Utilidad Hoy</p>
                                <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">${utilidadHoy.toFixed(2)}</h3>
                            </div>
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
                                ventasHoy.reverse().slice(0, 5).map(v => {
                                    const cliente = clientes?.find(c => c.id === v.clienteId);
                                    const nombreAMostrar = cliente ? (cliente.apodo || cliente.nombre) : 'Venta';

                                    return (
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
                                                    <p className="font-bold text-slate-800 text-sm">{nombreAMostrar}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{v.fecha.toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-primary-500">+${v.precioVenta}</p>
                                        </div>
                                    );
                                })
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
                        <div className="flex gap-2">
                            <button
                                onClick={openShareCatalog}
                                className="bg-slate-100 p-3 rounded-2xl text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-200 transition-colors"
                                title="Copiar enlace del catálogo"
                            >
                                <Share2 size={20} />
                            </button>
                            <button onClick={() => setIsAddProductOpen(true)} className="bg-primary-500 p-3 rounded-2xl text-white shadow-lg"><Plus size={20} /></button>
                        </div>
                    </div>

                    {cart.length > 0 && (
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="bg-accent text-white p-4 rounded-3xl shadow-2xl flex items-center gap-3 w-full animate-slide-up group"
                        >
                            <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                                <ShoppingCart size={24} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Carrito Activo</p>
                                <h4 className="font-bold">{cart.length} {cart.length === 1 ? 'producto' : 'productos'} en cola</h4>
                            </div>
                            <div className="font-black text-xl tracking-tighter">
                                ${cart.reduce((a, b) => a + (b.precioVenta * b.cantidad), 0).toFixed(2)}
                            </div>
                        </button>
                    )}
                    {!productos || productos.length === 0 ? (
                        <div className="glass-card text-center py-12 border-dashed border-2 border-slate-200">
                            <Package size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">Inventario vacío</p>
                            <button onClick={() => setIsAddProductOpen(true)} className="text-primary-500 font-bold mt-2">Agregar Producto</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-32">
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
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingProduct(prod)}
                                                    className="bg-slate-100 text-slate-500 p-2.5 rounded-xl active:scale-90 transition-all hover:bg-slate-200"
                                                >
                                                    <Edit size={16} strokeWidth={3} />
                                                </button>
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
                                    try {
                                        await syncAllDebts();
                                        loadData();
                                        showNotification('Deudas sincronizadas correctamente');
                                    } catch (error) {
                                        console.error('Error syncing debts:', error);
                                        showNotification('Error al sincronizar deudas.', 'error');
                                    }
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

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o apodo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary-300 transition-colors"
                        />
                    </div>

                    {!clientes || clientes.length === 0 ? (
                        <div className="glass-card text-center py-12 border-dashed border-2 border-slate-200">
                            <Users size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">No hay clientes registrados</p>
                            <button onClick={() => setIsAddClientOpen(true)} className="text-accent font-bold mt-2">Agregar Cliente</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-32">
                            {clientes
                                .filter(c => {
                                    const query = searchQuery.toLowerCase();
                                    return c.nombre.toLowerCase().includes(query) || (c.apodo && c.apodo.toLowerCase().includes(query));
                                })
                                .sort((a, b) => {
                                    const aVisto = (a.visto || vistosLocales.includes(String(a.id))) ? true : false;
                                    const bVisto = (b.visto || vistosLocales.includes(String(b.id))) ? true : false;
                                    if (aVisto === bVisto) return 0;
                                    return aVisto ? 1 : -1;
                                })
                                .map(c => (
                                    <div
                                        key={c.id}
                                        className="card-premium flex items-center justify-between gap-4 group relative overflow-hidden"
                                    >
                                        <div
                                            onClick={async () => {
                                                setSelectedClientAccount(c);
                                                const idStr = String(c.id);
                                                if (!c.visto && !vistosLocales.includes(idStr)) {
                                                    // Guardar localmente
                                                    const nuevosVistos = [...vistosLocales, idStr];
                                                    setVistosLocales(nuevosVistos);
                                                    localStorage.setItem('clientes_vistos', JSON.stringify(nuevosVistos));

                                                    // Intentar en servidor (opcional)
                                                    try {
                                                        await api.put(`/clientes/${c.id}`, { visto: true });
                                                    } catch (e) {
                                                        console.log('Usando respaldo local para visto');
                                                    }
                                                }
                                            }}
                                            className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                                        >
                                            <div className="relative flex-shrink-0">
                                                {c.foto && c.foto.length > 2 ? (
                                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary-100 shadow-sm">
                                                        {c.foto.includes('h') ? (
                                                            <img src={c.foto} className="w-full h-full object-cover" alt={c.nombre} />
                                                        ) : (
                                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-2xl">{c.foto}</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-accent/20">
                                                        {c.nombre ? c.nombre[0].toUpperCase() : '?'}
                                                    </div>
                                                )}
                                                {(!c.visto && !vistosLocales.includes(String(c.id))) && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-slate-900 text-sm tracking-tighter truncate">{c.apodo || c.nombre}</h4>
                                                    {(!c.visto && !vistosLocales.includes(String(c.id))) && (
                                                        <span className="bg-red-500 text-white text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-tighter animate-pulse">Nuevo</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{c.nombre}</p>
                                                    {c.whatsapp && (
                                                        <p className="text-[10px] text-green-600 font-black tracking-tight">{c.whatsapp}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 pr-1">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">Deuda</p>
                                                {Number(c.deudaTotal) <= 0 ? (
                                                    <span className="inline-flex bg-green-100 text-green-600 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                        Saldado
                                                    </span>
                                                ) : (
                                                    <p className="font-black text-red-500 text-lg tracking-tighter leading-none">${Number(c.deudaTotal).toFixed(2)}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {c.whatsapp && c.codigo_cliente && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const text = `Hola ${c.apodo || c.nombre}, tu código de cliente es: *${c.codigo_cliente}*. Úsalo para ver tu saldo aquí:`;
                                                            const url = `${window.location.origin}/catalogo/${user?.id}`;
                                                            setShareConfig({
                                                                isOpen: true,
                                                                title: `ID: ${c.apodo || c.nombre}`,
                                                                text,
                                                                url
                                                            });
                                                        }}
                                                        className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 active:scale-90 transition-all border border-green-100 shadow-sm"
                                                        title="Compartir Acceso"
                                                    >
                                                        <Share2 size={14} strokeWidth={3} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingClient(c);
                                                    }}
                                                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 active:scale-90 transition-all border border-slate-100 shadow-sm"
                                                >
                                                    <Edit size={14} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'requests' && <PendingRequestsManager />}
            {activeTab === 'tandas' && <TandaManager />}

            {activeTab === 'reports' && <ReportsView onShowCriticalStock={() => setIsCriticalStockOpen(true)} />}

            {/* Modals */}
            {isAddProductOpen && <AddProductForm onClose={() => setIsAddProductOpen(false)} onSuccess={() => { setIsAddProductOpen(false); loadData(); }} />}
            {editingProduct && <AddProductForm producto={editingProduct} onClose={() => setEditingProduct(null)} onSuccess={() => { setEditingProduct(null); loadData(); }} />}
            {isAddClientOpen && <AddClientForm onClose={() => setIsAddClientOpen(false)} onSuccess={() => { setIsAddClientOpen(false); loadData(); }} />}
            {editingClient && <AddClientForm cliente={editingClient} onClose={() => setEditingClient(null)} onSuccess={() => { setEditingClient(null); loadData(); }} />}
            {selectedProduct && <SellProductForm
                producto={selectedProduct}
                cartClienteId={cartClienteId}
                onClose={() => setSelectedProduct(null)}
                onSuccess={() => { setSelectedProduct(null); loadData(); }}
                onAddToCart={(item: any) => {
                    if (item.clienteId && !cartClienteId) setCartClienteId(item.clienteId);
                    setCart([...cart, { ...item, id: Date.now().toString() }]);
                    setSelectedProduct(null);
                }}
            />}

            {isCartOpen && (
                <CartModal
                    items={cart}
                    initialClienteId={cartClienteId}
                    onClose={() => setIsCartOpen(false)}
                    onRemoveItem={(id) => setCart(cart.filter(item => item.id !== id))}
                    onClearCart={() => { setCart([]); setCartClienteId(''); }}
                    onSuccess={async () => {
                        setIsCartOpen(false);
                        setCartClienteId('');
                        try {
                            await syncAllDebts();
                            await loadData();
                        } catch (e) {
                            console.error('Error post-venta:', e);
                        }
                        showNotification('¡Ventas registradas y deuda cargada exitosamente!');
                    }}
                />
            )}
            {selectedClientAccount && <ClientAccountStatement cliente={selectedClientAccount} onClose={() => setSelectedClientAccount(null)} />}
            {selectedSale && <SaleDetail venta={selectedSale} onClose={() => setSelectedSale(null)} />}
            {isCriticalStockOpen && (
                <CriticalStockModal
                    onClose={() => setIsCriticalStockOpen(false)}
                    onEditProduct={(p) => {
                        setIsCriticalStockOpen(false);
                        setEditingProduct(p);
                    }}
                />
            )}

            <ShareMenu
                isOpen={shareConfig.isOpen}
                onClose={() => setShareConfig({ ...shareConfig, isOpen: false })}
                title={shareConfig.title}
                text={shareConfig.text}
                url={shareConfig.url}
                onCopySuccess={() => showNotification('¡Enlace copiado al portapapeles!')}
            />

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

            {/* Notification Toast */}
            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl backdrop-blur-xl border ${toast.type === 'success'
                        ? 'bg-green-500/90 border-green-400 text-white'
                        : 'bg-red-500/90 border-red-400 text-white'
                        }`}>
                        <div className="bg-white/20 p-1 rounded-full">
                            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        </div>
                        <p className="font-black text-sm tracking-tight whitespace-nowrap">{toast.message}</p>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Dashboard;
