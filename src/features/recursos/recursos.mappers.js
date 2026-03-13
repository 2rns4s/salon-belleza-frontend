import { RECURSOS_HTTP_MESSAGES, DEFAULT_RECURSOS_ERROR_MESSAGE } from "./recursos.constants.js";

// Convierte un RecursoResponse del backend al modelo de la vista
export function mapResourceResponse(dto) {
    return {
        id: Number(dto.idRecurso),
        name: String(dto.nombre).trim(),
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
        nombre: String(formState.name ?? "").trim(),
        cantidadTotal: Number(formState.totalQuantity),
    };
}

// Construye el payload para PUT /api/v1/recursos/{id} (mismo shape que create)
export function mapUpdateResourcePayload(formState) {
    return mapCreateResourcePayload(formState);
}

// Normaliza errores HTTP a un string legible para el usuario
export function normalizeRecursosHttpError(error) {
    const status = error?.status ?? error?.response?.status;
    if (status && RECURSOS_HTTP_MESSAGES[status]) {
        return RECURSOS_HTTP_MESSAGES[status];
    }
    return error?.message || DEFAULT_RECURSOS_ERROR_MESSAGE;
}
