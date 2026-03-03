import { Router } from 'express';
import { getAbonos, createAbono, updateAbono, deleteAbono } from '../controllers/abonos.controller';
import { verifyToken, requireRol } from '../middleware/auth.middleware';

const router = Router();

// Todos (Clientes y Gestionadores) pueden ver, Clientes pueden usar ?clienteId=... (filtrado será pulido en prod)
router.get('/', verifyToken, getAbonos);

// Clientes y Gestionadores pueden crear
router.post('/', verifyToken, createAbono);

// Solo gestionadores/superadmin actualizan (verifican)
router.put('/:id', verifyToken, requireRol(['gestionador', 'superadmin']), updateAbono);

// Solo gestionadores/superadmin eliminan
router.delete('/:id', verifyToken, requireRol(['gestionador', 'superadmin']), deleteAbono);

export default router;
