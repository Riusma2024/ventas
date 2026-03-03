import { Router } from 'express';
import { loginUsuario } from '../controllers/auth.controller';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Endpoint público
router.post('/login', loginUsuario);

// Endpoint protegido (Validar si token sigue vivo/quién es)
router.get('/me', verifyToken, (req: AuthRequest, res) => {
    res.json({ user: req.user });
});

export default router;
