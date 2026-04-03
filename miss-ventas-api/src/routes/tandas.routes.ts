import { Router } from 'express';
import { getTandas, createTanda, deleteTanda, subscribeToTanda } from '../controllers/tandas.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', verifyToken, getTandas);
router.post('/', verifyToken, createTanda);
router.delete('/:id', verifyToken, deleteTanda);
router.post('/subscribe', verifyToken, subscribeToTanda);

export default router;
