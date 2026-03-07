const jwt = require('jwt-simple');
require('dotenv').config();

const token = jwt.encode({
    id: 1,
    rol: 'gestionador',
    tenant_id: 1,
    exp: Math.floor(Date.now() / 1000) + 3600
}, process.env.JWT_SECRET || 'fallback_secret');

console.log("TOKEN:", token);
