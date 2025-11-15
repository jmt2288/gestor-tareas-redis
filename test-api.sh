#!/bin/bash

# 🧪 Script de pruebas de la API - Gestor de Tareas con Redis
# Este script prueba todos los endpoints de la API

API_URL="http://localhost:3000"
EMAIL="prueba@example.com"
NOMBRE="Usuario Prueba"
PASSWORD="prueba123"
TOKEN=""
TASK_ID=""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 🧪 TESTING API - GESTOR DE TAREAS ===${NC}\n"

# Test 1: Obtener documentación de la API
echo -e "${YELLOW}[TEST 1]${NC} Obtener documentación (GET /)"
curl -s "$API_URL/" | jq .
echo -e "\n"

# Test 2: Registro de usuario
echo -e "${YELLOW}[TEST 2]${NC} Registrar usuario (POST /api/auth/registro)"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/registro" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "'"$EMAIL"'",
    "nombre": "'"$NOMBRE"'",
    "contraseña": "'"$PASSWORD"'"
  }')
echo "$REGISTER_RESPONSE" | jq .
echo -e "\n"

# Test 3: Login
echo -e "${YELLOW}[TEST 3]${NC} Login (POST /api/auth/login)"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"contraseña\": \"$PASSWORD\"
  }")
echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo -e "${GREEN}Token obtenido: $TOKEN${NC}\n"

# Test 4: Crear primera tarea
echo -e "${YELLOW}[TEST 4]${NC} Crear tarea 1 (POST /api/tareas)"
TASK1_RESPONSE=$(curl -s -X POST "$API_URL/api/tareas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Estudiar Redis Sorted Sets",
    "descripcion": "Aprender sobre ZADD y ZRANGE",
    "prioridad": 5,
    "fechaVencimiento": "2024-01-10"
  }')
echo "$TASK1_RESPONSE" | jq .
TASK1_ID=$(echo "$TASK1_RESPONSE" | jq -r '.tarea.id')
echo -e "${GREEN}Task ID: $TASK1_ID${NC}\n"

# Test 5: Crear segunda tarea
echo -e "${YELLOW}[TEST 5]${NC} Crear tarea 2 (POST /api/tareas)"
TASK2_RESPONSE=$(curl -s -X POST "$API_URL/api/tareas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Implementar ordenación por prioridad",
    "descripcion": "Usar ZSET con puntuaciones negativas",
    "prioridad": 4,
    "fechaVencimiento": "2024-01-20"
  }')
echo "$TASK2_RESPONSE" | jq .
TASK2_ID=$(echo "$TASK2_RESPONSE" | jq -r '.tarea.id')
echo -e "\n"

# Test 6: Crear tercera tarea
echo -e "${YELLOW}[TEST 6]${NC} Crear tarea 3 (POST /api/tareas)"
TASK3_RESPONSE=$(curl -s -X POST "$API_URL/api/tareas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Probar endpoints avanzados",
    "descripcion": "GET /ordenadas/vencimiento y /ordenadas/prioridad",
    "prioridad": 3,
    "fechaVencimiento": "2024-01-25"
  }')
echo "$TASK3_RESPONSE" | jq .
TASK3_ID=$(echo "$TASK3_RESPONSE" | jq -r '.tarea.id')
echo -e "\n"

# Test 7: Obtener todas las tareas
echo -e "${YELLOW}[TEST 7]${NC} Obtener todas las tareas (GET /api/tareas)"
curl -s -X GET "$API_URL/api/tareas" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# Test 8: Obtener tareas ordenadas por fecha de vencimiento ⏰
echo -e "${YELLOW}[TEST 8]${NC} Obtener tareas ordenadas por fecha (GET /api/tareas/ordenadas/vencimiento?limit=5)"
curl -s -X GET "$API_URL/api/tareas/ordenadas/vencimiento?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# Test 9: Obtener tareas ordenadas por prioridad 🎯
echo -e "${YELLOW}[TEST 9]${NC} Obtener tareas ordenadas por prioridad (GET /api/tareas/ordenadas/prioridad?limit=5)"
curl -s -X GET "$API_URL/api/tareas/ordenadas/prioridad?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# Test 10: Actualizar una tarea
echo -e "${YELLOW}[TEST 10]${NC} Actualizar tarea (PUT /api/tareas/$TASK1_ID)"
curl -s -X PUT "$API_URL/api/tareas/$TASK1_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Dominar Redis Sorted Sets ✅",
    "completada": false,
    "prioridad": 5,
    "fechaVencimiento": "2024-01-12"
  }' | jq .
echo -e "\n"

# Test 11: Obtener tareas ordenadas por prioridad (después de actualizar)
echo -e "${YELLOW}[TEST 11]${NC} Verificar ordenación actualizada (GET /api/tareas/ordenadas/prioridad)"
curl -s -X GET "$API_URL/api/tareas/ordenadas/prioridad?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# Test 12: Limpiar tareas vencidas 🗑️
echo -e "${YELLOW}[TEST 12]${NC} Limpiar tareas vencidas (DELETE /api/tareas/limpiar/vencidas)"
curl -s -X DELETE "$API_URL/api/tareas/limpiar/vencidas" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# Test 13: Eliminar una tarea específica
echo -e "${YELLOW}[TEST 13]${NC} Eliminar tarea (DELETE /api/tareas/$TASK3_ID)"
curl -s -X DELETE "$API_URL/api/tareas/$TASK3_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

# Test 14: Verificar que la tarea fue eliminada
echo -e "${YELLOW}[TEST 14]${NC} Verificar tareas restantes (GET /api/tareas)"
curl -s -X GET "$API_URL/api/tareas" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo -e "\n"

echo -e "${GREEN}=== ✅ TODAS LAS PRUEBAS COMPLETADAS ===${NC}"
