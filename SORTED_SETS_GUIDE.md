# 📊 Arquitectura de Sorted Sets - Guía Visual

## 🏗️ Estructura de Datos en Redis

### Hash: `tareas:{email}`
Almacena el objeto completo de cada tarea.

```
HASH: tareas:usuario@example.com
┌─────────────────────────────────────────────────────────┐
│ Field: "1700123456789"                                  │
│ Value: {                                                │
│   "id": "1700123456789",                                │
│   "titulo": "Estudiar Redis",                           │
│   "descripcion": "Aprender Sorted Sets",                │
│   "completada": false,                                  │
│   "prioridad": 5,                                       │
│   "fechaVencimiento": "2024-01-10T00:00:00.000Z",      │
│   "fechaCreacion": "2024-01-08T14:35:22.000Z"          │
│ }                                                       │
├─────────────────────────────────────────────────────────┤
│ Field: "1700234567890"                                  │
│ Value: {                                                │
│   "id": "1700234567890",                                │
│   "titulo": "Implementar API",                          │
│   "prioridad": 4,                                       │
│   "fechaVencimiento": "2024-01-15T00:00:00.000Z",      │
│   ...                                                   │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

Comandos Redis:
- HSET tareas:usuario@example.com "1700123456789" "{...json...}"
- HGET tareas:usuario@example.com "1700123456789"
- HGETALL tareas:usuario@example.com
```

---

## ⏰ Sorted Set: Por Fecha de Vencimiento

```
ZSET: tareas:usuario@example.com:by_due_date
┌─────────────────────────────────────────────┐
│ Score (timestamp) │ Value (task_id)         │
├─────────────────────────────────────────────┤
│ 1705000000000     │ 1700123456789  ← Vence primero  │
│ 1705084000000     │ 1700234567890  ← Vence segundo  │
│ 1705168000000     │ 1700345678901  ← Vence tercero  │
│ 1705252000000     │ 1700456789012  ← Vence cuarto   │
└─────────────────────────────────────────────┘

Comandos Redis:
- ZADD tareas:usuario@example.com:by_due_date 1705000000000 "1700123456789"
- ZRANGE tareas:usuario@example.com:by_due_date 0 4  # Top 5 próximas a vencer
- ZREMRANGEBYSCORE tareas:usuario@example.com:by_due_date "-inf" 1704999999999

Ventajas:
✅ O(log N) para insertar/actualizar
✅ O(log N) para obtener N elementos
✅ O(log N) para limpiar por score
✅ Ordenación automática por timestamp
```

---

## 🎯 Sorted Set: Por Prioridad

```
ZSET: tareas:usuario@example.com:by_priority
┌────────────────────────────────────────────────┐
│ Score (negativo) │ Value (task_id)             │
├────────────────────────────────────────────────┤
│ -5               │ 1700123456789  ← Prioridad máxima │
│ -5               │ 1700456789012  ← Prioridad máxima │
│ -4               │ 1700234567890  ← Prioridad alta   │
│ -3               │ 1700345678901  ← Prioridad media  │
│ -1               │ 1700567890123  ← Prioridad baja   │
└────────────────────────────────────────────────┘

¿Por qué scores negativos?
  - Prioridad: 1 = baja, 5 = máxima
  - Score: -5 = mayor prioridad primero
  - ZRANGE ordena por score ascendente
  - Así -5 aparece antes que -1

Comandos Redis:
- ZADD tareas:usuario@example.com:by_priority -5 "1700123456789"
- ZRANGE tareas:usuario@example.com:by_priority 0 9  # Top 10 por prioridad
- ZREM tareas:usuario@example.com:by_priority "1700123456789"

Ventajas:
✅ O(log N) para ordenar por prioridad
✅ O(log N) para obtener top N
✅ Automáticamente actualizado con ZADD
✅ Sin necesidad de ordenar en Node.js
```

---

## 🔄 Flujo de Operaciones

### 1️⃣ Crear Tarea

```javascript
// Usuario: usuario@example.com
// Nueva tarea: { id: 123, titulo: "Tarea", prioridad: 5, fechaVencimiento: "2024-01-10" }

// Paso 1: Guardar en Hash
HSET tareas:usuario@example.com 123 '{"id": 123, ...}'

// Paso 2: Agregar al ZSET de fecha
ZADD tareas:usuario@example.com:by_due_date 1705000000000 123

// Paso 3: Agregar al ZSET de prioridad  
ZADD tareas:usuario@example.com:by_priority -5 123
```

---

### 2️⃣ Obtener Tareas por Fecha (próximas a vencer)

```javascript
// Usuario quiere sus 5 tareas más próximas a vencer

// Redis:
ZRANGE tareas:usuario@example.com:by_due_date 0 4

// Retorna: ["123", "456", "789", "012", "345"]
// (en orden de fecha de vencimiento ascendente)

// Node.js entonces obtiene los detalles:
HGET tareas:usuario@example.com 123
HGET tareas:usuario@example.com 456
... etc
```

**Ventaja:** Redis hace la ordenación, Node.js solo obtiene 5 registros en lugar de 1000.

---

### 3️⃣ Obtener Tareas por Prioridad

