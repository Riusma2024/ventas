import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { Inbox, CheckCircle, XCircle, ShoppingBag, Clock, Phone } from 'lucide-react';
import { syncClientDebt } from '../utils/dbUtils';

interface RequestItem {
    id: number;
    productoNombre: string;
    clienteNombre: string;
    precioVenta: number;
    fecha: string;
    estado: string;
    productoId: number;
    clienteId: number;
    clienteWhatsapp?: string;
}

export const PendingRequestsManager: React.FC = () => {
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/ventas');
            // Filtrar solo los apartados pendientes
            const pendientes = res.data.filter((v: any) => v.estado === 'apartado');
            setRequests(pendientes);
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleAction = async (id: number, action: 'autorizado' | 'cancelado', clienteId: number) => {
        try {
            await api.put(`/ventas/${id}/estado`, { estado: action });
            if (action === 'autorizado') {
                await syncClientDebt(clienteId);
            }
            // Recargar tras actualizar
            await loadRequests();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al procesar la solicitud');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter inline-flex items-center gap-2">
                    <Inbox className="text-primary-500" />
                    Solicitudes Pendientes
                </h2>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-slate-400 font-bold">Cargando solicitudes...</div>
            ) : requests.length === 0 ? (
                <div className="glass-card text-center py-16 border-dashed border-2 border-slate-200">
                    <Inbox size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No tienes apartados pendientes por revisar.</p>
                </div>
            ) : (
                <div className="space-y-4 pb-32">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-1 rounded-lg mb-2">
                                        <Clock size={12} />
                                        Pendiente
                                    </span>
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{req.productoNombre}</h3>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                            Solicitado por: <span className="text-slate-800 font-bold">{req.clienteNombre}</span>
                                        </p>
                                        {req.clienteWhatsapp && (
                                            <a
                                                href={`https://wa.me/${req.clienteWhatsapp.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-xl text-xs font-black w-max hover:bg-green-100 transition-colors border border-green-100"
                                            >
                                                <Phone size={12} strokeWidth={3} />
                                                {req.clienteWhatsapp}
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-primary-500 text-xl tracking-tighter">${req.precioVenta.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => handleAction(req.id, 'cancelado', req.clienteId)}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold border-2 border-red-100 text-red-500 hover:bg-red-50 active:scale-95 transition-all text-sm"
                                >
                                    <XCircle size={18} />
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, 'autorizado', req.clienteId)}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600 active:scale-95 transition-all text-sm"
                                >
                                    <CheckCircle size={18} />
                                    Aprobar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
