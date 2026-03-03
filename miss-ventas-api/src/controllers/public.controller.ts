import { Request, Response } from 'express';
import { db } from '../config/db';

// [Público] Obtener productos disponibles del catálogo de un Gestionador
export const getPublicCatalog = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenant_id } = req.params;

        if (!tenant_id) {
            res.status(400).json({ error: 'ID de catálogo (tenant) requerido' });
            return;
        }

        // Obtener solo productos con stock > 0
        const [rows] = await db.query<any[]>(
            'SELECT id, nombre, precioSugerido, foto, stock, categoria FROM Productos WHERE tenant_id = ? AND stock > 0',
            [tenant_id]
        );

        // Obtener nombre del gestionador para personalizar la vista
        const [tenantRows] = await db.query<any[]>(
            'SELECT nombre FROM Usuarios WHERE id = ? AND rol = "gestionador"',
            [tenant_id]
        );

        if (tenantRows.length === 0) {
            res.status(404).json({ error: 'Catálogo no encontrado' });
            return;
        }

        res.json({
            negocio: tenantRows[0].nombre,
            productos: rows
        });
    } catch (error) {
        console.error('Error al obtener catálogo público:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// [Público] Enviar una solicitud de apartado (carrito de compras)
export const submitApartados = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenant_id } = req.params;
        const { cliente, carrito } = req.body;

        if (!tenant_id || !cliente?.nombre || !cliente?.whatsapp || !carrito || carrito.length === 0) {
            res.status(400).json({ error: 'Datos incompletos para crear el apartado' });
            return;
        }

        // 1. Buscar si el cliente ya existe por WhatsApp para este tenant
        let clienteId: number;

        const [existingClient] = await db.query<any[]>(
            'SELECT id FROM Clientes_App WHERE tenant_id = ? AND whatsapp = ?',
            [tenant_id, cliente.whatsapp]
        );

        if (existingClient.length > 0) {
            clienteId = existingClient[0].id;
        } else {
            // Crear el cliente si no existe
            const [newClient] = await db.query<any>(
                'INSERT INTO Clientes_App (tenant_id, nombre, whatsapp) VALUES (?, ?, ?)',
                [tenant_id, cliente.nombre, cliente.whatsapp]
            );
            clienteId = newClient.insertId;
        }

        // 2. Procesar cada producto en el carrito
        const apartadosCreados = [];

        for (const item of carrito) {
            const { productoId, cantidad, precioOriginal } = item;

            // Verificamos stock real
            const [prodRes] = await db.query<any[]>(
                'SELECT stock, costo FROM Productos WHERE id = ? AND tenant_id = ?',
                [productoId, tenant_id]
            );

            if (prodRes.length === 0 || prodRes[0].stock < cantidad) {
                continue; // Saltar si mágicamente se quedó sin stock en este milisegundo o no existe
            }

            // Un apartado genera tantas entradas de "Venta" como cantidad pida, o se puede agrupar.
            // Según la estructura actual, no hay "cantidad" en Ventas, es un producto = un registro.
            // Para simplificar, insertaremos N registros si cantidad > 1.
            const costoProd = Number(prodRes[0].costo);
            const precioVenta = Number(item.precioVenta || precioOriginal); // Permitir que envíen el precio al que vieron
            const utilidad = precioVenta - costoProd;

            for (let i = 0; i < cantidad; i++) {
                const [insertRes] = await db.query<any>(
                    `INSERT INTO Ventas (tenant_id, productoId, clienteId, precioVenta, utilidad, fecha, pagado, estado) 
                     VALUES (?, ?, ?, ?, ?, NOW(), FALSE, 'apartado')`,
                    [tenant_id, productoId, clienteId, precioVenta, utilidad]
                );

                apartadosCreados.push(insertRes.insertId);

                // Nota: El stock NO se descuenta aún. Se descontará cuando el gestionador apruebe el apartado.
            }
        }

        if (apartadosCreados.length === 0) {
            res.status(400).json({ error: 'No se pudo apartar ningún producto (probablemente sin stock)' });
            return;
        }

        res.status(201).json({
            mensaje: 'Solicitud de apartados enviada exitosamente',
            apartadosId: apartadosCreados,
            clienteId
        });

    } catch (error) {
        console.error('Error al enviar solicitud de apartados:', error);
        res.status(500).json({ error: 'Error interno del servidor en la solicitud' });
    }
};
