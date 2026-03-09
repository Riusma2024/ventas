import { Router } from 'express';
import { getClientes, createCliente, updateCliente, deleteCliente, syncClientDebtBackend } from '../controllers/clientes.controller';
import { verifyToken, requireRol } from '../middleware/auth.middleware';

const router = Router();

// [Gestionadores] Todos los accesos de clientes son para gestionadores (o superadmins)
router.get('/', verifyToken, requireRol(['gestionador', 'superadmin']), getClientes);
router.post('/', verifyToken, requireRol(['gestionador', 'superadmin']), createCliente);
router.put('/:id', verifyToken, requireRol(['gestionador', 'superadmin']), updateCliente);
router.delete('/:id', verifyToken, requireRol(['gestionador', 'superadmin']), deleteCliente);
router.post('/:id/sync-debt', verifyToken, requireRol(['gestionador', 'superadmin']), syncClientDebtBackend);

export default router;
