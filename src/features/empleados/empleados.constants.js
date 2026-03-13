// Endpoints y constantes para el modulo de empleados
export const EMPLEADOS_ENDPOINTS = {
    LIST: "/api/v1/empleados",
    DETAIL: (id) => `/api/v1/empleados/${id}`,
    // Catalogo silencioso para poblar serviciosIds sin acoplar otras features
    SERVICES_CATALOG: "/api/v1/servicios",
};

// Estados del catalogo de servicios para el formulario de empleados
export const EMPLEADOS_CATALOG_STATUS = {
    IDLE: "idle",
    LOADING: "loading",
    READY: "ready",
    EMPTY: "empty",
    ERROR: "error",
};

export const EMPLEADOS_VALIDATION = {
    NAME_MIN: 2,
    NAME_MAX: 100,
    PHONE_PATTERN: /^3\d{9}$/,
};

export const EMPLEADOS_HTTP_MESSAGES = {
    400: "Los datos del empleado no son validos.",
    401: "Tu sesion ha expirado. Inicia sesion nuevamente.",
    403: "No tienes permisos para realizar esta accion.",
    404: "El empleado no fue encontrado.",
    409: "Ya existe un empleado con ese correo o telefono.",
};

export const DEFAULT_EMPLEADOS_ERROR_MESSAGE = "Ocurrio un error inesperado. Intenta de nuevo.";