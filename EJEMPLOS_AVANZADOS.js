// 🔧 EJEMPLOS AVANZADOS - Gestor de Tareas con Redis

// ===============================================
// 1️⃣ FLUJO COMPLETO: Registro, Login, Crear Tareas
// ===============================================

// PASO 1: Registrarse
const registroData = {
  email: "juan@example.com",
  nombre: "Juan Pérez",
  contraseña: "miPassword123"
};

fetch('http://localhost:3000/api/auth/registro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registroData)
})
.then(res => res.json())
.then(data => console.log('Registrado:', data));

// -----------------------------------------------

// PASO 2: Login y obtener token
const loginData = {
  email: "juan@example.com",
  contraseña: "miPassword123"
};

let token = null;

fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
})
.then(res => res.json())
.then(data => {
  token = data.token;
  console.log('Token:', token);
});

// -----------------------------------------------

// PASO 3: Crear varias tareas con diferentes prioridades
const tareas = [
  { titulo: "Tarea urgente", prioridad: 5, fechaVencimiento: "2024-01-10" },
  { titulo: "Tarea importante", prioridad: 4, fechaVencimiento: "2024-01-15" },
  { titulo: "Tarea normal", prioridad: 3, fechaVencimiento: "2024-01-20" },
  { titulo: "Tarea baja", prioridad: 1, fechaVencimiento: "2024-01-25" }
];

tareas.forEach(tarea => {
  fetch('http://localhost:3000/api/tareas', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tarea)
  })
  .then(res => res.json())
  .then(data => console.log('Tarea creada:', data.tarea.titulo));
});

// ===============================================
// 2️⃣ SORTED SETS: Obtener tareas ordenadas
// ===============================================

