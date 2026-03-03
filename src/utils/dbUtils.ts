import { api } from '../config/api';

/**
 * Recalculates the total debt for a specific client based on their unpaid sales.
 * This ensures the deudaTotal field is always in sync with actual records.
 */
export const syncClientDebt = async (clienteId: number) => {
    try {
        const [ventasRes, abonosRes] = await Promise.all([
            api.get('/ventas'),
            api.get(`/abonos?clienteId=${clienteId}`)
        ]);

        const ventasParams = ventasRes.data.filter((v: any) => v.clienteId === clienteId);
        const abonosParams = abonosRes.data;

        const totalVentas = ventasParams.reduce((acc: any, v: any) => acc + v.precioVenta, 0);
        const totalAbonos = abonosParams.reduce((acc: any, a: any) => acc + a.monto, 0);

        const newDebt = totalVentas - totalAbonos;

        await api.put(`/clientes/${clienteId}`, { deudaTotal: newDebt });
        return newDebt;
    } catch (e) {
        console.error('Error syncing debt', e);
        return 0;
    }
};

/**
 * Recalculates debt for ALL clients.
 */
export const syncAllDebts = async () => {
    try {
        const res = await api.get('/clientes');
        for (const client of res.data) {
            if (client.id) await syncClientDebt(client.id);
        }
    } catch (e) {
        console.error('Error syncing all debts', e);
    }
};

/**
 * Recalculates a client's debt based on sales minus VERIFIED payments only.
 * This is the correct way to calculate debt when payments need verification.
 */
export const syncClientDebtWithVerifiedPayments = async (clienteId: number) => {
    try {
        const [ventasRes, abonosRes] = await Promise.all([
            api.get('/ventas'),
            api.get(`/abonos?clienteId=${clienteId}`)
        ]);

        const ventasParams = ventasRes.data.filter((v: any) => v.clienteId === clienteId);
        const abonosParams = abonosRes.data;

        const totalVentas = ventasParams.reduce((acc: any, v: any) => acc + v.precioVenta, 0);
        const totalAbonosVerificados = abonosParams
            .filter((a: any) => a.verificado)
            .reduce((acc: any, a: any) => acc + a.monto, 0);

        const newDebt = Math.max(0, totalVentas - totalAbonosVerificados);

        await api.put(`/clientes/${clienteId}`, { deudaTotal: newDebt });
        return newDebt;
    } catch (e) {
        console.error('Error syncing verified debt', e);
        return 0;
    }
};
