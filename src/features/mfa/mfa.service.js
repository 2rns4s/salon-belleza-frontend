import { httpClient } from "../../shared/services/httpClient.js";
import { MFA_ENDPOINTS } from "./mfa.constants.js";
import { mapMfaSetupResponse, mapMfaEnablePayload } from "./mfa.mappers.js";

/**
 * Solicita al backend la generacion de setup MFA (QR + secret)
 * @returns {Promise<{secret, qrCodeUrl}>} Setup data
 * @throws {Error} si la solicitud falla
 */
export async function setupMfa() {
    const responseData = await httpClient(MFA_ENDPOINTS.setup, {
        method: "GET",
    });
    return mapMfaSetupResponse(responseData);
}

/**
 * Confirma la activacion de MFA con secret y codigo TOTP
 * @param {string} secret - Secret en BASE32
 * @param {string} code - Codigo TOTP de 6 digitos
 * @returns {Promise<void>} Vacio (204 No Content)
 * @throws {Error} si la solicitud falla
 */
export async function enableMfa(secret, code) {
    const requestBody = mapMfaEnablePayload(secret, code);

    await httpClient(MFA_ENDPOINTS.enable, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });
    // 204 No Content - no hay respuesta que procesar
}
