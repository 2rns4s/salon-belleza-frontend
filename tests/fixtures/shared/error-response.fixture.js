const DEFAULT_TIMESTAMP = "2026-03-14T13:40:00";

const STATUS_ERROR_TEXT = Object.freeze({
    400: "Bad Request",
    401: "Unauthorized",
    404: "Not Found",
    409: "Conflict",
    500: "Internal Server Error",
});

const STATUS_MESSAGE_TEXT = Object.freeze({
    400: "Error en los datos enviados",
    401: "No autenticado",
    404: "Recurso no encontrado",
    409: "Conflicto de negocio",
    500: "Error interno del servidor",
});

const STATUS_DEFAULT_DETAILS = Object.freeze({
    400: ["campo: mensaje de validacion"],
    401: ["auth: token invalido o expirado"],
    404: ["resource: no existe"],
    409: ["domain: conflicto de estado"],
    500: ["server: error inesperado"],
});

function normalizeDetails(details = []) {
    if (!Array.isArray(details)) {
        return [];
    }

    return details
        .map((detail) => String(detail || "").trim())
        .filter(Boolean);
}

export function createErrorResponseFixture(status, overrides = {}) {
    const safeStatus = Number(status) || 500;

    return {
        timestamp: overrides.timestamp || DEFAULT_TIMESTAMP,
        status: safeStatus,
        error: overrides.error || STATUS_ERROR_TEXT[safeStatus] || "Error",
        message: overrides.message || STATUS_MESSAGE_TEXT[safeStatus] || "Error",
        details: normalizeDetails(
            overrides.details !== undefined
                ? overrides.details
                : (STATUS_DEFAULT_DETAILS[safeStatus] || ["error: detalle no disponible"]),
        ),
    };
}

export const ERROR_RESPONSE_FIXTURES = Object.freeze({
    badRequest: createErrorResponseFixture(400),
    unauthorized: createErrorResponseFixture(401),
    notFound: createErrorResponseFixture(404),
    conflict: createErrorResponseFixture(409),
    serverError: createErrorResponseFixture(500),
});