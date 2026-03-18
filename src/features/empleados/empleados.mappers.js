import {
    EMPLEADOS_HTTP_MESSAGES,
    DEFAULT_EMPLEADOS_ERROR_MESSAGE,
} from "./empleados.constants.js";
import { normalizeHttpError as normalizeSharedHttpError } from "../../shared/mappers/httpErrorNormalizer.js";
import {
    toNumber,
    toTrimmedString,
    toBackendLocalTime,
    buildFullName,
} from "../../shared/mappers/commonPrimitives.js";

function mapWorkShiftResponse(dto = {}) {
    return {
        id: toNumber(dto.idFranjaLaboral),
        day: toTrimmedString(dto.dia),
        startTime: toTrimmedString(dto.horaInicio),
        endTime: toTrimmedString(dto.horaFin),
    };
}

function mapCreateWorkShiftPayload(shift = {}) {
    return {
        dia: toTrimmedString(shift.day ?? shift.dia),
        horaInicio: toBackendLocalTime(shift.startTime ?? shift.horaInicio),
        horaFin: toBackendLocalTime(shift.endTime ?? shift.horaFin),
    };
}

// Convierte EmpleadoResponse del backend al modelo de la vista
export function mapEmployeeResponse(dto = {}) {
    const firstName = toTrimmedString(dto.nombre);
    const lastName = toTrimmedString(dto.apellido);

    return {
        id: toNumber(dto.idEmpleado),
        firstName,
        lastName,
        fullName: buildFullName(firstName, lastName),
        email: toTrimmedString(dto.correo),
        phone: toTrimmedString(dto.telefono),
        workShifts: Array.isArray(dto.franjasLaborales)
            ? dto.franjasLaborales.map((shift) => mapWorkShiftResponse(shift))
            : [],
        serviceIds: Array.isArray(dto.serviciosIds)
            ? dto.serviciosIds.map((id) => toNumber(id)).filter(Number.isFinite)
            : [],
    };
}

// Convierte un array de EmpleadoResponse
export function mapEmployeesResponse(array) {
    if (!Array.isArray(array)) {
        return [];
    }

    return array.map((item) => mapEmployeeResponse(item));
}

// Convierte ServicioResponse del catalogo al modelo minimo para serviciosIds
export function mapServiceCatalogResponse(dto = {}) {
    return {
        id: toNumber(dto.idServicio),
        name: toTrimmedString(dto.nombre),
    };
}

export function mapServicesCatalogResponse(array) {
    if (!Array.isArray(array)) {
        return [];
    }

    return array
        .map((item) => mapServiceCatalogResponse(item))
        .filter((item) => item.id > 0);
}

// Construye CrearEmpleadoRequest exacto para POST /api/v1/empleados
export function mapCreateEmployeePayload(formState = {}) {
    return {
        nombre: toTrimmedString(formState.firstName ?? formState.nombre),
        apellido: toTrimmedString(formState.lastName ?? formState.apellido),
        correo: toTrimmedString(formState.email ?? formState.correo),
        telefono: toTrimmedString(formState.phone ?? formState.telefono),
        franjasLaborales: Array.isArray(formState.workShifts ?? formState.franjasLaborales)
            ? (formState.workShifts ?? formState.franjasLaborales)
                .map((shift) => mapCreateWorkShiftPayload(shift))
            : [],
        serviciosIds: Array.isArray(formState.serviceIds ?? formState.serviciosIds)
            ? (formState.serviceIds ?? formState.serviciosIds)
                .map((id) => toNumber(id))
                .filter(Number.isFinite)
            : [],
    };
}

// Construye ActualizarEmpleadoRequest parcial para PUT /api/v1/empleados/{id}
// Solo se permite enviar: nombre, apellido, correo, telefono
export function mapUpdateEmployeePayload(formState = {}) {
    const payload = {};

    const firstName = toTrimmedString(formState.firstName ?? formState.nombre);
    const lastName = toTrimmedString(formState.lastName ?? formState.apellido);
    const email = toTrimmedString(formState.email ?? formState.correo);
    const phone = toTrimmedString(formState.phone ?? formState.telefono);

    if (firstName) payload.nombre = firstName;
    if (lastName) payload.apellido = lastName;
    if (email) payload.correo = email;
    if (phone) payload.telefono = phone;

    return payload;
}

// Normaliza error HTTP con message + details[] del ErrorResponse
export function normalizeEmpleadosHttpError(error) {
    const normalizedError = normalizeSharedHttpError(error, {
        statusMessages: EMPLEADOS_HTTP_MESSAGES,
        defaultMessage: DEFAULT_EMPLEADOS_ERROR_MESSAGE,
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