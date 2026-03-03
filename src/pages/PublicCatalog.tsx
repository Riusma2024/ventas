import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingBag, Search, X, ShoppingCart, Plus, Minus, Send } from 'lucide-react';
import { api } from '../config/api';

interface Producto {
    id: number;
    nombre: string;
    precioSugerido: number;
    foto: string | null;
    categoria: string | null;
    stock: number;
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

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await api.get(`/public/catalogo/${tenant_id}`);
                setNegocio(res.data.negocio);
                setProductos(res.data.productos);
            } catch (err: any) {
                setError(err.response?.data?.error || 'No se pudo cargar el catálogo');
            } finally {
                setIsLoading(false);
            }
        };

        if (tenant_id) {
            fetchCatalog();
        }
    }, [tenant_id]);

    const addToCart = (prod: Producto, quantityToAdd: number = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === prod.id);
            if (existing) {
                const newQuantity = Math.min(existing.cantidad + quantityToAdd, prod.stock);
                return prev.map(item => item.id === prod.id ? { ...item, cantidad: newQuantity } : item);
            }
            return [...prev, { ...prod, cantidad: Math.min(quantityToAdd, prod.stock) }];
        });

        // Reset the input quantity for this product back to 1
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

            await api.post(`/public/apartado/${tenant_id}`, {
                cliente: {
                    nombre: clienteNombre,
                    whatsapp: clienteWhatsapp
                },
                carrito: carritoPayload
            });

            setSuccessMessage('¡Solicitud enviada exitosamente! El vendedor se pondrá en contacto pronto.');
            setCart([]);
            setIsCartOpen(false);
            setClienteNombre('');
            setClienteWhatsapp('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al enviar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.precioSugerido) * item.cantidad), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);

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
            {/* Cabecera */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="font-black text-slate-900 text-xl tracking-tighter inline-flex items-center gap-2">
                            <ShoppingBag className="text-primary-500" />
                            Catálogo
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{negocio}</p>
                    </div>

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
            </header>

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

                {/* Buscador */}
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

                {/* Grid de Productos */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(prod => (
                        <div key={prod.id} className="bg-white rounded-3xl p-4 border border-slate-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden relative flex items-center justify-center">
                                {prod.foto ? (
                                    <img src={prod.foto} alt={prod.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <ShoppingBag size={40} className="text-slate-200" />
                                )}
                                {prod.stock <= 5 && (
                                    <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                        Quedan {prod.stock}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight line-clamp-2 min-h-[40px]">{prod.nombre}</h3>
                            <p className="font-black text-primary-500 text-lg mb-4">${Number(prod.precioSugerido).toLocaleString()}</p>

                            <div className="w-full mb-3 flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200">
                                <button
                                    onClick={() => setQuantities(prev => ({ ...prev, [prod.id]: Math.max(1, (prev[prod.id] || 1) - 1) }))}
                                    className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    disabled={(quantities[prod.id] || 1) <= 1}
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="font-bold text-sm text-slate-700 w-8 text-center">
                                    {quantities[prod.id] || 1}
                                </span>
                                <button
                                    onClick={() => setQuantities(prev => ({ ...prev, [prod.id]: Math.min(prod.stock, (prev[prod.id] || 1) + 1) }))}
                                    className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    disabled={(quantities[prod.id] || 1) >= prod.stock}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <button
                                onClick={() => addToCart(prod, quantities[prod.id] || 1)}
                                className="w-full py-3 bg-slate-900 border border-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                disabled={prod.stock <= 0}
                            >
                                {prod.stock > 0 ? 'Apartar' : 'Agotado'}
                            </button>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-slate-400 font-medium">
                        No se encontraron productos disponibles.
                    </div>
                )}
            </main>

            {/* Modal de Carrito */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-end animate-fade-in">
                    <div className="w-full max-w-md bg-white h-full shadow-2xl animate-slide-left flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h2 className="text-xl font-black text-slate-900 inline-flex items-center gap-2">
                                <ShoppingCart className="text-primary-500" /> Carrito
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
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
                                            <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
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
                                                    <button onClick={() => removeFromCart(item.id)} className="text-[10px] uppercase font-black tracking-widest text-red-400 hover:text-red-500">Quitar</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="border-t border-slate-100 pt-4 mt-6">
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="font-bold text-slate-500">Total</span>
                                            <span className="font-black text-slate-900 text-2xl">${cartTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                                    {error}
                                </div>
                            )}

                            {cart.length > 0 && (
                                <form id="checkoutForm" onSubmit={submitApartados} className="space-y-4 pt-6 border-t border-slate-100 mt-6">
                                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Tus Datos para Apartar</h3>
                                    <div>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Nombre Completo"
                                            value={clienteNombre}
                                            onChange={e => setClienteNombre(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="WhatsApp (ej. 5512345678)"
                                            value={clienteWhatsapp}
                                            onChange={e => setClienteWhatsapp(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                                        />
                                    </div>
                                </form>
                            )}

                        </div>

                        {cart.length > 0 && (
                            <div className="p-6 bg-white border-t border-slate-100">
                                <button
                                    type="submit"
                                    form="checkoutForm"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary-500/30 hover:bg-primary-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmitting ? 'Procesando...' : 'Enviar Solicitud'}
                                    <Send size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicCatalog;
