# 📋 Documentación de la API - Gestor de Tareas con Redis

## 🚀 Características Nuevas: Sorted Sets

La API ahora utiliza **Sorted Sets (ZSET)** en Redis para ordenación avanzada de tareas. Esto permite:
- ⚡ **Consultas ultra-rápidas**: Obtener tareas ordenadas por fecha o prioridad en O(log N)
- 💾 **Eficiencia de memoria**: Redis maneja la ordenación, no Node.js
- 🎯 **Escalabilidad**: Funciona igual de rápido con 100 o 100k tareas

---

## 📊 Estructura de Datos en Redis

```
Hash: tareas:{email}
  ├─ task_id_1 -> { "id": "task_id_1", "titulo": "...", ... }
  ├─ task_id_2 -> { "id": "task_id_2", "titulo": "...", ... }
  └─ task_id_3 -> { "id": "task_id_3", "titulo": "...", ... }

Sorted Set (por fecha de vencimiento): tareas:{email}:by_due_date
  ├─ Score: 1700000000000 (timestamp), Value: task_id_1
  ├─ Score: 1700100000000 (timestamp), Value: task_id_2
  └─ Score: 1700200000000 (timestamp), Value: task_id_3

Sorted Set (por prioridad): tareas:{email}:by_priority
  ├─ Score: -5 (prioridad inversa), Value: task_id_3
  ├─ Score: -4 (prioridad inversa), Value: task_id_1
  └─ Score: -1 (prioridad inversa), Value: task_id_2
```

---

## 🔐 Autenticación

### Registro de Usuario
```http
POST /api/auth/registro
Content-Type: application/json

{
  "email": "usuario@example.com",
  "nombre": "Juan Pérez",
  "contraseña": "miContraseña123"
}
```

**Respuesta (201):**
```json
{
  "mensaje": "Usuario registrado exitosamente",
  "email": "usuario@example.com",
  "nombre": "Juan Pérez"
}
```

---

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "contraseña": "miContraseña123"
}
```

**Respuesta (200):**
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "email": "usuario@example.com",
    "nombre": "Juan Pérez"
  }
}
```

⚠️ **Guarda el token**, lo necesitarás para todos los endpoints de tareas.

---

## 📝 Endpoints de Tareas

### Obtener todas las tareas
```http
GET /api/tareas
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "mensaje": "Tareas obtenidas",
  "cantidad": 3,
  "tareas": [
    {
      "id": "1700000000000",
      "titulo": "Comprar leche",
      "descripcion": "Ir al supermercado",
      "completada": false,
      "prioridad": 5,
      "fechaVencimiento": "2024-01-15T10:00:00.000Z",
      "fechaCreacion": "2024-01-08T14:30:00.000Z"
    }
  ]
}
```

---

### Crear una nueva tarea ✨
```http
POST /api/tareas
Authorization: Bearer {token}
Content-Type: application/json

{
  "titulo": "Comprar leche",
  "descripcion": "Ir al supermercado",
  "fechaVencimiento": "2024-01-15",
  "prioridad": 5
}
```

**Parámetros:**
- `titulo` (obligatorio): Título de la tarea
- `descripcion` (opcional): Descripción detallada
- `fechaVencimiento` (opcional): Fecha en formato ISO o YYYY-MM-DD. Si no se proporciona, será 7 días desde ahora
- `prioridad` (opcional): Número entre 1-5 (5 es máxima prioridad). Por defecto: 3

**Respuesta (201):**
```json
{
  "mensaje": "Tarea creada exitosamente",
  "tarea": {
    "id": "1700123456789",
    "titulo": "Comprar leche",
    "descripcion": "Ir al supermercado",
    "completada": false,
    "prioridad": 5,
    "fechaVencimiento": "2024-01-15T00:00:00.000Z",
    "fechaCreacion": "2024-01-08T14:35:22.000Z"
  }
}
```

---

### Actualizar una tarea
```http
PUT /api/tareas/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "titulo": "Comprar leche desnatada",
  "completada": true,
  "prioridad": 4,
  "fechaVencimiento": "2024-01-20"
}
```

**Respuesta:**
```json
{
  "mensaje": "Tarea actualizada",
  "tarea": {
    "id": "1700123456789",
    "titulo": "Comprar leche desnatada",
    "completada": true,
    "prioridad": 4,
    "fechaVencimiento": "2024-01-20T00:00:00.000Z"
  }
}
```

---

### Eliminar una tarea
```http
DELETE /api/tareas/{id}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "mensaje": "Tarea eliminada exitosamente"
}
```

---

## 🔥 Endpoints Avanzados (Sorted Sets)

### Obtener tareas ordenadas por fecha de vencimiento ⏰
```http
GET /api/tareas/ordenadas/vencimiento?limit=10
Authorization: Bearer {token}
```

