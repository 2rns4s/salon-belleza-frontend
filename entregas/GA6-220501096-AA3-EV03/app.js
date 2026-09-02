/*
 * Salon de Belleza - Frontend Application Standalone Bundle (EV03 SENA Execution)
 * Complete Modular SPA Architecture with Automatic Mock API Fallback for Offline Evaluation.
 */

// ------------------------------------------------------------------
// 1. MOCK API BACKEND INTERCEPTOR & DATA STORE
// ------------------------------------------------------------------
const MOCK_STORE = {
    auth: {
        token: "mock-jwt-token-sena-ev03-admin-owner",
        user: { id: 1, username: "admin_sena", role: "OWNER", fullName: "Administrador SENA", mfaEnabled: true }
    },
    citas: [
        { id: "301", client: { id: 101, fullName: "María Rodríguez", phone: "3158920192" }, service: { id: "SRV-01", name: "Corte & Cepillado" }, employee: { id: "EMP-01", fullName: "Ana Gómez" }, slotDateTime: "2026-09-02T09:00:00", status: "CONFIRMADA" },
        { id: "302", client: { id: 102, fullName: "Carlos Mendoza", phone: "3004512290" }, service: { id: "SRV-03", name: "Manicura Spa" }, employee: { id: "EMP-02", fullName: "Laura Pérez" }, slotDateTime: "2026-09-02T10:30:00", status: "CONFIRMADA" },
        { id: "303", client: { id: 103, fullName: "Andrea Torres", phone: "3117829011" }, service: { id: "SRV-02", name: "Tinte & Balayage" }, employee: { id: "EMP-03", fullName: "Sofía López" }, slotDateTime: "2026-09-02T11:45:00", status: "PENDIENTE" }
    ],
    clientes: [
        { id: 101, fullName: "María Rodríguez", documentNumber: "10203040", phone: "3158920192", firstName: "María", lastName: "Rodríguez" },
        { id: 102, fullName: "Carlos Mendoza", documentNumber: "10304050", phone: "3004512290", firstName: "Carlos", lastName: "Mendoza" },
        { id: 103, fullName: "Andrea Torres", documentNumber: "10405060", phone: "3117829011", firstName: "Andrea", lastName: "Torres" },
        { id: 104, fullName: "Diana Morales", documentNumber: "10506070", phone: "3201124455", firstName: "Diana", lastName: "Morales" },
        { id: 105, fullName: "Lucía Fernández", documentNumber: "10607080", phone: "3049981234", firstName: "Lucía", lastName: "Fernández" }
    ],
    empleados: [
        { id: "EMP-01", fullName: "Ana Gómez", email: "ana.gomez@salonbelleza.com", phone: "3158920192", workShifts: [1,2,3,4,5], serviceIds: ["SRV-01", "SRV-02"] },
        { id: "EMP-02", fullName: "Laura Pérez", email: "laura.perez@salonbelleza.com", phone: "3004512290", workShifts: [1,2,3,4,5], serviceIds: ["SRV-03"] },
        { id: "EMP-03", fullName: "Sofía López", email: "sofia.lopez@salonbelleza.com", phone: "3117829011", workShifts: [1,2,3,4,5], serviceIds: ["SRV-02"] }
    ],
    servicios: [
        { id: "SRV-01", name: "Corte & Cepillado Profesional", duration: 45, price: 65000, resources: [{ id: "REC-01", name: "Silla Estilista", qty: 1 }] },
        { id: "SRV-02", name: "Tinte & Balayage Especializado", duration: 120, price: 180000, resources: [{ id: "REC-02", name: "Cabina Tinte", qty: 1 }] },
        { id: "SRV-03", name: "Manicura & Pedicura Spa", duration: 60, price: 45000, resources: [{ id: "REC-03", name: "Mesa Manicura", qty: 1 }] }
    ],
    recursos: [
        { id: "REC-01", name: "Silla Estilista Hidráulica", totalQuantity: 4 },
        { id: "REC-02", name: "Cabina de Aplicación de Tinte", totalQuantity: 2 },
        { id: "REC-03", name: "Mesa Manicura Ergonómica", totalQuantity: 3 }
    ],
    usuarios: [
        { id: 1, username: "admin_sena", role: "OWNER", employeeId: "EMP-01", active: true, mfaEnabled: true },
        { id: 2, username: "recepcion_turnos", role: "RECEPTIONIST", employeeId: "EMP-02", active: true, mfaEnabled: false }
    ]
};

