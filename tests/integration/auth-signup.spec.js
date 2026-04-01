import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createErrorResponseFixture } from "../fixtures/shared/error-response.fixture.js";
import { renderLoginPage, renderSignupPage } from "../../src/features/auth/auth.view.js";
import { SIGNUP_VALIDATION_RULES } from "../../src/features/auth/auth.controller.js";

function createJsonResponse({ ok = true, status = 200, data = {} } = {}) {
    return {
        ok,
        status,
        headers: { get: () => "application/json" },
        json: async () => data,
        text: async () => JSON.stringify(data),
    };
}

function setupAuthContainer() {
    const container = document.createElement("div");
    container.className = "app__content";
    document.body.appendChild(container);
    return container;
}

async function initAuthWithContainer(container) {
    const { initAuth } = await import("../../src/features/auth/auth.controller.js");
    initAuth(container);
}

describe("auth.service employeeSignUp", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("AUTH-SIGNUP-01: employeeSignUp envia POST a /api/v1/auth/employee-signup con payload correcto", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 201, data: { message: "Cuenta creada" } }),
        );

        const { employeeSignUp } = await import("../../src/features/auth/auth.service.js");
        const result = await employeeSignUp("empleado@test.com", "empleado1", "password123");

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/auth/employee-signup",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({ "Content-Type": "application/json" }),
                body: JSON.stringify({
                    email: "empleado@test.com",
                    username: "empleado1",
                    password: "password123",
                }),
            }),
        );
        expect(result).toEqual({ message: "Cuenta creada" });
    });

    it("AUTH-SIGNUP-01: employeeSignUp lanza error cuando backend responde con 400", async () => {
        const errorData = createErrorResponseFixture(400, {
            message: "Errores de validación",
            fieldErrors: { email: "El email es obligatorio" },
        });
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
            ok: false,
            status: 400,
            headers: { get: () => "application/json" },
            json: async () => errorData,
        });

        const { employeeSignUp } = await import("../../src/features/auth/auth.service.js");
        await expect(employeeSignUp("", "", "")).rejects.toThrow("HTTP 400");
    });

    it("AUTH-SIGNUP-02: employeeSignUp con diferentes datos llama al endpoint correcto", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 201, data: { id: 42 } }),
        );

        const { employeeSignUp } = await import("../../src/features/auth/auth.service.js");
        const result = await employeeSignUp("otro@test.com", "usuario2", "securePass!");

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/auth/employee-signup",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    email: "otro@test.com",
                    username: "usuario2",
                    password: "securePass!",
                }),
            }),
        );
        expect(result).toEqual({ id: 42 });
    });
});

