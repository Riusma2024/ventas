import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { ResultSetHeader } from 'mysql2';

export const getCupones = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query('SELECT * FROM cupones ORDER BY creado_en DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cupones' });
    }
};

export const crearCupon = async (req: Request, res: Response) => {
    try {
        const { codigo, dias_regalo, limite_usos } = req.body;

        if (!codigo || !dias_regalo) {
            res.status(400).json({ error: 'Código y días de regalo son obligatorios' });
            return;
        }

        const [result] = await db.query<ResultSetHeader>(
            'INSERT INTO cupones (codigo, dias_regalo, limite_usos, usos_actuales, activo) VALUES (?, ?, ?, 0, 1)',
            [codigo.toUpperCase(), dias_regalo, limite_usos || 100]
        );

        res.status(201).json({ id: result.insertId, message: 'Cupón creado con éxito' });
    } catch (error) {
        console.error('Error al crear cupón:', error);
        res.status(500).json({ error: 'Error al crear el cupón' });
    }
};

export const eliminarCupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM cupones WHERE id = ?', [id]);
        res.json({ message: 'Cupón eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el cupón' });
    }
};
