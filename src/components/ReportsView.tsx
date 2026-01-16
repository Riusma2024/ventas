import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, Wallet, Package, AlertCircle, BarChart3,
    ChevronRight, ArrowUpRight, DollarSign, Users, Clock, ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ReportsView: React.FC = () => {
    const ventas = useLiveQuery(() => db.ventas.toArray());
    const productos = useLiveQuery(() => db.productos.toArray());
    const clientes = useLiveQuery(() => db.clientes.toArray());

    // Process Sales Data for the Chart (Last 7 Days)
    const chartData = useMemo(() => {
        if (!ventas) return [];
        const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                baseDate: d.toDateString(),
                label: days[d.getDay()],
                ventas: 0,
                utilidad: 0
            };
        });

        ventas.forEach(v => {
            const vDate = new Date(v.fecha).toDateString();
            const dayEntry = last7Days.find(d => d.baseDate === vDate);
            if (dayEntry) {
                dayEntry.ventas += v.precioVenta;
                dayEntry.utilidad += v.utilidad;
            }
        });

        return last7Days;
    }, [ventas]);

    // Summary Metrics
    const metrics = useMemo(() => {
        const totalVentas = ventas?.reduce((acc, v) => acc + v.precioVenta, 0) || 0;
        const totalUtilidad = ventas?.reduce((acc, v) => acc + v.utilidad, 0) || 0;
        const inversionInventario = productos?.reduce((acc, p) => acc + (p.costo * p.stock), 0) || 0;
        const valorVentaEsperado = productos?.reduce((acc, p) => acc + (p.precioSugerido * p.stock), 0) || 0;
        const deudaTotal = clientes?.reduce((acc, c) => acc + c.deudaTotal, 0) || 0;
        const stockBajo = productos?.filter(p => p.stock <= 2 && p.stock > 0).length || 0;
        const agotados = productos?.filter(p => p.stock === 0).length || 0;

        return {
            totalVentas,
            totalUtilidad,
            inversionInventario,
            valorVentaEsperado,
            deudaTotal,
            stockBajo,
            agotados,
            margenPromedio: totalVentas > 0 ? (totalUtilidad / totalVentas) * 100 : 0
        };
    }, [ventas, productos, clientes]);

    // Detailed Sales History
    const salesHistory = useMemo(() => {
        if (!ventas || !productos || !clientes) return [];
        return ventas
            .map(v => ({
                ...v,
                producto: productos.find(p => p.id === v.productoId),
                cliente: clientes.find(c => c.id === v.clienteId)
            }))
            .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    }, [ventas, productos, clientes]);

    const pieData = [
        { name: 'Inversión', value: metrics.inversionInventario, color: '#64748b' },
        { name: 'Ganancia Proyectada', value: metrics.valorVentaEsperado - metrics.inversionInventario, color: '#ec4899' }
    ];

    return (
        <div className="space-y-8 pb-32 animate-fade-in">
            {/* Main Financial Cards */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-700"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-primary-500 rounded-3xl shadow-lg shadow-primary-500/30">
                            <BarChart3 size={24} strokeWidth={2.5} />
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Utilidad</span>
                            <h2 className="text-4xl font-black tracking-tighter">${metrics.totalUtilidad.toFixed(2)}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-primary-400 font-black text-xs uppercase tracking-widest">
                        <TrendingUp size={14} />
                        <span>Eficiencia: {metrics.margenPromedio.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="card-premium space-y-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100">
                            <Users size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Por Cobrar</p>
                            <h4 className="text-xl font-black text-slate-900 tracking-tighter">${metrics.deudaTotal.toFixed(2)}</h4>
                        </div>
                    </div>
                    <div className="card-premium space-y-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100">
                            <Package size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión</p>
                            <h4 className="text-xl font-black text-slate-900 tracking-tighter">${metrics.inversionInventario.toFixed(2)}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales Performance Chart */}
            <div className="card-premium p-6 space-y-6">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-lg font-black text-slate-900 tracking-tighter">Desempeño Semanal</h3>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Ventas</span>
                        </div>
                    </div>
                </div>

                <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                dy={10}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '1.5rem',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="ventas"
                                stroke="#ec4899"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorVentas)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Inventory Insights */}
            <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 tracking-tighter px-2">Análisis de Inventario</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="card-premium flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center border border-red-100">
                                <AlertCircle size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-base">Stock Crítico</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{metrics.stockBajo} Productos por agotarse</p>
                            </div>
                        </div>
                        <div className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg shadow-red-500/20">
                            {metrics.stockBajo}
                        </div>
                    </div>

                    <div className="card-premium p-6 relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-black text-slate-900 text-base tracking-tighter">Valor de Almacén</h4>
                            <div className="px-3 py-1 bg-primary-100 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                Proyectado
                            </div>
                        </div>
                        <div className="flex items-end gap-1 mb-2">
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">${metrics.valorVentaEsperado.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase mb-1.5 ml-1 leading-none">Total</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                                className="h-full bg-slate-400 transition-all duration-1000"
                                style={{ width: `${(metrics.inversionInventario / metrics.valorVentaEsperado) * 100 || 0}%` }}
                            ></div>
                            <div
                                className="h-full bg-primary-500 transition-all duration-1000"
                                style={{ width: `${((metrics.valorVentaEsperado - metrics.inversionInventario) / metrics.valorVentaEsperado) * 100 || 0}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-3 px-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Inversión</span>
                            <span className="text-[8px] font-black text-primary-500 uppercase">Ganancia Esperada</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Detailed Sales History */}
            <div className="space-y-6">
                <div className="flex justify-between items-end px-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter">Historial de Operaciones</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{salesHistory.length} Registros</span>
                </div>

                <div className="space-y-4">
                    {salesHistory.length === 0 ? (
                        <div className="card-premium py-12 text-center text-slate-400 italic text-sm">
                            Aún no hay ventas registradas
                        </div>
                    ) : (
                        salesHistory.map((v) => (
                            <div key={v.id} className="card-premium overflow-hidden group hover:border-primary-200 transition-colors">
                                <div className="flex gap-4 items-center">
                                    {/* Product Thumbnail */}
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 group-hover:scale-105 transition-transform">
                                        {v.producto?.foto ? (
                                            <img src={v.producto.foto} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <Package size={24} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Sale Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[8px] font-black bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                                                ENTREGADO
                                            </span>
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <Clock size={10} />
                                                <span className="text-[9px] font-black uppercase tracking-tighter">
                                                    {v.fecha.toLocaleDateString()} — {v.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <h4 className="font-black text-slate-900 text-sm truncate uppercase tracking-tighter">
                                            {v.producto?.nombre || 'Producto Eliminado'}
                                        </h4>
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <Users size={12} className="text-slate-300" />
                                            <p className="text-[11px] font-bold truncate">
                                                Compró: <span className="text-slate-900">@{v.cliente?.apodo || 'Cliente Desconocido'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Price Tag */}
                                    <div className="text-right pl-2">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Venta</p>
                                        <p className="text-lg font-black text-primary-600 tracking-tighter leading-none">
                                            ${v.precioVenta.toFixed(2)}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1">
                                            Ganó: +${v.utilidad.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
