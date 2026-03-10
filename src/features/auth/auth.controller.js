import { login, verificarMfa } from "./auth.service.js";
import { renderLoginForm, renderMfaForm } from "./auth.view.js";
import { guardarSesion } from "../../shared/state/authStore.js";
import { navegarA } from "../../shared/router/router.js";

// Referencia al contenedor del DOM donde se inyecta el feature
let domContainer = null;

// Estado local del flujo de autenticacion
let estado = {
    cargando: false,
    error: null,
    paso: "login",       // "login" | "mfa"
    preAuthToken: null,
    nombreUsuario: null,
};

// --- Funciones de renderizado ---

function mostrarLogin(error = null) {
    estado.paso = "login";
    estado.error = error;
    domContainer.innerHTML = renderLoginForm({ error, loading: estado.cargando });
    asignarEventosLogin();
}

function mostrarMfa(error = null) {
    estado.paso = "mfa";
    estado.error = error;
    domContainer.innerHTML = renderMfaForm({ error, loading: estado.cargando });
    asignarEventosMfa();
}

// Muestra errores de campo individuales devueltos por el backend (400)
function mostrarErroresCampo(erroresCampo) {
    if (!erroresCampo || typeof erroresCampo !== "object") return;
    Object.entries(erroresCampo).forEach(([campo, mensaje]) => {
        const spanError = domContainer.querySelector(`#error-${campo}`);
        if (spanError) {
            spanError.textContent = mensaje;
        }
    });
}

// Extrae errores por campo desde diferentes formatos de respuesta del backend
function extraerErroresCampo(errorData) {
    if (!errorData || typeof errorData !== "object") return null;

    if (errorData.fieldErrors && typeof errorData.fieldErrors === "object") {
        return errorData.fieldErrors;
    }

    if (errorData.errors && typeof errorData.errors === "object" && !Array.isArray(errorData.errors)) {
        return errorData.errors;
    }

    if (Array.isArray(errorData.errors)) {
        const fieldErrors = {};
        errorData.errors.forEach((item) => {
            const fieldName = item?.field;
            const fieldMessage = item?.message || item?.defaultMessage;
            if (fieldName && fieldMessage) {
                fieldErrors[fieldName] = fieldMessage;
            }
        });
        return Object.keys(fieldErrors).length ? fieldErrors : null;
    }

    return null;
}

// Obtiene un mensaje legible desde las posibles llaves del backend
function extraerMensajeBackend(errorData, fallback) {
    if (!errorData || typeof errorData !== "object") {
        return fallback;
    }

    return (
        errorData.mensaje ||
        errorData.message ||
        errorData.error ||
        errorData.detail ||
        fallback
    );
}

// Detecta mensajes genericos de autenticacion para reemplazarlos en el flujo MFA
function isGenericAuthMessage(message) {
    const normalizedMessage = (message || "").toLowerCase();

    return (
        normalizedMessage.includes("credenciales invalid") ||
        normalizedMessage.includes("acceso no autorizado") ||
        normalizedMessage.includes("bad credentials") ||
        normalizedMessage.includes("unauthorized")
    );
}

// Ajusta el mensaje segun el contexto del flujo de autenticacion
function resolverMensajeNoAutorizado(errorData, context) {
    const fallbackMessage = context === "mfa"
        ? "Codigo de verificacion invalido o expirado. Intenta nuevamente."
        : "Credenciales invalidas o acceso no autorizado.";

    const backendMessage = extraerMensajeBackend(errorData, fallbackMessage);

    if (context === "mfa" && isGenericAuthMessage(backendMessage)) {
        return fallbackMessage;
    }

    return backendMessage;
}

