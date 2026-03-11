import { afterEach, beforeEach } from "vitest";

beforeEach(() => {
    document.body.innerHTML = "";
    window.location.hash = "#/";
    window.appFeatureRoutes = [];
    localStorage.clear();
});

afterEach(() => {
    document.body.innerHTML = "";
});
