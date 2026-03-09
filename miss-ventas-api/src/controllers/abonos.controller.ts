import { Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// Obtener Abonos (Payments) de un Cliente
export const getAbonos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { clienteId } = req.query;

        let query = 'SELECT * FROM abonos WHERE tenant_id = ?';
        const params: any[] = [tenant_id];

        if (clienteId) {
            query += ' AND clienteId = ?';
            params.push(clienteId);
        }

        query += ' ORDER BY fecha DESC';

        const [rows] = await db.query<any[]>(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener abonos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear Abono
export const createAbono = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const rol = req.user?.rol;
        const { clienteId, monto, metodoPago, evidencia, verificado } = req.body;

        if (!clienteId || monto === undefined) {
            res.status(400).json({ error: 'Faltan datos requeridos (clienteId, monto)' });
            return;
        }

        // Si lo crea un cliente, entra como no verificado. Si lo crea el gestionador, puede entrar verificado.
        const esVerificado = rol === 'cliente' ? false : (verificado || false);

        const [result] = await db.query<any>(
            `INSERT INTO abonos (tenant_id, clienteId, monto, metodoPago, evidencia, fecha, verificado) 
             VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
            [tenant_id, clienteId, monto, metodoPago || 'Efectivo', evidencia || null, esVerificado]
        );

        res.status(201).json({
            id: result.insertId,
            mensaje: 'Abono registrado exitosamente',
            verificado: esVerificado
        });

    } catch (error) {
        console.error('Error al registrar abono:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Modificar Abono (Verificar/Editar)
export const updateAbono = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { monto, evidencia, verificado } = req.body;

        const [result] = await db.query<any>(
            'UPDATE abonos SET monto = ?, evidencia = ?, verificado = ? WHERE id = ? AND tenant_id = ?',
            [monto, evidencia, verificado, id, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Abono no encontrado' });
            return;
        }

        res.json({ mensaje: 'Abono actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando abono:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar Abono
export const deleteAbono = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;

        const [result] = await db.query<any>(
            'DELETE FROM abonos WHERE id = ? AND tenant_id = ?',
            [id, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Abono no encontrado' });
            return;
        }

        res.json({ mensaje: 'Abono eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando abono:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
