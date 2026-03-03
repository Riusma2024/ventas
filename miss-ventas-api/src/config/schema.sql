-- Esquema de Base de Datos para Miss Ventas (SaaS Multi-Tenant)
-- Base de Datos a utilizar: miss_ventas_db

CREATE TABLE IF NOT EXISTS Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('superadmin', 'gestionador', 'cliente') NOT NULL,
    tenant_id INT NULL, -- NULL para superadmin. El gestionador tiene su propio ID aquí. Los clientes comparten el del gestionador.
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    costo DECIMAL(10, 2) NOT NULL,
    precioSugerido DECIMAL(10, 2) NOT NULL,
    foto TEXT NULL,
    stock INT NOT NULL DEFAULT 0,
    categoria VARCHAR(100) NULL,
    FOREIGN KEY (tenant_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Clientes_App (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    usuario_id INT NULL, -- Relación con la tabla Usuarios si el cliente final decidió crearse una cuenta para apartados
    nombre VARCHAR(100) NOT NULL,
    apodo VARCHAR(100) NULL,
    whatsapp VARCHAR(20) NULL,
    facebook VARCHAR(100) NULL,
    otro VARCHAR(100) NULL,
    deudaTotal DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (tenant_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    productoId INT NOT NULL,
    clienteId INT NOT NULL,
    precioVenta DECIMAL(10, 2) NOT NULL,
    utilidad DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL,
    pagado BOOLEAN DEFAULT FALSE,
    estado ENUM('apartado', 'autorizado', 'entregado', 'cancelado') DEFAULT 'autorizado',
    FOREIGN KEY (tenant_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (productoId) REFERENCES Productos(id) ON DELETE CASCADE,
    FOREIGN KEY (clienteId) REFERENCES Clientes_App(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Abonos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    clienteId INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL,
    evidencia TEXT NULL,
    verificado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tenant_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (clienteId) REFERENCES Clientes_App(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Tandas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    montoPorNumero DECIMAL(10, 2) NOT NULL,
    periodicidad ENUM('semanal', 'quincenal', 'mensual') NOT NULL,
    fechaInicio DATETIME NOT NULL,
    participantes INT DEFAULT 11,
    FOREIGN KEY (tenant_id) REFERENCES Usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS TandaPagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    tandaId INT NOT NULL,
    numeroSemana INT NOT NULL,
    participanteNombre VARCHAR(100) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    pagado BOOLEAN DEFAULT FALSE,
    esBeneficiario BOOLEAN DEFAULT FALSE,
    evidencia TEXT NULL,
    FOREIGN KEY (tenant_id) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tandaId) REFERENCES Tandas(id) ON DELETE CASCADE
);

-- Inserción de un Superadmin de prueba (La contraseña es 'admin123' hasheada con bcrypt para pruebas)
-- ¡IMPORTANTE! Cambiar esto en producción
INSERT IGNORE INTO Usuarios (id, nombre, email, password_hash, rol, tenant_id) VALUES 
(1, 'Super Admin', 'admin@missventas.com', '$2b$10$Ue1.zZ9x008i.2.Hj9.Ake.zY9u2E9M4S45H32Z5oV9n/.29Z5O0S', 'superadmin', NULL);
