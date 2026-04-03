import { Router } from 'express';
import { getAbonos, createAbono, updateAbono, deleteAbono } from '../controllers/abonos.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', verifyToken, getAbonos);
router.post('/', verifyToken, createAbono);
router.put('/:id', verifyToken, updateAbono);
router.delete('/:id', verifyToken, deleteAbono);

export default router;
