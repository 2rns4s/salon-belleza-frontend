import { SERVICIOS_HTTP_MESSAGES, DEFAULT_SERVICIOS_ERROR_MESSAGE } from "./servicios.constants.js";

// Convierte RecursoEnServicioResponse al modelo de la vista
function mapServiceResourceResponse(dto) {
    return {
        resourceId: Number(dto.idRecurso),
        name: String(dto.nombre).trim(),
        requiredQuantity: Number(dto.cantidadRequerida),
    };
}

// Convierte ServicioResponse del backend al modelo de la vista
export function mapServiceResponse(dto) {
    return {
        id: Number(dto.idServicio),
        name: String(dto.nombre).trim(),
        duration: Number(dto.duracion),
        resources: Array.isArray(dto.recursos) ? dto.recursos.map(mapServiceResourceResponse) : [],
    };
}

// Convierte un array de ServicioResponse
export function mapServicesResponse(array) {
    if (!Array.isArray(array)) return [];
    return array.map(mapServiceResponse);
}

// Convierte RecursoResponse del catálogo al modelo mínimo para el selector
export function mapCatalogResourceResponse(dto) {
    return {
        id: Number(dto.idRecurso),
        name: String(dto.nombre).trim(),
    };
}

export function mapCatalogResourcesResponse(array) {
    if (!Array.isArray(array)) return [];
    return array.map(mapCatalogResourceResponse);
}

// Construye CrearServicioRequest para POST /api/v1/servicios
// formState.requiredResources = [{ rowId, resourceId, quantity }] — rowId es id local, NO se envía
export function mapCreateServicePayload(formState) {
    return {
        nombre: String(formState.name ?? "").trim(),
        duracion: Number(formState.duration),
        recursos: (formState.requiredResources ?? []).map((row) => ({
            idRecurso: Number(row.resourceId),
            cantidadRequerida: Number(row.quantity),
        })),
    };
}

// Construye ActualizarServicioRequest para PUT /api/v1/servicios/{id} (mismo shape)
export function mapUpdateServicePayload(formState) {
    return mapCreateServicePayload(formState);
}

// Normaliza errores HTTP a un string legible para el usuario
export function normalizeServiciosHttpError(error) {
    const status = error?.status ?? error?.response?.status;
    if (status && SERVICIOS_HTTP_MESSAGES[status]) {
        return SERVICIOS_HTTP_MESSAGES[status];
    }
    return error?.message || DEFAULT_SERVICIOS_ERROR_MESSAGE;
}
