import { Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// [Superadmin] Crear un nuevo Vendedor (Antes Gestionador) o cliente
export const crearUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password || !rol) {
            res.status(400).json({ error: 'Faltan datos requeridos (nombre, email, password, rol)' });
            return;
        }

        let targetTenantId = null;

        // Soporte para ambos nombres durante transición
        const effectiveRol = (rol === 'gestionador' || rol === 'vendedor') ? 'vendedor' : rol;

        if (effectiveRol === 'vendedor') {
            if (req.user?.rol !== 'superadmin') {
                res.status(403).json({ error: 'Solo el Superadmin puede crear Vendedores.' });
                return;
            }
        } else if (effectiveRol === 'cliente') {
            if (req.user?.rol !== 'vendedor' && req.user?.rol !== 'gestionador') {
                res.status(403).json({ error: 'Solo los vendedores pueden crear accesos para clientes finales.' });
                return;
            }
            targetTenantId = req.user.id;
        }

        const [existing] = await db.query<any[]>('SELECT id FROM Usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            res.status(400).json({ error: 'El email ya está registrado' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const [result] = await db.query<any>(
            'INSERT INTO Usuarios (nombre, email, password_hash, rol, tenant_id) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, passwordHash, effectiveRol, targetTenantId]
        );

        if (effectiveRol === 'vendedor') {
            await db.query('UPDATE Usuarios SET tenant_id = ? WHERE id = ?', [result.insertId, result.insertId]);
        }

        res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuarioId: result.insertId });

    } catch (error: any) {
        res.status(500).json({ error: 'Error interno del servidor', detail: error?.message });
    }
};

// [Superadmin] Obtener lista de Vendedores
export const getGestionadores = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.rol !== 'superadmin') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }

        // Buscamos ambos por si queda alguno sin migrar, pero priorizamos 'vendedor'
        const [rows] = await db.query<any[]>(
            'SELECT id, nombre, email, creado_en, sub_status, sub_expira_el FROM Usuarios WHERE rol IN ("vendedor", "gestionador")'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Superadmin] Editar un Vendedor
export const updateGestionador = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.rol !== 'superadmin') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }

        const { id } = req.params;
        const { nombre, email, password } = req.body;

        if (!nombre || !email) {
            res.status(400).json({ error: 'Faltan datos requeridos' });
            return;
        }

        const [existingUser] = await db.query<any[]>('SELECT id, rol FROM Usuarios WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            res.status(404).json({ error: 'Vendedor no encontrado' });
            return;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            await db.query(
                'UPDATE Usuarios SET nombre = ?, email = ?, password_hash = ? WHERE id = ?',
                [nombre, email, passwordHash, id]
            );
        } else {
            await db.query('UPDATE Usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, id]);
        }

        res.json({ mensaje: 'Vendedor actualizado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Superadmin] Eliminar un Vendedor
export const deleteGestionador = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.rol !== 'superadmin') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }

        const { id } = req.params;
        const [existingUser] = await db.query<any[]>('SELECT id FROM Usuarios WHERE id = ?', [id]);
        
        if (existingUser.length === 0) {
            res.status(404).json({ error: 'Vendedor no encontrado' });
            return;
        }

        await db.query('DELETE FROM Usuarios WHERE id = ?', [id]);
        res.json({ mensaje: 'Vendedor eliminado exitosamente' });
    } catch (error: any) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ error: 'No se puede eliminar el vendedor porque tiene clientes o datos asociados.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};
