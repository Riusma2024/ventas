import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const crearUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password || !rol) {
            res.status(400).json({ error: 'Faltan datos requeridos' });
            return;
        }

        let targetTenantId = null;
        const effectiveRol = (rol === 'gestionador' || rol === 'vendedor') ? 'vendedor' : rol;

        if (effectiveRol === 'vendedor') {
            if (req.user?.rol !== 'superadmin') {
                res.status(403).json({ error: 'Solo el Superadmin puede crear Vendedores' });
                return;
            }
        } else if (effectiveRol === 'cliente') {
            targetTenantId = req.user?.id;
        }

        const [existing] = await db.query<any[]>('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            res.status(400).json({ error: 'El email ya está registrado' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const [result] = await db.query<any>(
            'INSERT INTO usuarios (nombre, email, password_hash, rol, tenant_id) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, passwordHash, effectiveRol, targetTenantId]
        );

        if (effectiveRol === 'vendedor') {
            await db.query('UPDATE usuarios SET tenant_id = ? WHERE id = ?', [result.insertId, result.insertId]);
        }

        res.status(201).json({ mensaje: 'Éxito', usuarioId: result.insertId });

    } catch (error: any) {
        res.status(500).json({ error: 'Error interno' });
    }
};

export const getGestionadores = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.rol !== 'superadmin') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }

        const [rows] = await db.query<any[]>(
            'SELECT id, nombre, email, creado_en, sub_status, sub_expira_el FROM usuarios WHERE rol IN ("vendedor", "gestionador")'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
};

export const updateGestionador = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.rol !== 'superadmin') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }

        const { id } = req.params;
        const { nombre, email, password } = req.body;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            await db.query(
                'UPDATE usuarios SET nombre = ?, email = ?, password_hash = ? WHERE id = ?',
                [nombre, email, passwordHash, id]
            );
        } else {
            await db.query('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, id]);
        }

        res.json({ mensaje: 'Éxito' });
    } catch (error: any) {
        res.status(500).json({ error: 'Error interno' });
    }
};

export const deleteGestionador = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.rol !== 'superadmin') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }

        const { id } = req.params;
        await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ mensaje: 'Éxito' });
    } catch (error: any) {
        res.status(500).json({ error: 'Error interno' });
    }
};
