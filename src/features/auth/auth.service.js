import { httpClient } from "../../shared/services/httpClient.js";

// Envia credenciales al backend. Devuelve token (final o temporal) y mfaRequired.
export async function login({ nombreUsuario, contrasena }) {
    const data = await httpClient("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ nombreUsuario, contrasena }),
    });
    return data;
}

// Verifica el codigo TOTP enviando el preAuthToken recibido en el paso de login.
export async function verificarMfa({ nombreUsuario, totpCode, preAuthToken }) {
    const data = await httpClient("/api/v1/auth/verify-mfa", {
        method: "POST",
        body: JSON.stringify({ nombreUsuario, totpCode, preAuthToken }),
    });
    return data;
}