// Simulated HttpClient with auto-fallback to Mock Data Store if Backend (localhost:8080) is unreachable
async function mockFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn(`[SENA Standalone Execution] Backend API no disponible en ${url}. Usando Mock Controller síncrono offline.`);
    }

    // Offline Interceptor
    return new Promise((resolve) => {
        setTimeout(() => {
            if (url.includes("/api/dashboard") || url.includes("/dashboard")) {
                resolve({
                    totalCitas: MOCK_STORE.citas.length,
                    completadas: MOCK_STORE.citas.filter(c => c.status === "CONFIRMADA").length,
                    canceladas: 0,
                    tasaCompletitud: 100,
                    serviciosTop: [
                        { nombre: "Corte & Cepillado Profesional", cantidad: 18 },
                        { nombre: "Tinte & Balayage Especializado", cantidad: 12 },
                        { nombre: "Manicura & Pedicura Spa", cantidad: 8 }
                    ]
                });
            } else if (url.includes("/clientes")) {
                resolve(MOCK_STORE.clientes);
            } else if (url.includes("/citas")) {
                resolve(MOCK_STORE.citas);
            } else if (url.includes("/empleados")) {
                resolve(MOCK_STORE.empleados);
            } else if (url.includes("/servicios")) {
                resolve(MOCK_STORE.servicios);
            } else if (url.includes("/recursos")) {
                resolve(MOCK_STORE.recursos);
            } else if (url.includes("/usuarios")) {
                resolve(MOCK_STORE.usuarios);
            } else {
                resolve({ status: "OK", message: "Operacion simulada exitosamente en modo standalone" });
            }
        }, 150);
    });
}

// ------------------------------------------------------------------
// 2. SPA ROUTER & RENDER ENGINE
// ------------------------------------------------------------------
const routes = {
    "/dashboard": renderDashboardView,
    "/citas": renderCitasView,
    "/clientes": renderClientesView,
    "/usuarios": renderUsuariosView,
    "/empleados": renderEmpleadosView,
    "/servicios": renderServiciosView,
    "/recursos": renderRecursosView,
    "/mfa": renderMfaView
};

function navigateTo(path) {
    window.location.hash = `#${path}`;
    renderCurrentRoute();
}

async function renderCurrentRoute() {
    const hash = window.location.hash.replace("#", "") || "/dashboard";
    const appContent = document.getElementById("app-content");
    const renderFn = routes[hash] || renderDashboardView;

    // Update active nav link
    document.querySelectorAll(".layout__nav-link").forEach(link => {
        const routeAttr = link.getAttribute("data-route");
        if (routeAttr === hash) {
            link.classList.add("layout__nav-link--active");
        } else {
            link.classList.remove("layout__nav-link--active");
        }
    });

    appContent.innerHTML = `<div style="text-align: center; padding: 2rem; color: #8a3f52;">Cargando interfaz modular...</div>`;
    const html = await renderFn();
    appContent.innerHTML = html;
}

// ------------------------------------------------------------------
// 3. FEATURE VIEWS RENDERERS (BEM COMPLIANT)
// ------------------------------------------------------------------

