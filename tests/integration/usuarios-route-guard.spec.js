import { beforeEach, describe, expect, it, vi } from "vitest";

function encodeBase64Url(value) {
    return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createJwtWithRole(role = "OWNER", username = "owner") {
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(JSON.stringify({ rol: role, nombreUsuario: username, exp: Math.floor(Date.now() / 1000) + 3600 }));
    return `${header}.${body}.signature`;
}

describe("usuarios route guard integration", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        localStorage.clear();
        document.body.innerHTML = '<main class="app__content"></main>';
        window.appFeatureRoutes = [];
        window.location.hash = "#/usuarios";
    });

    it("USUARIOS-ACCESS-01: RECEPTIONIST es redirigido a /dashboard en acceso directo a /usuarios", async () => {
        const initUsuariosMock = vi.fn();

        vi.doMock("../../src/features/usuarios/usuarios.controller.js", () => ({
            initUsuarios: initUsuariosMock,
        }));

        const { guardarSesion, limpiarSesion } = await import("../../src/shared/state/authStore.js");
        limpiarSesion();
        guardarSesion({ usuario: "recep", rol: "RECEPTIONIST", token: createJwtWithRole("RECEPTIONIST", "recep") });

        await import("../../src/features/usuarios/usuarios.routes.js");
        const usuariosRoute = window.appFeatureRoutes.find((routeDefinition) => routeDefinition?.path === "/usuarios");

        expect(usuariosRoute).toBeTruthy();

        usuariosRoute.handler(document.querySelector(".app__content"));

        expect(window.location.hash).toBe("#/dashboard");
        expect(initUsuariosMock).not.toHaveBeenCalled();
    });

    it("USUARIOS-ACCESS-02: OWNER mantiene acceso y ejecuta initUsuarios con el contenedor de ruta", async () => {
        const initUsuariosMock = vi.fn();

        vi.doMock("../../src/features/usuarios/usuarios.controller.js", () => ({
            initUsuarios: initUsuariosMock,
        }));

        const { guardarSesion, limpiarSesion } = await import("../../src/shared/state/authStore.js");
        limpiarSesion();
        guardarSesion({ usuario: "owner", rol: "OWNER", token: createJwtWithRole("OWNER", "owner") });

        await import("../../src/features/usuarios/usuarios.routes.js");
        const usuariosRoute = window.appFeatureRoutes.find((routeDefinition) => routeDefinition?.path === "/usuarios");
        const appContent = document.querySelector(".app__content");

        expect(usuariosRoute).toBeTruthy();

        usuariosRoute.handler(appContent);

        expect(window.location.hash).toBe("#/usuarios");
        expect(initUsuariosMock).toHaveBeenCalledTimes(1);
        expect(initUsuariosMock).toHaveBeenCalledWith(appContent);
    });

    it("AUTH-REHYDRATE-E2E-01: token OWNER persistido habilita /empleados tras recarga sin redireccion", async () => {
        const initEmpleadosMock = vi.fn();

        vi.doMock("../../src/features/empleados/empleados.controller.js", () => ({
            initEmpleados: initEmpleadosMock,
        }));

        const { limpiarSesion, tieneRol } = await import("../../src/shared/state/authStore.js");
        const { setAuthToken } = await import("../../src/shared/storage/authTokenStorage.js");

        await import("../../src/features/empleados/empleados.routes.js");
        const { initializeApp } = await import("../../src/app/bootstrap.js");

        limpiarSesion();
        setAuthToken(createJwtWithRole("OWNER", "owner-reload-empleados"));

        document.body.innerHTML = '<div id="app" class="app"></div>';
        window.location.hash = "#/empleados";

        initializeApp();

        expect(tieneRol("OWNER")).toBe(true);
        expect(window.location.hash).toBe("#/empleados");
        expect(initEmpleadosMock).toHaveBeenCalledTimes(1);
    });

    it("AUTH-REHYDRATE-E2E-02: token OWNER persistido habilita /servicios tras recarga sin redireccion", async () => {
        const initServiciosMock = vi.fn();

        vi.doMock("../../src/features/servicios/servicios.controller.js", () => ({
            initServicios: initServiciosMock,
        }));

        const { limpiarSesion, tieneRol } = await import("../../src/shared/state/authStore.js");
        const { setAuthToken } = await import("../../src/shared/storage/authTokenStorage.js");

        await import("../../src/features/servicios/servicios.routes.js");
        const { initializeApp } = await import("../../src/app/bootstrap.js");

        limpiarSesion();
        setAuthToken(createJwtWithRole("OWNER", "owner-reload-servicios"));

        document.body.innerHTML = '<div id="app" class="app"></div>';
        window.location.hash = "#/servicios";

        initializeApp();

        expect(tieneRol("OWNER")).toBe(true);
        expect(window.location.hash).toBe("#/servicios");
        expect(initServiciosMock).toHaveBeenCalledTimes(1);
    });
});
