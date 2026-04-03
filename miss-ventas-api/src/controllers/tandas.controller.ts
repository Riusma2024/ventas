import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getTandas = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const [rows] = await db.query<any[]>('SELECT * FROM tandas WHERE tenant_id = ?', [tenant_id]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const createTanda = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { nombre, monto_total, numero_pagos, frecuencia } = req.body;
        const [result] = await db.query<any>(
            'INSERT INTO tandas (tenant_id, nombre, monto_total, numero_pagos, frecuencia) VALUES (?, ?, ?, ?, ?)',
            [tenant_id, nombre, monto_total, numero_pagos, frecuencia]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const deleteTanda = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        await db.query('DELETE FROM tandas WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const subscribeToTanda = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { tanda_id, numero_posicion } = req.body;
        const cliente_id = req.user?.id;
        await db.query(
            'INSERT INTO tanda_participantes (tanda_id, cliente_id, numero_posicion, tenant_id) VALUES (?, ?, ?, ?)',
            [tanda_id, cliente_id, numero_posicion, tenant_id]
        );
        res.json({ mensaje: 'Suscrito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};
