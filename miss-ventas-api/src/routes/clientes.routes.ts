import { Router } from 'express';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../controllers/clientes.controller';
import { verifyToken, requireRol } from '../middleware/auth.middleware';

const router = Router();

// Todas las acciones sobre el catálogo de clientes requieren ser al menos 'gestionador'
router.use(verifyToken, requireRol(['gestionador', 'superadmin']));

router.get('/', getClientes);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

export default router;
