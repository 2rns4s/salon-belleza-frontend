import { getAuthToken } from "../storage/authTokenStorage.js";

// URL base de la API REST (Java). Cambiar en produccion.
const URL_BASE_API = "http://localhost:8080";
export const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds timeout
let unauthorizedCallback = null;
let isUnauthorizedCallbackRunning = false;

export function setUnauthorizedHandler(callback) {
    unauthorizedCallback = typeof callback === "function" ? callback : null;
}

async function runUnauthorizedHandler(errorContext) {
    if (typeof unauthorizedCallback !== "function" || isUnauthorizedCallbackRunning) {
        return;
    }

    isUnauthorizedCallbackRunning = true;

    try {
        await unauthorizedCallback(errorContext);
    } catch {
        // Evita romper el flujo del consumidor si falla el callback global.
    } finally {
        isUnauthorizedCallbackRunning = false;
    }
}

function construirUrl(endpoint) {
    if (endpoint.startsWith("http")) {
        return endpoint;
    }
    return `${URL_BASE_API}${endpoint}`;
}

export async function httpClient(endpoint, opciones = {}) {
    const { 
        skipUnauthorizedHandler = false, 
        timeoutMs = DEFAULT_TIMEOUT_MS,
        signal: externalSignal,
        ...requestOptions 
    } = opciones;
    const url = construirUrl(endpoint);

    // Create AbortController for timeout
    const abortController = new AbortController();
    let timeoutId = null;
    
    // Set up timeout if not disabled
    if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
            abortController.abort();
        }, timeoutMs);
    }

    // Merge external signal with abort controller
    const requestSignal = externalSignal
        ? AbortSignal.any([externalSignal, abortController.signal])
        : abortController.signal;

    const headers = {
        "Content-Type": "application/json",
        ...(requestOptions.headers || {}),
    };

    // Inyectar JWT automaticamente si hay sesion activa
    const token = getAuthToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const configuracion = {
        method: "GET",
        ...requestOptions,
        headers,
    };

    let respuesta;
    try {
        respuesta = await fetch(url, {
            ...configuracion,
            signal: requestSignal,
        });
    } catch (networkError) {
        // Clear timeout on successful fetch or network error
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Check if this was a timeout abort
        if (networkError.name === "AbortError") {
            const error = new Error("TIMEOUT_ERROR");
            error.status = 0;
            error.data = {
                message: `La solicitud excedió el tiempo de espera de ${timeoutMs / 1000} segundos.`,
                detail: "timeout",
            };
            throw error;
        }

        const error = new Error("NETWORK_ERROR");
        error.status = 0;
        error.data = {
            message: "No se pudo conectar con el servidor.",
            detail: networkError?.message || "Fallo de red o CORS.",
        };
        throw error;
    }

    // Clear timeout after successful response
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    if (!respuesta.ok) {
        const error = new Error(`HTTP ${respuesta.status}`);
        error.status = respuesta.status;
        try {
            error.data = await respuesta.json();
        } catch {
            error.data = null;
        }

        if ((respuesta.status === 401 || respuesta.status === 403) && !skipUnauthorizedHandler) {
            await runUnauthorizedHandler({ endpoint, error });
        }

        throw error;
    }

    const tipoContenido = respuesta.headers.get("content-type") || "";
    if (tipoContenido.includes("application/json")) {
        return respuesta.json();
    }

    return respuesta.text();
}
