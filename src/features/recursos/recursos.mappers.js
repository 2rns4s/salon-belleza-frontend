import { RECURSOS_HTTP_MESSAGES, DEFAULT_RECURSOS_ERROR_MESSAGE } from "./recursos.constants.js";
import { normalizeHttpError as normalizeSharedHttpError } from "../../shared/mappers/httpErrorNormalizer.js";
import { toTrimmedString } from "../../shared/mappers/commonPrimitives.js";

// Convierte un RecursoResponse del backend al modelo de la vista
export function mapResourceResponse(dto) {
    return {
        id: Number(dto.idRecurso),
        name: toTrimmedString(dto.nombre),
        totalQuantity: Number(dto.cantidadTotal),
    };
}

// Convierte un array de RecursoResponse
export function mapResourcesResponse(array) {
    if (!Array.isArray(array)) return [];
    return array.map(mapResourceResponse);
}

// Construye el payload para POST /api/v1/recursos
export function mapCreateResourcePayload(formState) {
    return {
        nombre: toTrimmedString(formState.name),
        cantidadTotal: Number(formState.totalQuantity),
    };
}

// Construye el payload para PUT /api/v1/recursos/{id} (mismo shape que create)
export function mapUpdateResourcePayload(formState) {
    return mapCreateResourcePayload(formState);
}

// Normaliza errores HTTP a objeto estructurado para el dashboard
export function normalizeRecursosHttpError(error) {
    const normalizedError = normalizeSharedHttpError(error, {
        statusMessages: RECURSOS_HTTP_MESSAGES,
        defaultMessage: DEFAULT_RECURSOS_ERROR_MESSAGE,
    });

    const hasFieldErrors = Object.keys(normalizedError.fieldErrors).length > 0;
    const includeFieldErrors = normalizedError.status === 400 || normalizedError.status === 409;

    return {
        status: normalizedError.status,
        code: normalizedError.code,
        message: normalizedError.message,
        details: normalizedError.details,
        fieldErrors: includeFieldErrors && hasFieldErrors ? normalizedError.fieldErrors : null,
        raw: normalizedError.raw,
    };
}
