import { navegarA } from "../../shared/router/router.js";
import { httpClient } from "../../shared/services/httpClient.js";
import { AUTH_ROLES, obtenerToken } from "../../shared/state/authStore.js";
import { requireAuth } from "../../shared/router/requireAuth.js";

const numberFormat = new Intl.NumberFormat("es-CO");
const percentFormat = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 2 });

function renderResults(results, { rendimiento, serviciosTop }) {
  const fields = {
    totalCitas: numberFormat.format(rendimiento.totalCitas),
    completadas: numberFormat.format(rendimiento.completadas),
    canceladas: numberFormat.format(rendimiento.canceladas),
    tasaCompletitud: percentFormat.format(rendimiento.tasaCompletitud / 100),
  };

  for (const [field, value] of Object.entries(fields)) {
    results.querySelector(`[data-metric="${field}"]`).textContent = value;
  }

  const ranking = results.querySelector("ol");
  ranking.replaceChildren(...serviciosTop.map(({ nombreServicio, cantidadRealizada }) => {
    const item = document.createElement("li");
    item.textContent = `${nombreServicio} — ${numberFormat.format(cantidadRealizada)}`;
    return item;
  }));
  const empty = serviciosTop.length === 0;
  ranking.hidden = empty;
  results.querySelector("[data-empty]").hidden = !empty;
  results.hidden = false;
}

/** Consulta el rendimiento de citas y los servicios realizados para el propietario. */
export function renderDashboardRoute(container) {
  const user = requireAuth();
  if (!user) return;

  const token = obtenerToken();
  if (user.normalizedRole !== AUTH_ROLES.OWNER) {
    navegarA("/citas");
    return;
  }

  container.innerHTML = `
    <section class="dashboard" aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">Panel principal</h1>
      <form class="dashboard__filters">
        <label>Desde <input type="date" name="inicio" required></label>
        <label>Hasta <input type="date" name="fin" required></label>
        <button type="submit">Consultar</button>
      </form>
      <p class="dashboard__status" role="status"></p>
      <div class="dashboard__results" hidden>
        <dl class="dashboard__metrics">
          <div><dt>Total de citas</dt><dd data-metric="totalCitas"></dd></div>
          <div><dt>Citas realizadas</dt><dd data-metric="completadas"></dd></div>
          <div><dt>Citas canceladas</dt><dd data-metric="canceladas"></dd></div>
          <div><dt>Tasa de completitud</dt><dd data-metric="tasaCompletitud"></dd></div>
        </dl>
        <section class="dashboard__ranking">
          <h2>Servicios más realizados</h2>
          <ol></ol>
          <p data-empty hidden>No hubo servicios realizados en este período.</p>
        </section>
      </div>
    </section>`;

  const dashboard = container.querySelector(".dashboard");
  const form = dashboard.querySelector("form");
  const status = dashboard.querySelector("[role=status]");
  const results = dashboard.querySelector(".dashboard__results");
  const start = form.elements.inicio;
  const end = form.elements.fin;
  const button = form.querySelector("button");
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  start.value = `${yearMonth}-01`;
  end.value = `${yearMonth}-${new Date(year, month + 1, 0).getDate()}`;

  async function loadDashboard() {
    if (button.disabled || !form.reportValidity()) return;

    results.hidden = true;
    if (start.value > end.value) {
      status.textContent = "La fecha inicial debe ser anterior o igual a la fecha final.";
      return;
    }

    const query = new URLSearchParams({
      fechaInicio: `${start.value}T00:00:00`,
      fechaFin: `${end.value}T23:59:59`,
    });
    start.disabled = end.disabled = button.disabled = true;
    status.textContent = "Consultando métricas…";

    try {
      const data = await httpClient(`/api/v1/dashboard?${query}`);
      // Una respuesta tardía no debe mostrar datos después de navegar o cerrar sesión.
      if (dashboard.isConnected && window.location.hash === "#/dashboard" && obtenerToken() === token) {
        renderResults(results, data);
        status.textContent = "";
      }
    } catch {
      status.textContent = "No se pudieron cargar las métricas. Vuelve a pulsar Consultar para reintentar.";
    } finally {
      start.disabled = end.disabled = button.disabled = false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void loadDashboard();
  });
  void loadDashboard();
}
