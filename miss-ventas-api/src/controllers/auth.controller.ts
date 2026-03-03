import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jwt-simple';
import { db } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const loginUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email y contraseña son requeridos' });
            return;
        }

        const [rows] = await db.query<any[]>('SELECT * FROM Usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        const usuario = rows[0];

        const isMatch = await bcrypt.compare(password, usuario.password_hash);
        if (!isMatch) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        // Payload del JWT
        const payload = {
            id: usuario.id,
            rol: usuario.rol,
            tenant_id: usuario.tenant_id,
            // Expira en 30 días
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        };

        const token = jwt.encode(payload, JWT_SECRET);

        res.json({
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                tenant_id: usuario.tenant_id
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
