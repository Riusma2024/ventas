import { Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// [Gestionador] Ver Clientes
export const getClientes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;

        if (!tenant_id) {
            res.status(403).json({ error: 'Tenant ID no encontrado' });
            return;
        }

        const [rows] = await db.query<any[]>('SELECT * FROM Clientes_App WHERE tenant_id = ?', [tenant_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Crear Cliente
export const createCliente = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { nombre, apodo, whatsapp, facebook, otro, deudaTotal } = req.body;

        if (!nombre) {
            res.status(400).json({ error: 'El nombre es obligatorio' });
            return;
        }

        const [result] = await db.query<any>(
            `INSERT INTO Clientes_App (tenant_id, nombre, apodo, whatsapp, facebook, otro, deudaTotal) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [tenant_id, nombre, apodo || null, whatsapp || null, facebook || null, otro || null, deudaTotal || 0]
        );

        res.status(201).json({ id: result.insertId, ...req.body, tenant_id });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Actualizar Cliente
export const updateCliente = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { nombre, apodo, whatsapp, facebook, otro, deudaTotal } = req.body;

        const [result] = await db.query<any>(
            `UPDATE Clientes_App 
             SET nombre = ?, apodo = ?, whatsapp = ?, facebook = ?, otro = ?, deudaTotal = ?
             WHERE id = ? AND tenant_id = ?`,
            [nombre, apodo || null, whatsapp || null, facebook || null, otro || null, deudaTotal, id, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Cliente no encontrado o no autorizado' });
            return;
        }

        res.json({ mensaje: 'Cliente actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Eliminar Cliente
export const deleteCliente = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;

        const [result] = await db.query<any>(
            'DELETE FROM Clientes_App WHERE id = ? AND tenant_id = ?',
            [id, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Cliente no encontrado o no autorizado' });
            return;
        }

        res.json({ mensaje: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
