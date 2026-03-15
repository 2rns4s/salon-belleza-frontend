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

function resolveUnixTimestamp(value) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function isExpiredTokenPayload(tokenPayload) {
    if (!tokenPayload || typeof tokenPayload !== "object") {
        return false;
    }

    const tokenExpiry = resolveUnixTimestamp(tokenPayload.exp);
    if (!tokenExpiry) {
        return false;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    return tokenExpiry <= currentTimestamp;
}

function decodeBase64Url(base64UrlValue) {
    const normalized = String(base64UrlValue || "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    if (!normalized) {
        return "";
    }

    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const encoded = `${normalized}${padding}`;

    if (typeof atob === "function") {
        return atob(encoded);
    }

    if (typeof Buffer !== "undefined") {
        return Buffer.from(encoded, "base64").toString("binary");
    }

    return "";
}

function decodeJwtPayload(token) {
    try {
        const tokenParts = String(token || "").split(".");
        if (tokenParts.length !== 3) {
            return null;
        }

        const binaryPayload = decodeBase64Url(tokenParts[1]);
        if (!binaryPayload) {
            return null;
        }

        const decodedPayload = decodeURIComponent(
            binaryPayload
                .split("")
                .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
                .join(""),
        );

        return JSON.parse(decodedPayload);
    } catch {
        return null;
    }
}

function sanitizeRoleValue(rawRole) {
    if (typeof rawRole !== "string") {
        return null;
    }

    const normalizedRole = rawRole.trim().toUpperCase();
    if (!normalizedRole) {
        return null;
    }

    return normalizedRole.startsWith("ROLE_") ? normalizedRole.slice(5) : normalizedRole;
}

function extractRoleFromClaim(claimValue) {
    if (typeof claimValue === "string") {
        return sanitizeRoleValue(claimValue);
    }

    if (claimValue && typeof claimValue === "object" && typeof claimValue.authority === "string") {
        return sanitizeRoleValue(claimValue.authority);
    }

    if (!Array.isArray(claimValue)) {
        return null;
    }

    for (const roleItem of claimValue) {
        if (typeof roleItem === "string") {
            const normalizedRole = sanitizeRoleValue(roleItem);
            if (normalizedRole) {
                return normalizedRole;
            }
        }

        if (roleItem && typeof roleItem === "object" && typeof roleItem.authority === "string") {
            const normalizedRole = sanitizeRoleValue(roleItem.authority);
            if (normalizedRole) {
                return normalizedRole;
            }
        }
    }

    return null;
}

function resolveRoleFromTokenPayload(tokenPayload) {
    if (!tokenPayload || typeof tokenPayload !== "object") {
        return null;
    }

    const roleClaims = [tokenPayload.rol, tokenPayload.role, tokenPayload.roles, tokenPayload.authorities];

    for (const claim of roleClaims) {
        const normalizedRole = extractRoleFromClaim(claim);
        if (normalizedRole) {
            return normalizedRole;
        }
    }

    return null;
}

function resolveUsernameFromTokenPayload(tokenPayload) {
    const usernameFromToken = String(
        tokenPayload?.nombreUsuario
            || tokenPayload?.username
            || tokenPayload?.sub
            || "",
    ).trim();

    return usernameFromToken || null;
}

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

export function rehydrateAuthSession() {
    const token = getAuthToken();

    if (!token) {
        return obtenerEstadoAuth();
    }

    const tokenPayload = decodeJwtPayload(token);
    const tokenIsMalformed = !tokenPayload;
    const tokenIsExpired = !tokenIsMalformed && isExpiredTokenPayload(tokenPayload);

    if (tokenIsMalformed || tokenIsExpired) {
        limpiarSesion();
        return obtenerEstadoAuth();
    }

    const usernameFromToken = resolveUsernameFromTokenPayload(tokenPayload);
    const roleFromToken = normalizeAuthRole(resolveRoleFromTokenPayload(tokenPayload));
    const currentUsername = String(estadoAuth.usuario || "").trim();

    estadoAuth.sesionIniciada = true;
    estadoAuth.usuario = currentUsername || usernameFromToken || null;
    estadoAuth.rol = normalizeAuthRole(estadoAuth.rol) || roleFromToken || null;

    return obtenerEstadoAuth();
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

export function resolveAuthUserContext(authStateOverride = null) {
    const authState = authStateOverride && typeof authStateOverride === "object"
        ? authStateOverride
        : estadoAuth;

    const token = getAuthToken();
    const tokenPayload = decodeJwtPayload(token);
    const hasToken = Boolean(token);
    const isTokenMalformed = hasToken && !tokenPayload;
    const isTokenExpired = hasToken && !isTokenMalformed && isExpiredTokenPayload(tokenPayload);

    const usernameFromState = String(authState?.usuario || "").trim();
    const usernameFromToken = resolveUsernameFromTokenPayload(tokenPayload) || "";

    const roleFromAuthState = normalizeAuthRole(authState?.rol);
    const roleFromToken = normalizeAuthRole(resolveRoleFromTokenPayload(tokenPayload));
    const normalizedRole = roleFromAuthState || roleFromToken;

    const hasValidToken = hasToken && !isTokenMalformed && !isTokenExpired;

    return {
        username: hasValidToken ? (usernameFromState || usernameFromToken || "Invitado") : (usernameFromState || "Invitado"),
        normalizedRole: hasValidToken ? normalizedRole : roleFromAuthState,
        hasSession: hasValidToken ? Boolean(authState?.sesionIniciada || token) : Boolean(authState?.sesionIniciada),
        isTokenExpired,
        isTokenMalformed,
    };
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
