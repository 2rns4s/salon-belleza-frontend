import {
    CITAS_HTTP_MESSAGES,
    DEFAULT_CITAS_ERROR_MESSAGE,
} from "./citas.constants.js";

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

function isClientLike(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return false;
    }

    return ["idCliente", "id", "clientId"].some((key) => payload[key] !== undefined && payload[key] !== null);
}

function isAppointmentLike(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return false;
    }

    return ["idCita", "id", "appointmentId"].some((key) => payload[key] !== undefined && payload[key] !== null);
}

function buildFullName(parts = []) {
    return parts
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .join(" ")
        .trim();
}

function normalizeDateTime(localDateTimeValue) {
    if (!localDateTimeValue) {
        return "";
    }

    const rawValue = String(localDateTimeValue).trim();
    if (!rawValue) {
        return "";
    }

    if (rawValue.includes("T") && rawValue.split("T")[1]?.length === 5) {
        return `${rawValue}:00`;
    }

    return rawValue;
}

function resolveDurationMinutes(appointment) {
    const explicitDuration = toNumber(getFirstValue(appointment, ["duracionMinutos", "durationMinutes"], 0), 0);
    if (explicitDuration > 0) {
        return explicitDuration;
    }

    const startDate = new Date(normalizeDateTime(getFirstValue(appointment, ["fechaInicio", "fechaHora", "startDateTime"], "")));
    const endDate = new Date(normalizeDateTime(getFirstValue(appointment, ["fechaFin", "endDateTime"], "")));

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return 0;
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    return diffMs > 0 ? Math.round(diffMs / (60 * 1000)) : 0;
}

function mapService(serviceData, appointment) {
    if (serviceData && typeof serviceData === "object") {
        const serviceId = toNumber(getFirstValue(serviceData, ["idServicio", "id", "serviceId"], 0), 0);
        const serviceName = String(getFirstValue(serviceData, ["nombre", "name"], "")).trim();

        return {
            id: serviceId,
            name: serviceName || (serviceId ? `Servicio #${serviceId}` : "Servicio no definido"),
        };
    }

    const serviceId = toNumber(getFirstValue(appointment, ["idServicio", "serviceId"], 0), 0);
    const serviceName = String(getFirstValue(appointment, ["nombreServicio", "serviceName"], "")).trim();

    return {
        id: serviceId,
        name: serviceName || (serviceId ? `Servicio #${serviceId}` : "Servicio no definido"),
    };
}

function mapEmployee(employeeData, appointment) {
    if (employeeData && typeof employeeData === "object") {
        const employeeId = toNumber(getFirstValue(employeeData, ["idEmpleado", "id", "employeeId"], 0), 0);
        const employeeName = buildFullName([
            getFirstValue(employeeData, ["nombre", "name"], ""),
            getFirstValue(employeeData, ["apellido", "lastName"], ""),
        ]) || String(getFirstValue(employeeData, ["nombreEmpleado", "employeeName"], "")).trim();

        return {
            id: employeeId,
            name: employeeName || (employeeId ? `Empleado #${employeeId}` : "Empleado no definido"),
        };
    }

    const employeeId = toNumber(getFirstValue(appointment, ["idEmpleado", "employeeId"], 0), 0);
    const employeeName = String(getFirstValue(appointment, ["nombreEmpleado", "employeeName"], "")).trim();

    return {
        id: employeeId,
        name: employeeName || (employeeId ? `Empleado #${employeeId}` : "Empleado no definido"),
    };
}

function mapClientSummary(clientData, appointment) {
    if (clientData && typeof clientData === "object") {
        const clientId = toNumber(getFirstValue(clientData, ["idCliente", "id", "clientId"], 0), 0);
        const clientName = String(getFirstValue(clientData, ["fullName", "nombreCompleto"], "")).trim() || buildFullName([
            getFirstValue(clientData, ["nombre", "firstName"], ""),
            getFirstValue(clientData, ["apellido", "lastName"], ""),
        ]);

        return {
            id: clientId,
            fullName: clientName || (clientId ? `Cliente #${clientId}` : "Cliente sin nombre"),
            phone: String(getFirstValue(clientData, ["telefono", "phone"], "")).trim(),
        };
    }

    const clientId = toNumber(getFirstValue(appointment, ["idCliente", "clientId"], 0), 0);
    const clientName = String(getFirstValue(appointment, ["nombreCliente", "clientName"], "")).trim();

    return {
        id: clientId,
        fullName: clientName || (clientId ? `Cliente #${clientId}` : "Cliente sin nombre"),
        phone: String(getFirstValue(appointment, ["telefonoCliente", "clientPhone"], "")).trim(),
    };
}

