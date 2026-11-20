import { initMfaSetup } from "./mfa.controller.js";
import { requireAuth } from "../../shared/router/requireAuth.js";
import { navegarA } from "../../shared/router/router.js";

/**
 * Handler para la ruta MFA setup
 * Protegida: solo usuarios autenticados y con MFA inactivo
 */
function renderMfaSetupRoute(container) {
  const userContext = requireAuth();
  if (!userContext) return;

  if (userContext.isMfaEnabled) {
    // Evita reprovisionar MFA cuando ya está activo
    navegarA("/user-settings");
    return;
  }

  void initMfaSetup(container);
}

// Registrar la ruta en el sistema global de features
const existingFeatureRoutes = window.appFeatureRoutes || [];

const hasMfaRoute = existingFeatureRoutes.some(
  (routeDefinition) => routeDefinition?.path === "/mfa-setup",
);

if (!hasMfaRoute) {
  existingFeatureRoutes.push({
    path: "/mfa-setup",
    handler: renderMfaSetupRoute,
  });
}

window.appFeatureRoutes = existingFeatureRoutes;
