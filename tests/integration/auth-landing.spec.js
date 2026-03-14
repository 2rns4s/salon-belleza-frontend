import { beforeEach, describe, expect, it, vi } from "vitest";
import { limpiarSesion, obtenerEstadoAuth } from "../../src/shared/state/authStore.js";
import { createErrorResponseFixture } from "../fixtures/shared/error-response.fixture.js";

const loginMock = vi.fn();
const verifyMfaMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../../src/features/auth/auth.service.js", async (importOriginal) => {
    const original = await importOriginal();
    return {
        extractRoleFromToken: original.extractRoleFromToken,
        login: (...args) => loginMock(...args),
        verificarMfa: (...args) => verifyMfaMock(...args),
    };
});

vi.mock("../../src/shared/router/router.js", () => ({
    navegarA: (...args) => navigateMock(...args),
}));

function flushPromises() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

function encodeBase64Url(value) {
    return btoa(value)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function createJwtToken(payload = {}) {
    const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = encodeBase64Url(JSON.stringify(payload));
    return `${header}.${body}.signature`;
}

function bindFormField(form, fieldName, inputElement) {
    Object.defineProperty(form, fieldName, {
        value: inputElement,
        configurable: true,
    });
}

describe("auth login integration", () => {
    beforeEach(() => {
        loginMock.mockReset();
        verifyMfaMock.mockReset();
        navigateMock.mockReset();
        limpiarSesion();
        document.body.innerHTML = "";
    });

    it("AUTH-REDIRECT-01: login RECEPTIONIST sin MFA redirige a /citas", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: createJwtToken({ rol: "RECEPTIONIST" }),
            mfaRequired: false,
        });

        initAuth(container);

        container.querySelector("#username").value = "recepcion";
        container.querySelector("#password").value = "123456";

        const loginForm = container.querySelector("#login-form");
        bindFormField(loginForm, "username", container.querySelector("#username"));
        bindFormField(loginForm, "password", container.querySelector("#password"));
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        expect(loginMock).toHaveBeenCalledTimes(1);
        expect(navigateMock).toHaveBeenCalledWith("/citas");
        expect(obtenerEstadoAuth().rol).toBe("RECEPTIONIST");
    });

    it("AUTH-REDIRECT-01: login OWNER sin MFA redirige a /dashboard", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: createJwtToken({ rol: "OWNER" }),
            mfaRequired: false,
        });

        initAuth(container);

        container.querySelector("#username").value = "dueno";
        container.querySelector("#password").value = "123456";

        const loginForm = container.querySelector("#login-form");
        bindFormField(loginForm, "username", container.querySelector("#username"));
        bindFormField(loginForm, "password", container.querySelector("#password"));
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        expect(loginMock).toHaveBeenCalledTimes(1);
        expect(navigateMock).toHaveBeenCalledWith("/dashboard");
        expect(obtenerEstadoAuth().rol).toBe("OWNER");
    });

    it("AUTH-REDIRECT-01: claim alias ROLE_RECEPCIONISTA redirige a /citas", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: createJwtToken({ role: "ROLE_RECEPCIONISTA" }),
            mfaRequired: false,
        });

        initAuth(container);

        container.querySelector("#username").value = "recepcion";
        container.querySelector("#password").value = "123456";

        const loginForm = container.querySelector("#login-form");
        bindFormField(loginForm, "username", container.querySelector("#username"));
        bindFormField(loginForm, "password", container.querySelector("#password"));
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        expect(navigateMock).toHaveBeenCalledWith("/citas");
        expect(obtenerEstadoAuth().rol).toBe("RECEPTIONIST");
    });

    it("AUTH-REDIRECT-01: claim roles con ROLE_OWNER redirige a /dashboard", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: createJwtToken({ roles: ["ROLE_OWNER"] }),
            mfaRequired: false,
        });

        initAuth(container);

        container.querySelector("#username").value = "dueno";
        container.querySelector("#password").value = "123456";

        const loginForm = container.querySelector("#login-form");
        bindFormField(loginForm, "username", container.querySelector("#username"));
        bindFormField(loginForm, "password", container.querySelector("#password"));
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        expect(navigateMock).toHaveBeenCalledWith("/dashboard");
        expect(obtenerEstadoAuth().rol).toBe("OWNER");
    });

    it("AUTH-REDIRECT-01: claim authorities objeto ROLE_RECEPTIONIST redirige a /citas", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: createJwtToken({ authorities: [{ authority: "ROLE_RECEPTIONIST" }] }),
            mfaRequired: false,
        });

        initAuth(container);

        container.querySelector("#username").value = "recepcion";
        container.querySelector("#password").value = "123456";

        const loginForm = container.querySelector("#login-form");
        bindFormField(loginForm, "username", container.querySelector("#username"));
        bindFormField(loginForm, "password", container.querySelector("#password"));
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        expect(navigateMock).toHaveBeenCalledWith("/citas");
        expect(obtenerEstadoAuth().rol).toBe("RECEPTIONIST");
    });

    it("AUTH-REDIRECT-01: login MFA de RECEPTIONIST redirige a /citas", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: "pre-auth-token",
            mfaRequired: true,
        });

        verifyMfaMock.mockResolvedValue({
            token: createJwtToken({ rol: "RECEPTIONIST" }),
        });

        initAuth(container);

        container.querySelector("#username").value = "recepcion";
        container.querySelector("#password").value = "123456";

        const loginForm = container.querySelector("#login-form");
        bindFormField(loginForm, "username", container.querySelector("#username"));
        bindFormField(loginForm, "password", container.querySelector("#password"));
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        container.querySelector("#totpCode").value = "123456";
        const mfaForm = container.querySelector("#mfa-form");
        bindFormField(mfaForm, "totpCode", container.querySelector("#totpCode"));
        mfaForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        expect(verifyMfaMock).toHaveBeenCalledTimes(1);
        expect(navigateMock).toHaveBeenCalledWith("/citas");
        expect(obtenerEstadoAuth().rol).toBe("RECEPTIONIST");
    });

    it("AUTH-REDIRECT-01: token sin rol cae a /dashboard con rol null", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: createJwtToken({ sub: "user-no-role" }),
            mfaRequired: false,
        });

        initAuth(container);

        container.querySelector("#username").value = "sinrol";
        container.querySelector("#password").value = "123456";

        const loginForm = container.querySelector("#login-form");
        bindFormField(loginForm, "username", container.querySelector("#username"));
        bindFormField(loginForm, "password", container.querySelector("#password"));
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        expect(navigateMock).toHaveBeenCalledWith("/dashboard");
        expect(obtenerEstadoAuth().rol).toBeNull();
    });

    it("AUTH-REDIRECT-01: token malformado cae a /dashboard sin excepcion", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: "jwt-token",
            mfaRequired: false,
        });

        initAuth(container);

        container.querySelector("#username").value = "malformado";
        container.querySelector("#password").value = "123456";

        const loginForm = container.querySelector("#login-form");
        bindFormField(loginForm, "username", container.querySelector("#username"));
        bindFormField(loginForm, "password", container.querySelector("#password"));
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        expect(navigateMock).toHaveBeenCalledWith("/dashboard");
        expect(obtenerEstadoAuth().rol).toBeNull();
    });

    it("AUTH-ERROR-401-01: login 401 muestra mensaje de backend y no redirige", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockRejectedValue({
            status: 401,
            data: createErrorResponseFixture(401, {
                message: "Credenciales invalidas o acceso no autorizado.",
                details: ["nombreUsuario: usuario no encontrado"],
            }),
        });

        initAuth(container);

        container.querySelector("#username").value = "usuario-invalido";
        container.querySelector("#password").value = "credencial-mala";

        const loginForm = container.querySelector("#login-form");
        bindFormField(loginForm, "username", container.querySelector("#username"));
        bindFormField(loginForm, "password", container.querySelector("#password"));
        loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await flushPromises();

        const errorBanner = container.querySelector(".auth__error");
        expect(errorBanner).not.toBeNull();
        expect(errorBanner.textContent).toContain("Credenciales invalidas o acceso no autorizado");
        expect(navigateMock).not.toHaveBeenCalled();
        expect(obtenerEstadoAuth().sesionIniciada).toBe(false);
    });
});
