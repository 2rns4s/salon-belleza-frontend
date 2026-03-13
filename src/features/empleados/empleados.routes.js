import { tieneRol, AUTH_ROLES } from "../../shared/state/authStore.js";
import { navegarA } from "../../shared/router/router.js";
import { initEmpleados } from "./empleados.controller.js";

window.appFeatureRoutes = window.appFeatureRoutes || [];
window.appFeatureRoutes.push({
    path: "/empleados",
    handler: (container) => {
        // Solo OWNER puede acceder a la gestión de empleados
        if (!tieneRol(AUTH_ROLES.OWNER)) {
            navegarA("/dashboard");
            return;
        }
        initEmpleados(container);
    },
});