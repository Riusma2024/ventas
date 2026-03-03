import { Router } from 'express';
import { getVentas, createVenta, updateVentaEstado, deleteVenta } from '../controllers/ventas.controller';
import { verifyToken, requireRol } from '../middleware/auth.middleware';

const router = Router();

// Ver ventas (Clientes y Gestionadores referenciados al mismo tenant)
router.get('/', verifyToken, getVentas);

// Crear venta/apartado (Clientes pueden hacer apartados, Gestionadores autorizadas)
router.post('/', verifyToken, createVenta);

// [Gestionadores] autorizar o cancelar
router.put('/:id/estado', verifyToken, requireRol(['gestionador', 'superadmin']), updateVentaEstado);

// [Gestionadores] eliminar del historial
router.delete('/:id', verifyToken, requireRol(['gestionador', 'superadmin']), deleteVenta);

export default router;
