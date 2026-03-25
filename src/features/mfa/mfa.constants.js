// Endpoints MFA
export const MFA_ENDPOINTS = {
    setup: "/api/v1/usuarios/me/mfa/setup",
    enable: "/api/v1/usuarios/me/mfa/enable",
};

// Estados del flujo MFA
export const MFA_SETUP_STEPS = {
    WAITING_FOR_SETUP: "waiting-setup",
    SHOWING_QR: "showing-qr",
    SETUP_ERROR: "setup-error",
    VERIFYING: "verifying",
    SUCCESS: "success",
    ERROR: "error",
};

// Validación de codigo TOTP
export const TOTP_CODE_REGEX = /^\d{6}$/;
export const TOTP_CODE_MAX_LENGTH = 6;

// Mensajes HTTP por status
export const MFA_HTTP_MESSAGES = {
    200: "Código QR generado exitosamente.",
    204: "MFA activado correctamente.",
    400: "Código inválido o expirado. Intenta de nuevo.",
    403: "Acceso denegado. Por favor, vuelve a iniciar sesión.",
    404: "Usuario no encontrado.",
    500: "Error del servidor. Por favor, intenta más tarde.",
};

// Mensajes de campo para validación cliente
export const MFA_FIELD_MESSAGES = {
    code: {
        required: "El código de 6 dígitos es requerido.",
        invalid: "El código debe contener exactamente 6 dígitos.",
    },
};
