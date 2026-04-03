import { Router } from 'express';
import { loginUsuario, registrarVendedor, solicitarRecuperacion, restablecerPassword } from '../controllers/auth.controller';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Endpoints públicos
router.post('/login', loginUsuario);
router.post('/register', registrarVendedor);
router.post('/forgot-password', solicitarRecuperacion);
router.post('/reset-password', restablecerPassword);

// Endpoint protegido
router.get('/me', verifyToken, (req: AuthRequest, res) => {
    res.json({ user: req.user });
});

export default router;
