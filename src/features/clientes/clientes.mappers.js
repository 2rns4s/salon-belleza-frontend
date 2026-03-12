import {
    CLIENTES_HTTP_MESSAGES,
    DEFAULT_CLIENTES_ERROR_MESSAGE,
} from "./clientes.constants.js";

function getFirstValue(source, keys, fallback = null) {
    for (const key of keys) {
        const value = source?.[key];

        if (value !== undefined && value !== null) {
            return value;
        }
    }

    return fallback;
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function buildFullName(firstName, lastName) {
    return [firstName, lastName]
        .map((part) => String(part || "").trim())
        .filter(Boolean)
        .join(" ")
        .trim();
}

function extractBackendMessage(errorData, fallbackMessage) {
    if (!errorData || typeof errorData !== "object") {
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

function parseFieldErrors(errorData) {
    if (!errorData || typeof errorData !== "object") {
        return {};
    }

    if (errorData.fieldErrors && typeof errorData.fieldErrors === "object") {
        return { ...errorData.fieldErrors };
    }

    if (errorData.errors && typeof errorData.errors === "object" && !Array.isArray(errorData.errors)) {
        return { ...errorData.errors };
    }

    if (Array.isArray(errorData.errors)) {
        const errorMap = {};

        errorData.errors.forEach((item) => {
            const fieldName = item?.field;
            const fieldMessage = item?.message || item?.defaultMessage;

            if (fieldName && fieldMessage) {
                errorMap[fieldName] = fieldMessage;
            }
        });

        return errorMap;
    }

    if (Array.isArray(errorData.details)) {
        const errorMap = {};

        errorData.details.forEach((detail) => {
            if (typeof detail !== "string") {
                return;
            }

            const [rawField, ...rawMessageParts] = detail.split(":");
            const fieldName = rawField?.trim();
            const fieldMessage = rawMessageParts.join(":").trim();

            if (fieldName && fieldMessage) {
                errorMap[fieldName] = fieldMessage;
            }
        });

        return errorMap;
    }

    return {};
}

function mapCreateFieldName(fieldName) {
    const normalizedField = String(fieldName || "").trim().toLowerCase();

    if (["nombre", "firstname", "first_name"].includes(normalizedField)) {
        return "firstName";
    }

    if (["apellido", "lastname", "last_name"].includes(normalizedField)) {
        return "lastName";
    }

    if (["telefono", "phone"].includes(normalizedField)) {
        return "phone";
    }

    if (["documento", "document", "documentnumber", "document_number"].includes(normalizedField)) {
        return "documentNumber";
    }

    return String(fieldName || "");
}

export function mapClientFieldErrors(fieldErrors = {}) {
    const normalizedErrors = {};

    Object.entries(fieldErrors || {}).forEach(([fieldName, message]) => {
        const normalizedFieldName = mapCreateFieldName(fieldName);

        if (normalizedFieldName) {
            normalizedErrors[normalizedFieldName] = String(message || "");
        }
    });

    return normalizedErrors;
}

export function mapClient(client = {}) {
    const firstName = String(getFirstValue(client, ["nombre", "firstName"], "")).trim();
    const lastName = String(getFirstValue(client, ["apellido", "lastName"], "")).trim();

    return {
        id: toNumber(getFirstValue(client, ["idCliente", "id", "clientId"], 0), 0),
        firstName,
        lastName,
        fullName: buildFullName(firstName, lastName),
        documentNumber: String(getFirstValue(client, ["documento", "documentNumber"], "")).trim(),
        phone: String(getFirstValue(client, ["telefono", "phone"], "")).trim(),
    };
}

export function mapClientsResponse(payload) {
    const rawItems = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.items) ? payload.items : []);

    const items = rawItems.map((client) => mapClient(client));

    return {
        items,
        total: toNumber(payload?.total, items.length),
    };
}

export function mapCreateClientPayload(clientInput = {}) {
    return {
        nombre: String(getFirstValue(clientInput, ["firstName", "nombre"], "")).trim(),
        apellido: String(getFirstValue(clientInput, ["lastName", "apellido"], "")).trim(),
        telefono: String(getFirstValue(clientInput, ["phone", "telefono"], "")).trim(),
        documento: String(getFirstValue(clientInput, ["documentNumber", "documento"], "")).trim(),
    };
}

export function normalizeClientesHttpError(error) {
    const status = Number(error?.status || 0);

    if (!status) {
        return {
            status: 0,
            message: "No se pudo conectar con el servidor. Verifica backend y CORS.",
            fieldErrors: {},
        };
    }

    const fallbackMessage = CLIENTES_HTTP_MESSAGES[status] || DEFAULT_CLIENTES_ERROR_MESSAGE;

    return {
        status,
        message: extractBackendMessage(error?.data, fallbackMessage),
        fieldErrors: parseFieldErrors(error?.data),
    };
}
