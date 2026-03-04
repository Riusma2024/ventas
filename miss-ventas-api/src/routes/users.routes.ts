import { Router } from 'express';
import { crearUsuario, getGestionadores, updateGestionador, deleteGestionador } from '../controllers/users.controller';
import { verifyToken, requireRol } from '../middleware/auth.middleware';

const router = Router();

// Endpoint para crear gestionadores (Solo Superadmin) 
// o crear clientes (Solo Gestionador)
router.post('/', verifyToken, crearUsuario);

// Endpoint para listar Gestionadores (Solo Superadmin)
router.get('/gestionadores', verifyToken, requireRol(['superadmin']), getGestionadores);

// Endpoint para editar un Gestionador (Solo Superadmin)
router.put('/gestionadores/:id', verifyToken, requireRol(['superadmin']), updateGestionador);

// Endpoint para eliminar un Gestionador (Solo Superadmin)
router.delete('/gestionadores/:id', verifyToken, requireRol(['superadmin']), deleteGestionador);

export default router;
