import { beforeEach, describe, expect, it, vi } from "vitest";
import createSuccessFixture from "../fixtures/clientes/create-success.json";
import listSuccessFixture from "../fixtures/clientes/list-success.json";
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

describe("clientes service contract", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it("usa GET/POST /api/v1/clientes y respeta CrearClienteRequest exacto", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 200,
                data: listSuccessFixture,
            }))
            .mockResolvedValueOnce(createJsonResponse({
                ok: true,
                status: 201,
                data: createSuccessFixture,
            }));

        const { getClients, createClient } = await import("../../src/features/clientes/clientes.service.js");

        const clientsResponse = await getClients();

        expect(fetchSpy).toHaveBeenNthCalledWith(
            1,
            "http://localhost:8080/api/v1/clientes",
            expect.objectContaining({
                method: "GET",
            }),
        );
        expect(clientsResponse.items.length).toBe(listSuccessFixture.length);

        await createClient({
            firstName: "Maria",
            lastName: "Gomez",
            phone: "3007776655",
            documentNumber: "12345678",
        });

        const postRequest = fetchSpy.mock.calls[1];
        expect(postRequest[0]).toBe("http://localhost:8080/api/v1/clientes");
        expect(postRequest[1].method).toBe("POST");
        expect(JSON.parse(postRequest[1].body)).toEqual({
            nombre: "Maria",
            apellido: "Gomez",
            telefono: "3007776655",
            documento: "12345678",
        });
    });

    it("propaga ErrorResponse 409 al crear cliente duplicado", async () => {
        const conflictError = createErrorResponseFixture(409, {
            message: "Ya existe un cliente con ese documento",
            details: ["documento: ya registrado"],
        });

        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(createJsonResponse({
            ok: false,
            status: 409,
            data: conflictError,
        }));

        const { createClient } = await import("../../src/features/clientes/clientes.service.js");

        await expect(
            createClient({
                firstName: "Maria",
                lastName: "Gomez",
                phone: "3007776655",
                documentNumber: "12345678",
            }),
        ).rejects.toMatchObject({
            status: 409,
            data: conflictError,
        });
    });

    it("propaga ErrorResponse 400 con details[] al crear cliente con payload invalido", async () => {
        const badRequestError = createErrorResponseFixture(400, {
            message: "Error en los datos enviados",
            details: [
                "telefono: formato invalido",
                "documento: debe tener entre 8 y 10 digitos",
            ],
        });

        vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(createJsonResponse({
            ok: false,
            status: 400,
            data: badRequestError,
        }));

        const { createClient } = await import("../../src/features/clientes/clientes.service.js");

        await expect(
            createClient({
                firstName: "A",
                lastName: "B",
                phone: "123",
                documentNumber: "12",
            }),
        ).rejects.toMatchObject({
            status: 400,
            data: badRequestError,
        });
    });
});
