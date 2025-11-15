// Importar las librerías que se necesitan
const express = require('express');
const redis = require('redis');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Crear la aplicación
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

// Middleware para trabajar con JSON
app.use(express.json());
app.use(cors());

// Crear cliente de Redis
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Conectar a Redis
let redisConnected = false;

client.connect()
  .then(() => {
    console.log('✓ Conectado a RedisCloud exitosamente');
    redisConnected = true;
  })
  .catch((err) => {
    console.log('✗ Error conectando a Redis:', err.message);
  });

// MIDDLEWARE: Verificar JWT
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// ENDPOINT: Registro (POST)
app.post('/api/auth/registro', async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    const { email, contraseña, nombre } = req.body;

    // Validaciones
    if (!email || !contraseña || !nombre) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son obligatorios' });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await client.hGet('usuarios', email);
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const contraseñaHash = await bcrypt.hash(contraseña, 10);

    // Crear usuario
    const usuario = {
      email,
      nombre,
      contraseña: contraseñaHash,
      fechaRegistro: new Date().toISOString()
    };

    // Guardar en Redis
    await client.hSet('usuarios', email, JSON.stringify(usuario));

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      email,
      nombre
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT: Login (POST)
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // Obtener usuario
    const usuarioJSON = await client.hGet('usuarios', email);
    if (!usuarioJSON) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = JSON.parse(usuarioJSON);

    // Verificar contraseña
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign(
      { email: usuario.email, nombre: usuario.nombre },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { email: usuario.email, nombre: usuario.nombre }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT 1: Ver todas las tareas del usuario (GET)
app.get('/api/tareas', verificarToken, async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    const email = req.usuario.email;
    const clave = `tareas:${email}`;

    // Obtener todas las tareas del usuario
    const tareas = await client.hGetAll(clave);

    // Convertir a array
    const tareasArray = Object.values(tareas).map(tarea => JSON.parse(tarea));

    res.json({
      mensaje: 'Tareas obtenidas',
      cantidad: tareasArray.length,
      tareas: tareasArray
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT 2: Agregar una nueva tarea (POST)
app.post('/api/tareas', verificarToken, async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    const { titulo, descripcion } = req.body;
    const email = req.usuario.email;

    // Validar que exista el título
    if (!titulo) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    // Crear un ID único para la tarea
    const id = Date.now().toString();
    const clave = `tareas:${email}`;

    // Crear objeto tarea
    const tarea = {
      id,
      titulo,
      descripcion: descripcion || '',
      completada: false,
      fechaCreacion: new Date().toISOString()
    };

    // Guardar en Redis
    await client.hSet(clave, id, JSON.stringify(tarea));

    res.status(201).json({
      mensaje: 'Tarea creada exitosamente',
      tarea
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT 3: Actualizar una tarea (PUT)
app.put('/api/tareas/:id', verificarToken, async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    const { id } = req.params;
    const { titulo, descripcion, completada } = req.body;
    const email = req.usuario.email;
    const clave = `tareas:${email}`;

    // Obtener la tarea actual
    const tareaJSON = await client.hGet(clave, id);

    if (!tareaJSON) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const tarea = JSON.parse(tareaJSON);

    // Actualizar los campos
    if (titulo !== undefined) tarea.titulo = titulo;
    if (descripcion !== undefined) tarea.descripcion = descripcion;
    if (completada !== undefined) tarea.completada = completada;

    // Guardar los cambios
    await client.hSet(clave, id, JSON.stringify(tarea));

    res.json({
      mensaje: 'Tarea actualizada',
      tarea
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT 4: Eliminar una tarea (DELETE)
app.delete('/api/tareas/:id', verificarToken, async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    const { id } = req.params;
    const email = req.usuario.email;
    const clave = `tareas:${email}`;

    // Verificar que existe
    const existe = await client.hExists(clave, id);

    if (!existe) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Eliminar
    await client.hDel(clave, id);

    res.json({
      mensaje: 'Tarea eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT 5: Endpoint de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: '¡Bienvenido a tu Gestor de Tareas!',
    estado: redisConnected ? '✓ Conectado a la base de datos' : '✗ Sin conexión',
    endpoints: {
      registro: 'POST /api/auth/registro',
      login: 'POST /api/auth/login',
      ver_tareas: 'GET /api/tareas (requiere token)',
      crear_tarea: 'POST /api/tareas (requiere token)',
      actualizar_tarea: 'PUT /api/tareas/:id (requiere token)',
      eliminar_tarea: 'DELETE /api/tareas/:id (requiere token)'
    }
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║ Servidor ejecutándose                  ║
║ http://localhost:${PORT}                  ║
╚════════════════════════════════════════╝
`);
});

// Manejar desconexión limpia
process.on('SIGINT', async () => {
  await client.disconnect();
  process.exit(0);
});