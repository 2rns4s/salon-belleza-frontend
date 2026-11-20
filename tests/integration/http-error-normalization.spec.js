import { describe, expect, it } from "vitest";
import { normalizeHttpError as normalizeCitasHttpError } from "../../src/features/citas/citas.mappers.js";
import { normalizeClientesHttpError } from "../../src/features/clientes/clientes.mappers.js";
import { normalizeEmpleadosHttpError } from "../../src/features/empleados/empleados.mappers.js";
import { normalizeRecursosHttpError } from "../../src/features/recursos/recursos.mappers.js";
import { normalizeServiciosHttpError } from "../../src/features/servicios/servicios.mappers.js";
import { normalizeUsuariosHttpError } from "../../src/features/usuarios/usuarios.mappers.js";

describe("normalización de errores HTTP por módulo", () => {
  it.each([
    ["citas", normalizeCitasHttpError],
    ["empleados", normalizeEmpleadosHttpError],
    ["recursos", normalizeRecursosHttpError],
    ["servicios", normalizeServiciosHttpError],
  ])("%s conserva metadatos y expone errores de campo solo para 400/409", (_, normalizeError) => {
    const data = { mensaje: "Revisa los campos", details: ["nombre: Ya existe"] };
    const validation = { status: 400, data };
    const conflict = { response: { status: 409, data } };
    const server = { status: 500, data };

    expect(normalizeError(validation)).toEqual({
      status: 400,
      code: "VALIDATION",
      message: data.mensaje,
      details: data.details,
      fieldErrors: { nombre: "Ya existe" },
      raw: validation,
    });
    expect(normalizeError(conflict)).toMatchObject({ status: 409, code: "CONFLICT", fieldErrors: { nombre: "Ya existe" } });
    expect(normalizeError(server)).toMatchObject({ status: 500, message: data.mensaje, fieldErrors: null });
    expect(normalizeError({ status: 400 }).fieldErrors).toBeNull();
  });

  it.each([
    ["clientes", normalizeClientesHttpError],
    ["usuarios", normalizeUsuariosHttpError],
  ])("%s conserva los errores de campo para cualquier estado y omite metadatos", (_, normalizeError) => {
    expect(normalizeError({
      status: 500,
      data: { mensaje: "No se pudo guardar", fieldErrors: { nombre: "Requerido" } },
    })).toEqual({
      status: 500,
      message: "No se pudo guardar",
      fieldErrors: { nombre: "Requerido" },
    });
    expect(normalizeError({ status: 400 }).fieldErrors).toEqual({});
  });

  it("conserva el mensaje de sesión vencida y de servidor de citas", () => {
    expect(normalizeCitasHttpError({ status: 401 }).message).toBe("Tu sesion expiro. Inicia sesion nuevamente.");
    expect(normalizeCitasHttpError({ status: 503 }).message).toBe("Ocurrio un error interno del servidor.");
  });
});
