import {
    USUARIOS_HTTP_MESSAGES,
    DEFAULT_USUARIOS_ERROR_MESSAGE,
} from "./usuarios.constants.js";
import { normalizeHttpError as normalizeSharedHttpError } from "../../shared/mappers/httpErrorNormalizer.js";
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

export function mapCreateUserPayload(form = {}) {
    return {
        nombreUsuario: toTrimmedString(getFirstValue(form, ["nombreUsuario", "username"], "")),
        contrasena: toTrimmedString(getFirstValue(form, ["contrasena", "password"], "")),
        rol: toTrimmedString(getFirstValue(form, ["rol", "role"], "")),
        idEmpleado: toNumber(getFirstValue(form, ["idEmpleado", "employeeId"], 0), 0),
    };
}

export function mapUpdateUserPayload(form = {}) {
    const payload = {};

    const nombreUsuario = toTrimmedString(form.nombreUsuario ?? "");
    if (nombreUsuario) {
        payload.nombreUsuario = nombreUsuario;
    }

    // Se omite la contraseña si está vacía para no sobreescribirla en el backend
    const contrasena = toTrimmedString(form.contrasena ?? "");
    if (contrasena) {
        payload.contrasena = contrasena;
    }

    const rol = toTrimmedString(form.rol ?? "");
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

export function normalizeUsuariosHttpError(error) {
    const normalizedError = normalizeSharedHttpError(error, {
        statusMessages: USUARIOS_HTTP_MESSAGES,
        defaultMessage: DEFAULT_USUARIOS_ERROR_MESSAGE,
        networkMessage: "No se pudo conectar con el servidor. Verifica backend y CORS.",
    });

    return {
        status: normalizedError.status,
        message: normalizedError.message,
        fieldErrors: normalizedError.fieldErrors,
    };
}
