import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingBag, Search, X, ShoppingCart, Plus, Minus, Send, User, Share2, ExternalLink, ChevronLeft, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../config/api';

interface Producto {
    id: number;
    nombre: string;
    precioSugerido: number;
    foto: string | null;
    categoria: string | null;
    stock: number;
    descripcion: string | null;
    imagenes: string[];
}

interface CartItem extends Producto {
    cantidad: number;
}

export const PublicCatalog: React.FC = () => {
    const { tenant_id } = useParams<{ tenant_id: string }>();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [negocio, setNegocio] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantities, setQuantities] = useState<Record<number, number>>({});

    // Carrito de compras y checkout
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteWhatsapp, setClienteWhatsapp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [clienteAuth, setClienteAuth] = useState<any>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginCode, setLoginCode] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [activeModalImage, setActiveModalImage] = useState<string | null>(null);

    // Profile tabs
    const [profileTab, setProfileTab] = useState<'acuerdos' | 'abonos'>('acuerdos');

    // Login security state
    const [loginStep, setLoginStep] = useState<'id' | 'confirm' | 'verify'>('id');
    const [pendingClient, setPendingClient] = useState<any>(null);
    const [phoneConfirmation, setPhoneConfirmation] = useState('');

    // Memoria de dispositivo
    const [rememberedUser, setRememberedUser] = useState<{ nombre: string, whatsapp: string } | null>(null);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    const fetchCatalogData = async () => {
        const savedId = localStorage.getItem('missventas_cliente_id');
        try {
            const url = savedId
                ? `/public/catalogo/${tenant_id}?clienteId=${savedId}`
                : `/public/catalogo/${tenant_id}`;
            const res = await api.get(url);
            setNegocio(res.data.negocio);
            const parsedProducts = res.data.productos.map((p: any) => ({
                ...p,
                imagenes: p.imagenes ? (typeof p.imagenes === 'string' ? JSON.parse(p.imagenes) : p.imagenes) : []
            }));
            setProductos(parsedProducts);
            if (res.data.cliente) {
                setClienteAuth(res.data.cliente);
            } else {
                setClienteAuth(null);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'No se pudo cargar el catálogo');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (tenant_id) {
            fetchCatalogData();

            const savedNombre = localStorage.getItem('missventas_cliente_nombre');
            const savedWhatsapp = localStorage.getItem('missventas_cliente_whatsapp');

            if (savedNombre && savedWhatsapp) {
                setRememberedUser({ nombre: savedNombre, whatsapp: savedWhatsapp });
                setClienteNombre(savedNombre);
                setClienteWhatsapp(savedWhatsapp);
                setShowWelcomeModal(true);
            }
        }
    }, [tenant_id]);

    const handleLoginWithCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        try {
            const res = await api.get(`/public/catalogo/${tenant_id}?codigo=${loginCode}`);
            if (res.data.cliente) {
                setPendingClient(res.data.cliente);
                setLoginStep('confirm');
                setLoginError(null);
            } else {
                setLoginError('ID de cliente no encontrado');
            }
        } catch (err: any) {
            setLoginError('Error al buscar el ID');
        }
    };

    const handleConfirmPhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingClient) return;

        // Limpiar los números de ambos lados para comparar
        const cleanPhone = pendingClient.whatsapp.replace(/\D/g, '');
        const lastFour = cleanPhone.slice(-4);

        if (phoneConfirmation === lastFour) {
            const c = pendingClient;
            setClienteAuth(c);
            localStorage.setItem('missventas_cliente_id', c.id.toString());
            localStorage.setItem('missventas_cliente_nombre', c.nombre);
            localStorage.setItem('missventas_cliente_whatsapp', c.whatsapp);
            setClienteNombre(c.nombre);
            setClienteWhatsapp(c.whatsapp);
            setIsLoginModalOpen(false);
            setLoginCode('');
            setPhoneConfirmation('');
            setLoginStep('id');
            setPendingClient(null);
            setSuccessMessage(`¡Bienvenido de nuevo, ${c.nombre}!`);
        } else {
            setLoginError('Los últimos 4 dígitos no coinciden');
        }
    };

    const addToCart = (prod: Producto, quantityToAdd: number = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === prod.id);
            if (existing) {
                const newQuantity = Math.min(existing.cantidad + quantityToAdd, prod.stock);
                return prev.map(item => item.id === prod.id ? { ...item, cantidad: newQuantity } : item);
            }
            return [...prev, { ...prod, cantidad: Math.min(quantityToAdd, prod.stock) }];
        });

        if (quantities[prod.id]) {
            setQuantities(prev => ({ ...prev, [prod.id]: 1 }));
        }
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = item.cantidad + delta;
                if (newQuantity <= 0) return item;
                if (newQuantity > item.stock) return item;
                return { ...item, cantidad: newQuantity };
            }
            return item;
        }));
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const submitApartados = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const carritoPayload = cart.map(item => ({
                productoId: item.id,
                cantidad: item.cantidad,
                precioOriginal: item.precioSugerido
            }));

            const res = await api.post(`/public/apartado/${tenant_id}`, {
                cliente: {
                    nombre: clienteNombre,
                    whatsapp: clienteWhatsapp
                },
                carrito: carritoPayload
            });

            const newClientId = res.data.clienteId;
            localStorage.setItem('missventas_cliente_nombre', clienteNombre);
            localStorage.setItem('missventas_cliente_whatsapp', clienteWhatsapp);
            localStorage.setItem('missventas_cliente_id', newClientId.toString());
            setRememberedUser({ nombre: clienteNombre, whatsapp: clienteWhatsapp });

            setSuccessMessage('¡Solicitud enviada exitosamente! El vendedor se pondrá en contacto pronto.');
            setCart([]);
            setIsCartOpen(false);
            setClienteNombre('');
            setClienteWhatsapp('');

            // Actualizar datos del cliente
            const updated = await api.get(`/public/catalogo/${tenant_id}?clienteId=${newClientId}`);
            if (updated.data.cliente) setClienteAuth(updated.data.cliente);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al enviar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.precioSugerido) * item.cantidad), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);

    const shareCatalog = async () => {
        const shareData = {
            title: `Catálogo de ${negocio} - Miss Ventas`,
            text: `¡Hola! Te comparto el catálogo de ${negocio}. Puedes ver todos los productos disponibles aquí:`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert('¡Enlace copiado al portapapeles!');
            }
        } catch (err) {
            console.error('Error al compartir catálogo:', err);
        }
    };

    const shareProduct = async (prod: Producto) => {
        const shareData = {
            title: prod.nombre,
            text: `¡Mira este ${prod.nombre} en ${negocio}! 😍 Solo $${Number(prod.precioSugerido).toLocaleString()}. Puedes verlo aquí:`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert('¡Enlace del producto copiado!');
            }
        } catch (err) {
            console.error('Error al compartir producto:', err);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Cargando catálogo...</div>;
    }

    if (error && !productos.length && !successMessage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <div className="w-24 h-24 bg-red-100 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                    <X size={40} strokeWidth={3} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 text-center">{error}</h1>
                <p className="text-slate-500 mt-2 text-center">Verifica el enlace o contacta al vendedor.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-primary-200 selection:text-primary-900">
            {/* Modal de Bienvenida */}
            {showWelcomeModal && rememberedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-fade-in text-center relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl"></div>
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30 transform -rotate-3">
                            <ShoppingBag size={36} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">¡Hola de nuevo, {rememberedUser.nombre}!</h2>
                        <p className="text-slate-500 font-medium mb-8">¿Deseas registrar tus apartados con este usuario?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowWelcomeModal(false)}
                                className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl shadow-primary-500/20 active:scale-95 transition-all hover:bg-primary-600"
                            >
                                Sí, continuar como {rememberedUser.nombre}
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('missventas_cliente_nombre');
                                    localStorage.removeItem('missventas_cliente_whatsapp');
                                    localStorage.removeItem('missventas_cliente_id');
                                    setRememberedUser(null);
                                    setClienteNombre('');
                                    setClienteWhatsapp('');
                                    setClienteAuth(null);
                                    setShowWelcomeModal(false);
                                }}
                                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm tracking-wide active:scale-95 transition-all hover:bg-slate-200"
                            >
                                No, soy otra persona
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="font-black text-slate-900 text-xl tracking-tighter inline-flex items-center gap-2">
                            <ShoppingBag className="text-primary-500" />
                            Catálogo
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{negocio}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {!clienteAuth && (
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-colors"
                            >
                                <User size={16} />
                                Tengo ID
                            </button>
                        )}
                        <button
                            onClick={shareCatalog}
                            className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors"
                            title="Compartir Catálogo"
                        >
                            <Share2 size={22} />
                        </button>
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-3 bg-primary-50 text-primary-600 rounded-2xl hover:bg-primary-100 transition-colors"
                        >
                            <ShoppingCart size={24} />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {clienteAuth && (
                <div className="bg-slate-900 text-white">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsProfileModalOpen(true)}>
                            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-black text-xs">
                                {clienteAuth.nombre[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Mi Cuenta</p>
                                <p className="text-xs font-bold text-slate-100 group-hover:text-primary-400 transition-colors">{clienteAuth.nombre}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">Mi Saldo</p>
                            <p className={`text-sm font-black tracking-tighter ${Number(clienteAuth.deudaTotal) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                ${Number(clienteAuth.deudaTotal).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 animate-fade-in mt-2">
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-3xl text-center shadow-sm animate-slide-up">
                        <ShoppingBag size={40} className="mx-auto mb-4 text-green-500" />
                        <h2 className="text-lg font-black">{successMessage}</h2>
                        <button onClick={() => setSuccessMessage(null)} className="mt-4 px-6 py-2 bg-white rounded-xl text-green-600 font-bold text-sm shadow-sm hover:bg-green-50">
                            Seguir Viendo Catálogo
                        </button>
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(prod => (
                        <div key={prod.id} className="bg-white rounded-3xl p-4 border border-slate-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <div
                                className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden relative flex items-center justify-center cursor-zoom-in group-hover:shadow-lg transition-all"
                                onClick={() => {
                                    setSelectedProduct(prod);
                                    setActiveModalImage(prod.foto);
                                }}
                            >
                                {prod.foto ? (
                                    <img src={prod.foto} alt={prod.nombre} className="w-full h-full object-contain transition-transform duration-700" />
                                ) : (
                                    <ShoppingBag size={40} className="text-slate-200" />
                                )}
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                    <Maximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight line-clamp-2 min-h-[40px]">{prod.nombre}</h3>
                            <p className="font-black text-primary-500 text-lg mb-4">${Number(prod.precioSugerido).toLocaleString()}</p>
                            <div className="w-full mb-3 flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200">
                                <button onClick={() => setQuantities(prev => ({ ...prev, [prod.id]: Math.max(1, (prev[prod.id] || 1) - 1) }))} className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={(quantities[prod.id] || 1) <= 1}><Minus size={16} /></button>
                                <span className="font-bold text-sm text-slate-700 w-8 text-center">{quantities[prod.id] || 1}</span>
                                <button onClick={() => setQuantities(prev => ({ ...prev, [prod.id]: Math.min(prod.stock, (prev[prod.id] || 1) + 1) }))} className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={(quantities[prod.id] || 1) >= prod.stock}><Plus size={16} /></button>
                            </div>
                            <button onClick={() => addToCart(prod, quantities[prod.id] || 1)} className="w-full py-3 bg-slate-900 border border-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none" disabled={prod.stock <= 0}>
                                {prod.stock > 0 ? 'Apartar' : 'Agotado'}
                            </button>
                        </div>
                    ))}
                </div>
            </main>

            {isCartOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-end animate-fade-in">
                    <div className="w-full max-w-md bg-white h-full shadow-2xl animate-slide-left flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 inline-flex items-center gap-2"><ShoppingCart className="text-primary-500" /> Carrito</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="text-center text-slate-400 font-medium mt-12 flex flex-col items-center">
                                    <ShoppingCart size={48} className="text-slate-200 mb-4" />
                                    Tu carrito está vacío
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0">
                                                {item.foto ? <img src={item.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100"><ShoppingBag size={20} className="text-slate-300" /></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 text-sm truncate">{item.nombre}</h4>
                                                <p className="font-black text-primary-500">${Number(item.precioSugerido).toLocaleString()}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={item.cantidad <= 1}><Minus size={14} /></button>
                                                        <span className="w-6 text-center text-xs font-bold">{item.cantidad}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" disabled={item.cantidad >= item.stock}><Plus size={14} /></button>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-[10px] uppercase font-black text-red-400">Quitar</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center">
                                        <span className="font-bold text-slate-500">Total</span>
                                        <span className="font-black text-slate-900 text-2xl">${cartTotal.toLocaleString()}</span>
                                    </div>
                                    <form id="checkoutForm" onSubmit={submitApartados} className="space-y-4 pt-6 border-t border-slate-100 mt-6">
                                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest text-center">Tus Datos</h3>
                                        {rememberedUser ? (
                                            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex flex-col gap-2 relative overflow-hidden">
                                                <p className="font-black text-slate-800 text-lg tracking-tight">{clienteNombre}</p>
                                                <p className="text-xs text-slate-500 font-bold uppercase">{clienteWhatsapp}</p>
                                                <button type="button" onClick={() => { localStorage.removeItem('missventas_cliente_id'); setRememberedUser(null); setClienteAuth(null); }} className="text-primary-500 text-xs font-black uppercase hover:underline">Cambiar cuenta</button>
                                            </div>
                                        ) : (
                                            <>
                                                <input type="text" required placeholder="Nombre Completo" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl" />
                                                <input type="tel" required placeholder="WhatsApp" value={clienteWhatsapp} onChange={e => setClienteWhatsapp(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl" />
                                            </>
                                        )}
                                    </form>
                                </div>
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="p-6 bg-white border-t border-slate-100">
                                <button type="submit" form="checkoutForm" disabled={isSubmitting} className="w-full bg-primary-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                                    {isSubmitting ? 'Procesando...' : 'Enviar Solicitud'} <Send size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isProfileModalOpen && clienteAuth && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-6 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-6 right-6 p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all z-10"><X size={24} strokeWidth={3} /></button>

                        {/* Header Personal */}
                        <div className="text-center pt-4 mb-6 sticky top-0 bg-white">
                            <div className="w-20 h-20 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 font-black text-3xl shadow-xl">
                                {clienteAuth.nombre[0].toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tighter">{clienteAuth.nombre}</h2>
                            <span className="inline-block bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">ID: {clienteAuth.codigo_cliente}</span>

                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                                    <p className="text-sm font-black text-slate-700 tracking-tight line-clamp-1">{clienteAuth.whatsapp}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deuda</p>
                                    <p className={`text-lg font-black tracking-tighter ${Number(clienteAuth.deudaTotal) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        ${Number(clienteAuth.deudaTotal).toFixed(0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs de Historial */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4 gap-2">
                            <button
                                onClick={() => setProfileTab('acuerdos')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${profileTab === 'acuerdos' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                            >
                                Acuerdos ({clienteAuth.ventas?.length || 0})
                            </button>
                            <button
                                onClick={() => setProfileTab('abonos')}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${profileTab === 'abonos' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                            >
                                Abonos ({clienteAuth.abonos?.length || 0})
                            </button>
                        </div>

                        {/* Listado Scrollable */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar mb-6 min-h-0">
                            {profileTab === 'acuerdos' ? (
                                <>
                                    {!clienteAuth.ventas || clienteAuth.ventas.length === 0 ? (
                                        <p className="text-center py-10 text-slate-400 font-medium italic">Sin adquisiciones aún</p>
                                    ) : (
                                        clienteAuth.ventas.map((v: any) => (
                                            <div
                                                key={v.id}
                                                onClick={() => {
                                                    const productData: Producto = {
                                                        id: v.productoId,
                                                        nombre: v.productoNombre,
                                                        precioSugerido: v.productoPrecioOriginal,
                                                        foto: v.productoFoto,
                                                        categoria: v.productoCategoria,
                                                        stock: v.productoStock,
                                                        descripcion: v.productoDescripcion,
                                                        imagenes: v.productoImagenes ? (typeof v.productoImagenes === 'string' ? JSON.parse(v.productoImagenes) : v.productoImagenes) : []
                                                    };
                                                    setSelectedProduct(productData);
                                                    setActiveModalImage(productData.foto);
                                                }}
                                                className="bg-white border border-slate-100 p-3 rounded-2xl flex gap-3 items-center shadow-sm hover:border-accent/30 transition-all cursor-pointer group active:scale-[0.98]"
                                            >
                                                {/* Miniatura */}
                                                <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-50 group-hover:border-accent/20 transition-all">
                                                    {v.productoFoto ? (
                                                        <img src={v.productoFoto} alt={v.productoNombre} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <ShoppingBag size={18} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <p className="text-[11px] font-black text-slate-800 tracking-tight leading-tight uppercase truncate">{v.productoNombre}</p>
                                                        <ExternalLink size={10} className="text-slate-300 group-hover:text-accent transition-colors" />
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 font-bold">{new Date(v.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                </div>

                                                <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                                                    <p className="font-black text-slate-900 tracking-tighter text-sm">$ {v.precioVenta}</p>
                                                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-md ${v.pagado ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                                        {v.pagado ? 'SALDADO' : (v.estado === 'apartado' ? 'PENDIENTE' : 'A CUENTA')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </>
                            ) : (
                                <>
                                    {!clienteAuth.abonos || clienteAuth.abonos.length === 0 ? (
                                        <p className="text-center py-10 text-slate-400 font-medium italic">Sin abonos registrados</p>
                                    ) : (
                                        clienteAuth.abonos.map((a: any) => (
                                            <div key={a.id} className={`${a.verificado ? 'bg-green-50/30 border-green-100' : 'bg-orange-50/30 border-orange-100'} border p-4 rounded-2xl flex justify-between items-center`}>
                                                <div className="flex flex-col gap-1">
                                                    <p className={`text-sm font-black tracking-tight ${a.verificado ? 'text-green-700' : 'text-orange-700'}`}>
                                                        {a.verificado ? 'Abono Verificado' : 'Abono Pendiente'} ({a.metodoPago || 'Efectivo'})
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{new Date(a.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-black text-lg tracking-tighter ${a.verificado ? 'text-green-600' : 'text-orange-600'}`}>+$ {a.monto}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </>
                            )}
                        </div>

                        {/* Botón Cerrar Sesión */}
                        <div className="space-y-3 pt-4 border-t border-slate-50 sticky bottom-0 bg-white bg-opacity-95">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('missventas_cliente_id');
                                    localStorage.removeItem('missventas_cliente_nombre');
                                    localStorage.removeItem('missventas_cliente_whatsapp');
                                    setClienteAuth(null);
                                    setRememberedUser(null);
                                    setClienteNombre('');
                                    setClienteWhatsapp('');
                                    setIsProfileModalOpen(false);
                                }}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                            >
                                Cerrar Sesión / No soy {clienteAuth.nombre.split(' ')[0]}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoginModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center relative animate-fade-in">
                        <button type="button" onClick={() => { setIsLoginModalOpen(false); setLoginStep('id'); setPendingClient(null); }} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>

                        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <User size={32} />
                        </div>

                        {loginStep === 'id' && (
                            <form onSubmit={handleLoginWithCode} className="space-y-4">
                                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Accede a tu cuenta</h2>
                                <p className="text-slate-500 text-sm mb-8">Ingresa tu código de cliente para comenzar.</p>

                                <div className="text-left">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código de Cliente</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: C-6"
                                        value={loginCode}
                                        onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-1 text-center font-black text-lg focus:border-primary-500 outline-none transition-all"
                                    />
                                </div>

                                {loginError && <p className="text-red-500 text-[10px] font-bold italic">{loginError}</p>}

                                <button type="submit" className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl shadow-primary-500/20 active:scale-95 transition-all">
                                    Siguiente
                                </button>
                            </form>
                        )}

                        {loginStep === 'confirm' && pendingClient && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">¿Eres tú?</h2>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="text-xl font-black text-slate-800 leading-tight">{pendingClient.nombre}</p>
                                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">ID: {pendingClient.codigo_cliente}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setLoginStep('id')} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm">No, regresar</button>
                                    <button onClick={() => setLoginStep('verify')} className="flex-1 py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-lg shadow-primary-500/20">Sí, soy yo</button>
                                </div>
                            </div>
                        )}

                        {loginStep === 'verify' && pendingClient && (
                            <form onSubmit={handleConfirmPhone} className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Verificación</h2>
                                <p className="text-slate-500 text-sm">Por seguridad, confirma los <b>últimos 4 dígitos</b> de tu número registrado:</p>

                                <div className="text-left">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Últimos 4 dígitos</label>
                                    <input
                                        type="password"
                                        required
                                        maxLength={4}
                                        placeholder="****"
                                        value={phoneConfirmation}
                                        onChange={(e) => setPhoneConfirmation(e.target.value.replace(/\D/g, ''))}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-1 text-center font-black text-2xl tracking-[0.5em] focus:border-primary-500 outline-none transition-all"
                                    />
                                </div>

                                {loginError && <p className="text-red-500 text-[10px] font-bold italic">{loginError}</p>}

                                <button type="submit" className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl shadow-primary-500/20 active:scale-95 transition-all">
                                    Acceder ahora
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl relative"
                        >
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-6 right-6 p-4 bg-white/80 backdrop-blur-md text-slate-900 rounded-3xl z-20 shadow-lg active:scale-95 transition-all"
                            >
                                <X size={24} strokeWidth={3} />
                            </button>

                            <div className="overflow-y-auto max-h-[90vh]">
                                <div className="relative w-full aspect-square bg-slate-100">
                                    {activeModalImage ? (
                                        <img src={activeModalImage} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ShoppingBag size={80} />
                                        </div>
                                    )}

                                    {/* Gallery overlay if multiple images */}
                                    {selectedProduct.imagenes && selectedProduct.imagenes.length > 1 && (
                                        <div className="absolute bottom-4 left-0 right-0 px-4">
                                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
                                                {selectedProduct.imagenes.map((img, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setActiveModalImage(img)}
                                                        className={`w-16 h-16 rounded-xl border-2 shadow-lg overflow-hidden flex-shrink-0 active:scale-90 transition-all ${activeModalImage === img ? 'border-primary-500 scale-105 z-10' : 'border-white'}`}
                                                    >
                                                        <img src={img} className="w-full h-full object-contain" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1">
                                                {selectedProduct.categoria || 'Producto'}
                                            </p>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                                {selectedProduct.nombre}
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() => shareProduct(selectedProduct)}
                                            className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                                        >
                                            <Share2 size={24} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between py-6 border-y border-slate-50">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                            ${Number(selectedProduct.precioSugerido).toLocaleString()}
                                        </span>
                                        <div className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest ${selectedProduct.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {selectedProduct.stock > 0 ? `Stock: ${selectedProduct.stock}` : 'Agotado'}
                                        </div>
                                    </div>

                                    {selectedProduct.descripcion && (
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</h4>
                                            <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-[2rem]">
                                                {selectedProduct.descripcion}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        {selectedProduct.stock > 0 && (
                                            <div className="flex items-center bg-slate-100 rounded-[2rem] px-4 py-2 border border-slate-200">
                                                <button onClick={() => setQuantities(prev => ({ ...prev, [selectedProduct.id]: Math.max(1, (prev[selectedProduct.id] || 1) - 1) }))} className="p-3 text-slate-500"><Minus size={20} strokeWidth={3} /></button>
                                                <span className="w-12 text-center font-black text-xl">{quantities[selectedProduct.id] || 1}</span>
                                                <button onClick={() => setQuantities(prev => ({ ...prev, [selectedProduct.id]: Math.min(selectedProduct.stock, (prev[selectedProduct.id] || 1) + 1) }))} className="p-3 text-slate-500"><Plus size={20} strokeWidth={3} /></button>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                addToCart(selectedProduct, quantities[selectedProduct.id] || 1);
                                                setSelectedProduct(null);
                                            }}
                                            className={`flex-1 rounded-[2rem] font-black uppercase tracking-wider shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${selectedProduct.stock > 0 ? 'bg-primary-500 text-white shadow-primary-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                                            disabled={selectedProduct.stock <= 0}
                                        >
                                            {selectedProduct.stock > 0 ? (
                                                <>
                                                    <Plus size={24} strokeWidth={3} />
                                                    Añadir al Carrito
                                                </>
                                            ) : (
                                                'Agotado'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PublicCatalog;
