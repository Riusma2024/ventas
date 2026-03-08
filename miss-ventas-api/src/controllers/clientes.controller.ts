import { Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// [Gestionador] Ver Clientes
export const getClientes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;

        if (!tenant_id) {
            res.status(403).json({ error: 'Tenant ID no encontrado' });
            return;
        }

        const [rows] = await db.query<any[]>('SELECT * FROM clientes_app WHERE tenant_id = ?', [tenant_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Crear Cliente
export const createCliente = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tenant_id = req.user?.tenant_id;
        const { nombre, apodo, whatsapp, facebook, otro, deudaTotal, foto } = req.body;

        if (!nombre) {
            res.status(400).json({ error: 'El nombre es obligatorio' });
            return;
        }

        const [result] = await db.query<any>(
            `INSERT INTO clientes_app (tenant_id, nombre, apodo, whatsapp, facebook, otro, deudaTotal, codigo_cliente, foto, visto) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
            [tenant_id, nombre, apodo || null, whatsapp || null, facebook || null, otro || null, deudaTotal || 0, 'PENDIENTE', foto || null]
        );

        const clientId = result.insertId;
        const codigo = `C-${clientId}`;
        await db.query('UPDATE clientes_app SET codigo_cliente = ? WHERE id = ?', [codigo, clientId]);

        res.status(201).json({ id: clientId, codigo_cliente: codigo, ...req.body, tenant_id });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Actualizar Cliente
export const updateCliente = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;
        const { nombre, apodo, whatsapp, facebook, otro, deudaTotal, foto, visto } = req.body;

        // Recuperar el cliente actual primero
        const [currentClientRows] = await db.query<any[]>('SELECT * FROM clientes_app WHERE id = ? AND tenant_id = ?', [id, tenant_id]);

        if (currentClientRows.length === 0) {
            res.status(404).json({ error: 'Cliente no encontrado o no autorizado' });
            return;
        }

        const currentClient = currentClientRows[0];

        // Construir valores finales aplicando valores actuales si el req.body no los incluye
        const finalNombre = nombre !== undefined ? nombre : currentClient.nombre;
        const finalApodo = apodo !== undefined ? apodo : currentClient.apodo;
        const finalWhatsapp = whatsapp !== undefined ? whatsapp : currentClient.whatsapp;
        const finalFacebook = facebook !== undefined ? facebook : currentClient.facebook;
        const finalOtro = otro !== undefined ? otro : currentClient.otro;
        const finalDeudaTotal = deudaTotal !== undefined ? deudaTotal : currentClient.deudaTotal;
        const finalFoto = foto !== undefined ? foto : currentClient.foto;
        const finalVisto = visto !== undefined ? visto : currentClient.visto;

        const [result] = await db.query<any>(
            `UPDATE clientes_app 
             SET nombre = ?, apodo = ?, whatsapp = ?, facebook = ?, otro = ?, deudaTotal = ?, foto = ?, visto = ?
             WHERE id = ? AND tenant_id = ?`,
            [finalNombre, finalApodo || null, finalWhatsapp || null, finalFacebook || null, finalOtro || null, finalDeudaTotal, finalFoto || null, finalVisto, id, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Cliente no encontrado o no autorizado' });
            return;
        }

        res.json({ mensaje: 'Cliente actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Gestionador] Eliminar Cliente
export const deleteCliente = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id;

        const [result] = await db.query<any>(
            'DELETE FROM clientes_app WHERE id = ? AND tenant_id = ?',
            [id, tenant_id]
        );

        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Cliente no encontrado o no autorizado' });
            return;
        }

        res.json({ mensaje: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
