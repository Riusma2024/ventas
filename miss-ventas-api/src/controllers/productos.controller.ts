import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const getProductos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const [rows] = await db.query<any[]>('SELECT * FROM productos WHERE tenant_id = ?', [tenant_id]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const createProducto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { nombre, descripcion, precio_lista, precio_contado, imagen_url } = req.body;
        const [result] = await db.query<any>(
            'INSERT INTO productos (tenant_id, nombre, descripcion, precio_lista, precio_contado, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
            [tenant_id, nombre, descripcion || null, precio_lista, precio_contado, imagen_url || null]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const updateProducto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { nombre, descripcion, precio_lista, precio_contado, imagen_url } = req.body;
        await db.query('UPDATE productos SET nombre = ?, descripcion = ?, precio_lista = ?, precio_contado = ?, imagen_url = ? WHERE id = ? AND tenant_id = ?', [nombre, descripcion, precio_lista, precio_contado, imagen_url, id, tenant_id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};

export const deleteProducto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        await db.query('DELETE FROM productos WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
};
