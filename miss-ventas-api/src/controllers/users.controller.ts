import { Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// [Superadmin] Crear un nuevo Gestionador o cliente
export const crearUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password || !rol) {
            res.status(400).json({ error: 'Faltan datos requeridos (nombre, email, password, rol)' });
            return;
        }

        // Si quien crea es un Superadmin, puede crear Gestionadores. 
        // Si no lo es, rechazamos por precaución. (Aquí también podría el gestionador crear clientes de acceso, pero por simplicidad solo SA crea G).

        let targetTenantId = null;

        if (rol === 'gestionador') {
            if (req.user?.rol !== 'superadmin') {
                res.status(403).json({ error: 'Solo el Superadmin puede crear Gestionadores.' });
                return;
            }
        } else if (rol === 'cliente') {
            // Un Gestionador crea a un cliente y se asigna su tenant_id
            if (req.user?.rol !== 'gestionador') {
                res.status(403).json({ error: 'Solo los gestionadores pueden crear accesos para clientes finales.' });
                return;
            }
            targetTenantId = req.user.id; // El cliente pertenecerá al gestionador actual
        }

        // Check si el email ya existe
        const [existing] = await db.query<any[]>('SELECT id FROM Usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            res.status(400).json({ error: 'El email ya está registrado' });
            return;
        }

        // Hashear password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insertar en Base de Datos
        const [result] = await db.query<any>(
            'INSERT INTO Usuarios (nombre, email, password_hash, rol, tenant_id) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, passwordHash, rol, targetTenantId]
        );

        // Si creamos un Gestionador, su propio tenant_id es su propio ID recién creado.
        // Hacemos un UPDATE rápido.
        if (rol === 'gestionador') {
            await db.query('UPDATE Usuarios SET tenant_id = ? WHERE id = ?', [result.insertId, result.insertId]);
        }

        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            usuarioId: result.insertId
        });

    } catch (error: any) {
        console.error('Error detallado creando usuario:', error?.message || error);
        res.status(500).json({ error: 'Error interno del servidor', detail: error?.message });
    }
};

// [Superadmin] Obtener lista de Gestionadores
export const getGestionadores = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.rol !== 'superadmin') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }

        const [rows] = await db.query<any[]>('SELECT id, nombre, email, creado_en FROM Usuarios WHERE rol = ?', ['gestionador']);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Superadmin] Editar un Gestionador
export const updateGestionador = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.rol !== 'superadmin') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }

        const { id } = req.params;
        const { nombre, email, password } = req.body;

        if (!nombre || !email) {
            res.status(400).json({ error: 'Faltan datos requeridos (nombre, email)' });
            return;
        }

        // Check if the user exists and is a gestionador
        const [existingUser] = await db.query<any[]>('SELECT id, rol FROM Usuarios WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            res.status(404).json({ error: 'Gestionador no encontrado' });
            return;
        }
        if (existingUser[0].rol !== 'gestionador') {
            res.status(400).json({ error: 'El usuario no es un gestionador' });
            return;
        }

        // Check if the new email already exists for a different user
        const [existingEmail] = await db.query<any[]>('SELECT id FROM Usuarios WHERE email = ? AND id != ?', [email, id]);
        if (existingEmail.length > 0) {
            res.status(400).json({ error: 'El email ya está registrado ppor otro usuario' });
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
            await db.query(
                'UPDATE Usuarios SET nombre = ?, email = ? WHERE id = ?',
                [nombre, email, id]
            );
        }

        res.json({ mensaje: 'Gestionador actualizado exitosamente' });

    } catch (error: any) {
        console.error('Error editando gestionador:', error?.message || error);
        res.status(500).json({ error: 'Error interno del servidor', detail: error?.message });
    }
};

// [Superadmin] Eliminar un Gestionador
export const deleteGestionador = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.rol !== 'superadmin') {
            res.status(403).json({ error: 'No autorizado' });
            return;
        }

        const { id } = req.params;

        // Check if the user exists and is a gestionador
        const [existingUser] = await db.query<any[]>('SELECT id, rol FROM Usuarios WHERE id = ?', [id]);
        if (existingUser.length === 0) {
            res.status(404).json({ error: 'Gestionador no encontrado' });
            return;
        }
        if (existingUser[0].rol !== 'gestionador') {
            res.status(400).json({ error: 'El usuario no es un gestionador o no puede ser eliminado' });
            return;
        }

        // (Optional) Check if the gestionador has associated clients/sales before deleting. 
        // We'll delete directly for now or let DB handle foreign key constraints depending on the schema.
        await db.query('DELETE FROM Usuarios WHERE id = ?', [id]);

        res.json({ mensaje: 'Gestionador eliminado exitosamente' });

    } catch (error: any) {
        console.error('Error eliminando gestionador:', error?.message || error);
        // Include a check if the error is a foreign key constraint violation
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ error: 'No se puede eliminar el gestionador porque tiene clientes o datos asociados. Elimínelos o reasígnelos primero.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor', detail: error?.message });
        }
    }
};
