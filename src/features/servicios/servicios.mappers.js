import { SERVICIOS_HTTP_MESSAGES, DEFAULT_SERVICIOS_ERROR_MESSAGE } from "./servicios.constants.js";
import { normalizeHttpError as normalizeSharedHttpError } from "../../shared/mappers/httpErrorNormalizer.js";
import { toTrimmedString } from "../../shared/mappers/commonPrimitives.js";

// Convierte RecursoEnServicioResponse al modelo de la vista
function mapServiceResourceResponse(dto) {
    return {
        resourceId: Number(dto.idRecurso),
        name: toTrimmedString(dto.nombre),
        requiredQuantity: Number(dto.cantidadRequerida),
    };
}

// Convierte ServicioResponse del backend al modelo de la vista
export function mapServiceResponse(dto) {
    return {
        id: Number(dto.idServicio),
        name: toTrimmedString(dto.nombre),
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
        name: toTrimmedString(dto.nombre),
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
        nombre: toTrimmedString(formState.name),
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
    const normalizedError = normalizeSharedHttpError(error, {
        statusMessages: SERVICIOS_HTTP_MESSAGES,
        defaultMessage: DEFAULT_SERVICIOS_ERROR_MESSAGE,
        preferStatusMessage: true,
    });

    if (normalizedError.status && SERVICIOS_HTTP_MESSAGES[normalizedError.status]) {
        return SERVICIOS_HTTP_MESSAGES[normalizedError.status];
    }

    return error?.message || normalizedError.message;
}