// Obtener las 5 tareas PRÓXIMAS A VENCER (sin ordenación en Node.js)
async function obtenerTareasPorVencimiento() {
  const response = await fetch(
    'http://localhost:3000/api/tareas/ordenadas/vencimiento?limit=5',
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  
  console.log('🕐 Tareas próximas a vencer:');
  data.tareas.forEach(tarea => {
    console.log(`  - ${tarea.titulo} (Vence: ${tarea.fechaVencimiento})`);
  });
}

obtenerTareasPorVencimiento();

// -----------------------------------------------

// Obtener las 10 tareas MÁS IMPORTANTES (por prioridad)
async function obtenerTareasPorPrioridad() {
  const response = await fetch(
    'http://localhost:3000/api/tareas/ordenadas/prioridad?limit=10',
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  
  console.log('🎯 Tareas por prioridad:');
  data.tareas.forEach(tarea => {
    const estrella = '⭐'.repeat(tarea.prioridad);
    console.log(`  ${estrella} ${tarea.titulo}`);
  });
}

obtenerTareasPorPrioridad();

// ===============================================
// 3️⃣ ACTUALIZAR TAREAS Y SORTED SETS
// ===============================================

// Cambiar la prioridad de una tarea
// Redis automáticamente reordenará el Sorted Set
async function cambiarPrioridad(taskId, nuevaPrioridad) {
  const response = await fetch(`http://localhost:3000/api/tareas/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prioridad: nuevaPrioridad })
  });
  
  const data = await response.json();
  console.log(`✅ Prioridad actualizada a ${nuevaPrioridad}: ${data.tarea.titulo}`);
}

// Cambiar la fecha de vencimiento de una tarea
async function cambiarFechaVencimiento(taskId, nuevaFecha) {
  const response = await fetch(`http://localhost:3000/api/tareas/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fechaVencimiento: nuevaFecha })
  });
  
  const data = await response.json();
  console.log(`📅 Fecha actualizada a ${nuevaFecha}: ${data.tarea.titulo}`);
}

// ===============================================
// 4️⃣ LIMPIAR TAREAS VENCIDAS
// ===============================================

// Eliminar automáticamente todas las tareas pasadas
async function limpiarVencidas() {
  const response = await fetch(
    'http://localhost:3000/api/tareas/limpiar/vencidas',
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  console.log(`🗑️ Tareas eliminadas: ${data.tareasEliminadas}`);
}

limpiarVencidas();

// ===============================================
// 5️⃣ DASHBOARD EN TIEMPO REAL
// ===============================================

// Crear un dashboard que muestre:
// - Próximas tareas a vencer
// - Tareas por prioridad
// - Total de tareas

async function crearDashboard() {
  try {
    // Obtener todas las tareas
    const allResponse = await fetch('http://localhost:3000/api/tareas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const allData = await allResponse.json();
    
    // Obtener próximas a vencer
    const dueResponse = await fetch(
      'http://localhost:3000/api/tareas/ordenadas/vencimiento?limit=3',
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const dueData = await dueResponse.json();
    
    // Obtener por prioridad
    const priorityResponse = await fetch(
      'http://localhost:3000/api/tareas/ordenadas/prioridad?limit=3',
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const priorityData = await priorityResponse.json();
    
    // Renderizar dashboard
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║         📋 DASHBOARD DE TAREAS         ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log(`📊 Total de tareas: ${allData.cantidad}\n`);
    
    console.log('🕐 Próximas a vencer:');
    dueData.tareas.slice(0, 3).forEach(t => {
      console.log(`   • ${t.titulo} - ${t.fechaVencimiento.split('T')[0]}`);
    });
    
    console.log('\n🎯 Por prioridad (Top 3):');
    priorityData.tareas.slice(0, 3).forEach(t => {
      const estrella = '⭐'.repeat(t.prioridad);
      console.log(`   ${estrella} ${t.titulo}`);
    });
    
    const completadas = allData.tareas.filter(t => t.completada).length;
    const pendientes = allData.cantidad - completadas;
    console.log(`\n✅ Completadas: ${completadas} | ⏳ Pendientes: ${pendientes}\n`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar dashboard cada 10 segundos
setInterval(crearDashboard, 10000);

// ===============================================
// 6️⃣ BÚSQUEDA Y FILTRADO (Avanzado)
// ===============================================

// Obtener tareas de hoy
async function tareasDeHoy() {
  const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const mañana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const response = await fetch('http://localhost:3000/api/tareas/ordenadas/vencimiento?limit=100', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  const hoytareas = data.tareas.filter(t => {
    const fecha = t.fechaVencimiento.split('T')[0];
    return fecha >= hoy && fecha < mañana;
  });
  
  console.log(`📅 Tareas de hoy: ${hoytareas.length}`);
  hoytareas.forEach(t => console.log(`   • ${t.titulo}`));
}

// Obtener tareas urgentes (prioridad >= 4)
async function tareasUrgentes() {
  const response = await fetch('http://localhost:3000/api/tareas/ordenadas/prioridad?limit=100', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  const urgentes = data.tareas.filter(t => t.prioridad >= 4 && !t.completada);
  
  console.log(`🔴 Tareas urgentes: ${urgentes.length}`);
  urgentes.forEach(t => {
    console.log(`   ⭐⭐⭐⭐⭐ ${t.titulo}`.substring(0, t.prioridad * 2));
  });
}

// ===============================================
// 7️⃣ BATCH OPERATIONS (Operaciones por lotes)
// ===============================================

// Crear 100 tareas de una vez (para testing de performance)
async function crearMuchasTareas(cantidad = 100) {
  console.log(`⏳ Creando ${cantidad} tareas...`);
  
  for (let i = 1; i <= cantidad; i++) {
    const fecha = new Date(Date.now() + Math.random() * 30 * 86400000);
    
    fetch('http://localhost:3000/api/tareas', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        titulo: `Tarea ${i}`,
        descripcion: `Descripción de tarea ${i}`,
        prioridad: Math.floor(Math.random() * 5) + 1,
        fechaVencimiento: fecha.toISOString().split('T')[0]
      })
    }).then(() => {
      if (i % 10 === 0) console.log(`  ✅ ${i} creadas`);
    });
  }
  
  console.log(`✅ ${cantidad} tareas creadas`);
}

// Marcar tareas completadas
async function marcarVarias(taskIds) {
  for (const id of taskIds) {
    await fetch(`http://localhost:3000/api/tareas/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completada: true })
    });
  }
  console.log(`✅ ${taskIds.length} tareas marcadas como completadas`);
}

// ===============================================
// 8️⃣ MONITORING Y ESTADÍSTICAS
// ===============================================

async function obtenerEstadisticas() {
  const response = await fetch('http://localhost:3000/api/tareas', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  const tareas = data.tareas;
  
  // Estadísticas
  const stats = {
    total: tareas.length,
    completadas: tareas.filter(t => t.completada).length,
    pendientes: tareas.filter(t => !t.completada).length,
    porPrioridad: {
      baja: tareas.filter(t => t.prioridad <= 2).length,
      media: tareas.filter(t => t.prioridad === 3).length,
      alta: tareas.filter(t => t.prioridad === 4).length,
      urgente: tareas.filter(t => t.prioridad === 5).length
    }
  };
  
  console.log('📊 Estadísticas:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  ✅ Completadas: ${stats.completadas} (${(stats.completadas/stats.total*100).toFixed(1)}%)`);
  console.log(`  ⏳ Pendientes: ${stats.pendientes} (${(stats.pendientes/stats.total*100).toFixed(1)}%)`);
  console.log(`\n  Por prioridad:`);
  console.log(`    Baja: ${stats.porPrioridad.baja}`);
  console.log(`    Media: ${stats.porPrioridad.media}`);
  console.log(`    Alta: ${stats.porPrioridad.alta}`);
  console.log(`    Urgente: ${stats.porPrioridad.urgente}`);
  
  return stats;
}

// ===============================================
// 9️⃣ EXPORTAR DATOS
// ===============================================

// Exportar todas las tareas a JSON
async function exportarTareasJSON() {
  const response = await fetch('http://localhost:3000/api/tareas', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  const json = JSON.stringify(data.tareas, null, 2);
  
  // Para Node.js
  require('fs').writeFileSync('tareas_export.json', json);
  console.log('📄 Tareas exportadas a tareas_export.json');
  
  // Para navegador, crear descarga
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tareas.json';
  a.click();
}

// Exportar a CSV
async function exportarTareasCSV() {
  const response = await fetch('http://localhost:3000/api/tareas', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  const tareas = data.tareas;
  
  const csv = [
    'ID,Titulo,Descripcion,Prioridad,Fecha Vencimiento,Completada',
    ...tareas.map(t => 
      `${t.id},"${t.titulo}","${t.descripcion}",${t.prioridad},${t.fechaVencimiento},${t.completada}`
    )
  ].join('\n');
  
  require('fs').writeFileSync('tareas_export.csv', csv);
  console.log('📊 Tareas exportadas a tareas_export.csv');
}

// ===============================================
// 🔟 UTILIDADES PRÁCTICAS
// ===============================================

// Helper: Formatear fecha
function formatearFecha(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper: Obtener días faltantes
function diasFaltantes(isoDate) {
  const fecha = new Date(isoDate);
  const hoy = new Date();
  const diff = fecha - hoy;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Helper: Mostrar prioridad con emoji
function mostrarPrioridad(nivel) {
  const emojis = ['💤', '😌', '😐', '⚡', '🔥'];
  return emojis[nivel - 1] || '❓';
}

console.log('🎉 Ejemplos avanzados listos para usar!');
console.log('📚 Abre la consola de desarrollador para ver más ejemplos');
