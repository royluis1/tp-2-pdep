import * as readline from 'readline';

/**
 * ==================================================================================
 * MODULO DE DEFINICIÓN DE DATOS (ABSTRACCIÓN)
 * ==================================================================================
 */

// Definimos los tipos de datos restringidos
type EstadoTarea = 'Pendiente' | 'En Curso' | 'Terminada' | 'Cancelada';
type DificultadTarea = 'Fácil' | 'Medio' | 'Difícil';

// Definición de la estructura de una Tarea
interface Tarea {
    titulo: string;
    descripcion: string;
    estado: EstadoTarea;
    fechaCreacion: Date;
    fechaVencimiento: Date | null;
    dificultad: DificultadTarea;
    ultimaEdicion: Date | null;
}

// Estado Global de la Aplicación (Base de Datos en memoria)
let listaDeTareas: Tarea[] = [];

// Configuración de entrada por consola
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * ==================================================================================
 * MODULO DE UTILIDADES (ENTRADA/SALIDA)
 * ==================================================================================
 */

// Función auxiliar para pedir datos al usuario de forma asíncrona pero secuencial
function preguntar(pregunta: string): Promise<string> {
    return new Promise(resolve => {
        // Agregamos ': string' explícito para evitar error si faltan @types/node
        rl.question(pregunta, (respuesta: string) => {
            resolve(respuesta);
        });
    });
}

function limpiarConsola() {
    console.clear();
}

// CORRECCIÓN AQUÍ: Usamos async/await para que la función devuelva Promise<void> correctamente
async function esperarTecla(): Promise<void> {
    await preguntar('\nPresione Enter para continuar...');
}

// Función para mostrar dificultad con estrellas (Requerimiento visual)
function obtenerEstrellasDificultad(dif: DificultadTarea): string {
    switch (dif) {
        case 'Fácil': return '★☆☆';
        case 'Medio': return '★★☆';
        case 'Difícil': return '★★★';
        default: return '---';
    }
}

// Función para formatear fechas
function formatearFecha(fecha: Date | null): string {
    if (!fecha) return 'Sin Vencimiento';
    return fecha.toLocaleDateString();
}

/**
 * ==================================================================================
 * MODULO DE LÓGICA DE NEGOCIO (OPERACIONES)
 * ==================================================================================
 */

// Crear una nueva tarea con valores por defecto
function crearTareaLogica(titulo: string, descripcion: string, vencimiento: string | null, dificultadInput: string): Tarea {
    
    // Mapeo de dificultad
    let dificultad: DificultadTarea = 'Fácil'; // Por defecto
    if (dificultadInput === '2') dificultad = 'Medio';
    if (dificultadInput === '3') dificultad = 'Difícil';

    // Parseo de fecha
    let fechaVenc: Date | null = null;
    if (vencimiento && vencimiento.trim() !== '') {
        const partes = vencimiento.split('-'); // Espera formato YYYY-MM-DD
        if (partes.length === 3) {
            fechaVenc = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
        }
    }

    const nuevaTarea: Tarea = {
        titulo: titulo,
        descripcion: descripcion,
        estado: 'Pendiente', // Por defecto
        fechaCreacion: new Date(), // Automático
        fechaVencimiento: fechaVenc,
        dificultad: dificultad,
        ultimaEdicion: new Date()
    };

    listaDeTareas.push(nuevaTarea);
    return nuevaTarea;
}

// Filtrar tareas según estado
function obtenerTareasPorEstado(opcion: string): Tarea[] {
    switch (opcion) {
        case '1': return listaDeTareas; // Todas
        case '2': return listaDeTareas.filter(t => t.estado === 'Pendiente');
        case '3': return listaDeTareas.filter(t => t.estado === 'En Curso');
        case '4': return listaDeTareas.filter(t => t.estado === 'Terminada');
        default: return [];
    }
}

// Buscar tarea por título
function buscarTareasPorTitulo(busqueda: string): Tarea[] {
    return listaDeTareas.filter(t => t.titulo.toLowerCase().includes(busqueda.toLowerCase()));
}

/**
 * ==================================================================================
 * MODULO DE INTERFAZ DE USUARIO (VISTAS Y MENÚS)
 * ==================================================================================
 */

async function mostrarMenuPrincipal() {
    limpiarConsola();
    console.log("========================================");
    console.log("      TODO LIST - MENÚ PRINCIPAL        ");
    console.log("========================================");
    console.log("1. Ver mis tareas");
    console.log("2. Buscar una tarea");
    console.log("3. Agregar una tarea");
    console.log("0. Salir");
    console.log("========================================");

    const opcion = await preguntar("Ingrese una opción: ");
    
    switch (opcion) {
        case '1': await mostrarMenuVerTareas(); break;
        case '2': await menuBuscarTarea(); break;
        case '3': await menuAgregarTarea(); break;
        case '0': 
            rl.close(); 
            process.exit(0);
            break;
        default:
            console.log("Opción no válida.");
            await esperarTecla();
            await mostrarMenuPrincipal();
    }
}

async function mostrarMenuVerTareas() {
    limpiarConsola();
    console.log("--- VER MIS TAREAS ---");
    console.log("1. Todas");
    console.log("2. Pendientes");
    console.log("3. En Curso");
    console.log("4. Terminadas");
    console.log("0. Volver");

    const opcion = await preguntar("¿Qué tareas deseas ver? ");

    if (opcion === '0') {
        await mostrarMenuPrincipal();
        return;
    }

    if (['1', '2', '3', '4'].includes(opcion)) {
        const tareasFiltradas = obtenerTareasPorEstado(opcion);
        // Ordenamiento por defecto: Alfabético (Bonus)
        tareasFiltradas.sort((a, b) => a.titulo.localeCompare(b.titulo));
        await listarTareas(tareasFiltradas);
    } else {
        console.log("Opción incorrecta.");
        await esperarTecla();
        await mostrarMenuVerTareas();
    }
}

