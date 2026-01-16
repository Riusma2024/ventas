import { db } from '../db/db';

/**
 * Recalculates the total debt for a specific client based on their unpaid sales.
 * This ensures the deudaTotal field is always in sync with actual records.
 */
export const syncClientDebt = async (clienteId: number) => {
    return await db.transaction('rw', [db.clientes, db.ventas, db.abonos], async () => {
        const client = await db.clientes.get(clienteId);
        if (!client) return;

        // Sum all sales for this client
        const ventas = await db.ventas.where('clienteId').equals(clienteId).toArray();
        const totalVentas = ventas.reduce((acc, v) => acc + v.precioVenta, 0);

        // Sum all payments (abonos) for this client
        const abonos = await db.abonos.where('clienteId').equals(clienteId).toArray();
        const totalAbonos = abonos.reduce((acc, a) => acc + a.monto, 0);

        const newDebt = totalVentas - totalAbonos;

        await db.clientes.update(clienteId, {
            deudaTotal: newDebt
        });

        return newDebt;
    });
};

/**
 * Recalculates debt for ALL clients.
 */
export const syncAllDebts = async () => {
    const clients = await db.clientes.toArray();
    for (const client of clients) {
        if (client.id) await syncClientDebt(client.id);
    }
};

/**
 * Recalculates a client's debt based on sales minus VERIFIED payments only.
 * This is the correct way to calculate debt when payments need verification.
 */
export const syncClientDebtWithVerifiedPayments = async (clienteId: number) => {
    return await db.transaction('rw', [db.clientes, db.ventas, db.abonos], async () => {
        const client = await db.clientes.get(clienteId);
        if (!client) return;

        // Sum all sales for this client
        const ventas = await db.ventas.where('clienteId').equals(clienteId).toArray();
        const totalVentas = ventas.reduce((acc, v) => acc + v.precioVenta, 0);

        // Sum ONLY verified payments (abonos)
        const abonos = await db.abonos.where('clienteId').equals(clienteId).toArray();
        const totalAbonosVerificados = abonos
            .filter(a => a.verificado)
            .reduce((acc, a) => acc + a.monto, 0);

        const newDebt = Math.max(0, totalVentas - totalAbonosVerificados);

        await db.clientes.update(clienteId, {
            deudaTotal: newDebt
        });

        return newDebt;
    });
};
