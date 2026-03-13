export const CITAS_ENDPOINTS = Object.freeze({
    appointments: "/api/v1/citas",
    availability: "/api/v1/disponibilidad",
    searchClients: "/api/v1/clientes/buscar",
    createClient: "/api/v1/clientes",
    clientById: (clientId) => `/api/v1/clientes/${clientId}`,
    services: "/api/v1/servicios",
    employees: "/api/v1/empleados",
    updateAppointmentById: (appointmentId) => `/api/v1/citas/${appointmentId}`,
    deleteAppointmentById: (appointmentId) => `/api/v1/citas/${appointmentId}`,
});

export const CITAS_HTTP_MESSAGES = Object.freeze({
    400: "Los datos enviados no son validos. Revisa la informacion e intenta nuevamente.",
    403: "No tienes permisos para consultar citas con esta sesion. Inicia sesion con un usuario autorizado.",
    404: "No se encontraron resultados para la busqueda realizada.",
    409: "El horario seleccionado ya no esta disponible. Actualiza la agenda e intenta nuevamente.",
});

export const CITAS_CACHE_KEYS = Object.freeze({
    appointments: "citas:appointments",
    availability: "citas:availability",
    clients: "citas:clients",
});

export const CITAS_VIEW_MODES = Object.freeze({
    DAY: "day",
    WEEK: "week",
});

export const APPOINTMENT_STATUSES = Object.freeze([
    "PENDIENTE",
    "CONFIRMADA",
    "CANCELADA",
    "REALIZADA",
]);

export const SLOT_GRANULARITY_MINUTES = 30;

export const CITAS_FILTER_DEBOUNCE_MS = 180;
export const CITAS_CACHE_TTL_MS = 20_000;

export const CITAS_PERFORMANCE_THRESHOLDS_MS = Object.freeze({
    agendaLoadMs: 1500,
    availabilityRefreshMs: 500,
});

export const CONFLICT_TYPES = Object.freeze({
    NONE: "NONE",
    EMPLOYEE: "EMPLOYEE",
    RESOURCE: "RESOURCE",
});

export const CITAS_UI_MESSAGES = Object.freeze({
    searchCriteriaRequired: "Ingresa al menos un criterio de busqueda: documento, telefono o nombre.",
    slotRequired: "Selecciona un horario disponible antes de confirmar la cita.",
    clientRequired: "Selecciona o crea un cliente para continuar con la reserva.",
    serviceRequired: "Debes indicar un servicio para crear la cita.",
    employeeRequired: "Debes indicar un empleado para crear la cita.",
    quickAddSuccess: "Cliente creado correctamente y listo para reservar.",
    appointmentCreated: "Cita creada correctamente.",
    appointmentUpdated: "Estado de cita actualizado correctamente.",
    appointmentDeleted: "Cita eliminada correctamente.",
});

export const DEFAULT_CITAS_ERROR_MESSAGE = "Ocurrio un error inesperado. Intenta nuevamente.";
