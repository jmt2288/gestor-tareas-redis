# 📋 Gestor de Tareas con Redis y Sorted Sets

Una aplicación Node.js/Express de gestión de tareas con autenticación JWT y almacenamiento en Redis, utilizando **Sorted Sets** para ordenación ultra-rápida de tareas por fecha de vencimiento y prioridad.

## ✨ Características

### 🔐 Autenticación
- ✅ Registro de usuarios con email y contraseña
- ✅ Login con generación de JWT
- ✅ Protección de endpoints con middleware de token
- ✅ Contraseñas hasheadas con bcrypt

### 📝 Gestión de Tareas
- ✅ Crear, leer, actualizar y eliminar tareas
- ✅ Tareas personalizadas por usuario
- ✅ Campos: título, descripción, prioridad (1-5), fecha de vencimiento
- ✅ Marca de completado

### ⚡ Sorted Sets (Ordenación Avanzada)
- ✅ Obtener tareas ordenadas por **fecha de vencimiento** (próximas primero)
- ✅ Obtener tareas ordenadas por **prioridad** (mayor primero)
- ✅ Limpiar automáticamente tareas vencidas
- ✅ Sin ordenación en Node.js, todo en Redis

### 🗄️ Almacenamiento Redis
```
Hashes:
├── usuarios                    (almacena datos de usuarios)
└── tareas:{email}              (almacena tareas por usuario)

Sorted Sets:
├── tareas:{email}:by_due_date  (ordenadas por fecha de vencimiento)
└── tareas:{email}:by_priority  (ordenadas por prioridad)
```

## 🚀 Instalación

### Requisitos
- Node.js 14+
- Redis (local o RedisCloud)

### Pasos

1. **Clonar repositorio**
   ```bash
   git clone https://github.com/jmt2288/gestor-tareas-redis.git
   cd gestor-tareas-redis
   ```

2. **Instalar dependencias**
   ```bash
   npm install bcrypt cors dotenv express jsonwebtoken redis
   ```

3. **Configurar variables de entorno**
   
  Crear archivo .env

   ```
   REDIS_URL=redis://password@endpoint:puerto
   JWT_SECRET=your_jwt_secret_here
   # Puerto en el que se monta el servidor
   PORT=3000
   ```

4. **Iniciar servidor**
   ```bash
   npm start
   # Servidor en http://localhost:3000
   ```

## 📚 Documentación de API

### Endpoints de Autenticación

#### Registro
```http
POST /api/auth/registro
Content-Type: application/json

{
  "email": "usuario@example.com",
  "nombre": "Mi Nombre",
  "contraseña": "miPassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "contraseña": "miPassword123"
}
```

### Endpoints de Tareas

**Todos requieren token JWT en el header:**
```
Authorization: Bearer {token}
```

#### Obtener todas las tareas
```http
GET /api/tareas
```

#### Crear tarea
```http
POST /api/tareas
Content-Type: application/json

{
  "titulo": "Mi tarea",
  "descripcion": "Descripción opcional",
  "prioridad": 5,        # 1-5 (5 = máxima)
  "fechaVencimiento": "2024-01-20"  # opcional
}
```

#### Actualizar tarea
```http
PUT /api/tareas/{id}
Content-Type: application/json

{
  "titulo": "Nuevo título",
  "completada": true,
  "prioridad": 4
}
```

#### Eliminar tarea
```http
DELETE /api/tareas/{id}
```

### ⚡ Endpoints Avanzados (Sorted Sets)

#### Obtener tareas por fecha de vencimiento
```http
GET /api/tareas/ordenadas/vencimiento?limit=10
```
Retorna las 10 tareas próximas a vencer, **sin ordenación en Node.js**.

#### Obtener tareas por prioridad
```http
GET /api/tareas/ordenadas/prioridad?limit=10
```
Retorna las 10 tareas con mayor prioridad.

#### Limpiar tareas vencidas
```http
DELETE /api/tareas/limpiar/vencidas
```
Elimina automáticamente todas las tareas vencidas.

## 🧪 Pruebas

### Con cURL

```bash
# 1. Registrarse
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","nombre":"User","contraseña":"pass123"}'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","contraseña":"pass123"}' | jq -r '.token')

# 3. Crear tarea
curl -X POST http://localhost:3000/api/tareas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Mi tarea","prioridad":5}'

# 4. Ver tareas por prioridad
curl -X GET "http://localhost:3000/api/tareas/ordenadas/prioridad?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ JWT con expiración de 24 horas
- ✅ Aislamiento de datos por usuario
- ✅ Validación de entrada en todos los endpoints
- ✅ CORS configurado

## 📦 Dependencias

- **express**: Framework web
- **redis**: Cliente de Redis
- **jsonwebtoken**: Autenticación JWT
- **bcrypt**: Hasheo de contraseñas
- **cors**: Control de CORS
- **dotenv**: Variables de entorno

## 🚀 Próximos Pasos

1. **Frontend**: Crear interfaz React/Vue para consumir la API
2. **Compartir tareas**: Permitir compartir tareas entre usuarios
3. **Comentarios**: Agregar comentarios a las tareas
4. **Etiquetas**: Organizar tareas por etiquetas/categorías
5. **Subtareas**: Tareas anidadas
6. **Recordatorios**: Notificaciones de tareas próximas
7. **API Rate Limiting**: Proteger la API de abuso

## 📝 Estructura del Proyecto

```
.
├── server.js                    # Archivo principal
├── package.json                 # Dependencias
├── .env                         # Variables de entorno 
└── README.md                    # Este archivo
```
