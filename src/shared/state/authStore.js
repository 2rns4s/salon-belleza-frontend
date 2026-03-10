import {
    clearAuthToken,
    getAuthToken,
    setAuthToken,
} from "../storage/authTokenStorage.js";

const estadoAuth = {
    sesionIniciada: false,
    usuario: null,
    rol: null,
};

// Persiste la sesion en memoria y en localStorage
export function guardarSesion({ usuario, rol, token }) {
    estadoAuth.sesionIniciada = true;
    estadoAuth.usuario = usuario;
    estadoAuth.rol = rol;
    setAuthToken(token);
}

// Limpia la sesion completamente
export function limpiarSesion() {
    estadoAuth.sesionIniciada = false;
    estadoAuth.usuario = null;
    estadoAuth.rol = null;
    clearAuthToken();
}

export function obtenerEstadoAuth() {
    return { ...estadoAuth };
}

export function tieneRol(rolRequerido) {
    return estadoAuth.rol === rolRequerido;
}

export function obtenerToken() {
    return getAuthToken();
}
