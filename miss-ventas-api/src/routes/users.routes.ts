import { Router } from 'express';
import { crearUsuario, getGestionadores } from '../controllers/users.controller';
import { verifyToken, requireRol } from '../middleware/auth.middleware';

const router = Router();

// Endpoint para crear gestionadores (Solo Superadmin) 
// o crear clientes (Solo Gestionador)
router.post('/', verifyToken, crearUsuario);

// Endpoint para listar Gestionadores (Solo Superadmin)
router.get('/gestionadores', verifyToken, requireRol(['superadmin']), getGestionadores);

export default router;
