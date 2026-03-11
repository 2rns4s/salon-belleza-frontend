import { login, verificarMfa } from "./auth.service.js";
import { renderLoadingState, renderLoginPage, renderMfaPage } from "./auth.view.js";
import { guardarSesion as saveSession } from "../../shared/state/authStore.js";
import { navegarA } from "../../shared/router/router.js";

const AUTH_STATES = Object.freeze({
    LOGIN: "login",
    MFA: "mfa",
});

let domContainer = null;
let authState = createInitialState();

function createInitialState() {
    return {
        currentState: AUTH_STATES.LOGIN,
        userData: {
            username: "",
        },
        mfaToken: null,
        loading: false,
        errorMessage: "",
        fieldErrors: {},
    };
}

function clearErrors() {
    authState.errorMessage = "";
    authState.fieldErrors = {};
}

function parseFieldErrors(errorData) {
    if (!errorData || typeof errorData !== "object") {
        return null;
    }

    if (errorData.fieldErrors && typeof errorData.fieldErrors === "object") {
        return errorData.fieldErrors;
    }

    if (errorData.errors && typeof errorData.errors === "object" && !Array.isArray(errorData.errors)) {
        return errorData.errors;
    }

    if (Array.isArray(errorData.errors)) {
        const errorMap = {};

        errorData.errors.forEach((item) => {
            const fieldName = item?.field;
            const fieldMessage = item?.message || item?.defaultMessage;
            if (fieldName && fieldMessage) {
                errorMap[fieldName] = fieldMessage;
            }
        });

        return Object.keys(errorMap).length ? errorMap : null;
    }

    if (Array.isArray(errorData.details)) {
        const errorMap = {};

        errorData.details.forEach((detail) => {
            if (typeof detail !== "string") {
                return;
            }

            const [rawField, ...rawMessageParts] = detail.split(":");
            const fieldName = rawField?.trim();
            const fieldMessage = rawMessageParts.join(":").trim();

            if (fieldName && fieldMessage) {
                errorMap[fieldName] = fieldMessage;
            }
        });

        return Object.keys(errorMap).length ? errorMap : null;
    }

    return null;
}

function extractBackendMessage(errorData, fallbackMessage) {
    if (!errorData || typeof errorData !== "object") {
        return fallbackMessage;
    }

    return (
        errorData.mensaje
        || errorData.message
        || errorData.error
        || errorData.detail
        || fallbackMessage
    );
}

function isGenericAuthMessage(message) {
    const normalizedMessage = (message || "").toLowerCase();

    return (
        normalizedMessage.includes("credenciales invalid")
        || normalizedMessage.includes("acceso no autorizado")
        || normalizedMessage.includes("bad credentials")
        || normalizedMessage.includes("unauthorized")
    );
}

function resolveUnauthorizedMessage(errorData, context) {
    const defaultMessage = context === AUTH_STATES.MFA
        ? "Codigo de verificacion invalido o expirado. Intenta nuevamente."
        : "Credenciales invalidas o acceso no autorizado.";

    const backendMessage = extractBackendMessage(errorData, defaultMessage);

    if (context === AUTH_STATES.MFA && isGenericAuthMessage(backendMessage)) {
        return defaultMessage;
    }

    return backendMessage;
}

function normalizeUiError(error, context = AUTH_STATES.LOGIN) {
    if (!error || error.status === undefined || error.status === null || error.status === 0) {
        return {
            errorMessage: "No se pudo conectar con el servidor. Verifica backend y configuracion CORS.",
            fieldErrors: {},
        };
    }

    if (error.status === 400) {
        const backendFieldErrors = parseFieldErrors(error.data);
        const errorMessage = extractBackendMessage(error.data, "Hay errores de validacion. Revisa los campos.");

        return {
            errorMessage,
            fieldErrors: backendFieldErrors || {},
        };
    }

    if (error.status === 401 || error.status === 403) {
        return {
            errorMessage: resolveUnauthorizedMessage(error.data, context),
            fieldErrors: {},
        };
    }

    if (error.status >= 500) {
        return {
            errorMessage: extractBackendMessage(error.data, "Error interno del servidor. Intenta nuevamente."),
            fieldErrors: {},
        };
    }

    return {
        errorMessage: extractBackendMessage(error.data, "Error inesperado del servidor. Por favor intenta mas tarde."),
        fieldErrors: {},
    };
}

