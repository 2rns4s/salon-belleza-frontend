import { initAuth } from "./auth.controller.js";

function renderAuthRoute() {
  const appContent = document.querySelector(".app__content");

  if (!appContent) {
    return;
  }

  initAuth(appContent);
}

const existingFeatureRoutes = window.appFeatureRoutes || [];

existingFeatureRoutes.push(
  { path: "/", handler: renderAuthRoute },
  { path: "/auth", handler: renderAuthRoute },
);

window.appFeatureRoutes = existingFeatureRoutes;
/**
 * Registra las pantallas públicas de autenticación.
 * @requisito RF-011 Autenticación JWT y MFA
 */
