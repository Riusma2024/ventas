import { Request, Response } from 'express';
import { db } from '../config/db';
import { MercadoPagoConfig, Preference } from 'mercadopago';

let client: any = null;
if (process.env.MP_ACCESS_TOKEN) {
    try {
        client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
        console.log('✅ Mercado Pago service initialized');
    } catch (e) {
        console.error('⚠️ Failed to initialize Mercado Pago:', e);
    }
} else {
    console.warn('⚠️ MP_ACCESS_TOKEN is missing');
}

export const crearPreferenciaSuscripcion = async (req: Request, res: Response) => {
    try {
        if (!client) { res.status(503).json({ error: 'Servicio de pago no disponible' }); return; }
        const { vendedorId, planNombre, precio } = req.body;
        const preference = new Preference(client);
        const result = await preference.create({ body: { items: [{ id: `SUB-${vendedorId}`, title: `Suscripción`, quantity: 1, unit_price: Number(precio), currency_id: 'MXN' }], notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`, external_reference: `vendedor_${vendedorId}` } });
        res.json({ id: result.id, init_point: result.init_point });
    } catch (error: any) { 
        console.error('MP error:', error.message);
        res.status(500).json({ error: 'Error' }); 
    }
};

export const webhookPagos = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, data } = req.body;
        if (type === 'payment' && process.env.MP_ACCESS_TOKEN) {
            const paymentId = data.id;
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
            const payment = await response.json();
            if (payment.status === 'approved' && payment.external_reference) {
                const vendedorId = payment.external_reference.split('_')[1];
                await db.query('UPDATE usuarios SET sub_expira_el = DATE_ADD(COALESCE(sub_expira_el, NOW()), INTERVAL 30 DAY), sub_status = "active" WHERE id = ?', [vendedorId]);
            }
        }
        res.status(200).send('OK');
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};
