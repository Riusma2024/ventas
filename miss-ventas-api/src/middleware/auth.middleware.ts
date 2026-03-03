import { Request, Response, NextFunction } from 'express';
import jwt from 'jwt-simple';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Extender Request para inyectar el usuario
export interface AuthRequest extends Request {
    user?: {
        id: number;
        rol: 'superadmin' | 'gestionador' | 'cliente';
        tenant_id: number | null;
    };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token no proveído' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.decode(token, JWT_SECRET);

        // Verificar expiración
        if (decoded.exp <= Math.floor(Date.now() / 1000)) {
            res.status(401).json({ error: 'Token expirado' });
            return;
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Middleware para restringir acceso por Rol
export const requireRol = (roles: Array<'superadmin' | 'gestionador' | 'cliente'>) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.rol)) {
            res.status(403).json({ error: 'No tienes permisos para esta acción' });
            return;
        }
        next();
    };
};
