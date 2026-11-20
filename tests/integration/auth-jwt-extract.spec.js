import { afterEach, describe, expect, it, vi } from "vitest";
import { limpiarSesion, rehydrateAuthSession } from "../../src/shared/state/authStore.js";
import { setAuthToken } from "../../src/shared/storage/authTokenStorage.js";
import { extractRoleFromToken } from "../../src/features/auth/auth.service.js";

function encodeBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function createJwtToken(payload = {}) {
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encodeBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  limpiarSesion();
});

describe("auth.service extractRoleFromToken", () => {
  it("AUTH-JWT-EXTRACT-01: token valido con rol retorna el rol", () => {
    const token = createJwtToken({ rol: "RECEPTIONIST" });
    expect(extractRoleFromToken(token)).toBe("RECEPTIONIST");
  });

  it("AUTH-JWT-EXTRACT-01: claim role con prefijo ROLE_ retorna valor limpio", () => {
    const token = createJwtToken({ role: "ROLE_OWNER" });
    expect(extractRoleFromToken(token)).toBe("OWNER");
  });

  it("AUTH-JWT-EXTRACT-01: claim roles en arreglo retorna primer valor utilizable", () => {
    const token = createJwtToken({ roles: ["ROLE_RECEPTIONIST", "OWNER"] });
    expect(extractRoleFromToken(token)).toBe("RECEPTIONIST");
  });

  it("AUTH-JWT-EXTRACT-01: claim authorities con strings retorna rol limpio", () => {
    const token = createJwtToken({ authorities: ["ROLE_RECEPCIONISTA", "ROLE_OWNER"] });
    expect(extractRoleFromToken(token)).toBe("RECEPCIONISTA");
  });

  it("AUTH-JWT-EXTRACT-01: claim authorities con objetos retorna rol limpio", () => {
    const token = createJwtToken({ authorities: [{ authority: "ROLE_OWNER" }] });
    expect(extractRoleFromToken(token)).toBe("OWNER");
  });

  it("AUTH-JWT-EXTRACT-01: token valido sin rol retorna null", () => {
    const token = createJwtToken({ sub: "owner" });
    expect(extractRoleFromToken(token)).toBeNull();
  });

  it("AUTH-JWT-EXTRACT-01: token malformado retorna null sin excepcion", () => {
    expect(extractRoleFromToken("invalid-token")).toBeNull();
    expect(extractRoleFromToken("part1.part2")).toBeNull();
  });

  it.each(["atob", "Buffer"])("rehidrata claims UTF-8 a traves de %s", (decoder) => {
    if (decoder === "Buffer") {
      vi.stubGlobal("atob", undefined);
    }

    const token = createJwtToken({
      sub: "Muñoz",
      rol: "ROLE_DUEÑO",
      role: "ROLE_RECEPTIONIST",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    expect(extractRoleFromToken(token)).toBe("DUEÑO");
    setAuthToken(token);
    expect(rehydrateAuthSession()).toEqual({
      sesionIniciada: true,
      usuario: "Muñoz",
      rol: "OWNER",
    });
  });

  it("AUTH-JWT-EXTRACT-02: no emite logs a consola al decodificar el JWT", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    expect(extractRoleFromToken(createJwtToken({ rol: "OWNER" }))).toBe("OWNER");
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
