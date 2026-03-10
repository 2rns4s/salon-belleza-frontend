import { getAuthToken } from "../storage/authTokenStorage.js";

// URL base de la API REST (Java). Cambiar en produccion.
const URL_BASE_API = "http://localhost:8080";

function construirUrl(endpoint) {
    if (endpoint.startsWith("http")) {
        return endpoint;
    }
    return `${URL_BASE_API}${endpoint}`;
}

export async function httpClient(endpoint, opciones = {}) {
    const url = construirUrl(endpoint);

    const headers = {
        "Content-Type": "application/json",
        ...(opciones.headers || {}),
    };

    // Inyectar JWT automaticamente si hay sesion activa
    const token = getAuthToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const configuracion = {
        method: "GET",
        ...opciones,
        headers,
    };

    let respuesta;
    try {
        respuesta = await fetch(url, configuracion);
    } catch (networkError) {
        const error = new Error("NETWORK_ERROR");
        error.status = 0;
        error.data = {
            message: "No se pudo conectar con el servidor.",
            detail: networkError?.message || "Fallo de red o CORS.",
        };
        throw error;
    }

    if (!respuesta.ok) {
        const error = new Error(`HTTP ${respuesta.status}`);
        error.status = respuesta.status;
        try {
            error.data = await respuesta.json();
        } catch {
            error.data = null;
        }
        throw error;
    }

    const tipoContenido = respuesta.headers.get("content-type") || "";
    if (tipoContenido.includes("application/json")) {
        return respuesta.json();
    }

    return respuesta.text();
}
