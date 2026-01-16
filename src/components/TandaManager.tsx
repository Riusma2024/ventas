import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Tanda, type TandaPago } from '../db/db';
import { Users2, Plus, Calendar, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export const TandaManager: React.FC = () => {
    const [isCreating, setIsCreating] = useState(false);
    const tandas = useLiveQuery(() => db.tandas.toArray());
    const [selectedTandaId, setSelectedTandaId] = useState<number | null>(null);

    const tandaActiva = useLiveQuery(
        () => selectedTandaId ? db.tandas.get(selectedTandaId) : undefined,
        [selectedTandaId]
    );

    const pagosTanda = useLiveQuery(
        () => selectedTandaId ? db.tandaPagos.where('tandaId').equals(selectedTandaId).toArray() : [],
        [selectedTandaId]
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Tandas</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-primary-500 p-3 rounded-2xl text-white shadow-lg"
                >
                    <Plus size={20} />
                </button>
            </div>

            {!tandas || tandas.length === 0 ? (
                <div className="glass-card text-center py-12 border-dashed border-2 border-slate-200">
                    <Users2 size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No hay tandas activas</p>
                    <button onClick={() => setIsCreating(true)} className="text-primary-500 font-bold mt-2">Crear Nueva Tanda</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tandas.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedTandaId(t.id!)}
                            className={`p-5 rounded-[2rem] border transition-all text-left ${selectedTandaId === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-100'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg">{t.nombre}</h4>
                                    <p className={`text-xs ${selectedTandaId === t.id ? 'text-slate-400' : 'text-slate-500'}`}>
                                        ${t.montoPorNumero} • {t.periodicidad}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-xl ${selectedTandaId === t.id ? 'bg-primary-500' : 'bg-primary-50'}`}>
                                    <Calendar size={18} className={selectedTandaId === t.id ? 'text-white' : 'text-primary-500'} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Tanda Detail View */}
            {tandaActiva && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pb-20"
                >
                    <h3 className="text-lg font-bold text-slate-800 px-2 mt-8">Seguimiento de Pagos</h3>
                    <div className="space-y-3">
                        {pagosTanda?.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.esBeneficiario ? 'bg-amber-100 text-amber-600' : (p.pagado ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400')
                                    }`}>
                                    {p.esBeneficiario ? <Trophy size={18} /> : (p.pagado ? <CheckCircle2 size={18} /> : <Circle size={18} />)}
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-slate-800 text-sm">{p.participanteNombre}</h5>
                                    <p className="text-[10px] text-slate-400 font-bold">SEMANA {p.numeroSemana}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${p.esBeneficiario ? 'text-amber-600' : 'text-slate-800'}`}>
                                        {p.esBeneficiario ? 'EXENTO' : `$${p.monto}`}
                                    </p>
                                    {(!p.pagado && !p.esBeneficiario) && (
                                        <button
                                            onClick={() => db.tandaPagos.update(p.id!, { pagado: true })}
                                            className="text-[9px] font-bold text-primary-500 uppercase tracking-tighter"
                                        >
                                            Marcar Pago
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {isCreating && (
                <CreateTandaForm
                    onClose={() => setIsCreating(false)}
                    onSuccess={(id) => {
                        setIsCreating(false);
                        setSelectedTandaId(id);
                    }}
                />
            )}
        </div>
    );
};

interface CreateTandaFormProps {
    onClose: () => void;
    onSuccess: (id: number) => void;
}

const CreateTandaForm: React.FC<CreateTandaFormProps> = ({ onClose, onSuccess }) => {
    const [nombre, setNombre] = useState('');
    const [monto, setMonto] = useState('500');
    const [participantes, setParticipantes] = useState<string[]>(Array(11).fill(''));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const tandaId = await db.tandas.add({
                nombre,
                montoPorNumero: Number(monto),
                periodicidad: 'semanal',
                fechaInicio: new Date(),
                participantes: 11
            });

            // Generate seed payments for week 1
            // Logic N+1: Beneficiary of current week is exempt
            const pagos = participantes.map((name, index) => ({
                tandaId: tandaId as number,
                numeroSemana: 1,
                participanteNombre: name || `Participante ${index + 1}`,
                monto: index === 0 ? 0 : Number(monto), // Week 1 beneficiary is usually index 0
                pagado: index === 0, // Beneficiary is marked as paid
                esBeneficiario: index === 0
            }));

            await db.tandaPagos.bulkAdd(pagos);
            onSuccess(tandaId as number);
        } catch (error) {
            console.error('Error al crear tanda:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 space-y-6 animate-slide-up h-[90vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Nueva Tanda</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-2">NOMBRE DE LA TANDA</label>
                        <input type="text" required className="input-field w-full" value={nombre} onChange={e => setNombre(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-2">MONTO SEMANAL ($)</label>
                        <input type="number" required className="input-field w-full" value={monto} onChange={e => setMonto(e.target.value)} />
                    </div>

                    <div className="space-y-3 mt-4">
                        <label className="text-xs font-bold text-slate-400 ml-2">LISTA DE 11 PARTICIPANTES</label>
                        {participantes.map((p, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                                <input
                                    type="text"
                                    placeholder={`Nombre del participante ${i + 1}`}
                                    className="input-field flex-1 py-2 text-sm"
                                    value={p}
                                    onChange={(e) => {
                                        const newP = [...participantes];
                                        newP[i] = e.target.value;
                                        setParticipantes(newP);
                                    }}
                                />
                                {i === 0 && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-1 rounded-lg font-bold">INICIA</span>}
                            </div>
                        ))}
                    </div>

                    <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-6 mb-10">
                        <Save size={20} />
                        Crear Tanda de 11 Participantes
                    </button>
                </form>
            </div>
        </div>
    );
};

const X = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
