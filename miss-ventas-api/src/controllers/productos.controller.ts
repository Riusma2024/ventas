import { Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// [Gestionador / Cliente] Ver Productos
export const getProductos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;

        if (!tenant_id) {
            res.status(403).json({ error: 'Tenant ID no encontrado en el contexto del usuario' });
            return;
        }

        const [rows] = await db.query<any[]>('SELECT * FROM productos WHERE tenant_id = ?', [tenant_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Crear un Producto
export const createProducto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { nombre, costo, precioSugerido, categoria, foto, stock, descripcion, imagenes } = req.body;

        if (!nombre || costo === undefined || precioSugerido === undefined) {
            res.status(400).json({ error: 'Faltan datos requeridos (nombre, costo, precioSugerido)' });
            return;
        }

        const initialStock = stock || 0;
        const imagenesStr = imagenes ? JSON.stringify(imagenes) : null;

        const [result] = await db.query<any>(
            'INSERT INTO productos (tenant_id, nombre, costo, precioSugerido, categoria, foto, stock, descripcion, imagenes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [tenant_id, nombre, costo, precioSugerido, categoria || null, foto || null, initialStock, descripcion || null, imagenesStr]
        );

        res.status(201).json({ id: result.insertId, ...req.body, tenant_id });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Actualizar Producto
export const updateProducto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { nombre, costo, precioSugerido, categoria, foto, stock, descripcion, imagenes } = req.body;

        const imagenesStr = imagenes ? JSON.stringify(imagenes) : null;

        const [result] = await db.query<any>(
            `UPDATE productos 
             SET nombre = ?, costo = ?, precioSugerido = ?, categoria = ?, foto = ?, stock = ?, descripcion = ?, imagenes = ?
             WHERE id = ? AND tenant_id = ?`,
            [nombre, costo, precioSugerido, categoria || null, foto || null, stock, descripcion || null, imagenesStr, id, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Producto no encontrado o no autorizado' });
            return;
        }

        res.json({ mensaje: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Eliminar Producto
export const deleteProducto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;

        const [result] = await db.query<any>(
            'DELETE FROM productos WHERE id = ? AND tenant_id = ?',
            [id, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Producto no encontrado o no autorizado' });
            return;
        }

        res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
