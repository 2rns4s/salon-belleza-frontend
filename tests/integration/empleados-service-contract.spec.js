import { beforeEach, describe, expect, it, vi } from "vitest";
import createSuccessFixture from "../fixtures/empleados/create-success.json";
import listSuccessFixture from "../fixtures/empleados/list-success.json";
import { createErrorResponseFixture } from "../fixtures/shared/error-response.fixture.js";
import { normalizeEmpleadosHttpError } from "../../src/features/empleados/empleados.mappers.js";

function createJsonResponse({ ok = true, status = 200, data = {} } = {}) {
    return {
        ok,
        status,
        headers: { get: () => "application/json" },
        json: async () => data,
        text: async () => JSON.stringify(data),
    };
}

describe("empleados service contract", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("EMPLEADOS-SVC-01: GET /api/v1/empleados mapea idEmpleado, nombre/apellido, franjasLaborales y serviciosIds", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: listSuccessFixture }),
        );

        const { getEmployees } = await import("../../src/features/empleados/empleados.service.js");
        const result = await getEmployees();

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/empleados",
            expect.objectContaining({ method: "GET" }),
        );

        expect(result).toHaveLength(listSuccessFixture.length);
        expect(result[0]).toMatchObject({
            id: 21,
            firstName: "Laura",
            lastName: "Diaz",
            email: "laura.diaz@salon.com",
            phone: "3001112233",
        });
        expect(result[0].workShifts[0]).toEqual({
            id: 501,
            day: "MONDAY",
            startTime: "08:00:00",
            endTime: "12:00:00",
        });
        expect(result[0].serviceIds).toEqual([1, 3]);
    });

    it("EMPLEADOS-SVC-02: POST /api/v1/empleados envia CrearEmpleadoRequest exacto con franjasLaborales y serviciosIds", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 201, data: createSuccessFixture }),
        );

        const { createEmployee } = await import("../../src/features/empleados/empleados.service.js");
        await createEmployee({
            firstName: "Marta",
            lastName: "Ruiz",
            email: "marta.ruiz@salon.com",
            phone: "3007778899",
            workShifts: [
                {
                    rowId: "local-shift-1",
                    day: "FRIDAY",
                    startTime: "10:00",
                    endTime: "16:00",
                },
            ],
            serviceIds: [1, 2],
        });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/empleados");
        expect(options.method).toBe("POST");

        const body = JSON.parse(options.body);
        expect(body).toEqual({
            nombre: "Marta",
            apellido: "Ruiz",
            correo: "marta.ruiz@salon.com",
            telefono: "3007778899",
            franjasLaborales: [
                {
                    dia: "FRIDAY",
                    horaInicio: "10:00:00",
                    horaFin: "16:00:00",
                },
            ],
            serviciosIds: [1, 2],
        });
        expect(JSON.stringify(body)).not.toContain("rowId");
    });

    it("EMPLEADOS-SVC-03: PUT /api/v1/empleados/{id} envia solo {nombre, apellido, correo, telefono}", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 200, data: createSuccessFixture }),
        );

        const { updateEmployee } = await import("../../src/features/empleados/empleados.service.js");
        await updateEmployee(23, {
            firstName: "Marta",
            lastName: "Gonzalez",
            email: "marta.gonzalez@salon.com",
            phone: "3001231234",
            workShifts: [{ rowId: "local-shift-2", day: "MONDAY", startTime: "08:00", endTime: "12:00" }],
            serviceIds: [9],
        });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/empleados/23");
        expect(options.method).toBe("PUT");

        const body = JSON.parse(options.body);
        expect(body).toEqual({
            nombre: "Marta",
            apellido: "Gonzalez",
            correo: "marta.gonzalez@salon.com",
            telefono: "3001231234",
        });
        expect(JSON.stringify(body)).not.toContain("franjasLaborales");
        expect(JSON.stringify(body)).not.toContain("serviciosIds");
    });

    it("EMPLEADOS-SVC-04: DELETE /api/v1/empleados/{id} llama al endpoint correcto", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({ ok: true, status: 204, data: null }),
        );

        const { deleteEmployee } = await import("../../src/features/empleados/empleados.service.js");
        await deleteEmployee(44);

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe("http://localhost:8080/api/v1/empleados/44");
        expect(options.method).toBe("DELETE");
    });

    it("EMPLEADOS-SVC-05: GET catalogo de servicios usa /api/v1/servicios y mapea idServicio a id", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
            createJsonResponse({
                ok: true,
                status: 200,
                data: [
                    { idServicio: 1, nombre: "Corte", duracion: 30 },
                    { idServicio: 2, nombre: "Color", duracion: 80 },
                ],
            }),
        );

        const { getServicesCatalog } = await import("../../src/features/empleados/empleados.service.js");
        const result = await getServicesCatalog();

        expect(fetchSpy).toHaveBeenCalledWith(
            "http://localhost:8080/api/v1/servicios",
            expect.objectContaining({ method: "GET" }),
        );
        expect(result).toEqual([
            { id: 1, name: "Corte" },
            { id: 2, name: "Color" },
        ]);
    });

    it("EMPLEADOS-MAPPER-01: normalize incluye fieldErrors en 400 y los omite en no-validación", () => {
        const normalizedValidation = normalizeEmpleadosHttpError({
            status: 400,
            data: {
                ...createErrorResponseFixture(400),
                fieldErrors: {
                    correo: "correo invalido",
                    telefono: "telefono invalido",
                },
            },
        });

        expect(normalizedValidation.status).toBe(400);
        expect(normalizedValidation.code).toBe("VALIDATION");
        expect(normalizedValidation.fieldErrors).toEqual({
            correo: "correo invalido",
            telefono: "telefono invalido",
        });

        const normalizedUnauthorized = normalizeEmpleadosHttpError({
            status: 401,
            data: {
                ...createErrorResponseFixture(401),
                fieldErrors: {
                    auth: "token invalido",
                },
            },
        });

        expect(normalizedUnauthorized.status).toBe(401);
        expect(normalizedUnauthorized.code).toBe("UNAUTHORIZED");
        expect(normalizedUnauthorized.fieldErrors).toBeNull();
    });
});
