import React, { useState } from 'react';
import { X, DollarSign, Calendar, CheckCircle, Edit as EditIcon } from 'lucide-react';
import { db, type Abono, type Cliente } from '../db/db';
import { syncClientDebtWithVerifiedPayments } from '../utils/dbUtils';

interface EditAbonoFormProps {
    abono: Abono;
    cliente: Cliente;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditAbonoForm: React.FC<EditAbonoFormProps> = ({ abono, cliente, onClose, onSuccess }) => {
    const [verificado, setVerificado] = useState(abono.verificado);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const wasVerified = abono.verificado;
            const isNowVerified = verificado;

            // Actualizar el abono
            await db.abonos.update(abono.id!, { verificado });

            // Recalcular la deuda basándose en abonos verificados
            await syncClientDebtWithVerifiedPayments(cliente.id!);

            onSuccess();
        } catch (error) {
            console.error('Error al actualizar abono:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-2xl border border-white/20">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Editar Abono</h3>
                        <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">
                            ${abono.monto.toFixed(2)} - {abono.fecha.toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Evidencia Preview */}
                    {abono.evidencia && (
                        <div className="rounded-3xl overflow-hidden border-2 border-slate-100">
                            <img src={abono.evidencia} className="w-full h-48 object-cover" alt="Evidencia" />
                        </div>
                    )}

                    {/* Verificado Toggle */}
                    <div
                        onClick={() => setVerificado(!verificado)}
                        className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${verificado
                            ? 'bg-green-50 border-green-200'
                            : 'bg-amber-50 border-amber-200'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${verificado
                                ? 'bg-green-500 border-green-500'
                                : 'bg-white border-amber-300'
                                }`}>
                                {verificado && <CheckCircle size={20} className="text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-slate-900 text-base">Pago Verificado</p>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                    {verificado
                                        ? 'El pago ha sido confirmado y se descuenta de la deuda'
                                        : 'Pendiente de verificación - No afecta la deuda aún'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full shadow-2xl bg-green-500 hover:bg-green-600">
                        <EditIcon size={20} strokeWidth={3} />
                        Actualizar Estado
                    </button>
                </form>
            </div>
        </div>
    );
};
