// =========================================================================
// 1. VARIABLES GLOBALES DE ESTADO
// =========================================================================
let filtroActual = 'Todos';
let personajeSecretoAsignado = null;
let secretoRevelado = false;

// =========================================================================
// 2. CARGA DE DATOS PRINCIPAL (SOLICITUD AJAX)
// =========================================================================
window.solicitudAJAX = function() {
    let xhr = new XMLHttpRequest();
    
    // Este evento se dispara cada vez que cambia el estado de la petición
    xhr.onreadystatechange = function () {
        // readyState 4: Petición finalizada | status 200: Respuesta exitosa
        if (xhr.readyState == 4 && xhr.status == 200) {
            try {
                // Convertimos el texto plano del archivo txt en un objeto/array JS
                let data = JSON.parse(xhr.responseText);
                
                // Guardamos los datos en texto dentro de la memoria del navegador
                localStorage.setItem("marvelMovies", JSON.stringify(data));
                
                // Inicializamos las dos pantallas visuales con los datos recibidos
                mostrarPeliculas(data);
                inicializarTableroJuego(data);
            } catch (error) {
                console.error("Error al procesar el archivo JSON:", error);
            }
        }
    };

    // Preparamos y enviamos la petición al servidor local de forma asíncrona (true)
    xhr.open("GET", "movies.txt", true);
    xhr.send();
};

// =========================================================================
// 3. BASE DE DATOS: RENDERIZADO Y MODALES
// =========================================================================

// Función interna para dibujar las tarjetas de la sección "Explorar"
function mostrarPeliculas(listaFiltrada) {
    const contenedor = document.getElementById("ConteinerCard");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    // Si el filtro o la búsqueda no arrojan resultados
    if (listaFiltrada.length === 0) {
        contenedor.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted-custom fs-4">⚠️ Registro no encontrado en los servidores de SHIELD.</p></div>`;
        return;
    }

    // Construimos el HTML acumulando las tarjetas mediante map y join
    contenedor.innerHTML = listaFiltrada.map(personaje => `
        <div class="col d-flex justify-content-center">
            <div class="card marvel-card text-white h-100 pointer-cursor" style="width: 100%; max-width: 18rem;" onclick="abrirModal(${personaje.id})">
                <img src="${personaje.imagen_url}" class="card-img-top" alt="${personaje.titulo}">
                <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="card-title fw-bold text-danger text-uppercase mb-1">${personaje.titulo}</h5>
                        <h6 class="card-subtitle mb-3 text-muted" style="font-size: 0.85rem;">Primera Aparición: ${personaje.anio}</h6>
                    </div>
                    <div class="badge bg-dark border border-secondary w-100 py-2 mt-3">ID: ${personaje.id} | ${personaje.bando.toUpperCase()}</div>
                </div>
            </div>
        </div>
    `).join("");
}

// Función global para rellenar la ventana flotante (Modal) con los datos del personaje clickeado
window.abrirModal = function(id) {
    const marvelMovies = JSON.parse(localStorage.getItem("marvelMovies"));
    if (!marvelMovies) return;

    // Buscamos el personaje específico que coincida con el ID
    const personaje = marvelMovies.find(p => p.id === id);
    
    if (personaje) {
        // Inyectamos dinámicamente los datos en cada etiqueta del modal
        document.getElementById("modalTitulo").innerText = personaje.titulo;
        document.getElementById("modalImagen").src = personaje.imagen_url;
        document.getElementById("modalAnio").innerText = personaje.anio;
        document.getElementById("modalBando").innerText = personaje.bando.toUpperCase();
        document.getElementById("modalDesc").innerText = personaje.descripcion;
        document.getElementById("modalId").innerText = personaje.id;
        
        // Inicializamos y mostramos el componente Modal usando la librería de Bootstrap
        const myModal = new bootstrap.Modal(document.getElementById('modalHeroe'));
        myModal.show();
    }
};

// =========================================================================
// 4. LÓGICA DE BÚSQUEDA Y FILTRADO COMBINADO
// =========================================================================

window.buscar = function() {
    const textoInput = document.getElementById("nPokemon").value.toLowerCase().trim();
    const marvelMovies = JSON.parse(localStorage.getItem("marvelMovies"));
    if (!marvelMovies) return;

    // Filtramos la lista completa evaluando texto y bando a la vez
    const resultado = marvelMovies.filter(personaje => {
        const coincideTexto = (textoInput === "") || 
                              (personaje.id.toString() === textoInput) || 
                              (personaje.titulo.toLowerCase().includes(textoInput));
        
        const coincideBando = (filtroActual === 'Todos') || (personaje.bando === filtroActual);
        
        return coincideTexto && coincideBando;
    });
    
    mostrarPeliculas(resultado);
};

window.filtrarBando = function(bando, botonPresionado) {
    filtroActual = bando;
    
    // Cambiamos los estilos visuales de los botones de Bootstrap
    const botones = document.querySelectorAll('.filter-btn');
    botones.forEach(btn => {
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-outline-danger');
    });
    botonPresionado.classList.remove('btn-outline-danger');
    botonPresionado.classList.add('btn-danger');

    // Ejecutamos la búsqueda para actualizar los resultados en pantalla
    buscar();
};

