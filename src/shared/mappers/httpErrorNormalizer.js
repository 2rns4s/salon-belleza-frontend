const HTTP_ERROR_CODES = Object.freeze({
    NETWORK: "NETWORK",
    VALIDATION: "VALIDATION",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    SERVER: "SERVER",
    UNKNOWN: "UNKNOWN",
});

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toTrimmedString(value) {
    return String(value ?? "").trim();
}

function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resolveDefaultCode(status) {
    if (status === 0) {
        return HTTP_ERROR_CODES.NETWORK;
    }

    if (status === 400) {
        return HTTP_ERROR_CODES.VALIDATION;
    }

    if (status === 401) {
        return HTTP_ERROR_CODES.UNAUTHORIZED;
    }

    if (status === 403) {
        return HTTP_ERROR_CODES.FORBIDDEN;
    }

    if (status === 404) {
        return HTTP_ERROR_CODES.NOT_FOUND;
    }

    if (status === 409) {
        return HTTP_ERROR_CODES.CONFLICT;
    }

    if (status >= 500) {
        return HTTP_ERROR_CODES.SERVER;
    }

    return HTTP_ERROR_CODES.UNKNOWN;
}

function resolveFallbackMessage(status, statusMessages, defaultMessage, networkMessage) {
    if (status === 0) {
        return networkMessage;
    }

    return statusMessages[status] || defaultMessage;
}

function resolveCode(status, codeByStatus = {}, resolveCodeByStatus) {
    if (typeof resolveCodeByStatus === "function") {
        const customCode = toTrimmedString(resolveCodeByStatus(status));
        if (customCode) {
            return customCode;
        }
    }

    if (isPlainObject(codeByStatus)) {
        const explicitCode = toTrimmedString(codeByStatus[status]);
        if (explicitCode) {
            return explicitCode;
        }
    }

    return resolveDefaultCode(status);
}

export function getHttpErrorStatus(error) {
    const status = toNumber(error?.status ?? error?.response?.status, 0);
    return status > 0 ? status : 0;
}

export function getHttpErrorData(error) {
    if (error?.data !== undefined) {
        return error.data;
    }

    if (error?.response?.data !== undefined) {
        return error.response.data;
    }

    return null;
}

export function extractHttpErrorMessage(errorData, fallbackMessage) {
    if (typeof errorData === "string") {
        return errorData;
    }

    if (!isPlainObject(errorData)) {
        return fallbackMessage;
    }

    return (
        errorData.mensaje
        || errorData.message
        || errorData.error
        || errorData.detail
        || fallbackMessage
    );
}

export function extractHttpErrorDetails(errorData) {
    if (!isPlainObject(errorData)) {
        return [];
    }

    if (Array.isArray(errorData.details)) {
        return errorData.details
            .map((detail) => toTrimmedString(detail))
            .filter(Boolean);
    }

    const detailMessage = toTrimmedString(errorData.detail);
    if (detailMessage) {
        return [detailMessage];
    }

    return [];
}

export function extractHttpErrorFieldErrors(errorData) {
    if (!isPlainObject(errorData)) {
        return {};
    }

    if (isPlainObject(errorData.fieldErrors)) {
        return { ...errorData.fieldErrors };
    }

    if (isPlainObject(errorData.errors)) {
        return { ...errorData.errors };
    }

    if (Array.isArray(errorData.errors)) {
        const fieldErrors = {};

        errorData.errors.forEach((item) => {
            const fieldName = toTrimmedString(item?.field);
            const fieldMessage = toTrimmedString(item?.message || item?.defaultMessage);

            if (fieldName && fieldMessage) {
                fieldErrors[fieldName] = fieldMessage;
            }
        });

        return fieldErrors;
    }

    if (Array.isArray(errorData.details)) {
        const fieldErrors = {};

        errorData.details.forEach((detail) => {
            if (typeof detail !== "string") {
                return;
            }

            const [rawField, ...rawMessageParts] = detail.split(":");
            const fieldName = toTrimmedString(rawField);
            const fieldMessage = toTrimmedString(rawMessageParts.join(":"));

            if (fieldName && fieldMessage) {
                fieldErrors[fieldName] = fieldMessage;
            }
        });

        return fieldErrors;
    }

    return {};
}

export function normalizeHttpError(error, options = {}) {
    const statusMessages = isPlainObject(options.statusMessages) ? options.statusMessages : {};
    const defaultMessage = toTrimmedString(options.defaultMessage) || "Ocurrio un error inesperado. Intenta nuevamente.";
    const networkMessage = toTrimmedString(options.networkMessage) || "No se pudo conectar con el servidor.";
    const status = getHttpErrorStatus(error);
    const errorData = getHttpErrorData(error);

    let fallbackMessage = resolveFallbackMessage(status, statusMessages, defaultMessage, networkMessage);

    if (typeof options.resolveFallbackMessage === "function") {
        const customFallbackMessage = toTrimmedString(
            options.resolveFallbackMessage({
                status,
                error,
                errorData,
                fallbackMessage,
                statusMessages,
                defaultMessage,
                networkMessage,
            }),
        );

        if (customFallbackMessage) {
            fallbackMessage = customFallbackMessage;
        }
    }

    let message = extractHttpErrorMessage(errorData, fallbackMessage);

    if (options.preferStatusMessage && status > 0 && toTrimmedString(statusMessages[status])) {
        message = toTrimmedString(statusMessages[status]);
    }

    if (options.useErrorMessageAsFallback && message === fallbackMessage) {
        const transportErrorMessage = toTrimmedString(error?.message);
        if (transportErrorMessage) {
            message = transportErrorMessage;
        }
    }

    return {
        status,
        code: resolveCode(status, options.codeByStatus, options.resolveCodeByStatus),
        message,
        details: extractHttpErrorDetails(errorData),
        fieldErrors: extractHttpErrorFieldErrors(errorData),
        raw: error,
    };
}
