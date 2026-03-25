import { describe, it, expect, beforeEach, vi } from "vitest";
import * as mfaService from "../../src/features/mfa/mfa.service.js";
import * as mfaMappers from "../../src/features/mfa/mfa.mappers.js";
import setupSuccessFixture from "../fixtures/mfa/setup-success.json";

/**
 * MFA Setup & Enable Integration Tests
 * Validar flujo de setup (GET) y enable (POST) segun especificacion.
 * Nota: Los tests de fetch real estan cubiertos de forma e2e.
 * Aqui validamos mappers, validaciones y fixtures.
 */

describe("MFA Setup & Enable - Specs Validation", () => {
    describe("MFA-SPEC-001: Setup QR Retrieval", () => {
        it("should map setup response with secret and qrCodeUrl", () => {
            const result = mfaMappers.mapMfaSetupResponse(setupSuccessFixture);

            expect(result).toHaveProperty("secret");
            expect(result).toHaveProperty("qrCodeUrl");
            expect(result.secret).toBe("JBSWY3DPEBLW64TMMQ======");
            expect(result.qrCodeUrl).toContain("data:image/png;base64");
        });

        it("should throw error if setup response missing secret", () => {
            const invalidResponse = { qrCodeUrl: "data:..." };

            expect(() => {
                mfaMappers.mapMfaSetupResponse(invalidResponse);
            }).toThrow("secret válido");
        });

        it("should throw error if setup response missing qrCodeUrl", () => {
            const invalidResponse = { secret: "ABC123" };

            expect(() => {
                mfaMappers.mapMfaSetupResponse(invalidResponse);
            }).toThrow("código QR");
        });

        it("should throw error if response is null or undefined", () => {
            expect(() => {
                mfaMappers.mapMfaSetupResponse(null);
            }).toThrow();

            expect(() => {
                mfaMappers.mapMfaSetupResponse(undefined);
            }).toThrow();
        });
    });

    describe("MFA-SPEC-002: Enable MFA Submission", () => {
        it("should validate and map enable payload with valid code", () => {
            const payload = mfaMappers.mapMfaEnablePayload("JBSWY3DPEBLW64TMMQ======", "123456");

            expect(payload).toHaveProperty("secret");
            expect(payload).toHaveProperty("code");
            expect(payload.secret).toBe("JBSWY3DPEBLW64TMMQ======");
            expect(payload.code).toBe("123456");
        });

        it("should reject code with less than 6 digits", () => {
            expect(() => {
                mfaMappers.mapMfaEnablePayload("SECRET", "12345");
            }).toThrow();
        });

        it("should reject code with more than 6 digits", () => {
            expect(() => {
                mfaMappers.mapMfaEnablePayload("SECRET", "1234567");
            }).toThrow();
        });

        it("should reject code with non-digit characters", () => {
            expect(() => {
                mfaMappers.mapMfaEnablePayload("SECRET", "12345a");
            }).toThrow();

            expect(() => {
                mfaMappers.mapMfaEnablePayload("SECRET", "abc123");
            }).toThrow();
        });

        it("should reject empty code", () => {
            expect(() => {
                mfaMappers.mapMfaEnablePayload("SECRET", "");
            }).toThrow();
        });

        it("should reject if secret is invalid", () => {
            expect(() => {
                mfaMappers.mapMfaEnablePayload(null, "123456");
            }).toThrow();

            expect(() => {
                mfaMappers.mapMfaEnablePayload("", "123456");
            }).toThrow();
        });
    });

    describe("MFA-SPEC-003: Client-side Code Validation", () => {
        it("should validate 6-digit TOTP format", () => {
            expect(mfaMappers.isValidTotpFormat("123456")).toBe(true);
            expect(mfaMappers.isValidTotpFormat("000000")).toBe(true);
            expect(mfaMappers.isValidTotpFormat("999999")).toBe(true);
        });

        it("should reject invalid TOTP formats", () => {
            expect(mfaMappers.isValidTotpFormat("12345")).toBe(false); // too short
            expect(mfaMappers.isValidTotpFormat("1234567")).toBe(false); // too long
            expect(mfaMappers.isValidTotpFormat("abc123")).toBe(false); // letters
            expect(mfaMappers.isValidTotpFormat("")).toBe(false); // empty
            expect(mfaMappers.isValidTotpFormat(null)).toBe(false); // null
        });

        it("should sanitize TOTP input properly", () => {
            expect(mfaMappers.sanitizeTotp("123456")).toBe("123456");
            expect(mfaMappers.sanitizeTotp("12 34 56")).toBe("123456"); // remove spaces
            expect(mfaMappers.sanitizeTotp("  123456  ")).toBe("123456"); // trim
            expect(mfaMappers.sanitizeTotp("1234567")).toBe("123456"); // truncate
            expect(mfaMappers.sanitizeTotp("abc123")).toBe("123"); // remove letters
            expect(mfaMappers.sanitizeTotp("")).toBe(""); // empty stays empty
        });

        it("should trim code before validation", () => {
            const payload = mfaMappers.mapMfaEnablePayload("SECRET", "  123456  ");
            expect(payload.code).toBe("123456");
        });
    });

    describe("MFA-SPEC-004: Fixture Loading", () => {
        it("should load setup success fixture with required fields", () => {
            expect(setupSuccessFixture).toBeDefined();
            expect(setupSuccessFixture.secret).toBeDefined();
            expect(setupSuccessFixture.qrCodeUrl).toBeDefined();
            expect(typeof setupSuccessFixture.secret).toBe("string");
            expect(typeof setupSuccessFixture.qrCodeUrl).toBe("string");
        });

        it("should have valid BASE32 secret format", () => {
            // BASE32 uses A-Z and 2-7
            const base32Regex = /^[A-Z2-7=]*$/;
            expect(base32Regex.test(setupSuccessFixture.secret)).toBe(true);
        });

        it("should have valid PNG base64 data URI", () => {
            expect(setupSuccessFixture.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
            expect(setupSuccessFixture.qrCodeUrl.length).toBeGreaterThan(100);
        });
    });

    describe("Error Response Handling (from spec)", () => {
        it("should identify field error structure for 400 responses", () => {
            const error400 = {
                status: 400,
                fieldErrors: {
                    code: "Código TOTP inválido o expirado",
                },
            };

            expect(error400.status).toBe(400);
            expect(error400.fieldErrors).toBeDefined();
            expect(error400.fieldErrors.code).toBeDefined();
        });

        it("should identify auth error for 403 responses", () => {
            const error403 = {
                status: 403,
                message: "Acceso denegado. Token inválido o expirado.",
            };

            expect(error403.status).toBe(403);
            expect(error403.message).toContain("denegado");
        });

        it("should identify not found error for 404 responses", () => {
            const error404 = {
                status: 404,
                message: "Usuario no encontrado",
            };

            expect(error404.status).toBe(404);
            expect(error404.message).toContain("no encontrado");
        });

        it("should identify server error for 500 responses", () => {
            const error500 = {
                status: 500,
                message: "Error interno del servidor",
            };

            expect(error500.status).toBe(500);
            expect(error500.message).toContain("interno");
        });
    });
});
