import { httpClient } from "../../shared/services/httpClient.js";

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
