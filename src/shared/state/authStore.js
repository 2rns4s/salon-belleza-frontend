const AUTH_TOKEN_KEY = "auth_token";

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
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

// Limpia la sesion completamente
export function limpiarSesion() {
    estadoAuth.sesionIniciada = false;
    estadoAuth.usuario = null;
    estadoAuth.rol = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function obtenerEstadoAuth() {
    return { ...estadoAuth };
}

export function tieneRol(rolRequerido) {
    return estadoAuth.rol === rolRequerido;
}

export function obtenerToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}
