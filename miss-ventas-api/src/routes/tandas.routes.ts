import { Router } from 'express';
import { getTandas, createTanda, addParticipante, updateParticipante, deleteTanda } from '../controllers/tandas.controller';
import { verifyToken, requireRol } from '../middleware/auth.middleware';

const router = Router();

// Accesible por clientes y gestionadores
router.get('/', verifyToken, getTandas);

// Crear tanda (solo gestionadores/super)
router.post('/', verifyToken, requireRol(['gestionador', 'superadmin']), createTanda);

// Eliminar tanda (solo gestionador/super)
router.delete('/:id', verifyToken, requireRol(['gestionador', 'superadmin']), deleteTanda);

// Añadir participante a una tanda (Gestionadores y clientes pueden apuntarse)
router.post('/:tandaId/participantes', verifyToken, addParticipante);

// Actualizar estado de pago/beneficiario de un participante
router.put('/:tandaId/participantes/:idParticipante', verifyToken, requireRol(['gestionador', 'superadmin']), updateParticipante);

export default router;
