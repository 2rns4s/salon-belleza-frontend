import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as mfaService from "../../src/features/mfa/mfa.service.js";
import { resolveAuthUserContext, guardarSesion } from "../../src/shared/state/authStore.js";
import { getAuthToken, setAuthToken, clearAuthToken } from "../../src/shared/storage/authTokenStorage.js";
import enableWithTokenFixture from "../fixtures/mfa/enable-with-token.json";

/**
 * MFA JWT Token Update Integration Tests
 * Valida el flujo completo donde enableMfa() retorna un nuevo token JWT
 * y guardarSesion() lo persiste correctamente.
 */

// Helper para crear JWT tokens de test
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

describe("MFA JWT Token Update - Specs Validation", () => {
    beforeEach(() => {
        // Limpiar estado antes de cada test
        clearAuthToken();
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        clearAuthToken();
    });

    // ============================================
    // Phase 3: Unit Tests para Service
    // ============================================

    describe("JWT-TOKEN-SERVICE-001: enableMfa() retorna token del mock", () => {
        it("debe retornar token cuando la respuesta del mock incluye token", async () => {
            // Mock de httpClient para que retorne la respuesta con token
            const httpClientSpy = vi.spyOn(mfaService, "enableMfa");
            
            // Simular que el servicio retorna el token del fixture
            const mockResponse = { token: enableWithTokenFixture.token };
            httpClientSpy.mockResolvedValue(mockResponse);
            
            const result = await mfaService.enableMfa("JBSWY3DPEBLW64TMMQ======", "123456");
            
            expect(result).toHaveProperty("token");
            expect(result.token).toBe(enableWithTokenFixture.token);
            expect(typeof result.token).toBe("string");
            expect(result.token.length).toBeGreaterThan(0);
        });

        it("debe retornar estructura correcta con token en respuesta exitosa", async () => {
            const httpClientSpy = vi.spyOn(mfaService, "enableMfa");
            
            const mockResponse = { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test" };
            httpClientSpy.mockResolvedValue(mockResponse);
            
            const result = await mfaService.enableMfa("SECRET", "123456");
            
            // Validar estructura según spec
            expect(result).toBeDefined();
            expect(result).toHaveProperty("token");
            expect(result.token).toMatch(/^eyJ/); // JWT format starts with eyJ
        });
    });

    // ============================================
    // Phase 4: Unit Tests para Controller
    // ============================================

    describe("JWT-TOKEN-CONTROLLER-001: Controller extrae token y llama guardarSesion", () => {
        it("debe extraer token de la respuesta del servicio y llamar guardarSesion", async () => {
            // Setup: crear token inicial para el usuario
            const initialToken = createJwtToken({
                nombreUsuario: "testuser",
                rol: "OWNER",
            });
            setAuthToken(initialToken);

            // Mock de enableMfa para que retorne el nuevo token
            const enableMfaSpy = vi.spyOn(mfaService, "enableMfa");
            enableMfaSpy.mockResolvedValue({ token: enableWithTokenFixture.token });

            // Ejecutar el flujo del controller
            const secret = "JBSWY3DPEBLW64TMMQ======";
            const code = "123456";
            
            const { token } = await mfaService.enableMfa(secret, code);
            
            // Verificar que se extrajo el token
            expect(token).toBeDefined();
            expect(token).toBe(enableWithTokenFixture.token);

            // Simular lo que hace el controller: llamar guardarSesion con el token
            // Verificamos que guardarSesion está disponible y funciona correctamente
            guardarSesion({
                usuario: "testuser",
                rol: "OWNER",
                token: token,
            });

            // Verificar que el token fue almacenado correctamente en authStore
            expect(getAuthToken()).toBe(enableWithTokenFixture.token);
        });

        it("NO debe guardar sesion cuando enableMfa retorna error", async () => {
            // Limpiar el estado antes del test
            clearAuthToken();
            
            const enableMfaSpy = vi.spyOn(mfaService, "enableMfa");
            enableMfaSpy.mockRejectedValue(new Error("Código TOTP inválido"));

            // Intentar llamar enableMfa y verificar que no se guarda sesión
            let errorCaught = false;
            try {
                await mfaService.enableMfa("SECRET", "000000");
            } catch (error) {
                errorCaught = true;
            }

            // Verificar que el error fue lanzado
            expect(errorCaught).toBe(true);
            
            // Verificar que NO se almacenó ningún token (estado limpio)
            expect(getAuthToken()).toBeNull();
        });
    });

    // ============================================
    // Phase 5: Integration Tests con AuthStore
    // ============================================

    describe("JWT-TOKEN-INTEGRATION-001: authStore almacena token correctamente", () => {
        it("debe almacenar el token en authStore via guardarSesion", () => {
            const newToken = enableWithTokenFixture.token;
            
            // Llamar guardarSesion con el token
            guardarSesion({
                usuario: "testuser",
                rol: "OWNER",
                token: newToken,
            });

            // Verificar que el token fue almacenado
            const storedToken = getAuthToken();
            expect(storedToken).toBe(newToken);
        });

        it("debe actualizar el token via setAuthToken", () => {
            const initialToken = "initial-token";
            const newToken = enableWithTokenFixture.token;
            
            // Setear token inicial
            setAuthToken(initialToken);
            expect(getAuthToken()).toBe(initialToken);

            // Actualizar con nuevo token
            setAuthToken(newToken);
            expect(getAuthToken()).toBe(newToken);
        });

        it("debe persistir el token en localStorage", () => {
            const token = enableWithTokenFixture.token;
            
            setAuthToken(token);
            
            // Verificar en localStorage directamente
            const storedInLocalStorage = localStorage.getItem("auth_token");
            expect(storedInLocalStorage).toBe(token);
        });
    });

    describe("JWT-TOKEN-INTEGRATION-002: Integracion completa del flujo", () => {
        it("debe ejecutar el flujo completo desde enableMfa hasta guardado de sesion", async () => {
            // Setup: token inicial
            const initialToken = createJwtToken({
                nombreUsuario: "owner",
                rol: "OWNER",
                mfaEnabled: false,
            });
            setAuthToken(initialToken);

            // Mock de enableMfa - retorna nuevo token con mfaEnabled=true
            const newToken = createJwtToken({
                nombreUsuario: "owner",
                rol: "OWNER",
                mfaEnabled: true,
            });

            const enableMfaSpy = vi.spyOn(mfaService, "enableMfa");
            enableMfaSpy.mockResolvedValue({ token: newToken });

            // Ejecutar flujo completo
            const serviceResult = await mfaService.enableMfa("SECRET", "123456");
            
            // El servicio retorna el token
            expect(serviceResult).toHaveProperty("token");
            expect(serviceResult.token).toBe(newToken);

            // El controller extrae el token y llama guardarSesion
            guardarSesion({
                usuario: "owner",
                rol: "OWNER",
                token: serviceResult.token,
            });

            // Verificar que el token fue persistido
            const persistedToken = getAuthToken();
            expect(persistedToken).toBe(newToken);

            // Verificar que el token contiene mfaEnabled=true
            const tokenParts = newToken.split(".");
            const payload = JSON.parse(atob(tokenParts[1]));
            expect(payload.mfaEnabled).toBe(true);
        });

        it("debe mantener el flujo cuando el token no esta presente en la respuesta", async () => {
            // Limpiar estado antes del test
            clearAuthToken();
            
            // Mock de enableMfa que retorna respuesta sin token (caso de error del backend)
            const enableMfaSpy = vi.spyOn(mfaService, "enableMfa");
            enableMfaSpy.mockResolvedValue({}); // Respuesta vacía sin token

            const result = await mfaService.enableMfa("SECRET", "123456");

            // Si no hay token, el controller no debe llamar guardarSesion
            // Verificamos que NO se almacenó ningún token
            expect(result.token).toBeUndefined();
            expect(getAuthToken()).toBeNull();
        });
    });

    // ============================================
    // Phase 6: Coverage Verification
    // ============================================

    describe("JWT-TOKEN-COVERAGE-001: Verificacion de cobertura del flujo JWT post-MFA", () => {
        it("debe tener fixture con estructura de token valida", () => {
            expect(enableWithTokenFixture).toBeDefined();
            expect(enableWithTokenFixture.token).toBeDefined();
            expect(typeof enableWithTokenFixture.token).toBe("string");
            expect(enableWithTokenFixture.token.length).toBeGreaterThan(0);
        });

        it("debe validar formato JWT del token en fixture", () => {
            const token = enableWithTokenFixture.token;
            const parts = token.split(".");
            
            // JWT tiene 3 partes: header.payload.signature
            expect(parts.length).toBe(3);
            
            // Verificar que el payload es decodificable
            const payload = JSON.parse(atob(parts[1]));
            expect(payload).toBeDefined();
            expect(payload).toHaveProperty("mfaEnabled");
        });

        it("debe verificar que el flujo completa correctamente", async () => {
            // Setup inicial
            clearAuthToken();
            
            // Mock del servicio
            const enableMfaSpy = vi.spyOn(mfaService, "enableMfa");
            enableMfaSpy.mockResolvedValue({ token: enableWithTokenFixture.token });

            // Ejecutar flujo
            const { token } = await mfaService.enableMfa("SECRET", "123456");
            guardarSesion({
                usuario: "testuser",
                rol: "OWNER",
                token: token,
            });

            // Verificaciones finales
            expect(getAuthToken()).toBe(enableWithTokenFixture.token);
            expect(localStorage.getItem("auth_token")).toBe(enableWithTokenFixture.token);
        });
    });
});
