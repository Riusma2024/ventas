import { Router } from 'express';
import { crearPreferenciaSuscripcion, webhookPagos } from '../controllers/payments.controller.js';

const router = Router();

router.post('/create-subscription', crearPreferenciaSuscripcion);
router.post('/webhook', webhookPagos);

export default router;
