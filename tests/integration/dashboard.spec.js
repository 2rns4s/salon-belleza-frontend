import { beforeEach, expect, it, vi } from "vitest";
import { renderDashboardRoute } from "../../src/features/dashboard/dashboard.js";
import { setAuthToken } from "../../src/shared/storage/authTokenStorage.js";

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<main id="app"></main>';
  window.location.hash = "#/dashboard";
});

function setRole(role) {
  const payload = btoa(JSON.stringify({ roles: [`ROLE_${role}`] }));
  setAuthToken(`header.${payload}.signature`);
}

it.each([[null, "#/auth"], ["RECEPTIONIST", "#/citas"]])(
  "redirects %s without requesting the owner report",
  (role, destination) => {
    if (role) setRole(role);
    const fetch = vi.spyOn(globalThis, "fetch");
    renderDashboardRoute(document.querySelector("main"));
    expect(window.location.hash).toBe(destination);
    expect(fetch).not.toHaveBeenCalled();
  },
);

it("retries an unsuccessful query and renders the report for the selected range", async () => {
  setRole("OWNER");
  const fetch = vi.spyOn(globalThis, "fetch")
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        rendimiento: { totalCitas: 42, completadas: 30, canceladas: 8, tasaCompletitud: 71.43 },
        serviciosTop: [{ nombreServicio: "<b>Corte</b>", cantidadRealizada: 15 }],
      }),
    });
  const container = document.querySelector("main");
  renderDashboardRoute(container);
  await vi.waitFor(() => expect(container.querySelector("[role=status]").textContent).toContain("reintentar"));

  const form = container.querySelector("form");
  form.elements.inicio.value = "2026-04-01";
  form.elements.fin.value = "2026-04-30";
  form.requestSubmit();

  await vi.waitFor(() => expect(container.querySelector("[data-metric=totalCitas]").textContent).toBe("42"));
  const [url, options] = fetch.mock.calls[1];
  expect(new URL(url).pathname).toBe("/api/v1/dashboard");
  expect(Object.fromEntries(new URL(url).searchParams)).toEqual({
    fechaInicio: "2026-04-01T00:00:00",
    fechaFin: "2026-04-30T23:59:59",
  });
  expect(options.headers.Authorization).toMatch(/^Bearer /);
  expect(container.querySelector("li").textContent).toBe("<b>Corte</b> — 15");
  expect(container.querySelector("li b")).toBeNull();
});