window.heroeAleatorio = function() {
    const marvelMovies = JSON.parse(localStorage.getItem("marvelMovies"));
    if (!marvelMovies || marvelMovies.length === 0) return;

    const randomIndex = Math.floor(Math.random() * marvelMovies.length);
    const personajeMisterioso = marvelMovies[randomIndex];
    
    // Abre el modal del personaje seleccionado al azar
    abrirModal(personajeMisterioso.id);
};

// =========================================================================
// 5. LÓGICA DEL MINIJUEGO "ADIVINA QUIÉN"
// =========================================================================

// Genera el tablero de personajes para el juego
function inicializarTableroJuego(data) {
    const tablero = document.getElementById("tableroJuego");
    if (!tablero || !data) return;
    tablero.innerHTML = "";

    tablero.innerHTML = data.map(personaje => `
        <div class="col">
            <div class="card game-card text-white h-100 pointer-cursor text-center" id="game-card-${personaje.id}" onclick="conmutarDescarte(${personaje.id})">
                <div class="position-relative overflow-hidden card-img-wrapper">
                    <img src="${personaje.imagen_url}" class="game-card-img" alt="${personaje.titulo}">
                    <div class="game-card-overlay-abs">ELIMINADO</div>
                </div>
                <div class="p-2 bg-dark border-top border-secondary">
                    <p class="game-card-title fw-bold m-0 text-truncate text-uppercase text-danger small">${personaje.titulo}</p>
                </div>
            </div>
        </div>
    `).join("");
}

// Alterna de color/opacidad una tarjeta del tablero de juego al descartarla
window.conmutarDescarte = function(id) {
    const tarjeta = document.getElementById(`game-card-${id}`);
    if (tarjeta) {
        tarjeta.classList.toggle("character-eliminated");
    }
};

// Asigna un personaje secreto al azar de forma interna
window.generarPersonajeSecreto = function() {
    const marvelMovies = JSON.parse(localStorage.getItem("marvelMovies"));
    if (!marvelMovies || marvelMovies.length === 0) return;

    const randomIndex = Math.floor(Math.random() * marvelMovies.length);
    personajeSecretoAsignado = marvelMovies[randomIndex];
    secretoRevelado = false;
    
    actualizarVistaSecreta();
};

// Alterna el interruptor booleano para ver u ocultar la tarjeta
window.revelarOcultarSecreto = function() {
    if (!personajeSecretoAsignado) return;
    secretoRevelado = !secretoRevelado;
    actualizarVistaSecreta();
};

// Dibuja el estado visual de la tarjeta secreta según las variables
function actualizarVistaSecreta() {
    const contenedor = document.getElementById("tarjetaSecretaContainer");
    if (!contenedor) return;
    
    // Estado inicial: Sin personaje asignado
    if (!personajeSecretoAsignado) {
        contenedor.className = "game-secret-card-box empty-state";
        contenedor.innerHTML = `
            <div id="contenidoSecreto" class="text-center text-muted">
                <span class="fs-1 d-block mb-2">❓</span>
            </div>`;
        return;
    }

    // Estado 2: Personaje asignado y visible (Revelado)
    if (secretoRevelado) {
        contenedor.className = "game-secret-card-box revealed-state card text-white border-danger overflow-hidden";
        contenedor.innerHTML = `
            <img src="${personajeSecretoAsignado.imagen_url}" style="width:100%; height:180px; object-fit:cover; object-position:top;">
            <div class="bg-dark p-2 text-center border-top border-danger w-100">
                <span class="text-uppercase fw-black text-danger d-block text-truncate" style="font-size: 1.1rem;">${personajeSecretoAsignado.titulo}</span>
                <span class="badge bg-secondary style="font-size: 0.7rem;">${personajeSecretoAsignado.bando.toUpperCase()}</span>
                <span class="d-block text-muted mt-1" style="font-size: 0.75rem;">(Haz clic para ocultar)</span>
            </div>`;
    } else {
        // Estado 3: Personaje asignado pero oculto (Boca abajo)
        contenedor.className = "game-secret-card-box hidden-state text-center";
        contenedor.innerHTML = `
            <div class="text-white">
                <h4 class="fw-black text-danger text-uppercase tracking-wider m-0 mb-1" style="font-size:1.1rem;">TU PERSONAJE</h4>
                <div class="badge bg-danger mb-2">SECRETO</div>
                <p class="text-muted small m-0 px-2">(Haz clic para mirar / ocultar)</p>
            </div>`;
    }
}

// Resetea por completo las condiciones del minijuego
window.reiniciarTableroJuego = function() {
    personajeSecretoAsignado = null;
    secretoRevelado = false;
    
    actualizarVistaSecreta();
    
    // Obtenemos los datos limpios para volver a renderizar el tablero inicial
    const marvelMovies = JSON.parse(localStorage.getItem("marvelMovies"));
    if (marvelMovies) {
        inicializarTableroJuego(marvelMovies);
    }
};