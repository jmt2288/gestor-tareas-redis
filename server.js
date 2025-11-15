// Importar las librerías que se necesitan
const express = require('express');
const redis = require('redis');
const cors = require('cors');
require('dotenv').config();

// Crear la aplicación
const app = express();
const PORT = process.env.PORT || 3000;

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

// ENDPOINT 1: Ver todas las tareas (GET)
app.get('/api/tareas', async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    // Obtener todas las tareas de Redis
    const tareas = await client.hGetAll('tareas');

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
app.post('/api/tareas', async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    const { titulo, descripcion } = req.body;

    // Validar que exista el título
    if (!titulo) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    // Crear un ID único para la tarea
    const id = Date.now().toString();

    // Crear objeto tarea
    const tarea = {
      id,
      titulo,
      descripcion: descripcion || '',
      completada: false,
      fechaCreacion: new Date().toISOString()
    };

    // Guardar en Redis
    await client.hSet('tareas', id, JSON.stringify(tarea));

    res.status(201).json({
      mensaje: 'Tarea creada exitosamente',
      tarea
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT 3: Actualizar una tarea (PUT)
app.put('/api/tareas/:id', async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    const { id } = req.params;
    const { titulo, descripcion, completada } = req.body;

    // Obtener la tarea actual
    const tareaJSON = await client.hGet('tareas', id);

    if (!tareaJSON) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const tarea = JSON.parse(tareaJSON);

    // Actualizar los campos
    if (titulo !== undefined) tarea.titulo = titulo;
    if (descripcion !== undefined) tarea.descripcion = descripcion;
    if (completada !== undefined) tarea.completada = completada;

    // Guardar los cambios
    await client.hSet('tareas', id, JSON.stringify(tarea));

    res.json({
      mensaje: 'Tarea actualizada',
      tarea
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT 4: Eliminar una tarea (DELETE)
app.delete('/api/tareas/:id', async (req, res) => {
  try {
    if (!redisConnected) {
      return res.status(500).json({ error: 'No conectado a la base de datos' });
    }

    const { id } = req.params;

    // Verificar que existe
    const existe = await client.hExists('tareas', id);

    if (!existe) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Eliminar
    await client.hDel('tareas', id);

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
      ver_tareas: 'GET /api/tareas',
      crear_tarea: 'POST /api/tareas',
      actualizar_tarea: 'PUT /api/tareas/:id',
      eliminar_tarea: 'DELETE /api/tareas/:id'
    }
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║ Servidor ejecutándose                  ║
║ http://localhost:${PORT}               ║
╚════════════════════════════════════════╝
`);
});

// Manejar desconexión limpia
process.on('SIGINT', async () => {
  await client.disconnect();
  process.exit(0);
});