import { httpClient } from "../../shared/services/httpClient.js";

function decodeBase64Url(base64UrlValue) {
    const normalizedBase64 = String(base64UrlValue || "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    if (!normalizedBase64) {
        return "";
    }

    const padding = "=".repeat((4 - (normalizedBase64.length % 4)) % 4);
    const encodedValue = `${normalizedBase64}${padding}`;

    if (typeof atob === "function") {
        return atob(encodedValue);
    }

    if (typeof Buffer !== "undefined") {
        return Buffer.from(encodedValue, "base64").toString("binary");
    }

    return "";
}

function decodeJwtPayload(token) {
    try {
        if (!token || typeof token !== "string") {
            return null;
        }

        const tokenParts = token.split(".");
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

function sanitizeRoleValue(rawValue) {
    if (typeof rawValue !== "string") {
        return null;
    }

    const normalizedValue = rawValue.trim().toUpperCase();
    if (!normalizedValue) {
        return null;
    }

    return normalizedValue.startsWith("ROLE_") ? normalizedValue.slice(5) : normalizedValue;
}

function normalizeRoleClaim(claimValue) {
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

function resolveRoleFromPayload(payload) {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const roleClaims = [payload.rol, payload.role, payload.roles, payload.authorities];

    for (const claim of roleClaims) {
        const normalizedRole = normalizeRoleClaim(claim);
        if (normalizedRole) {
            return normalizedRole;
        }
    }

    return null;
}

// Decodifica el payload base64url del JWT y extrae el campo rol.
export function extractRoleFromToken(token) {
    const payload = decodeJwtPayload(token);
    return resolveRoleFromPayload(payload);
}

// Envia credenciales al backend y retorna LoginResponse.
export async function login(username, password) {
    const requestBody = {
        nombreUsuario: username,
        contrasena: password,
    };

    const responseData = await httpClient("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    return responseData;
}

// Verifica el codigo TOTP para completar el flujo MFA.
export async function verificarMfa(mfaToken, mfaCode, username = null) {
    const requestBody = {
        preAuthToken: mfaToken,
        totpCode: mfaCode,
    };

    if (username) {
        requestBody.nombreUsuario = username;
    }

    const responseData = await httpClient("/api/v1/auth/verify-mfa", {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    return responseData;
}

// Registra un empleado pre-registrado con credenciales.
export async function employeeSignUp(email, username, password) {
    const requestBody = {
        email,
        username,
        password,
    };

    const responseData = await httpClient("/api/v1/auth/employee-signup", {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    return responseData;
}
