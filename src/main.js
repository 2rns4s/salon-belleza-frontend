import { iniciarRouter, registrarRuta } from "./shared/router/router.js";
import { inicializarAuth } from "./features/auth/auth.controller.js";

const contenedor = document.querySelector(".app__contenido");

// Registro de rutas de la aplicacion
registrarRuta("/", () => inicializarAuth(contenedor));
registrarRuta("/auth", () => inicializarAuth(contenedor));
// Ruta temporal mientras se implementa el dashboard real
registrarRuta("/dashboard", () => {
    contenedor.innerHTML = "<p class=\"app__texto\">Autenticacion completada correctamente. Dashboard pendiente de implementacion.</p>";
});
registrarRuta("/404", () => {
    contenedor.innerHTML = "<p class=\"app__texto\">Ruta no encontrada.</p>";
});

// Arranca el router (punto unico de entrada)
iniciarRouter();