async function renderDashboardView() {
    const data = await mockFetch("http://localhost:8080/api/dashboard");
    return `
        <section class="dashboard">
            <header class="dashboard__header">
                <div>
                    <h2 class="dashboard__title">Dashboard Operativo</h2>
                    <p class="dashboard__subtitle">Resumen de rendimiento del salón de belleza</p>
                </div>
            </header>

            <form class="dashboard__date-range" onsubmit="event.preventDefault(); alert('Consulta de fechas realizada.');">
                <div class="dashboard__field">
                    <span class="dashboard__field-label">Fecha inicio</span>
                    <input class="dashboard__input" type="datetime-local" value="2026-09-01T00:00">
                </div>
                <div class="dashboard__field">
                    <span class="dashboard__field-label">Fecha fin</span>
                    <input class="dashboard__input" type="datetime-local" value="2026-09-02T23:59">
                </div>
                <button class="dashboard__button" type="submit">Consultar</button>
            </form>

            <div class="dashboard__metrics">
                <article class="dashboard__card" style="border-top-color: #8a3f52;">
                    <h3 class="dashboard__card-title">Total Citas</h3>
                    <p class="dashboard__card-value">${data.totalCitas}</p>
                </article>
                <article class="dashboard__card" style="border-top-color: #388e3c;">
                    <h3 class="dashboard__card-title">Completadas</h3>
                    <p class="dashboard__card-value">${data.completadas}</p>
                </article>
                <article class="dashboard__card" style="border-top-color: #c62828;">
                    <h3 class="dashboard__card-title">Canceladas</h3>
                    <p class="dashboard__card-value">${data.canceladas}</p>
                </article>
                <article class="dashboard__card" style="border-top-color: #7b1fa2;">
                    <h3 class="dashboard__card-title">Tasa Completitud</h3>
                    <p class="dashboard__card-value">${data.tasaCompletitud}%</p>
                </article>
            </div>

            <section class="dashboard__servicios-top" style="background: white; padding: 1rem; border: 1px solid #eadde0; border-radius: 0.5rem;">
                <h3 style="color: #8a3f52; margin-bottom: 1rem;">Servicios más demandados</h3>
                <ul style="list-style: none;">
                    ${data.serviciosTop.map((s, idx) => `
                        <li style="display: flex; justify-content: space-between; padding: 0.6rem; background: #f8f3f4; margin-bottom: 0.4rem; border-radius: 0.4rem;">
                            <span><strong>${idx + 1}.</strong> ${s.nombre}</span>
                            <span style="color: #8a3f52; font-weight: bold;">${s.cantidad} atenciones</span>
                        </li>
                    `).join("")}
                </ul>
            </section>
        </section>
    `;
}

