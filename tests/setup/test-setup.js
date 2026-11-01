import { afterEach, beforeEach } from "vitest";

// Polyfill defensivo de Web Storage.
// Con Node >=26 y jsdom 24, jsdom no expone localStorage/sessionStorage en el
// contexto global de pruebas. Solo lo definimos cuando falta, para no pisar una
// implementación real si una versión futura de jsdom la provee.
function createMemoryStorage() {
    let store = new Map();

    return {
        getItem(key) {
            return store.has(String(key)) ? store.get(String(key)) : null;
        },
        setItem(key, value) {
            store.set(String(key), String(value));
        },
        removeItem(key) {
            store.delete(String(key));
        },
        clear() {
            store = new Map();
        },
        key(index) {
            return Array.from(store.keys())[index] ?? null;
        },
        get length() {
            return store.size;
        },
    };
}

if (typeof globalThis.localStorage === "undefined") {
    globalThis.localStorage = createMemoryStorage();
}

if (typeof globalThis.sessionStorage === "undefined") {
    globalThis.sessionStorage = createMemoryStorage();
}

beforeEach(() => {
    document.body.innerHTML = "";
    window.location.hash = "#/";
    window.appFeatureRoutes = [];
    localStorage.clear();
});

afterEach(() => {
    document.body.innerHTML = "";
});