describe("auth.controller signup validation constants", () => {
    it("AUTH-CONSTANTS-01: SIGNUP_VALIDATION_RULES contiene reglas correctas", async () => {
        const { SIGNUP_VALIDATION_RULES } = await import("../../src/features/auth/auth.controller.js");
        expect(SIGNUP_VALIDATION_RULES.USERNAME_MIN_LENGTH).toBe(4);
        expect(SIGNUP_VALIDATION_RULES.USERNAME_MAX_LENGTH).toBe(20);
        expect(SIGNUP_VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBe(8);
        expect(SIGNUP_VALIDATION_RULES.EMAIL_PATTERN).toBeInstanceOf(RegExp);
        expect(SIGNUP_VALIDATION_RULES.EMAIL_PATTERN.test("user@example.com")).toBe(true);
        expect(SIGNUP_VALIDATION_RULES.EMAIL_PATTERN.test("invalid")).toBe(false);
    });
});

describe("auth.view signup link", () => {
    it("T3: renderLoginPage includes 'Crear cuenta' button with id btn-signup", () => {
        const html = renderLoginPage();
        expect(html).toContain("¿No tienes cuenta?");
        expect(html).toContain("Crear cuenta");
        expect(html).toContain('id="btn-signup"');
        expect(html).toContain('type="button"');
    });
});

describe("auth.view renderSignupPage", () => {
    it("T4: renderSignupPage returns HTML with signup form and fields", () => {
        const html = renderSignupPage();
        expect(html).toContain("auth__signup-form");
        expect(html).toContain('name="email"');
        expect(html).toContain('name="username"');
        expect(html).toContain('name="password"');
        expect(html).toContain('autocomplete="email"');
        expect(html).toContain('autocomplete="username"');
        expect(html).toContain('autocomplete="new-password"');
        expect(html).toContain('type="email"');
        expect(html).toContain('type="password"');
        expect(html).toContain("Crear cuenta"); // button text
        expect(html).toContain("Volver al inicio de sesión");
    });

    it("T4: renderSignupPage includes error display areas", () => {
        const html = renderSignupPage();
        expect(html).toContain("auth__field-error");
    });

    it("T4: renderSignupPage accepts parameters for loading and errors", () => {
        const html = renderSignupPage({ loading: true });
        expect(html).toContain("disabled");
        expect(html).toContain("Creando cuenta...");
    });

    it("T5: renderSignupPage uses proper BEM classes for fields and inputs", () => {
        const html = renderSignupPage();
        expect(html).toContain("auth__field");
        expect(html).toContain("auth__input");
        expect(html).toContain("auth__label");
    });
});

describe("auth.controller signup integration", () => {
    let container;

    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        container = setupAuthContainer();
    });

    afterEach(() => {
        container?.remove();
        document.body.innerHTML = "";
    });

    it("AUTH-SIGNUP-03: click en 'Crear cuenta' muestra formulario signup", async () => {
        await initAuthWithContainer(container);

        const signupBtn = container.querySelector("#btn-signup");
        expect(signupBtn).toBeTruthy();

        signupBtn.click();

        const signupForm = container.querySelector("#signup-form");
        expect(signupForm).toBeTruthy();
        expect(container.querySelector("#login-form")).toBeFalsy();
    });

    it("AUTH-SIGNUP-04: click en 'Volver al inicio de sesión' regresa al login", async () => {
        await initAuthWithContainer(container);

        container.querySelector("#btn-signup").click();
        expect(container.querySelector("#signup-form")).toBeTruthy();

        const backBtn = container.querySelector("#btn-back");
        expect(backBtn).toBeTruthy();
        backBtn.click();

        expect(container.querySelector("#login-form")).toBeTruthy();
        expect(container.querySelector("#signup-form")).toBeFalsy();
    });

    it("AUTH-SIGNUP-05: validación client-side rechaza email inválido", async () => {
        await initAuthWithContainer(container);
        container.querySelector("#btn-signup").click();

        const form = container.querySelector("#signup-form");
        form.querySelector("#email").value = "invalid-email";
        form.querySelector("#username").value = "validuser";
        form.querySelector("#password").value = "password123";

        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        expect(container.querySelector("#signup-form")).toBeTruthy();
        const emailError = container.querySelector("#error-email");
        expect(emailError?.textContent).toContain("correo valido");
    });

    it("AUTH-SIGNUP-06: validación client-side rechaza username corto", async () => {
        await initAuthWithContainer(container);
        container.querySelector("#btn-signup").click();

        const form = container.querySelector("#signup-form");
        form.querySelector("#email").value = "user@test.com";
        form.querySelector("#username").value = "ab";
        form.querySelector("#password").value = "password123";

        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        expect(container.querySelector("#signup-form")).toBeTruthy();
        const usernameError = container.querySelector("#error-username");
        expect(usernameError?.textContent).toContain("al menos 4 caracteres");
    });

    it("AUTH-SIGNUP-07: validación client-side rechaza password corto", async () => {
        await initAuthWithContainer(container);
        container.querySelector("#btn-signup").click();

        const form = container.querySelector("#signup-form");
        form.querySelector("#email").value = "user@test.com";
        form.querySelector("#username").value = "validuser";
        form.querySelector("#password").value = "short";

        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        expect(container.querySelector("#signup-form")).toBeTruthy();
        const passwordError = container.querySelector("#error-password");
        expect(passwordError?.textContent).toContain("al menos 8 caracteres");
    });

    it("AUTH-SIGNUP-08: signup exitoso redirige a login con username pre-llenado", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({
                ok: true,
                status: 201,
                data: { idEmpleado: 5, nombreUsuario: "maria_lopez", rol: "RECEPTIONIST" },
            }),
        );

        await initAuthWithContainer(container);
        container.querySelector("#btn-signup").click();

        const form = container.querySelector("#signup-form");
        form.querySelector("#email").value = "maria@salon.com";
        form.querySelector("#username").value = "maria_lopez";
        form.querySelector("#password").value = "securePass123";
        form.querySelector("#confirmPassword").value = "securePass123";

        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(container.querySelector("#login-form")).toBeTruthy();
            const usernameInput = container.querySelector("#username");
            expect(usernameInput.value).toBe("maria_lopez");
        });
    });

    it("AUTH-SIGNUP-09: error 404 muestra mensaje de empleado no encontrado", async () => {
        const errorData = createErrorResponseFixture(404, {
            message: "Empleado no encontrado con ese correo",
        });
        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
            ok: false,
            status: 404,
            headers: { get: () => "application/json" },
            json: async () => errorData,
        });

        await initAuthWithContainer(container);
        container.querySelector("#btn-signup").click();

        const form = container.querySelector("#signup-form");
        form.querySelector("#email").value = "nobody@salon.com";
        form.querySelector("#username").value = "nobody";
        form.querySelector("#password").value = "password123";
        form.querySelector("#confirmPassword").value = "password123";

        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(container.querySelector(".auth__error")?.textContent).toContain(
                "No encontramos un empleado con ese correo",
            );
        });
    });

    it("AUTH-SIGNUP-10: error 409 por email ya reclamado muestra mensaje apropiado", async () => {
        const errorData = createErrorResponseFixture(409, {
            message: "El correo ya tiene una cuenta asociada",
        });
        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
            ok: false,
            status: 409,
            headers: { get: () => "application/json" },
            json: async () => errorData,
        });

        await initAuthWithContainer(container);
        container.querySelector("#btn-signup").click();

        const form = container.querySelector("#signup-form");
        form.querySelector("#email").value = "existing@salon.com";
        form.querySelector("#username").value = "newuser";
        form.querySelector("#password").value = "password123";
        form.querySelector("#confirmPassword").value = "password123";

        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(container.querySelector(".auth__error")?.textContent).toContain(
                "correo ya tiene una cuenta",
            );
        });
    });

    it("AUTH-SIGNUP-11: error 409 por username en uso muestra mensaje apropiado", async () => {
        const errorData = createErrorResponseFixture(409, {
            message: "El nombre de usuario ya está en uso",
        });
        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
            ok: false,
            status: 409,
            headers: { get: () => "application/json" },
            json: async () => errorData,
        });

        await initAuthWithContainer(container);
        container.querySelector("#btn-signup").click();

        const form = container.querySelector("#signup-form");
        form.querySelector("#email").value = "user@salon.com";
        form.querySelector("#username").value = "taken_user";
        form.querySelector("#password").value = "password123";
        form.querySelector("#confirmPassword").value = "password123";

        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(container.querySelector(".auth__error")?.textContent).toContain(
                "nombre de usuario ya esta en uso",
            );
        });
    });

    it("AUTH-SIGNUP-12: loading state muestra pantalla de carga durante submit", async () => {
        let resolveFetch;
        const fetchPromise = new Promise((resolve) => {
            resolveFetch = resolve;
        });
        vi.spyOn(globalThis, "fetch").mockReturnValue(fetchPromise);

        await initAuthWithContainer(container);
        container.querySelector("#btn-signup").click();

        const form = container.querySelector("#signup-form");
        form.querySelector("#email").value = "user@salon.com";
        form.querySelector("#username").value = "validuser";
        form.querySelector("#password").value = "password123";
        form.querySelector("#confirmPassword").value = "password123";

        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(container.querySelector(".auth__title")?.textContent).toBe("Procesando");
        });

        resolveFetch(
            createJsonResponse({
                ok: true,
                status: 201,
                data: { idEmpleado: 1, nombreUsuario: "validuser", rol: "RECEPTIONIST" },
            }),
        );
    });
});

