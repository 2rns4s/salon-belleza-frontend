// Endpoints y constantes para el módulo de recursos
export const RECURSOS_ENDPOINTS = {
    LIST: "/api/v1/recursos",
    DETAIL: (id) => `/api/v1/recursos/${id}`,
};

export const RECURSOS_VALIDATION = {
    NOMBRE_MIN: 3,
    NOMBRE_MAX: 100,
    CANTIDAD_MIN: 1,
};

export const RECURSOS_HTTP_MESSAGES = {
    400: "Los datos del recurso no son válidos.",
    401: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    403: "No tienes permisos para realizar esta acción.",
    404: "El recurso no fue encontrado.",
    409: "Ya existe un recurso con ese nombre.",
};

export const DEFAULT_RECURSOS_ERROR_MESSAGE = "Ocurrió un error inesperado. Intenta de nuevo.";