**Parámetros:**
- `limit` (opcional): Número máximo de tareas a retornar. Por defecto: 10

**Uso:** Perfecto para mostrar "próximas tareas a vencer"

**Respuesta:**
```json
{
  "mensaje": "Tareas ordenadas por fecha de vencimiento",
  "cantidad": 3,
  "tareas": [
    {
      "id": "1700000000000",
      "titulo": "Tarea urgente",
      "fechaVencimiento": "2024-01-09T10:00:00.000Z",
      "prioridad": 5
    },
    {
      "id": "1700111111111",
      "titulo": "Tarea menos urgente",
      "fechaVencimiento": "2024-01-15T10:00:00.000Z",
      "prioridad": 2
    }
  ]
}
```

---

### Obtener tareas ordenadas por prioridad 🎯
```http
GET /api/tareas/ordenadas/prioridad?limit=10
Authorization: Bearer {token}
```

**Parámetros:**
- `limit` (opcional): Número máximo de tareas a retornar. Por defecto: 10

**Uso:** Mostrar tareas ordenadas por importancia (mayor a menor)

**Respuesta:**
```json
{
  "mensaje": "Tareas ordenadas por prioridad",
  "cantidad": 3,
  "tareas": [
    {
      "id": "1700000000000",
      "titulo": "Tarea crítica",
      "prioridad": 5,
      "fechaVencimiento": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": "1700111111111",
      "titulo": "Tarea normal",
      "prioridad": 3,
      "fechaVencimiento": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

---

### Limpiar tareas vencidas 🗑️
```http
DELETE /api/tareas/limpiar/vencidas
Authorization: Bearer {token}
```

**Uso:** Elimina automáticamente todas las tareas cuya fecha de vencimiento es anterior a ahora.

**Respuesta:**
```json
{
  "mensaje": "Tareas vencidas eliminadas exitosamente",
  "tareasEliminadas": 5
}
```

---

## 🧪 Ejemplos con cURL

### 1. Registrarse
```bash
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "nombre": "Mi Nombre",
    "contraseña": "miPassword123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "contraseña": "miPassword123"
  }'
```

### 3. Crear tarea
```bash
TOKEN="tu_token_aqui"
curl -X POST http://localhost:3000/api/tareas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Aprender Redis",
    "descripcion": "Dominar Sorted Sets",
    "prioridad": 5,
    "fechaVencimiento": "2024-01-20"
  }'
```

### 4. Obtener tareas por prioridad
```bash
TOKEN="tu_token_aqui"
curl -X GET "http://localhost:3000/api/tareas/ordenadas/prioridad?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Obtener tareas próximas a vencer
```bash
TOKEN="tu_token_aqui"
curl -X GET "http://localhost:3000/api/tareas/ordenadas/vencimiento?limit=3" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Limpiar tareas vencidas
```bash
TOKEN="tu_token_aqui"
curl -X DELETE http://localhost:3000/api/tareas/limpiar/vencidas \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎨 Casos de Uso Prácticos

### Caso 1: Dashboard de tareas pendientes
```javascript
// Obtener las 5 tareas más urgentes (próximas a vencer)
GET /api/tareas/ordenadas/vencimiento?limit=5
```

### Caso 2: Mostrar tareas por importancia
```javascript
// Listar las 10 tareas más importantes
GET /api/tareas/ordenadas/prioridad?limit=10
```

### Caso 3: Limpieza automática (ejecutar cada día)
```javascript
// Eliminar tareas vencidas
DELETE /api/tareas/limpiar/vencidas
```

### Caso 4: Actualizar prioridad de una tarea
```javascript
// Cambiar a máxima prioridad
PUT /api/tareas/{id}
{
  "prioridad": 5
}
// Redis actualizará automáticamente el ZSET by_priority
```

---

## ⚡ Ventajas del Diseño con Sorted Sets

| Operación | Sin ZSET | Con ZSET |
|-----------|----------|----------|
| Obtener todas las tareas | O(1)* | O(1)* |
| Obtener top 10 por fecha | O(n log n) | O(log N) |
| Obtener top 10 por prioridad | O(n log n) | O(log N) |
| Limpiar vencidas | O(n) | O(k log n) |
| Actualizar prioridad | O(1) | O(log n) |

*O(1) para obtener del Hash, pero O(n log n) para ordenar en aplicación

---

## 🔒 Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- Los JWT expiran en 24 horas
- Cada usuario solo puede acceder a sus propias tareas
- Todos los endpoints de tareas requieren token válido

---

## 📦 Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
REDIS_URL=redis://default:password@host:port
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
PORT=3000
```

---

## 🛠️ Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start

# El servidor estará en http://localhost:3000
```
