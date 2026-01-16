const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idClie = Number(clienteId);
    if (!idClie) return;

    try {
        await db.transaction('rw', [db.ventas, db.productos, db.clientes], async () => {
            // 1. Add Sale
            await db.ventas.add({
                productoId: producto.id!,
                clienteId: idClie,
                precioVenta: Number(precioVenta),
                utilidad,
                fecha: new Date(),
                pagado: false
            });

            // 2. Update stock
            await db.productos.update(producto.id!, {
                stock: producto.stock - 1
            });

            // 3. Update Client Debt
            const client = await db.clientes.get(idClie);
            if (client) {
                await db.clientes.update(idClie, {
                    deudaTotal: client.deudaTotal + Number(precioVenta)
                });
            }
        });

        onSuccess();
    } catch (error) {
        console.error('Error en el proceso de venta:', error);
    }
};

return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white/20 overflow-y-auto no-scrollbar max-h-[90vh]">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Registrar Venta</h3>
                    <p className="text-[10px] text-primary-500 font-black uppercase tracking-widest">Cargo a Cuenta</p>
                </div>
                <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                    <X size={20} strokeWidth={3} />
                </button>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100/50">
                <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden shadow-sm border border-white">
                    {producto.foto && <img src={producto.foto} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Producto a Entregar</p>
                    <h4 className="font-black text-slate-900 text-sm leading-tight uppercase tracking-tighter">{producto.nombre}</h4>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Asignar a Cliente</label>
                    <div className="relative">
                        <select
                            required
                            className="input-field appearance-none"
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clientes?.map(c => (
                                <option key={c.id} value={c.id}>{c.apodo} — {c.nombre}</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Users size={18} />
                        </div>
                    </div>
                    {(!clientes || clientes.length === 0) && (
                        <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-tighter">¡No hay clientes registrados!</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Precio Final de Venta</label>
                    <input
                        type="number"
                        required
                        className="input-field font-black text-slate-900 text-lg"
                        value={precioVenta}
                        onChange={(e) => setPrecioVenta(e.target.value)}
                    />
                </div>

                <div className="bg-primary-50/50 p-6 rounded-[2.5rem] border border-primary-100/50 flex justify-between items-center group overflow-hidden relative">
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-primary-500/5 rounded-full blur-xl group-hover:bg-primary-500/10 transition-all"></div>
                    <div>
                        <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em] mb-1">Ganancia Neta</p>
                        <h4 className="text-2xl font-black text-primary-600 tracking-tighter">${utilidad.toFixed(2)}</h4>
                    </div>
                    <div className="w-12 h-12 bg-primary-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <DollarSign size={20} strokeWidth={3} />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!clienteId}
                    className="btn-primary w-full shadow-2xl disabled:opacity-30 disabled:grayscale"
                >
                    <ShoppingBag size={20} strokeWidth={3} />
                    Confirmar y Cargar Deuda
                </button>
            </form>
        </div>
    </div>
);
};