// Traduce el error HTTP a un mensaje legible para la UI
function resolverMensajeError(error, context = "login") {
    if (!error || error.status === undefined || error.status === null || error.status === 0) {
        return {
            tipo: "general",
            mensaje: "No se pudo conectar con el servidor. Verifica backend y configuracion CORS.",
        };
    }

    if (error.status === 400) {
        const erroresCampo = extraerErroresCampo(error.data);
        const mensaje = extraerMensajeBackend(error.data, "Hay errores de validacion. Revisa los campos.");

        if (erroresCampo) {
            return { tipo: "campo", data: erroresCampo, mensaje };
        }

        return { tipo: "general", mensaje };
    }

    if (error.status === 401 || error.status === 403) {
        const mensaje = resolverMensajeNoAutorizado(error.data, context);
        return { tipo: "general", mensaje };
    }

    if (error.status >= 500) {
        const mensaje = extraerMensajeBackend(error.data, "Error interno del servidor. Intenta nuevamente.");
        return { tipo: "general", mensaje };
    }

    return {
        tipo: "general",
        mensaje: extraerMensajeBackend(error.data, "Error inesperado del servidor. Por favor intenta mas tarde."),
    };
}

// --- Manejadores de formularios ---

async function handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const nombreUsuario = form.nombreUsuario.value.trim();
    const contrasena = form.contrasena.value;

    // Validaciones de UI antes de llamar al servicio
    let hayErrorUI = false;
    if (!nombreUsuario) {
        domContainer.querySelector("#error-nombreUsuario").textContent = "El usuario es obligatorio.";
        hayErrorUI = true;
    }
    if (!contrasena) {
        domContainer.querySelector("#error-contrasena").textContent = "La contrasena es obligatoria.";
        hayErrorUI = true;
    }
    if (hayErrorUI) return;

    estado.cargando = true;
    estado.nombreUsuario = nombreUsuario;

    // Mostrar estado de carga
    domContainer.innerHTML = renderLoginForm({ loading: true });
    asignarEventosLogin();

    try {
        const respuesta = await login({ nombreUsuario, contrasena });

        if (respuesta.mfaRequired) {
            // Login parcial: guardar token temporal y pasar al paso MFA
            estado.preAuthToken = respuesta.token;
            estado.cargando = false;
            mostrarMfa();
        } else {
            // Login completo: persistir sesion y navegar al dashboard
            guardarSesion({ usuario: nombreUsuario, rol: respuesta.rol || null, token: respuesta.token });
            navegarA("/dashboard");
        }
    } catch (error) {
        estado.cargando = false;
        const resultado = resolverMensajeError(error, "login");
        if (resultado.tipo === "campo" && resultado.data) {
            mostrarLogin(resultado.mensaje);
            mostrarErroresCampo(resultado.data);
        } else {
            mostrarLogin(resultado.mensaje);
        }
    }
}

async function handleMfaSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const totpCode = form.totpCode.value.trim();

    // Validar formato TOTP: exactamente 6 digitos numericos
    if (!/^\d{6}$/.test(totpCode)) {
        domContainer.querySelector("#error-totpCode").textContent =
            "El codigo debe tener exactamente 6 digitos numericos.";
        return;
    }

    estado.cargando = true;

    // Mostrar estado de carga
    domContainer.innerHTML = renderMfaForm({ loading: true });
    asignarEventosMfa();

    try {
        const respuesta = await verificarMfa({
            nombreUsuario: estado.nombreUsuario,
            totpCode,
            preAuthToken: estado.preAuthToken,
        });

        // Reemplazar token temporal por el token final de sesion autenticada
        guardarSesion({ usuario: estado.nombreUsuario, rol: respuesta.rol || null, token: respuesta.token });
        navegarA("/dashboard");
    } catch (error) {
        estado.cargando = false;
        const resultado = resolverMensajeError(error, "mfa");
        mostrarMfa(resultado.mensaje);
    }
}

// --- Asignacion de eventos (siempre despues de inyectar HTML) ---

function asignarEventosLogin() {
    const form = domContainer.querySelector("#login-form");
    if (form) {
        form.addEventListener("submit", handleLoginSubmit);
    }
}

function asignarEventosMfa() {
    const form = domContainer.querySelector("#mfa-form");
    if (form) {
        form.addEventListener("submit", handleMfaSubmit);
    }
    const btnBack = domContainer.querySelector("#btn-back");
    if (btnBack) {
        btnBack.addEventListener("click", () => {
            estado.cargando = false;
            mostrarLogin();
        });
    }
}

// Punto de entrada del feature: recibe el nodo del DOM donde renderizar
export function initAuth(container) {
    domContainer = container;
    estado = {
        cargando: false,
        error: null,
        paso: "login",
        preAuthToken: null,
        nombreUsuario: null,
    };
    mostrarLogin();
}
