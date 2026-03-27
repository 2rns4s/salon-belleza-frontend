import { renderMfaSetupPage } from "./mfa.view.js";
import { setupMfa, enableMfa } from "./mfa.service.js";
import { sanitizeTotp, isValidTotpFormat } from "./mfa.mappers.js";
import { MFA_SETUP_STEPS, MFA_HTTP_MESSAGES } from "./mfa.constants.js";
import { normalizeHttpError } from "../../shared/mappers/httpErrorNormalizer.js";
import { resolveAuthUserContext, guardarSesion } from "../../shared/state/authStore.js";

/**
 * Estado controlador para pantalla MFA
 */
const mfaState = {
    currentStep: MFA_SETUP_STEPS.WAITING_FOR_SETUP,
    secret: null,
    qrCodeUrl: null,
    errorMessage: "",
    fieldErrors: {},
    loading: false,
    mfaEnabled: false,
};

/**
 * Actualiza el estado y re-renderiza la vista
 */
function updateStateAndRender(container, updates = {}) {
    Object.assign(mfaState, updates);
    const html = renderMfaSetupPage(mfaState);
    container.innerHTML = html;
    attachEventListeners(container);
}

/**
 * Maneja el error usando normalizer global
 */
function handleError(error) {
    const normalized = normalizeHttpError(error, {
        statusMessages: MFA_HTTP_MESSAGES,
        defaultMessage: "Algo salió mal. Por favor intenta de nuevo.",
    });

    return {
        errorMessage: normalized.message,
        fieldErrors: normalized.fieldErrors || {},
    };
}

/**
 * Inicia el flujo de setup
 */
async function handleSetupClick(container) {
    if (mfaState.mfaEnabled) {
        updateStateAndRender(container, {
            currentStep: MFA_SETUP_STEPS.WAITING_FOR_SETUP,
            loading: false,
            errorMessage: "Tu cuenta ya tiene MFA activado.",
            fieldErrors: {},
        });
        return;
    }

    updateStateAndRender(container, {
        currentStep: MFA_SETUP_STEPS.WAITING_FOR_SETUP,
        loading: true,
        errorMessage: "",
        fieldErrors: {},
    });

    try {
        const { secret, qrCodeUrl } = await setupMfa();

        updateStateAndRender(container, {
            currentStep: MFA_SETUP_STEPS.SHOWING_QR,
            secret,
            qrCodeUrl,
            loading: false,
            errorMessage: "",
            fieldErrors: {},
        });
    } catch (error) {
        const { errorMessage } = handleError(error);
        updateStateAndRender(container, {
            currentStep: MFA_SETUP_STEPS.SETUP_ERROR,
            loading: false,
            errorMessage,
        });
    }
}

/**
 * Valida codigo antes de enabler
 */
function validateCodeInput() {
    const codeInput = document.getElementById("totpCode");
    if (!codeInput) {
        return { valid: false, sanitized: "", fieldErrors: {} };
    }

    const sanitized = sanitizeTotp(codeInput.value);
    const valid = isValidTotpFormat(sanitized);

    return {
        valid,
        sanitized,
        fieldErrors: valid ? {} : { code: "El código debe contener exactamente 6 dígitos." },
    };
}

/**
 * Maneja el envio de confirmacion (enable)
 */
async function handleEnableSubmit(container) {
    const { valid, sanitized, fieldErrors } = validateCodeInput();

    if (!valid) {
        updateStateAndRender(container, {
            currentStep: MFA_SETUP_STEPS.SHOWING_QR,
            fieldErrors,
            errorMessage: "",
        });
        return;
    }

    updateStateAndRender(container, {
        currentStep: MFA_SETUP_STEPS.SHOWING_QR,
        loading: true,
        fieldErrors: {},
        errorMessage: "",
    });

    try {
        const { token } = await enableMfa(mfaState.secret, sanitized);

        // Actualizar el token en storage y estado de auth
        if (token) {
            const userContext = resolveAuthUserContext();
            guardarSesion({
                usuario: userContext?.username,
                rol: userContext?.normalizedRole,
                token,
            });
        }

        updateStateAndRender(container, {
            currentStep: MFA_SETUP_STEPS.SUCCESS,
            loading: false,
            secret: null, // Limpiar el secret de memoria
            mfaEnabled: true,
        });
    } catch (error) {
        const { errorMessage, fieldErrors: errFields } = handleError(error);
        updateStateAndRender(container, {
            currentStep: MFA_SETUP_STEPS.ERROR,
            loading: false,
            errorMessage,
            fieldErrors: errFields,
        });
    }
}

