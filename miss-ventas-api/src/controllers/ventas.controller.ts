import { Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// [Gestionador / Cliente] Ver Ventas/Apartados
export const getVentas = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;

        if (!tenant_id) {
            res.status(403).json({ error: 'Tenant ID no encontrado' });
            return;
        }

        // Si es cliente, técnicamente deberíamos filtrar por su usuario_id vinculado a clienteId
        // Por ahora, asumimos que estamos en vista de Gestionador principalmente.
        const [rows] = await db.query<any[]>(
            `SELECT v.*, p.nombre as productoNombre, c.nombre as clienteNombre 
             FROM Ventas v 
             JOIN Productos p ON v.productoId = p.id 
             JOIN Clientes_App c ON v.clienteId = c.id 
             WHERE v.tenant_id = ?
             ORDER BY v.fecha DESC`,
            [tenant_id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador / Cliente] Crear un Apartado (Venta)
export const createVenta = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const rol = req.user?.rol;
        const { productoId, clienteId, precioVenta, utilidad, pagado, cantidad = 1 } = req.body;

        if (!productoId || !clienteId || precioVenta === undefined || utilidad === undefined || cantidad < 1) {
            res.status(400).json({ error: 'Faltan datos requeridos para la venta o cantidad inválida' });
            return;
        }

        // Verificar stock actual
        const [productoRes] = await db.query<any[]>('SELECT stock FROM Productos WHERE id = ? AND tenant_id = ?', [productoId, tenant_id]);

        if (productoRes.length === 0) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }

        if (productoRes[0].stock < cantidad) {
            res.status(400).json({ error: 'No hay stock suficiente para esta cantidad' });
            return;
        }

        // Si lo solicita un cliente, queda "apartado". Si es el gestionador, es "autorizado".
        const estadoInicial = rol === 'cliente' ? 'apartado' : 'autorizado';

        const lastInsertIds = [];

        // Insertar individualmente para mantener compatibilidad con BD
        for (let i = 0; i < cantidad; i++) {
            const [result] = await db.query<any>(
                `INSERT INTO Ventas (tenant_id, productoId, clienteId, precioVenta, utilidad, fecha, pagado, estado) 
                 VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
                [tenant_id, productoId, clienteId, precioVenta, utilidad, pagado || false, estadoInicial]
            );
            lastInsertIds.push(result.insertId);
        }

        // Si es "autorizado" directamente por el Gestionador, descontamos el stock.
        if (estadoInicial === 'autorizado') {
            await db.query('UPDATE Productos SET stock = stock - ? WHERE id = ? AND tenant_id = ?', [cantidad, productoId, tenant_id]);
        }

        res.status(201).json({
            id: lastInsertIds[0], // Returned for backwards compatibility
            ids: lastInsertIds,
            mensaje: `Venta registrada en estado: ${estadoInicial} (${cantidad} unidades)`,
            estado: estadoInicial
        });

    } catch (error) {
        console.error('Error al crear venta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Cambiar estado de Venta (Autorizar Apartado)
export const updateVentaEstado = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { estado } = req.body; // 'apartado', 'autorizado', 'entregado', 'cancelado'

        if (!['apartado', 'autorizado', 'entregado', 'cancelado'].includes(estado)) {
            res.status(400).json({ error: 'Estado inválido' });
            return;
        }

        // Obtener estado actual
        const [ventaRows] = await db.query<any[]>('SELECT estado, productoId FROM Ventas WHERE id = ? AND tenant_id = ?', [id, tenant_id]);

        if (ventaRows.length === 0) {
            res.status(404).json({ error: 'Venta no encontrada' });
            return;
        }

        const ventaAnterior = ventaRows[0];

        // Regla: Si pasa de 'apartado' a 'autorizado'/'entregado', descontar stock.
        // Si pasa de algo a 'cancelado', quizá regresar stock (opcional pero lo omitimos por simplicidad aquí, dejamos a juicio futuro)
        if (ventaAnterior.estado === 'apartado' && ['autorizado', 'entregado'].includes(estado)) {
            // Verificar stock de nuevo
            const [productoRes] = await db.query<any[]>('SELECT stock FROM Productos WHERE id = ? AND tenant_id = ?', [ventaAnterior.productoId, tenant_id]);
            if (productoRes[0].stock <= 0) {
                res.status(400).json({ error: 'No se puede autorizar, no hay stock disponible' });
                return;
            }
            // Descontar
            await db.query('UPDATE Productos SET stock = stock - 1 WHERE id = ? AND tenant_id = ?', [ventaAnterior.productoId, tenant_id]);
        }

        const [result] = await db.query<any>(
            'UPDATE Ventas SET estado = ? WHERE id = ? AND tenant_id = ?',
            [estado, id, tenant_id]
        );

        res.json({ mensaje: `Estado actualizado a ${estado}` });
    } catch (error) {
        console.error('Error actualizando venta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Eliminar Venta
export const deleteVenta = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;

        const [result] = await db.query<any>(
            'DELETE FROM Ventas WHERE id = ? AND tenant_id = ?',
            [id, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Venta no encontrada o no autorizada' });
            return;
        }

        res.json({ mensaje: 'Venta eliminada exitosamente' });
    } catch (error) {
        console.error('Error eliminando venta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
