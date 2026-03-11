import {
    clearAuthToken,
    getAuthToken,
    setAuthToken,
} from "../storage/authTokenStorage.js";

export const AUTH_ROLES = Object.freeze({
    OWNER: "OWNER",
    RECEPTIONIST: "RECEPTIONIST",
});

const ROLE_ALIASES = Object.freeze({
    [AUTH_ROLES.OWNER]: ["OWNER", "ADMIN", "DUENO", "DUEÑO", "ROLE_OWNER", "ROLE_ADMIN"],
    [AUTH_ROLES.RECEPTIONIST]: ["RECEPTIONIST", "RECEPCIONISTA", "ROLE_RECEPTIONIST", "ROLE_RECEPCIONISTA"],
});

export function normalizeAuthRole(rawRole) {
    const normalizedRole = typeof rawRole === "string" ? rawRole.trim().toUpperCase() : "";

    if (ROLE_ALIASES[AUTH_ROLES.RECEPTIONIST].includes(normalizedRole)) {
        return AUTH_ROLES.RECEPTIONIST;
    }

    if (ROLE_ALIASES[AUTH_ROLES.OWNER].includes(normalizedRole)) {
        return AUTH_ROLES.OWNER;
    }

    return null;
}

export function resolveLandingPathByRole(rawRole) {
    const normalizedRole = normalizeAuthRole(rawRole);
    return normalizedRole === AUTH_ROLES.RECEPTIONIST ? "/citas" : "/dashboard";
}

const estadoAuth = {
    sesionIniciada: false,
    usuario: null,
    rol: null,
};

// Persiste la sesion en memoria y en localStorage
export function guardarSesion({ usuario, rol = null, token }) {
    estadoAuth.sesionIniciada = true;
    estadoAuth.usuario = usuario;
    estadoAuth.rol = normalizeAuthRole(rol);
    setAuthToken(token);
}

// Limpia la sesion completamente
export function limpiarSesion() {
    estadoAuth.sesionIniciada = false;
    estadoAuth.usuario = null;
    estadoAuth.rol = null;
    clearAuthToken();
}

export function obtenerEstadoAuth() {
    return { ...estadoAuth };
}

export function tieneRol(rolRequerido) {
    const normalizedRequiredRole = normalizeAuthRole(rolRequerido);
    if (!normalizedRequiredRole) {
        return false;
    }

    return estadoAuth.rol === normalizedRequiredRole;
}

export function obtenerToken() {
    return getAuthToken();
}
