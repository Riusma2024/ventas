import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getVentas = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const [rows] = await db.query<any[]>('SELECT * FROM ventas WHERE tenant_id = ? ORDER BY fecha DESC', [tenant_id]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const createVenta = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { cliente_id, total, tipo, items } = req.body;
        const [result] = await db.query<any>(
            'INSERT INTO ventas (tenant_id, cliente_id, total, tipo) VALUES (?, ?, ?, ?)',
            [tenant_id, cliente_id, total, tipo]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const updateVentaEstado = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { estado } = req.body;
        await db.query('UPDATE ventas SET estado = ? WHERE id = ? AND tenant_id = ?', [estado, id, tenant_id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const deleteVenta = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        await db.query('DELETE FROM ventas WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};
