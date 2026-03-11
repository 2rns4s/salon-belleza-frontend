import { describe, expect, it } from "vitest";
import { extractRoleFromToken } from "../../src/features/auth/auth.service.js";

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

describe("auth.service extractRoleFromToken", () => {
    it("AUTH-JWT-EXTRACT-01: token valido con rol retorna el rol", () => {
        const token = createJwtToken({ rol: "RECEPTIONIST" });
        expect(extractRoleFromToken(token)).toBe("RECEPTIONIST");
    });

    it("AUTH-JWT-EXTRACT-01: token valido sin rol retorna null", () => {
        const token = createJwtToken({ sub: "owner" });
        expect(extractRoleFromToken(token)).toBeNull();
    });

    it("AUTH-JWT-EXTRACT-01: token malformado retorna null sin excepcion", () => {
        expect(extractRoleFromToken("invalid-token")).toBeNull();
        expect(extractRoleFromToken("part1.part2")).toBeNull();
    });
});
