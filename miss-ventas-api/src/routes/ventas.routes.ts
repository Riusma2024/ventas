import { Router } from 'express';
import { getVentas, createVenta, updateVentaEstado, deleteVenta } from '../controllers/ventas.controller.js';
import { verifyToken, requireRol } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', verifyToken, getVentas);
router.post('/', verifyToken, createVenta);
router.put('/:id/estado', verifyToken, requireRol(['gestionador', 'superadmin']), updateVentaEstado);
router.delete('/:id', verifyToken, requireRol(['gestionador', 'superadmin']), deleteVenta);

export default router;
