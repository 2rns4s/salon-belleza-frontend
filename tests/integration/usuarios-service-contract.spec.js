import { beforeEach, describe, expect, it, vi } from "vitest";
import createSuccessFixture from "../fixtures/usuarios/create-success.json";
import listSuccessFixture from "../fixtures/usuarios/list-success.json";
import { createErrorResponseFixture } from "../fixtures/shared/error-response.fixture.js";

function createJsonResponse({ ok = true, status = 200, data = {} } = {}) {
    return {
        ok,
        status,
        headers: {
            get: () => "application/json",
        },
        json: async () => data,
        text: async () => JSON.stringify(data),
    };
}

describe("usuarios service contract", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("USUARIOS-SVC-01: usa GET /api/v1/usuarios y mapea UsuarioResponse correctamente", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: listSuccessFixture }),
        );

        const { getUsers } = await import("../../src/features/usuarios/usuarios.service.js");

        const users = await getUsers();

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/usuarios",
            expect.objectContaining({ method: "GET" }),
        );
        expect(users.length).toBe(2);
        expect(users[0]).toMatchObject({
            id: 1,
            username: "admin.principal",
            role: "OWNER",
            employeeId: 10,
            active: true,
            mfaEnabled: true,
        });
        expect(users[1]).toMatchObject({
            id: 2,
            username: "recep.central",
            role: "RECEPTIONIST",
            employeeId: 11,
            active: true,
            mfaEnabled: false,
        });
    });

    it("USUARIOS-SVC-02: usa POST /api/v1/usuarios con CrearUsuarioRequest exacto (DTO del manual)", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 201, data: createSuccessFixture }),
        );

        const { createUser } = await import("../../src/features/usuarios/usuarios.service.js");

        await createUser({
            nombreUsuario: "nuevo.user",
            contrasena: "password123",
            rol: "RECEPTIONIST",
            idEmpleado: 12,
        });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/usuarios");
        expect(options.method).toBe("POST");

        const body = JSON.parse(options.body);
        // Verifica exactamente los campos del CrearUsuarioRequest del MANUAL_FRONTEND.md
        expect(body).toEqual({
            nombreUsuario: "nuevo.user",
            contrasena: "password123",
            rol: "RECEPTIONIST",
            idEmpleado: 12,
        });
        // GARANTÍA: sin campos extra
        expect(Object.keys(body)).toHaveLength(4);
    });

    it("USUARIOS-SVC-03: usa PUT /api/v1/usuarios/{id} con ActualizarUsuarioRequest y omite contraseña vacía", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: { ...createSuccessFixture, idUsuario: 3, rol: "OWNER" } }),
        );

        const { updateUser } = await import("../../src/features/usuarios/usuarios.service.js");

        await updateUser(3, {
            nombreUsuario: "nuevo.user",
            contrasena: "", // vacía → no se envía
            rol: "OWNER",
            activo: true,
        });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/usuarios/3");
        expect(options.method).toBe("PUT");

        const body = JSON.parse(options.body);
        // La contraseña vacía NO debe estar en el payload
        expect(body).not.toHaveProperty("contrasena");
        expect(body).toMatchObject({ nombreUsuario: "nuevo.user", rol: "OWNER", activo: true });
    });

    it("USUARIOS-SVC-06: usa PUT /api/v1/usuarios/{id} e incluye contrasena cuando viene informada", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: { ...createSuccessFixture, idUsuario: 3, rol: "OWNER" } }),
        );

        const { updateUser } = await import("../../src/features/usuarios/usuarios.service.js");

        await updateUser(3, {
            nombreUsuario: "nuevo.user",
            contrasena: "nuevaClave123",
            rol: "OWNER",
            activo: true,
        });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/usuarios/3");
        expect(options.method).toBe("PUT");

        const body = JSON.parse(options.body);
        expect(body).toMatchObject({
            nombreUsuario: "nuevo.user",
            contrasena: "nuevaClave123",
            rol: "OWNER",
            activo: true,
        });
    });

    it("USUARIOS-SVC-04: usa DELETE /api/v1/usuarios/{id} para el soft delete", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 204, data: null }),
        );

        const { deleteUser } = await import("../../src/features/usuarios/usuarios.service.js");

        await deleteUser(1);

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/usuarios/1");
        expect(options.method).toBe("DELETE");
    });

    it("USUARIOS-SVC-05: propaga ErrorResponse 409 en nombre de usuario duplicado", async () => {
        const conflictError = createErrorResponseFixture(409, {
            message: "El nombre de usuario ya está en uso",
        });

        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: false, status: 409, data: conflictError }),
        );

        const { createUser } = await import("../../src/features/usuarios/usuarios.service.js");

        await expect(
            createUser({ nombreUsuario: "admin.principal", contrasena: "pass1234", rol: "OWNER", idEmpleado: 10 }),
        ).rejects.toMatchObject({ status: 409 });
    });
});
