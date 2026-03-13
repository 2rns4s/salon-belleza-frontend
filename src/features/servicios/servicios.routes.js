import { tieneRol, AUTH_ROLES } from "../../shared/state/authStore.js";
import { navegarA } from "../../shared/router/router.js";
import { initServicios } from "./servicios.controller.js";

window.appFeatureRoutes = window.appFeatureRoutes || [];
window.appFeatureRoutes.push({
    path: "/servicios",
    handler: (container) => {
        // Solo OWNER puede acceder a la gestión de servicios
        if (!tieneRol(AUTH_ROLES.OWNER)) {
            navegarA("/dashboard");
            return;
        }
        initServicios(container);
    },
});
