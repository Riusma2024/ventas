import { Router } from 'express';
import { getCupones, crearCupon, eliminarCupon } from '../controllers/admin.controller.js';
import { verifyToken, requireRol } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);
router.use(requireRol(['superadmin']));

router.get('/cupones', getCupones);
router.post('/cupones', crearCupon);
router.delete('/cupones/:id', eliminarCupon);

export default router;
