import { api } from '../config/api';

/**
 * Recalcula la deuda total de un cliente basándose ÚNICAMENTE en ventas autorizadas/entregadas y abonos verificados.
 * Esto asegura que la base de datos siempre refleje la información real, ignorando apartados o pre-ventas y evitando 
 * errores de sincronización o de caché del frontend.
 */
export const syncClientDebt = async (clienteId: number | string) => {
    try {
        const res = await api.post(`/clientes/${clienteId}/sync-debt`);
        return res.data.nuevaDeuda;
    } catch (e) {
        console.error('Error syncing debt in backend', e);
        return 0;
    }
};

/**
 * Función de conveniencia que sincroniza explícitamente usando la función mejorada unificada.
 */
export const syncClientDebtWithVerifiedPayments = async (clienteId: number | string) => {
    return await syncClientDebt(clienteId);
};

/**
 * Sincroniza la deuda de todos los clientes
 */
export const syncAllDebts = async () => {
    try {
        const res = await api.get(`/clientes?t=${Date.now()}`);
        for (const client of res.data) {
            if (client.id) await syncClientDebt(client.id);
        }
    } catch (e) {
        console.error('Error syncing all debts', e);
    }
};
