/**
 * Constantes del módulo de citas: endpoints, mensajes y umbrales.
 *
 * Trazabilidad SRS (ver docs/desarrollo/trazabilidad-requisitos.md):
 * @rnf RNF-001 agendaLoadMs=1500 — umbral de carga de la agenda integrada (<=1.5s)
 * @rnf RNF-005 availabilityRefreshMs=500 — umbral del motor de disponibilidad (<=0.5s)
 * @rnf RNF-008 CITAS_HTTP_MESSAGES[409] — mensaje de integridad ante horario ya no disponible
 * @rnf RNF-015 CITAS_HTTP_MESSAGES / CITAS_UI_MESSAGES — mensajes de error accionables en español
 * @hu HU-05, HU-06, HU-07 — validaciones de empleado/recurso reflejadas en mensajes de conflicto
 */
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

export const CITAS_FILTER_DEBOUNCE_MS = 180;
export const CITAS_SEARCH_DEBOUNCE_MS = 300;
export const CITAS_CACHE_TTL_MS = 20_000;

// @rnf RNF-001 agendaLoadMs <= 1500ms (carga de agenda integrada)
// @rnf RNF-005 availabilityRefreshMs <= 500ms (motor de búsqueda de disponibilidad)
export const CITAS_PERFORMANCE_THRESHOLDS_MS = Object.freeze({
    agendaLoadMs: 1500,
    availabilityRefreshMs: 500,
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
    pastDateError: "No se pueden agendar citas en fechas pasadas",
});

export const DEFAULT_CITAS_ERROR_MESSAGE = "Ocurrio un error inesperado. Intenta nuevamente.";
