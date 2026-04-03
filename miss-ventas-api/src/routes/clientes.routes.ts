import { Router } from 'express';
import { getClientes, createCliente, updateCliente, deleteCliente, getClienteEstadoCuenta } from '../controllers/clientes.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', verifyToken, getClientes);
router.post('/', verifyToken, createCliente);
router.put('/:id', verifyToken, updateCliente);
router.delete('/:id', verifyToken, deleteCliente);
router.get('/:id/estado-cuenta', verifyToken, getClienteEstadoCuenta);

export default router;
