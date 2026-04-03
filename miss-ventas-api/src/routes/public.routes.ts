import { Router } from 'express';
import { getPublicSub, getCatalog, getClientData, submitOrder } from '../controllers/public.controller.js';

const router = Router();
router.get('/tenant/:slug', getPublicSub);
router.get('/catalog/:tenantId', getCatalog);
router.get('/client/:tenantId/:email', getClientData);
router.post('/order', submitOrder);

export default router;