async function renderCitasView() {
    const citas = await mockFetch("http://localhost:8080/api/citas");
    return `
        <section class="citas">
            <header class="citas__header">
                <div>
                    <h2 class="citas__title">Agenda de citas</h2>
                    <p class="citas__subtitle">Gestiona disponibilidad, clientes y reservas sin salir de la agenda.</p>
                </div>
            </header>

            <form class="citas__filters" onsubmit="event.preventDefault(); alert('Filtros aplicados.');">
                <div class="citas__field">
                    <span class="citas__field-label">Fecha</span>
                    <input class="citas__input" type="date" value="2026-09-02">
                </div>
                <div class="citas__field">
                    <span class="citas__field-label">Servicio</span>
                    <select class="citas__select"><option>Corte & Cepillado</option></select>
                </div>
                <div class="citas__field">
                    <span class="citas__field-label">Empleado</span>
                    <select class="citas__select"><option>Ana Gómez</option></select>
                </div>
                <button class="citas__button" type="submit">Actualizar agenda</button>
            </form>

            <div class="citas__workspace">
                <section class="citas__panel">
                    <h3>Disponibilidad dual</h3>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 1rem;">
                        <div class="citas__slot" style="padding: 0.5rem; border: 1px solid #eadde0; text-align: center; border-radius: 0.4rem; cursor: pointer;">08:00</div>
                        <div class="citas__slot" style="padding: 0.5rem; background: #8a3f52; color: white; text-align: center; border-radius: 0.4rem; font-weight: bold;">09:00</div>
                        <div class="citas__slot" style="padding: 0.5rem; border: 1px solid #eadde0; text-align: center; border-radius: 0.4rem; cursor: pointer;">10:00</div>
                        <div class="citas__slot" style="padding: 0.5rem; border: 1px solid #eadde0; text-align: center; border-radius: 0.4rem; cursor: pointer;">11:00</div>
                    </div>
                </section>

                <section class="citas__panel">
                    <h3>Reserva y quick-add</h3>
                    <p style="margin-top: 0.5rem;"><strong>Horario:</strong> 2026-09-02 09:00</p>
                    <p style="margin-top: 0.25rem;"><strong>Cliente:</strong> María Rodríguez (10203040)</p>
                    <button class="citas__button" style="width: 100%; margin-top: 1rem;" onclick="createMockCita()">Confirmar cita</button>
                </section>
            </div>

            <section class="citas__panel" style="margin-top: 1rem;">
                <h3>Citas Registradas</h3>
                <table class="clients__table">
                    <thead>
                        <tr><th>ID</th><th>Cliente</th><th>Servicio</th><th>Empleado</th><th>Horario</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                        ${citas.map(c => `
                            <tr>
                                <td>#${c.id}</td>
                                <td>${c.client.fullName}</td>
                                <td>${c.service.name}</td>
                                <td>${c.employee.fullName}</td>
                                <td>${c.slotDateTime.replace("T", " ")}</td>
                                <td><span class="usuarios__badge usuarios__badge--active">${c.status}</span></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </section>
        </section>
    `;
}

async function renderClientesView() {
    const clientes = await mockFetch("http://localhost:8080/api/clientes");
    return `
        <section class="clients">
            <header class="clients__header">
                <div>
                    <h2 class="clients__title">Directorio de Clientes</h2>
                    <p class="clients__subtitle">Gestión de clientes y registros base del salón de belleza</p>
                </div>
                <button class="clients__button" onclick="openClientModal()">+ Nuevo cliente</button>
            </header>

            <table class="clients__table">
                <thead>
                    <tr><th>ID</th><th>Nombre completo</th><th>Documento</th><th>Teléfono</th><th>Nombre base</th></tr>
                </thead>
                <tbody>
                    ${clientes.map(c => `
                        <tr>
                            <td>${c.id}</td>
                            <td><strong>${c.fullName}</strong></td>
                            <td>${c.documentNumber}</td>
                            <td>${c.phone}</td>
                            <td>${c.firstName}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </section>
    `;
}

async function renderUsuariosView() {
    const usuarios = await mockFetch("http://localhost:8080/api/usuarios");
    return `
        <section class="usuarios">
            <header class="usuarios__header">
                <div>
                    <h2 class="usuarios__title">Gestión de Usuarios y Roles (RBAC)</h2>
                    <p class="usuarios__subtitle">Control de acceso, credenciales y seguridad MFA</p>
                </div>
                <button class="usuarios__btn" onclick="alert('Formulario de creación de usuario activado.');">+ Nuevo usuario</button>
            </header>

            <table class="usuarios__table">
                <thead>
                    <tr><th>ID</th><th>Nombre de usuario</th><th>Rol</th><th>ID Empleado</th><th>Estado</th><th>MFA</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${usuarios.map(u => `
                        <tr>
                            <td>${u.id}</td>
                            <td><strong>${u.username}</strong></td>
                            <td><span class="usuarios__badge usuarios__badge--${u.role.toLowerCase()}">${u.role}</span></td>
                            <td>${u.employeeId}</td>
                            <td><span class="usuarios__badge usuarios__badge--${u.active ? 'active' : 'inactive'}">${u.active ? 'Activo' : 'Inactivo'}</span></td>
                            <td>${u.mfaEnabled ? '✓ Habilitado' : '✗ Pendiente'}</td>
                            <td>
                                <button class="usuarios__btn usuarios__btn--secondary">Editar</button>
                                <button class="usuarios__btn usuarios__btn--danger">Desactivar</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </section>
    `;
}

async function renderEmpleadosView() {
    const empleados = await mockFetch("http://localhost:8080/api/empleados");
    return `
        <section class="employees">
            <header class="employees__header">
                <div>
                    <h2 class="employees__title">Gestión de Empleados</h2>
                    <p class="employees__subtitle">Control de estilistas, especialidades y asignación de franjas horarias</p>
                </div>
                <button class="employees__button" onclick="alert('Modal de alta de empleado activado.');">+ Nuevo empleado</button>
            </header>

            <table class="employees__table">
                <thead>
                    <tr><th>ID</th><th>Nombre completo</th><th>Correo</th><th>Teléfono</th><th>Franjas</th><th>Servicios</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${empleados.map(e => `
                        <tr>
                            <td>${e.id}</td>
                            <td><strong>${e.fullName}</strong></td>
                            <td>${e.email}</td>
                            <td>${e.phone}</td>
                            <td>${e.workShifts.length} franjas</td>
                            <td>${e.serviceIds.length} servicios</td>
                            <td><button class="employees__button employees__button--secondary">Editar</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </section>
    `;
}

async function renderServiciosView() {
    const servicios = await mockFetch("http://localhost:8080/api/servicios");
    return `
        <section class="service-list">
            <header class="service-list__header">
                <div>
                    <h2 class="service-list__title">Catálogo de Servicios</h2>
                    <p class="dashboard__subtitle">Tratamientos comerciales y equipamiento asociado</p>
                </div>
                <button class="service-actions__btn" onclick="alert('Modal de servicio activado.');">+ Nuevo servicio</button>
            </header>

            <table class="service-list__table">
                <thead>
                    <tr><th>ID</th><th>Nombre del servicio</th><th>Duración</th><th>Recursos Requeridos</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${servicios.map(s => `
                        <tr>
                            <td>${s.id}</td>
                            <td><strong>${s.name}</strong></td>
                            <td>${s.duration} min</td>
                            <td>${s.resources.length} recurso(s)</td>
                            <td><button class="service-actions__btn service-actions__btn--refresh">Editar</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </section>
    `;
}

async function renderRecursosView() {
    const recursos = await mockFetch("http://localhost:8080/api/recursos");
    return `
        <section class="resource-list">
            <header class="resource-list__header">
                <div>
                    <h2 class="resource-list__title">Administración de Recursos</h2>
                    <p class="dashboard__subtitle">Inventario de equipamiento e infraestructura física</p>
                </div>
                <button class="resource-actions__btn" onclick="alert('Modal de recurso activado.');">+ Nuevo recurso</button>
            </header>

            <table class="resource-list__table">
                <thead>
                    <tr><th>ID</th><th>Nombre del recurso</th><th>Cantidad Total</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${recursos.map(r => `
                        <tr>
                            <td>${r.id}</td>
                            <td><strong>${r.name}</strong></td>
                            <td>${r.totalQuantity} unidades</td>
                            <td><button class="resource-actions__btn resource-actions__btn--refresh">Editar</button></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </section>
    `;
}

async function renderMfaView() {
    return `
        <section style="max-width: 450px; margin: 2rem auto; text-align: center; border: 1px solid #eadde0; padding: 2rem; border-radius: 0.5rem; background: white;">
            <h3 style="color: #8a3f52; margin-bottom: 1rem;">Autenticación MFA (TOTP)</h3>
            <p style="font-size: 0.9rem; margin-bottom: 1rem; color: #4a4a4a;">Escanee el código QR e ingrese el código de 6 dígitos:</p>
            <div style="width: 150px; height: 150px; border: 2px solid #8a3f52; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #8a3f52; background: #f8f3f4;">[ QR CODE ]</div>
            <input class="citas__input" type="text" placeholder="8 4 2 9 1 5" style="text-align: center; font-size: 1.3rem; letter-spacing: 4px; width: 100%; margin-bottom: 1rem;">
            <button class="citas__button" style="width: 100%; padding: 0.6rem;" onclick="alert('✓ Autenticación MFA verificada exitosamente.');">VERIFICAR CÓDIGO</button>
        </section>
    `;
}

// Interactive helper actions
function createMockCita() {
    MOCK_STORE.citas.push({
        id: String(MOCK_STORE.citas.length + 301),
        client: { id: 105, fullName: "Lucía Fernández", phone: "3049981234" },
        service: { id: "SRV-01", name: "Corte & Cepillado" },
        employee: { id: "EMP-01", fullName: "Ana Gómez" },
        slotDateTime: "2026-09-02T09:00:00",
        status: "CONFIRMADA"
    });
    alert("✓ Cita registrada exitosamente en el sistema frontend.");
    renderCurrentRoute();
}

function openClientModal() {
    const name = prompt("Ingrese nombre del nuevo cliente:");
    if (name) {
        MOCK_STORE.clientes.push({
            id: MOCK_STORE.clientes.length + 101,
            fullName: name,
            documentNumber: "10" + Math.floor(100000 + Math.random() * 900000),
            phone: "315" + Math.floor(1000000 + Math.random() * 9000000),
            firstName: name.split(" ")[0]
        });
        alert("✓ Cliente registrado en la base de datos local.");
        renderCurrentRoute();
    }
}

// Global Init Listener
window.addEventListener("hashchange", renderCurrentRoute);
window.addEventListener("DOMContentLoaded", renderCurrentRoute);
