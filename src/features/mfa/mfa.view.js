import { MFA_SETUP_STEPS } from "./mfa.constants.js";

// Escape HTML para prevenir XSS
function escapeHtml(rawValue) {
    return String(rawValue ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function renderGlobalError(errorMessage) {
    if (!errorMessage) {
        return "";
    }
    return `<p class="mfa__error-global" role="alert">${escapeHtml(errorMessage)}</p>`;
}

function renderFieldError(message) {
    if (!message) {
        return "";
    }
    return `<span class="mfa__field-error">${escapeHtml(message)}</span>`;
}

/**
 * Pantalla inicial: boton para iniciar setup
 */
export function renderInitialStep({ mfaEnabled = false, errorMessage = "" } = {}) {
    if (mfaEnabled) {
        return `
            <section class="mfa">
                <div class="mfa__card mfa__card--success">
                    <h2 class="mfa__title">MFA ya está activado</h2>
                    <p class="mfa__description">
                        Tu cuenta ya tiene verificación en dos pasos habilitada.
                    </p>
                </div>
            </section>
        `;
    }

    return `
        <section class="mfa">
            <div class="mfa__card">
                <h2 class="mfa__title">Activación de MFA</h2>
                <p class="mfa__description">
                    Protege tu cuenta habilitando autenticación en dos pasos con una app autenticadora.
                </p>
                ${renderGlobalError(errorMessage)}
                <button class="mfa__btn mfa__btn--primary" id="btn-setup-start">
                    Activar MFA
                </button>
            </div>
        </section>
    `;
}

/**
 * Estado de carga durante setup
 */
export function renderLoadingSetup() {
    return `
        <section class="mfa">
            <div class="mfa__card">
                <h2 class="mfa__title">Generando QR...</h2>
                <p class="mfa__description">Por favor espera mientras se genera tu código QR.</p>
            </div>
        </section>
    `;
}

/**
 * Pantalla QR + input de confirmacion codigo
 */
export function renderQrStep(
    { qrCodeUrl = "", errorMessage = "", fieldErrors = {} } = {},
) {
    return `
        <section class="mfa">
            <div class="mfa__card">
                <h2 class="mfa__title">Escanea el código QR</h2>
                <p class="mfa__description">
                    Abre tu app autenticadora (Google Authenticator, Microsoft Authenticator, etc) y escanea el código QR.
                </p>
                
                <div class="mfa__step">
                    <h3 class="mfa__step-title">Paso 1: Escanear QR</h3>
                    ${qrCodeUrl ? `<img class="mfa__qr-image" src="${escapeHtml(qrCodeUrl)}" alt="Código QR para MFA" />` : ""}
                </div>

                <div class="mfa__step">
                    <h3 class="mfa__step-title">Paso 2: Confirmar código</h3>
                    ${renderGlobalError(errorMessage)}
                    
                    <form class="mfa__form" id="mfa-enable-form" novalidate>
                        <div class="mfa__field">
                            <label class="mfa__label" for="totpCode">
                                Ingresa el código de 6 dígitos:
                            </label>
                            <input
                                class="mfa__input mfa__input--totp"
                                type="text"
                                id="totpCode"
                                name="totpCode"
                                inputmode="numeric"
                                pattern="[0-9]{6}"
                                maxlength="6"
                                placeholder="000000"
                                autocomplete="one-time-code"
                                required
                            />
                            ${renderFieldError(fieldErrors.code)}
                        </div>

                        <button class="mfa__btn mfa__btn--primary" type="submit" id="btn-enable-submit">
                            Confirmar y activar MFA
                        </button>
                        <button class="mfa__btn mfa__btn--secondary" type="button" id="btn-cancel">
                            Cancelar
                        </button>
                    </form>
                </div>
            </div>
        </section>
    `;
}

/**
 * Pantalla de éxito
 */
export function renderSuccessStep() {
    return `
        <section class="mfa">
            <div class="mfa__card mfa__card--success">
                <h2 class="mfa__title">✓ MFA Activado</h2>
                <p class="mfa__description">
                    Tu cuenta está ahora protegida con autenticación en dos pasos.
                    En tu próximo inicio de sesión, se te pedirá el código de tu app autenticadora.
                </p>
                <button class="mfa__btn mfa__btn--primary" id="btn-done">
                    Entendido
                </button>
            </div>
        </section>
    `;
}

/**
 * Pantalla de error durante setup o enable
 */
export function renderErrorStep({ errorMessage = "", stepName = "setup" } = {}) {
    return `
        <section class="mfa">
            <div class="mfa__card mfa__card--error">
                <h2 class="mfa__title">Error</h2>
                ${renderGlobalError(errorMessage)}
                <p class="mfa__description">
                    ${stepName === "setup" ? "No se pudo generar el código QR. Por favor intenta de nuevo." : "Hubo un problema al activar MFA. Por favor intenta de nuevo."}
                </p>
                <button class="mfa__btn mfa__btn--primary" id="btn-retry">
                    Intentar de nuevo
                </button>
                <button class="mfa__btn mfa__btn--secondary" id="btn-back-to-start">
                    Volver
                </button>
            </div>
        </section>
    `;
}

/**
 * Renderiza toda la pantalla MFA segun el estado actual
 */
export function renderMfaSetupPage({
    currentStep = MFA_SETUP_STEPS.WAITING_FOR_SETUP,
    qrCodeUrl = "",
    errorMessage = "",
    fieldErrors = {},
    loading = false,
    mfaEnabled = false,
} = {}) {
    if (loading && currentStep === MFA_SETUP_STEPS.WAITING_FOR_SETUP) {
        return renderLoadingSetup();
    }

    switch (currentStep) {
        case MFA_SETUP_STEPS.WAITING_FOR_SETUP:
            return renderInitialStep({ mfaEnabled, errorMessage });

        case MFA_SETUP_STEPS.SHOWING_QR:
            return renderQrStep({ qrCodeUrl, errorMessage, fieldErrors });

        case MFA_SETUP_STEPS.SETUP_ERROR:
            return renderErrorStep({ errorMessage, stepName: "setup" });

        case MFA_SETUP_STEPS.SUCCESS:
            return renderSuccessStep();

        case MFA_SETUP_STEPS.ERROR:
            return renderErrorStep({ errorMessage, stepName: "enable" });

        default:
            return renderInitialStep({ mfaEnabled, errorMessage });
    }
}
