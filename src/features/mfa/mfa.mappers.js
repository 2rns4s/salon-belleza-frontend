import { TOTP_CODE_REGEX, TOTP_CODE_MAX_LENGTH, MFA_FIELD_MESSAGES } from "./mfa.constants.js";

/**
 * Mapea la respuesta del servidor para GET /usuarios/me/mfa/setup
 * @param {Object} responseData - {secret, qrCodeUrl}
 * @returns {Object} {secret, qrCodeUrl}
 */
export function mapMfaSetupResponse(responseData) {
    if (!responseData || typeof responseData !== "object") {
        throw new Error("Respuesta inválida del servidor.");
    }

    const { secret, qrCodeUrl } = responseData;

    if (!secret || typeof secret !== "string") {
        throw new Error("El servidor no proporcionó un secret válido.");
    }

    if (!qrCodeUrl || typeof qrCodeUrl !== "string") {
        throw new Error("El servidor no proporcionó un código QR válido.");
    }

    return { secret, qrCodeUrl };
}

/**
 * Valida y mapea el payload de POST /usuarios/me/mfa/enable
 * @param {string} secret - Secret BASE32
 * @param {string} code - Código TOTP de 6 dígitos
 * @returns {Object} {secret, code} con validación
 * @throws Error si validación falla
 */
export function mapMfaEnablePayload(secret, code) {
    const fieldErrors = {};

    // Validar secret
    if (!secret || typeof secret !== "string") {
        throw new Error("Secret inválido.");
    }

    // Validar code
    if (!code) {
        fieldErrors.code = MFA_FIELD_MESSAGES.code.required;
    } else if (!TOTP_CODE_REGEX.test(String(code).trim())) {
        fieldErrors.code = MFA_FIELD_MESSAGES.code.invalid;
    }

    if (Object.keys(fieldErrors).length > 0) {
        const error = new Error("Validación de formulario fallida.");
        error.fieldErrors = fieldErrors;
        throw error;
    }

    return {
        secret: String(secret).trim(),
        code: String(code).trim(),
    };
}

/**
 * Extrae y normaliza el código de un input, validando antes de enviar
 * @param {string} rawCode - Código ingresado por usuario
 * @returns {string} Código limpio o vacío
 */
export function sanitizeTotp(rawCode) {
    if (!rawCode) {
        return "";
    }
    return String(rawCode).trim().replace(/\D/g, "").slice(0, TOTP_CODE_MAX_LENGTH);
}

/**
 * Valida si un código TOTP es válido (solo formato)
 * @param {string} code - Codigo a validar
 * @returns {boolean} true si válido
 */
export function isValidTotpFormat(code) {
    return TOTP_CODE_REGEX.test(String(code || "").trim());
}
