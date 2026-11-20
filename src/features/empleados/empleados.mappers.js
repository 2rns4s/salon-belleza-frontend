import {
  EMPLEADOS_HTTP_MESSAGES,
  DEFAULT_EMPLEADOS_ERROR_MESSAGE,
} from "./empleados.constants.js";
import { createHttpErrorNormalizer } from "../../shared/mappers/httpErrorNormalizer.js";
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

// Keep form validation and both request mappings on the same text conversion.
export function normalizeEmployeeContact(form = {}) {
  return {
    firstName: toTrimmedString(form.firstName ?? form.nombre),
    lastName: toTrimmedString(form.lastName ?? form.apellido),
    email: toTrimmedString(form.email ?? form.correo),
    phone: toTrimmedString(form.phone ?? form.telefono),
  };
}

// Construye CrearEmpleadoRequest exacto para POST /api/v1/empleados
export function mapCreateEmployeePayload(formState = {}) {
  const { firstName, lastName, email, phone } = normalizeEmployeeContact(formState);
  return {
    nombre: firstName,
    apellido: lastName,
    correo: email,
    telefono: phone,
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

  const { firstName, lastName, email, phone } = normalizeEmployeeContact(formState);

  if (firstName) payload.nombre = firstName;
  if (lastName) payload.apellido = lastName;
  if (email) payload.correo = email;
  if (phone) payload.telefono = phone;

  return payload;
}

// Normaliza error HTTP con message + details[] del ErrorResponse
export const normalizeEmpleadosHttpError = createHttpErrorNormalizer({
  statusMessages: EMPLEADOS_HTTP_MESSAGES,
  defaultMessage: DEFAULT_EMPLEADOS_ERROR_MESSAGE,
  fieldErrorStatuses: [400, 409],
});