import { obtenerToken, resolveAuthUserContext } from "../state/authStore.js";
import { navegarA } from "./router.js";

/** Devuelve el contexto de sesión válido o deriva al inicio de sesión. */
export function requireAuth() {
  const context = resolveAuthUserContext();
  if (obtenerToken() && context.hasSession && !context.isTokenExpired && !context.isTokenMalformed) {
    return context;
  }

  navegarA("/auth");
  return null;
}
