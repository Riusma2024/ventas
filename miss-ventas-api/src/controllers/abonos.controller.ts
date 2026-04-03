import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getAbonos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { clienteId } = req.query;
        let query = 'SELECT * FROM abonos WHERE tenant_id = ?';
        const params: any[] = [tenant_id];
        if (clienteId) { query += ' AND clienteId = ?'; params.push(clienteId); }
        query += ' ORDER BY fecha DESC';
        const [rows] = await db.query<any[]>(query, params);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const createAbono = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const rol = req.user?.rol;
        const { clienteId, monto, metodoPago, evidencia, verificado, fecha } = req.body;
        const esVerificado = rol === 'cliente' ? false : (verificado || false);
        const [result] = await db.query<any>(
            'INSERT INTO abonos (tenant_id, clienteId, monto, metodoPago, evidencia, fecha, verificado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [tenant_id, clienteId, monto, metodoPago || 'Efectivo', evidencia || null, fecha || new Date(), esVerificado]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Éxito', verificado: esVerificado });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const updateAbono = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { monto, evidencia, verificado } = req.body;
        await db.query('UPDATE abonos SET monto = ?, evidencia = ?, verificado = ? WHERE id = ? AND tenant_id = ?', [monto, evidencia, verificado, id, tenant_id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const deleteAbono = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        await db.query('DELETE FROM abonos WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};
