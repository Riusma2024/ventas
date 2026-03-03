import { Router } from 'express';
import { getPublicCatalog, submitApartados } from '../controllers/public.controller';

const router = Router();

// /api/public/catalogo/:tenant_id
router.get('/catalogo/:tenant_id', getPublicCatalog);

// /api/public/apartado/:tenant_id
router.post('/apartado/:tenant_id', submitApartados);

export default router;