/**
 * Cancela el flujo y vuelve al inicio
 */
function handleCancel(container) {
    updateStateAndRender(container, {
        currentStep: MFA_SETUP_STEPS.WAITING_FOR_SETUP,
        secret: null,
        qrCodeUrl: null,
        errorMessage: "",
        fieldErrors: {},
        loading: false,
    });
}

/**
 * Vuelve al inicio desde error
 */
function handleBackToStart(container) {
    mfaState.secret = null;
    mfaState.qrCodeUrl = null;
    updateStateAndRender(container, {
        currentStep: MFA_SETUP_STEPS.WAITING_FOR_SETUP,
        errorMessage: "",
        fieldErrors: {},
        loading: false,
    });
}

/**
 * Reintenta el setup o enable
 */
function handleRetry(container) {
    const { currentStep } = mfaState;

    if (currentStep === MFA_SETUP_STEPS.SETUP_ERROR) {
        handleSetupClick(container);
    } else if (currentStep === MFA_SETUP_STEPS.ERROR) {
        // Volver al QR para reintento de codigo
        updateStateAndRender(container, {
            currentStep: MFA_SETUP_STEPS.SHOWING_QR,
            errorMessage: "",
            fieldErrors: {},
        });
    }
}

/**
 * Cierra el flujo exitoso
 */
function handleDone(container) {
    // Limpiar estado y volver a inicial
    Object.assign(mfaState, {
        currentStep: MFA_SETUP_STEPS.WAITING_FOR_SETUP,
        secret: null,
        qrCodeUrl: null,
        errorMessage: "",
        fieldErrors: {},
        loading: false,
        mfaEnabled: mfaState.mfaEnabled,
    });

    // Renderizar pantalla inicial
    updateStateAndRender(container, {});
}

/**
 * Adjunta event listeners a la pantalla
 */
function attachEventListeners(container) {
    const btnSetupStart = container.querySelector("#btn-setup-start");
    if (btnSetupStart) {
        btnSetupStart.addEventListener("click", () => handleSetupClick(container));
    }

    const formEnable = container.querySelector("#mfa-enable-form");
    if (formEnable) {
        formEnable.addEventListener("submit", (e) => {
            e.preventDefault();
            handleEnableSubmit(container);
        });
    }

    const btnCancel = container.querySelector("#btn-cancel");
    if (btnCancel) {
        btnCancel.addEventListener("click", () => handleCancel(container));
    }

    const btnRetry = container.querySelector("#btn-retry");
    if (btnRetry) {
        btnRetry.addEventListener("click", () => handleRetry(container));
    }

    const btnBackToStart = container.querySelector("#btn-back-to-start");
    if (btnBackToStart) {
        btnBackToStart.addEventListener("click", () => handleBackToStart(container));
    }

    const btnDone = container.querySelector("#btn-done");
    if (btnDone) {
        btnDone.addEventListener("click", () => handleDone(container));
    }
}

/**
 * Inicializa el controlador MFA setup
 */
export function initMfaSetup(container) {
    if (!container || !(container instanceof Element)) {
        return;
    }

    const userContext = resolveAuthUserContext();

    // Resetear estado
    Object.assign(mfaState, {
        currentStep: MFA_SETUP_STEPS.WAITING_FOR_SETUP,
        secret: null,
        qrCodeUrl: null,
        errorMessage: "",
        fieldErrors: {},
        loading: false,
        mfaEnabled: Boolean(userContext?.isMfaEnabled),
    });

    updateStateAndRender(container, {});
}
