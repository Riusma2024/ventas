import { Router } from 'express';
import { crearUsuario, getGestionadores, updateGestionador, deleteGestionador } from '../controllers/users.controller.js';
import { verifyToken, requireRol } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', verifyToken, crearUsuario);
router.get('/gestionadores', verifyToken, requireRol(['superadmin']), getGestionadores);
router.put('/gestionadores/:id', verifyToken, requireRol(['superadmin']), updateGestionador);
router.delete('/gestionadores/:id', verifyToken, requireRol(['superadmin']), deleteGestionador);

export default router;
