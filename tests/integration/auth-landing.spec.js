import { beforeEach, describe, expect, it, vi } from "vitest";

const loginMock = vi.fn();
const verifyMfaMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../../src/features/auth/auth.service.js", () => ({
    login: (...args) => loginMock(...args),
    verificarMfa: (...args) => verifyMfaMock(...args),
}));

vi.mock("../../src/shared/router/router.js", () => ({
    navegarA: (...args) => navigateMock(...args),
}));

function flushPromises() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
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
    });

    it("redirects to /dashboard after successful login without MFA", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: "jwt-token",
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
        expect(navigateMock).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects to /dashboard after successful MFA verification", async () => {
        const { initAuth } = await import("../../src/features/auth/auth.controller.js");
        const container = document.createElement("section");
        document.body.appendChild(container);

        loginMock.mockResolvedValue({
            token: "pre-auth-token",
            mfaRequired: true,
        });

        verifyMfaMock.mockResolvedValue({
            token: "final-token",
        });

        initAuth(container);

        container.querySelector("#username").value = "dueno";
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
        expect(navigateMock).toHaveBeenCalledWith("/dashboard");
    });
});