function mapResourceSummary(appointment) {
    const resources = getFirstValue(
        appointment,
        ["resourceSummary", "resumenRecursos", "recursosAsignados", "recursos"],
        [],
    );

    if (!Array.isArray(resources)) {
        return [];
    }

    return resources
        .map((item) => {
            if (typeof item === "string") {
                return item.trim();
            }

            const resourceId = toNumber(getFirstValue(item, ["idRecurso", "resourceId", "id"], 0), 0);
            const resourceName = String(getFirstValue(item, ["nombre", "name", "codigo", "code"], "")).trim();

            if (resourceName) {
                return resourceName;
            }

            return resourceId ? `Recurso #${resourceId}` : "";
        })
        .filter(Boolean);
}

// Mapea una hora individual de DisponibilidadResponse al modelo de vista.
export function mapAvailabilitySlot(fecha, hora) {
    const normalizedDate = String(fecha || "").trim();
    const normalizedTime = String(hora || "").trim();

    if (!normalizedDate || !normalizedTime) {
        return {
            slotDateTime: "",
            isSelectable: false,
        };
    }

    const safeTime = normalizedTime.length === 5 ? `${normalizedTime}:00` : normalizedTime;

    return {
        slotDateTime: `${normalizedDate}T${safeTime}`,
        isSelectable: true,
    };
}

// Mapea DisponibilidadResponse oficial y soporta payload legacy para compatibilidad de pruebas.
export function mapAvailabilityResponse(payload) {
    if (Array.isArray(payload)) {
        return payload
            .map((item) => {
                const slotDateTime = normalizeDateTime(getFirstValue(item, ["fechaHora", "slotDateTime"], ""));
                const employeeAvailable = getFirstValue(item, ["disponibilidadEmpleado", "employeeAvailable"], true) !== false;
                const resourceAvailable = getFirstValue(item, ["disponibilidadRecurso", "resourceAvailable"], true) !== false;

                return {
                    slotDateTime,
                    isSelectable: Boolean(slotDateTime && employeeAvailable && resourceAvailable),
                };
            })
            .filter((slot) => slot.slotDateTime);
    }

    if (!payload || typeof payload !== "object") {
        return [];
    }

    const fecha = String(payload.fecha || "").trim();
    const horarios = Array.isArray(payload.horariosDisponibles) ? payload.horariosDisponibles : [];

    return horarios
        .map((hora) => mapAvailabilitySlot(fecha, hora))
        .filter((slot) => slot.slotDateTime);
}

export function mapAppointment(appointment = {}) {
    const normalizedAppointment = appointment && typeof appointment === "object" ? appointment : {};

    return {
        id: toNumber(getFirstValue(normalizedAppointment, ["idCita", "id", "appointmentId"], 0), 0),
        slotDateTime: normalizeDateTime(
            getFirstValue(normalizedAppointment, ["fechaInicio", "fechaHora", "startDateTime", "slotDateTime"], ""),
        ),
        durationMinutes: resolveDurationMinutes(normalizedAppointment),
        service: mapService(getFirstValue(normalizedAppointment, ["servicio", "service"], null), normalizedAppointment),
        employee: mapEmployee(getFirstValue(normalizedAppointment, ["empleado", "employee"], null), normalizedAppointment),
        client: mapClientSummary(getFirstValue(normalizedAppointment, ["cliente", "client"], null), normalizedAppointment),
        resourceSummary: mapResourceSummary(normalizedAppointment),
        status: String(getFirstValue(normalizedAppointment, ["estado", "status"], "PENDIENTE")),
    };
}

export function mapAppointmentsResponse(payload) {
    const rawItems = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.items)
            ? payload.items
            : (isAppointmentLike(payload) ? [payload] : []));

    return rawItems.map((appointment) => mapAppointment(appointment));
}

export function mapClient(client = {}) {
    const normalizedClient = client && typeof client === "object" ? client : {};

    const firstName = String(getFirstValue(normalizedClient, ["nombre", "nombres", "firstName"], "")).trim();
    const lastName = String(getFirstValue(normalizedClient, ["apellido", "apellidos", "lastName"], "")).trim();

    return {
        id: toNumber(getFirstValue(normalizedClient, ["idCliente", "id", "clientId"], 0), 0),
        fullName: String(
            getFirstValue(normalizedClient, ["fullName", "nombreCompleto"], buildFullName([firstName, lastName])),
        ).trim(),
        documentNumber: String(getFirstValue(normalizedClient, ["documento", "documentNumber"], "")).trim(),
        phone: String(getFirstValue(normalizedClient, ["telefono", "phone"], "")).trim(),
    };
}

