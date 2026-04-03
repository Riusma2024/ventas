import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getClientes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const [rows] = await db.query<any[]>('SELECT * FROM clientes WHERE tenant_id = ? ORDER BY nombre ASC', [tenant_id]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const createCliente = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { nombre, apodo, whatsapp, saldo_inicial } = req.body;
        const [result] = await db.query<any>(
            'INSERT INTO clientes (tenant_id, nombre, apodo, whatsapp, saldo_actual) VALUES (?, ?, ?, ?, ?)',
            [tenant_id, nombre, apodo || null, whatsapp || null, saldo_inicial || 0]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const updateCliente = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { nombre, apodo, whatsapp } = req.body;
        await db.query('UPDATE clientes SET nombre = ?, apodo = ?, whatsapp = ? WHERE id = ? AND tenant_id = ?', [nombre, apodo, whatsapp, id, tenant_id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const deleteCliente = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        await db.query('DELETE FROM clientes WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const getClienteEstadoCuenta = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const [ventas] = await db.query<any[]>('SELECT * FROM ventas WHERE cliente_id = ? AND tenant_id = ?', [id, tenant_id]);
        const [abonos] = await db.query<any[]>('SELECT * FROM abonos WHERE clienteId = ? AND tenant_id = ?', [id, tenant_id]);
        res.json({ ventas, abonos });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};
