/**
 * Helper de montaje de una feature de gestion (recursos, servicios, empleados...).
 *
 * Todos los modulos CRUD montan su pantalla de la misma forma:
 *   1. Resuelven el contenedor (un Element recibido, o por defecto `.app__content`).
 *   2. Se suscriben a dos eventos DELEGADOS en ese contenedor: `click` y `submit`
 *      (un solo listener por tipo que atiende todos los botones/formularios dentro).
 *   3. Al volver a montar, primero dan de baja los listeners anteriores para no
 *      duplicarlos.
 *
 * Esa "fontaneria" era identica en cada controller. Aqui se define una sola vez.
 * Cada feature aporta lo suyo: como se pinta la pantalla (`render`) y que hacer
 * ante un click o un submit (`onClick`, `onSubmit`). La logica del modulo sigue
 * viviendo en su controller; esto solo resuelve el contenedor y el alta/baja de
 * los dos listeners.
 *
 * @param {object} config
 * @param {() => string} config.render     Devuelve el HTML de la pantalla segun el estado actual.
 * @param {(event: Event) => void} config.onClick   Manejador del click delegado del contenedor.
 * @param {(event: Event) => void} config.onSubmit  Manejador del submit delegado del contenedor.
 * @returns {{ mount: (container?: Element) => Element|null, unmount: () => void, renderScreen: () => void, getContainer: () => Element|null }}
 */
export function createFeatureMount({ render, onClick, onSubmit }) {
    let domContainer = null;

    function resolveContainer(container) {
        if (container instanceof Element) return container;
        if (typeof document === "undefined") return null;
        const appContent = document.querySelector(".app__content");
        return appContent instanceof Element ? appContent : null;
    }

    function renderScreen() {
        if (!domContainer) return;
        domContainer.innerHTML = render();
    }

    function unmount() {
        if (!domContainer) return;
        if (onClick) domContainer.removeEventListener("click", onClick);
        if (onSubmit) domContainer.removeEventListener("submit", onSubmit);
    }

    function mount(container) {
        unmount();
        domContainer = resolveContainer(container);
        if (domContainer) {
            if (onClick) domContainer.addEventListener("click", onClick);
            if (onSubmit) domContainer.addEventListener("submit", onSubmit);
        }
        return domContainer;
    }

    return {
        mount,
        unmount,
        renderScreen,
        getContainer: () => domContainer,
    };
}
