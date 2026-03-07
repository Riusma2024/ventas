import { Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// Obtener todas las tandas activas
export const getTandas = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const [rows] = await db.query<any[]>('SELECT * FROM tandas WHERE tenant_id = ? ORDER BY fechaInicio DESC', [tenant_id]);

        // Agregar los participantes a cada tanda para que el front lo reciba ordenado
        const tandas = await Promise.all(rows.map(async (tanda: any) => {
            const [participantes] = await db.query<any[]>(
                'SELECT * FROM tandapagos WHERE tandaId = ? ORDER BY numeroSemana ASC',
                [tanda.id]
            );
            return {
                ...tanda,
                participantes
            };
        }));

        res.json(tandas);
    } catch (error) {
        console.error('Error al obtener tandas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear una nueva tanda
export const createTanda = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { nombre, montoPorNumero, periodicidad, fechaInicio, participantes = 11 } = req.body;

        if (!nombre || !montoPorNumero || !periodicidad || !fechaInicio) {
            res.status(400).json({ error: 'Faltan datos requeridos para la tanda' });
            return;
        }

        const [result] = await db.query<any>(
            `INSERT INTO tandas (tenant_id, nombre, montoPorNumero, periodicidad, fechaInicio, participantes) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tenant_id, nombre, montoPorNumero, periodicidad, fechaInicio, participantes]
        );

        res.status(201).json({
            id: result.insertId,
            mensaje: 'Tanda creada exitosamente'
        });

    } catch (error) {
        console.error('Error al crear tanda:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Asignar o agregar un cliente a un número de la tanda
export const addParticipante = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tandaId } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { numeroSemana, participanteNombre, monto } = req.body;

        if (!numeroSemana || !participanteNombre || !monto) {
            res.status(400).json({ error: 'Faltan datos requeridos (numeroSemana, participanteNombre, monto)' });
            return;
        }

        const [result] = await db.query<any>(
            `INSERT INTO tandapagos (tenant_id, tandaId, numeroSemana, participanteNombre, monto) 
             VALUES (?, ?, ?, ?, ?)`,
            [tenant_id, tandaId, numeroSemana, participanteNombre, monto]
        );

        res.status(201).json({ id: result.insertId, mensaje: 'Participante registrado' });
    } catch (error) {
        console.error('Error asignando participante:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Marcar un pago de tanda como pagado/entregado o actualizar info
export const updateParticipante = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tandaId, idParticipante } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { pagado, esBeneficiario, evidencia } = req.body;

        const [result] = await db.query<any>(
            'UPDATE tandapagos SET pagado = COALESCE(?, pagado), esBeneficiario = COALESCE(?, esBeneficiario), evidencia = COALESCE(?, evidencia) WHERE id = ? AND tandaId = ? AND tenant_id = ?',
            [pagado, esBeneficiario, evidencia, idParticipante, tandaId, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Participante/Pago no encontrado' });
            return;
        }

        res.json({ mensaje: 'Pago actualizado' });
    } catch (error) {
        console.error('Error actualizando participante:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar Tanda
export const deleteTanda = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;

        const [result] = await db.query<any>(
            'DELETE FROM tandas WHERE id = ? AND tenant_id = ?',
            [id, tenant_id]
        );

        res.json({ mensaje: 'Tanda eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
