// Endpoints y constantes para el módulo de servicios
export const SERVICIOS_ENDPOINTS = {
    LIST: "/api/v1/servicios",
    DETAIL: (id) => `/api/v1/servicios/${id}`,
    // Catálogo de recursos para poblar el selector — NO importa nada de la feature recursos
    RECURSOS_CATALOG: "/api/v1/recursos",
};

// Estados del catálogo de recursos dentro del formulario de servicios
export const RESOURCE_CATALOG_STATUS = {
    IDLE: "idle",
    LOADING: "loading",
    READY: "ready",
    EMPTY: "empty",
    ERROR: "error",
};

export const SERVICIOS_VALIDATION = {
    NOMBRE_MIN: 3,
    NOMBRE_MAX: 100,
    DURACION_MIN: 1,
};

export const SERVICIOS_HTTP_MESSAGES = {
    400: "Los datos del servicio no son válidos.",
    401: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    403: "No tienes permisos para realizar esta acción.",
    404: "El servicio no fue encontrado.",
    409: "Ya existe un servicio con ese nombre.",
};

export const DEFAULT_SERVICIOS_ERROR_MESSAGE = "Ocurrió un error inesperado. Intenta de nuevo.";