function assignContainerEvents() {
    if (!domContainer) {
        return;
    }

    // Remover listeners anteriores mediante referencias almacenadas
    if (domContainer.__submitHandler) {
        domContainer.removeEventListener("submit", domContainer.__submitHandler);
    }
    if (domContainer.__clickHandler) {
        domContainer.removeEventListener("click", domContainer.__clickHandler);
    }

    // Crear nuevos handlers (sin clonar nodo, manteniendo referencia)
    domContainer.__submitHandler = (event) => {
        const formElement = event.target;

        if (formElement.id === "login-form") {
            event.preventDefault();
            void handleLoginSubmit(formElement);
            return;
        }

        if (formElement.id === "mfa-form") {
            event.preventDefault();
            void handleMfaSubmit(formElement);
        }
    };

    domContainer.__clickHandler = (event) => {
        if (event.target?.id === "btn-back") {
            event.preventDefault();
            handleBackToLogin();
        }
    };

    domContainer.addEventListener("submit", domContainer.__submitHandler);
    domContainer.addEventListener("click", domContainer.__clickHandler);
}

function renderAuthScreen() {
    if (!domContainer) {
        return;
    }

    if (authState.loading) {
        domContainer.innerHTML = renderLoadingState({ currentState: authState.currentState });
        assignContainerEvents();
        return;
    }

    if (authState.currentState === AUTH_STATES.MFA) {
        domContainer.innerHTML = renderMfaPage({
            loading: authState.loading,
            errorMessage: authState.errorMessage,
            fieldErrors: authState.fieldErrors,
        });
        assignContainerEvents();
        return;
    }

    domContainer.innerHTML = renderLoginPage({
        loading: authState.loading,
        errorMessage: authState.errorMessage,
        fieldErrors: authState.fieldErrors,
        username: authState.userData.username,
    });
    assignContainerEvents();
}

function validateLoginInput(username, password) {
    const validationErrors = {};

    if (!username) {
        validationErrors.username = "El usuario es obligatorio.";
    }

    if (!password) {
        validationErrors.password = "La contrasena es obligatoria.";
    }

    return validationErrors;
}

function validateMfaInput(mfaCode) {
    const validationErrors = {};

    if (!/^\d{6}$/.test(mfaCode)) {
        validationErrors.totpCode = "El codigo debe tener exactamente 6 digitos numericos.";
    }

    return validationErrors;
}

async function handleLoginSubmit(formElement) {
    const formData = new FormData(formElement);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    const inputErrors = validateLoginInput(username, password);
    if (Object.keys(inputErrors).length > 0) {
        authState.loading = false;
        authState.errorMessage = "";
        authState.fieldErrors = inputErrors;
        renderAuthScreen();
        return;
    }

    authState.loading = true;
    authState.userData.username = username;
    clearErrors();
    renderAuthScreen();

    try {
        const responseData = await login(username, password);

        if (responseData?.mfaRequired) {
            authState.loading = false;
            authState.currentState = AUTH_STATES.MFA;
            authState.mfaToken = responseData?.token || null;
            clearErrors();
            renderAuthScreen();
            return;
        }

        if (!responseData?.token) {
            throw new Error("Missing token in login response");
        }

        saveSession({
            usuario: username,
            token: responseData.token,
        });

        navegarA("/dashboard");
    } catch (error) {
        authState.loading = false;
        const uiError = normalizeUiError(error, AUTH_STATES.LOGIN);
        authState.errorMessage = uiError.errorMessage;
        authState.fieldErrors = uiError.fieldErrors;
        renderAuthScreen();
    }
}

async function handleMfaSubmit(formElement) {
    const formData = new FormData(formElement);
    const mfaCode = String(formData.get("totpCode") || "").trim();

    const inputErrors = validateMfaInput(mfaCode);
    if (Object.keys(inputErrors).length > 0) {
        authState.loading = false;
        authState.errorMessage = "";
        authState.fieldErrors = inputErrors;
        renderAuthScreen();
        return;
    }

    if (!authState.mfaToken) {
        authState.currentState = AUTH_STATES.LOGIN;
        authState.errorMessage = "Tu sesion de verificacion expiro. Inicia sesion nuevamente.";
        authState.fieldErrors = {};
        authState.loading = false;
        renderAuthScreen();
        return;
    }

    authState.loading = true;
    clearErrors();
    renderAuthScreen();

    try {
        const responseData = await verificarMfa(
            authState.mfaToken,
            mfaCode,
            authState.userData.username,
        );

        if (!responseData?.token) {
            throw new Error("Missing token in MFA response");
        }

        saveSession({
            usuario: authState.userData.username,
            token: responseData.token,
        });

        navegarA("/dashboard");
    } catch (error) {
        authState.loading = false;
        const uiError = normalizeUiError(error, AUTH_STATES.MFA);
        authState.errorMessage = uiError.errorMessage;
        authState.fieldErrors = uiError.fieldErrors;
        renderAuthScreen();
    }
}

function handleBackToLogin() {
    authState.currentState = AUTH_STATES.LOGIN;
    authState.loading = false;
    authState.errorMessage = "";
    authState.fieldErrors = {};
    authState.mfaToken = null;
    renderAuthScreen();
}

// Punto de entrada del feature: recibe el nodo del DOM donde renderizar.
export function initAuth(container) {
    domContainer = container;
    authState = createInitialState();
    renderAuthScreen();
}
