import { Request, Response } from 'express';
import { db } from '../config/db.js';

export const getPublicSub = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const [rows]: any = await db.query('SELECT id, nombre, negocio_nombre, sub_status FROM usuarios WHERE negocio_slug = ?', [slug]);
        if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const getCatalog = async (req: Request, res: Response) => {
    try {
        const { tenantId } = req.params;
        const [rows] = await db.query('SELECT * FROM productos WHERE tenant_id = ?', [tenantId]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const getClientData = async (req: Request, res: Response) => {
    try {
        const { tenantId, email } = req.params;
        const [rows]: any = await db.query('SELECT id, nombre FROM usuarios WHERE tenant_id = ? AND email = ? AND rol = "cliente"', [tenantId, email]);
        if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
};

export const submitOrder = async (req: Request, res: Response) => {
    try {
        const { tenantId, clienteId, items, total, tipo } = req.body;
        const [result]: any = await db.query(
            'INSERT INTO ventas (tenant_id, cliente_id, total, tipo, estado) VALUES (?, ?, ?, ?, "apartado")',
            [tenantId, clienteId, total, tipo]
        );
        res.json({ id: result.insertId, mensaje: 'Apartado realizado' });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
};
