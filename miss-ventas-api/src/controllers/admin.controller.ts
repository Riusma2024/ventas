import { Request, Response } from 'express';
import { db } from '../config/db';
import { ResultSetHeader } from 'mysql2';

export const getCupones = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query('SELECT * FROM cupones ORDER BY creado_en DESC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const crearCupon = async (req: Request, res: Response) => {
    try {
        const { codigo, dias_regalo, limite_usos } = req.body;
        const [result] = await db.query<ResultSetHeader>('INSERT INTO cupones (codigo, dias_regalo, limite_usos, usos_actuales, activo) VALUES (?, ?, ?, 0, 1)', [codigo.toUpperCase(), dias_regalo, limite_usos || 100]);
        res.status(201).json({ id: result.insertId, message: 'Fábrica lista' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const eliminarCupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; await db.query('DELETE FROM cupones WHERE id = ?', [id]);
        res.json({ message: 'Eliminado' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};
