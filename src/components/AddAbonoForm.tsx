import React, { useState } from 'react';
import { X, DollarSign, Calendar, Camera, CheckCircle, Upload } from 'lucide-react';
import { db, type Cliente } from '../db/db';
import { syncClientDebtWithVerifiedPayments } from '../utils/dbUtils';

interface AddAbonoFormProps {
    cliente: Cliente;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddAbonoForm: React.FC<AddAbonoFormProps> = ({ cliente, onClose, onSuccess }) => {
    const [monto, setMonto] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [evidencia, setEvidencia] = useState<string | undefined>();
    const [verificado, setVerificado] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEvidencia(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const montoNum = Number(monto);

            // Registrar el abono
            await db.abonos.add({
                clienteId: cliente.id!,
                monto: montoNum,
                fecha: new Date(fecha),
                evidencia,
                verificado
            });

            // Actualizar la deuda del cliente
            const nuevaDeuda = Math.max(0, cliente.deudaTotal - montoNum);
            await db.clientes.update(cliente.id!, { deudaTotal: nuevaDeuda });

            onSuccess();
        } catch (error) {
            console.error('Error al registrar abono:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-8 animate-slide-up shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Registrar Abono</h3>
                        <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">
                            {cliente.apodo || cliente.nombre}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Monto */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Monto del Abono</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="input-field pl-12"
                                placeholder="0.00"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Fecha */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Fecha del Pago</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="date"
                                required
                                className="input-field pl-12"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Evidencia */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 ml-4 tracking-widest uppercase">Evidencia (Opcional)</label>
                        {evidencia ? (
                            <div className="relative rounded-3xl overflow-hidden border-2 border-slate-100">
                                <img src={evidencia} className="w-full h-48 object-cover" alt="Evidencia" />
                                <button
                                    type="button"
                                    onClick={() => setEvidencia(undefined)}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"
                                >
                                    <X size={16} strokeWidth={3} />
                                </button>
                            </div>
                        ) : (
                            <label className="block cursor-pointer">
                                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-primary-300 transition-colors">
                                    <Upload className="mx-auto text-slate-300 mb-2" size={32} />
                                    <p className="text-sm font-bold text-slate-400">Adjuntar comprobante</p>
                                    <p className="text-[10px] text-slate-300 mt-1">Transferencia, depósito, etc.</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        )}
                    </div>

                    {/* Verificado */}
                    <div
                        onClick={() => setVerificado(!verificado)}
                        className={`p-4 rounded-3xl border-2 cursor-pointer transition-all ${verificado
                            ? 'bg-green-50 border-green-200'
                            : 'bg-slate-50 border-slate-200'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${verificado
                                ? 'bg-green-500 border-green-500'
                                : 'bg-white border-slate-300'
                                }`}>
                                {verificado && <CheckCircle size={16} className="text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-slate-900 text-sm">Pago Verificado</p>
                                <p className="text-[9px] text-slate-400 font-medium">Confirmar que el pago fue recibido</p>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full shadow-2xl bg-green-500 hover:bg-green-600">
                        <DollarSign size={20} strokeWidth={3} />
                        Registrar Abono
                    </button>
                </form>
            </div>
        </div>
    );
};
