export const USUARIOS_ENDPOINTS = Object.freeze({
    users: "/api/v1/usuarios",
    userById: (id) => `/api/v1/usuarios/${id}`,
    employees: "/api/v1/empleados",
});

export const USUARIOS_VALIDATION_RULES = Object.freeze({
    usernameMin: 4,
    usernameMax: 50,
    passwordMin: 8,
    passwordMax: 100,
    roles: ["OWNER", "RECEPTIONIST"],
});

export const USUARIOS_HTTP_MESSAGES = Object.freeze({
    400: "Datos inválidos. Revise los campos.",
    401: "No autorizado.",
    403: "Acceso denegado.",
    404: "Usuario no encontrado.",
    409: "El nombre de usuario o empleado ya está en uso.",
    500: "Error interno del servidor.",
});

export const USUARIOS_CATALOG_STATUS = Object.freeze({
    IDLE: "idle",
    LOADING: "loading",
    READY: "ready",
    EMPTY: "empty",
    ERROR: "error",
});

export const USUARIOS_UI_MESSAGES = Object.freeze({
    title: "Usuarios",
    subtitle: "Gestión de usuarios del sistema",
    emptyList: "No hay usuarios registrados.",
    createSuccess: "Usuario creado exitosamente.",
    updateSuccess: "Usuario actualizado exitosamente.",
    deactivateSuccess: "Usuario desactivado exitosamente.",
    defaultError: "Ocurrió un error inesperado.",
    deactivateConfirm: (name) => `¿Confirma que desea desactivar al usuario "${name}"?`,
    noEmployees: "No hay empleados disponibles para asignar.",
    loadingEmployees: "Cargando empleados...",
    localValidation: "Corrige los campos marcados antes de continuar.",
});

export const DEFAULT_USUARIOS_ERROR_MESSAGE = "No fue posible completar la operación. Intenta nuevamente.";
