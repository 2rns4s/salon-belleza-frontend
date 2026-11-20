import { tieneRol } from "../state/authStore.js";
import { navegarA } from "./router.js";

// Reuse the same dashboard redirect when a feature is outside the user's role.
export function requireRole(role) {
  if (tieneRol(role)) {
    return true;
  }

  navegarA("/dashboard");
  return false;
}
