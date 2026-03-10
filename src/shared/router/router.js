const rutas = new Map();

// Normaliza el hash de la URL a una ruta limpia
function normalizarRuta(hashActual) {
    const ruta = hashActual.replace("#", "").trim();
    return ruta || "/";
}

export function registrarRuta(ruta, renderizador) {
    rutas.set(ruta, renderizador);
}

export function navegarA(ruta) {
    window.location.hash = ruta;
}

function renderizarRutaActual() {
    const rutaActual = normalizarRuta(window.location.hash);
    const renderizador = rutas.get(rutaActual) || rutas.get("/404");

    if (typeof renderizador === "function") {
        renderizador();
    }
}

// Inicia el router escuchando cambios de hash
export function iniciarRouter() {
    window.addEventListener("hashchange", renderizarRutaActual);
    renderizarRutaActual();
}