export function mapClientsResponse(payload) {
    const rawItems = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.items)
            ? payload.items
            : (isClientLike(payload) ? [payload] : []));

    return {
        items: rawItems.map((client) => mapClient(client)),
        total: toNumber(getFirstValue(payload, ["total"], rawItems.length), rawItems.length),
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

export function mapCreateAppointmentPayload(appointmentInput = {}) {
    return {
        idCliente: toNumber(getFirstValue(appointmentInput, ["clientId", "idCliente"], 0), 0),
        idServicio: toNumber(getFirstValue(appointmentInput, ["serviceId", "idServicio"], 0), 0),
        idEmpleado: toNumber(getFirstValue(appointmentInput, ["employeeId", "idEmpleado"], 0), 0),
        fechaInicio: normalizeDateTime(getFirstValue(appointmentInput, ["startDateTime", "fechaInicio"], "")),
    };
}

export function mapUpdateAppointmentPayload(appointmentInput = {}) {
    return {
        estado: String(getFirstValue(appointmentInput, ["status", "estado"], "")).trim().toUpperCase(),
    };
}

function extractFieldErrors(errorData) {
    if (!errorData || typeof errorData !== "object") {
        return null;
    }

    if (errorData.fieldErrors && typeof errorData.fieldErrors === "object") {
        return errorData.fieldErrors;
    }

    if (errorData.errors && typeof errorData.errors === "object" && !Array.isArray(errorData.errors)) {
        return errorData.errors;
    }

    if (Array.isArray(errorData.errors)) {
        const fieldErrors = {};

        errorData.errors.forEach((item) => {
            const fieldName = item?.field;
            const fieldMessage = item?.message || item?.defaultMessage;

            if (fieldName && fieldMessage) {
                fieldErrors[fieldName] = fieldMessage;
            }
        });

        if (Object.keys(fieldErrors).length > 0) {
            return fieldErrors;
        }
    }

    if (Array.isArray(errorData.details)) {
        const fieldErrors = {};

        errorData.details.forEach((detail) => {
            if (typeof detail !== "string") {
                return;
            }

            const [rawField, ...messageParts] = detail.split(":");
            const fieldName = rawField?.trim();
            const fieldMessage = messageParts.join(":").trim();

            if (fieldName && fieldMessage) {
                fieldErrors[fieldName] = fieldMessage;
            }
        });

        if (Object.keys(fieldErrors).length > 0) {
            return fieldErrors;
        }
    }

    return null;
}

function resolveErrorMessage(errorData, fallbackMessage) {
    if (typeof errorData === "string") {
        return errorData;
    }

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

export function normalizeHttpError(error) {
    const status = toNumber(error?.status, 0);
    const errorData = error?.data;

    if (status === 0) {
        return {
            status,
            code: "NETWORK",
            message: "No se pudo conectar con el servidor.",
            fieldErrors: null,
            raw: error,
        };
    }

    if (status === 400) {
        return {
            status,
            code: "VALIDATION",
            message: resolveErrorMessage(errorData, CITAS_HTTP_MESSAGES[400]),
            fieldErrors: extractFieldErrors(errorData),
            raw: error,
        };
    }

    if (status === 401) {
        return {
            status,
            code: "UNAUTHORIZED",
            message: resolveErrorMessage(errorData, "Tu sesion expiro. Inicia sesion nuevamente."),
            fieldErrors: null,
            raw: error,
        };
    }

    if (status === 403) {
        return {
            status,
            code: "FORBIDDEN",
            message: resolveErrorMessage(errorData, CITAS_HTTP_MESSAGES[403]),
            fieldErrors: null,
            raw: error,
        };
    }

    if (status === 404) {
        return {
            status,
            code: "NOT_FOUND",
            message: resolveErrorMessage(errorData, CITAS_HTTP_MESSAGES[404]),
            fieldErrors: null,
            raw: error,
        };
    }

    if (status === 409) {
        return {
            status,
            code: "CONFLICT",
            message: resolveErrorMessage(errorData, CITAS_HTTP_MESSAGES[409]),
            fieldErrors: extractFieldErrors(errorData),
            raw: error,
        };
    }

    if (status >= 500) {
        return {
            status,
            code: "SERVER",
            message: resolveErrorMessage(errorData, "Ocurrio un error interno del servidor."),
            fieldErrors: null,
            raw: error,
        };
    }

    return {
        status,
        code: "UNKNOWN",
        message: resolveErrorMessage(errorData, DEFAULT_CITAS_ERROR_MESSAGE),
        fieldErrors: null,
        raw: error,
    };
}
