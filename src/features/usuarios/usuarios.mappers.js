import {
  USUARIOS_HTTP_MESSAGES,
  DEFAULT_USUARIOS_ERROR_MESSAGE,
} from "./usuarios.constants.js";
import { createHttpErrorNormalizer } from "../../shared/mappers/httpErrorNormalizer.js";
import {
  getFirstValue,
  toNumber,
  buildFullName,
  toTrimmedString,
} from "../../shared/mappers/commonPrimitives.js";

// Mapea el nombre de campo del backend al nombre del campo del formulario frontend
function mapUserFieldName(fieldName) {
  const normalized = toTrimmedString(fieldName).toLowerCase();

  const fieldMap = {
    nombreusuario: "nombreUsuario",
    nombreUsuario: "nombreUsuario",
    "nombre_usuario": "nombreUsuario",
    username: "nombreUsuario",
    contrasena: "contrasena",
    contrasena: "contrasena",
    password: "contrasena",
    rol: "rol",
    role: "rol",
    idempleado: "idEmpleado",
    "id_empleado": "idEmpleado",
    employeeid: "idEmpleado",
  };

  return fieldMap[normalized] ?? fieldMap[fieldName] ?? fieldName;
}

export function mapUserFieldErrors(fieldErrors = {}) {
  const normalizedErrors = {};

  Object.entries(fieldErrors ?? {}).forEach(([fieldName, message]) => {
    const normalizedFieldName = mapUserFieldName(fieldName);
    if (normalizedFieldName) {
      normalizedErrors[normalizedFieldName] = toTrimmedString(message);
    }
  });

  return normalizedErrors;
}

export function mapUser(dto = {}) {
  return {
    id: toNumber(getFirstValue(dto, ["idUsuario", "id"], 0), 0),
    username: toTrimmedString(getFirstValue(dto, ["nombreUsuario", "username"], "")),
    role: toTrimmedString(getFirstValue(dto, ["rol", "role"], "")),
    employeeId: toNumber(getFirstValue(dto, ["idEmpleado", "employeeId"], 0), 0),
    active: Boolean(getFirstValue(dto, ["activo", "active"], false)),
    mfaEnabled: Boolean(getFirstValue(dto, ["mfaEnabled", "mfaHabilitado"], false)),
  };
}

export function mapUsersResponse(payload) {
  const rawItems = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.items) ? payload.items : []);

  return rawItems.map((dto) => mapUser(dto));
}

// Normalize text once in one definition shared by validation and request mapping.
export function normalizeUserCredentials(form = {}) {
  return {
    nombreUsuario: toTrimmedString(form.nombreUsuario),
    contrasena: toTrimmedString(form.contrasena),
    rol: toTrimmedString(form.rol),
  };
}

export function normalizeCreateUserForm(form = {}) {
  return {
    ...normalizeUserCredentials({
      nombreUsuario: getFirstValue(form, ["nombreUsuario", "username"], ""),
      contrasena: getFirstValue(form, ["contrasena", "password"], ""),
      rol: getFirstValue(form, ["rol", "role"], ""),
    }),
    idEmpleado: toNumber(getFirstValue(form, ["idEmpleado", "employeeId"], 0), 0),
  };
}

export function mapCreateUserPayload(form = {}) {
  return normalizeCreateUserForm(form);
}

export function mapUpdateUserPayload(form = {}) {
  const payload = {};
  const { nombreUsuario, contrasena, rol } = normalizeUserCredentials(form);

  if (nombreUsuario) {
    payload.nombreUsuario = nombreUsuario;
  }

  // Omit a blank password so the backend keeps the current one.
  if (contrasena) {
    payload.contrasena = contrasena;
  }

  if (rol) {
    payload.rol = rol;
  }

  // El campo activo se envía solo si viene explícitamente en el form
  if (form.activo !== undefined && form.activo !== null) {
    payload.activo = Boolean(form.activo);
  }

  return payload;
}

export function mapEmployeeCatalogItem(dto = {}) {
  const nombre = toTrimmedString(getFirstValue(dto, ["nombre", "firstName"], ""));
  const apellido = toTrimmedString(getFirstValue(dto, ["apellido", "lastName"], ""));

  return {
    id: toNumber(getFirstValue(dto, ["idEmpleado", "id"], 0), 0),
    fullName: buildFullName(nombre, apellido),
  };
}

export function mapEmployeesCatalog(payload) {
  const rawItems = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.items) ? payload.items : []);

  return rawItems.map((dto) => mapEmployeeCatalogItem(dto));
}

export const normalizeUsuariosHttpError = createHttpErrorNormalizer({
  statusMessages: USUARIOS_HTTP_MESSAGES,
  defaultMessage: DEFAULT_USUARIOS_ERROR_MESSAGE,
  networkMessage: "No se pudo conectar con el servidor. Verifica backend y CORS.",
  includeMetadata: false,
});
