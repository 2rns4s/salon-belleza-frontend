import { extractRoleFromToken, login, verificarMfa } from "./auth.service.js";
import { renderLoadingState, renderLoginPage, renderMfaPage } from "./auth.view.js";
import { AUTH_ROLES, guardarSesion as saveSession, normalizeAuthRole } from "../../shared/state/authStore.js";
import { navegarA } from "../../shared/router/router.js";
import { normalizeHttpError as normalizeSharedHttpError } from "../../shared/mappers/httpErrorNormalizer.js";

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

function resolvePostLoginPath(normalizedRole) {
    if (normalizedRole === AUTH_ROLES.RECEPTIONIST) {
        return "/citas";
    }

    if (normalizedRole === AUTH_ROLES.OWNER) {
        return "/dashboard";
    }

    return "/dashboard";
}

function clearErrors() {
    authState.errorMessage = "";
    authState.fieldErrors = {};
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

function resolveUnauthorizedMessage(normalizedMessage, context) {
    const defaultMessage = context === AUTH_STATES.MFA
        ? "Codigo de verificacion invalido o expirado. Intenta nuevamente."
        : "Credenciales invalidas o acceso no autorizado.";

    const backendMessage = String(normalizedMessage || defaultMessage);

    if (context === AUTH_STATES.MFA && isGenericAuthMessage(backendMessage)) {
        return defaultMessage;
    }

    return backendMessage;
}

function normalizeUiError(error, context = AUTH_STATES.LOGIN) {
    const normalizedError = normalizeSharedHttpError(error, {
        statusMessages: {
            400: "Hay errores de validacion. Revisa los campos.",
            401: "Credenciales invalidas o acceso no autorizado.",
            403: "Credenciales invalidas o acceso no autorizado.",
        },
        defaultMessage: "Error inesperado del servidor. Por favor intenta mas tarde.",
        networkMessage: "No se pudo conectar con el servidor. Verifica backend y configuracion CORS.",
        resolveFallbackMessage: ({ status, fallbackMessage }) => {
            if (status >= 500) {
                return "Error interno del servidor. Intenta nuevamente.";
            }

            return fallbackMessage;
        },
    });

    if (normalizedError.status === 400) {
        return {
            errorMessage: normalizedError.message,
            fieldErrors: normalizedError.fieldErrors,
        };
    }

    if (normalizedError.status === 401 || normalizedError.status === 403) {
        return {
            errorMessage: resolveUnauthorizedMessage(normalizedError.message, context),
            fieldErrors: {},
        };
    }

    return {
        errorMessage: normalizedError.message,
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

        const extractedRole = extractRoleFromToken(responseData.token);
        const normalizedRole = normalizeAuthRole(extractedRole);

        saveSession({
            usuario: username,
            rol: normalizedRole,
            token: responseData.token,
        });

        navegarA(resolvePostLoginPath(normalizedRole));
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

        const extractedRole = extractRoleFromToken(responseData.token);
        const normalizedRole = normalizeAuthRole(extractedRole);

        saveSession({
            usuario: authState.userData.username,
            rol: normalizedRole,
            token: responseData.token,
        });

        navegarA(resolvePostLoginPath(normalizedRole));
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
