import { Router } from 'express';
import { crearUsuario, getVendedores, updateVendedor, deleteVendedor } from '../controllers/users.controller.js';
import { verifyToken, requireRol } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', verifyToken, crearUsuario);
router.get('/vendedores', verifyToken, requireRol(['superadmin']), getVendedores);
router.put('/vendedores/:id', verifyToken, requireRol(['superadmin']), updateVendedor);
router.delete('/vendedores/:id', verifyToken, requireRol(['superadmin']), deleteVendedor);

export default router;