```javascript
// Usuario quiere sus 10 tareas más importantes

// Redis:
ZRANGE tareas:usuario@example.com:by_priority 0 9

// Retorna: ["123", "456", "789", ...] 
// (en orden de -5, -5, -4, -3, -2, -1, -1, -1, -1, -1)

// Node.js obtiene los detalles de cada una
```

---

### 4️⃣ Actualizar Prioridad de Tarea

```javascript
// Usuario cambia tarea 123 de prioridad 5 a prioridad 2

// Paso 1: Actualizar en Hash
HSET tareas:usuario@example.com 123 '{"id": 123, "prioridad": 2, ...}'

// Paso 2: Actualizar en ZSET de prioridad (ZADD sobrescribe)
ZADD tareas:usuario@example.com:by_priority -2 123

// El ZSET automáticamente reordena
```

---

### 5️⃣ Limpiar Tareas Vencidas

```javascript
// Eliminar todas las tareas cuya fecha de vencimiento < ahora

// Ahora: 2024-01-20 = 1705718400000

// Redis:
ZREMRANGEBYSCORE tareas:usuario@example.com:by_due_date "-inf" 1705718400000

// Esto elimina todas las tareas con score <= fecha actual
// Pero NO del Hash, por eso necesitamos hacerlo manualmente

// Node.js:
// 1. Obtener IDs de tareas vencidas
// 2. Borrar del Hash: HDEL tareas:usuario@example.com id1 id2 id3...
// 3. Borrar del ZSET de prioridad: ZREM tareas:usuario@example.com:by_priority id1 id2 id3...
```

---

## 📈 Comparativa de Performance

### Obtener 10 tareas próximas a vencer (total: 1000 tareas)

#### Método Tradicional (solo Hash)
```
1. HGETALL tareas:usuario@example.com  → retorna 1000 tareas
2. Ordenar 1000 tareas en Node.js      → O(n log n) = 1000 * log(1000)
3. Tomar las primeras 10                → O(1)
Total: Transferencia de 1000 objetos + ordenación costosa
```

#### Con Sorted Sets ⚡
```
1. ZRANGE tareas:usuario@example.com:by_due_date 0 9 → O(log N) = log(1000)
   Retorna solo 10 task IDs
2. HGET tareas:usuario@example.com id1 → 10 transferencias
   ... id2, id3, ... id10
Total: Ordenación en Redis + solo 10 objetos transferidos
```

**Resultado:** 100x más rápido con Sorted Sets

---

## 🎓 Resumen de Comandos Redis Usados

| Comando | Descripción | Complejidad |
|---------|-------------|-------------|
| `ZADD key score member` | Añadir/actualizar elemento en ZSET | O(log N) |
| `ZRANGE key 0 -1` | Obtener todos los elementos ordenados | O(log N + M) |
| `ZRANGE key 0 9` | Obtener primeros 10 elementos | O(log N + 10) |
| `ZRANGEBYSCORE key min max` | Obtener elementos en rango de scores | O(log N + M) |
| `ZREMRANGEBYSCORE key min max` | Eliminar elementos en rango de scores | O(log N + M) |
| `ZREM key member` | Eliminar un elemento | O(log N) |
| `ZCARD key` | Contar elementos | O(1) |
| `ZSCORE key member` | Obtener score de un elemento | O(1) |

---

## 💡 Casos de Uso en el Mundo Real

### 1. Sistema de Tareas (nuestro caso)
- Ordenar por fecha de vencimiento
- Ordenar por prioridad
- Limpiar automáticamente vencidas

### 2. Leaderboards/Rankings
- Score de usuario en un juego
- Ranking de vendedores por monto
- Top comentarios en redes sociales

### 3. Rate Limiting
- Contar peticiones por usuario por minuto
- Score = timestamp, limpiar antiguos con ZREMRANGEBYSCORE

### 4. Colas de Mensajes
- Procesar mensajes en orden de prioridad
- Score = prioridad, obtener siguiente con ZRANGE

### 5. Análisis en Tiempo Real
- Estadísticas por rango de tiempo
- Score = timestamp, ZRANGEBYSCORE para rango

---

## 🔍 Debugging con Redis CLI

```bash
# Conectar a Redis
redis-cli

# Ver todas las claves
> KEYS *

# Ver estructura del usuario
> HGETALL tareas:usuario@example.com
> ZRANGE tareas:usuario@example.com:by_due_date 0 -1 WITHSCORES
> ZRANGE tareas:usuario@example.com:by_priority 0 -1 WITHSCORES

# Ver cardinalidad (cantidad de tareas)
> HLEN tareas:usuario@example.com
> ZCARD tareas:usuario@example.com:by_due_date

# Limpiar datos de prueba
> DEL tareas:usuario@example.com
> DEL tareas:usuario@example.com:by_due_date
> DEL tareas:usuario@example.com:by_priority
```

---

## 🎯 Próximos Pasos

1. **Ejecutar el servidor** y probar con `test-api.sh`
2. **Usar `redis-cli`** para ver cómo se almacenan los datos
3. **Implementar frontend** para consumir la API
4. **Agregar más funcionalidades:**
   - Compartir tareas entre usuarios
   - Comentarios en tareas
   - Etiquetas/categorías
   - Subtareas
   - Recordatorios