async function listarTareas(tareas: Tarea[]) {
    limpiarConsola();
    console.log("--- LISTADO ---");
    
    if (tareas.length === 0) {
        console.log("No hay tareas para mostrar.");
    } else {
        tareas.forEach((t, index) => {
            console.log(`[${index + 1}] ${t.titulo} (${obtenerEstrellasDificultad(t.dificultad)}) - ${t.estado}`);
        });
    }

    console.log("\n--------------------------------");
    console.log("Ingrese el número de la tarea para ver detalles/editar");
    console.log("O ingrese 0 para volver");
    
    const input = await preguntar("Opción: ");
    const indice = parseInt(input) - 1;

    if (input === '0') {
        await mostrarMenuPrincipal();
    } else if (indice >= 0 && indice < tareas.length) {
        // Debemos encontrar la tarea original en el array global para editarla
        const tareaSeleccionada = tareas[indice];
        await verDetallesTarea(tareaSeleccionada);
    } else {
        console.log("Tarea no encontrada.");
        await esperarTecla();
        await listarTareas(tareas);
    }
}

async function verDetallesTarea(tarea: Tarea) {
    limpiarConsola();
    console.log("========================================");
    console.log("          DETALLES DE TAREA             ");
    console.log("========================================");
    console.log(`Título:      ${tarea.titulo}`);
    console.log(`Descripción: ${tarea.descripcion || "Sin descripción"}`);
    console.log(`Estado:      ${tarea.estado}`);
    console.log(`Dificultad:  ${tarea.dificultad} ${obtenerEstrellasDificultad(tarea.dificultad)}`);
    console.log(`Vencimiento: ${formatearFecha(tarea.fechaVencimiento)}`);
    console.log(`Creación:    ${tarea.fechaCreacion.toLocaleDateString()} ${tarea.fechaCreacion.toLocaleTimeString()}`);
    console.log(`Ult. Edición:${formatearFecha(tarea.ultimaEdicion)}`);
    console.log("========================================");
    console.log("Presione [E] para Editar, o Enter para volver.");

    const op = await preguntar("Opción: ");
    if (op.toLowerCase() === 'e') {
        await menuEditarTarea(tarea);
    } else {
        await mostrarMenuPrincipal();
    }
}

async function menuAgregarTarea() {
    limpiarConsola();
    console.log("--- AGREGAR NUEVA TAREA ---");
    
    const titulo = await preguntar("Título (Obligatorio): ");
    if (!titulo.trim()) {
        console.log("El título no puede estar vacío.");
        await esperarTecla();
        await menuAgregarTarea();
        return;
    }

    const descripcion = await preguntar("Descripción: ");
    const vencimiento = await preguntar("Fecha Vencimiento (YYYY-MM-DD) [Enter para vacio]: ");
    
    console.log("Dificultad: 1. Fácil | 2. Medio | 3. Difícil");
    const dificultad = await preguntar("Opción [Enter para Fácil]: ");

    crearTareaLogica(titulo, descripcion, vencimiento, dificultad);
    
    console.log("¡Tarea guardada con éxito!");
    await esperarTecla();
    await mostrarMenuPrincipal();
}

async function menuEditarTarea(tarea: Tarea) {
    limpiarConsola();
    console.log(`--- EDITANDO: ${tarea.titulo} ---`);
    console.log("(Deje en blanco para mantener el valor actual)");

    const nuevoTitulo = await preguntar(`Título [${tarea.titulo}]: `);
    if (nuevoTitulo.trim()) tarea.titulo = nuevoTitulo;

    const nuevaDesc = await preguntar(`Descripción [${tarea.descripcion}]: `);
    if (nuevaDesc.trim()) tarea.descripcion = nuevaDesc;

    console.log(`Estado actual: ${tarea.estado}`);
    console.log("1. Pendiente | 2. En Curso | 3. Terminada | 4. Cancelada");
    const nuevoEstadoOp = await preguntar("Nuevo Estado: ");
    
    switch(nuevoEstadoOp) {
        case '1': tarea.estado = 'Pendiente'; break;
        case '2': tarea.estado = 'En Curso'; break;
        case '3': tarea.estado = 'Terminada'; break;
        case '4': tarea.estado = 'Cancelada'; break;
    }

    console.log(`Dificultad actual: ${tarea.dificultad}`);
    console.log("1. Fácil | 2. Medio | 3. Difícil");
    const nuevaDifOp = await preguntar("Nueva Dificultad: ");
    
    switch(nuevaDifOp) {
        case '1': tarea.dificultad = 'Fácil'; break;
        case '2': tarea.dificultad = 'Medio'; break;
        case '3': tarea.dificultad = 'Difícil'; break;
    }

    // Actualizar fecha de edición
    tarea.ultimaEdicion = new Date();

    console.log("Tarea actualizada correctamente.");
    await esperarTecla();
    await verDetallesTarea(tarea);
}

async function menuBuscarTarea() {
    limpiarConsola();
    console.log("--- BUSCAR TAREA ---");
    const termino = await preguntar("Ingrese palabra a buscar en el título: ");
    
    const resultados = buscarTareasPorTitulo(termino);
    
    if (resultados.length > 0) {
        await listarTareas(resultados);
    } else {
        console.log("No se encontraron tareas con ese criterio.");
        await esperarTecla();
        await mostrarMenuPrincipal();
    }
}

// Iniciar la aplicación
mostrarMenuPrincipal();