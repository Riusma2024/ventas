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
