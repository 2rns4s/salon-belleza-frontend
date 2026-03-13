import { tieneRol, AUTH_ROLES } from "../../shared/state/authStore.js";
import { navegarA } from "../../shared/router/router.js";
import { initRecursos } from "./recursos.controller.js";

window.appFeatureRoutes = window.appFeatureRoutes || [];
window.appFeatureRoutes.push({
    path: "/recursos",
    handler: (container) => {
        // Solo OWNER puede acceder a la gestión de recursos
        if (!tieneRol(AUTH_ROLES.OWNER)) {
            navegarA("/dashboard");
            return;
        }
        initRecursos(container);
    },
});
