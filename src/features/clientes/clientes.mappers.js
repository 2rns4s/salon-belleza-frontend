import {
    CLIENTES_HTTP_MESSAGES,
    DEFAULT_CLIENTES_ERROR_MESSAGE,
} from "./clientes.constants.js";
import { normalizeHttpError as normalizeSharedHttpError } from "../../shared/mappers/httpErrorNormalizer.js";
import {
    getFirstValue,
    toNumber,
    buildFullName,
} from "../../shared/mappers/commonPrimitives.js";

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
    const normalizedError = normalizeSharedHttpError(error, {
        statusMessages: CLIENTES_HTTP_MESSAGES,
        defaultMessage: DEFAULT_CLIENTES_ERROR_MESSAGE,
        networkMessage: "No se pudo conectar con el servidor. Verifica backend y CORS.",
    });

    return {
        status: normalizedError.status,
        message: normalizedError.message,
        fieldErrors: normalizedError.fieldErrors,
    };
}
