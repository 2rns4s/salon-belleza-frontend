/**
 * Salón de Belleza - Engine Frontend Standalone Dummy
 * Evidencia SENA: GA6-220501096-AA4-EV03
 * 
 * 100% Desconectado de Backend | Simulación de Roles (Admin vs Receptionist)
 * Calendario Interactivo de Citas & Simulación de MFA TOTP
 */

// ------------------------------------------------------------------
// 1. ESTADO GLOBAL EN MEMORIA (MOCK DATA)
// ------------------------------------------------------------------
const state = {
    currentRole: null, // 'OWNER' | 'RECEPTIONIST'
    currentRoute: 'citas',
    
    // Citas iniciales harcodeadas
    citas: [
        {
            id: 'CIT-101',
            clienteId: 'CLI-1',
            clienteNombre: 'Valentina Ríos',
            servicioId: 'SERV-1',
            servicioNombre: 'Corte & Cepillado Profesional',
            empleadoId: 'EMP-1',
            empleadoNombre: 'Camila Torres',
            fecha: new Date().toISOString().split('T')[0],
            hora: '09:00',
            estado: 'CONFIRMADA',
            notas: 'Cliente preferencial. Alergia suave a fragancias fuertes.'
        },
        {
            id: 'CIT-102',
            clienteId: 'CLI-2',
            clienteNombre: 'Carlos Mendoza',
            servicioId: 'SERV-2',
            servicioNombre: 'Barbería Completa & Perfilado',
            empleadoId: 'EMP-2',
            empleadoNombre: 'Mateo Gómez',
            fecha: new Date().toISOString().split('T')[0],
            hora: '10:30',
            estado: 'PENDIENTE',
            notas: 'Solicitó confirmación vía WhatsApp 1h antes.'
        },
        {
            id: 'CIT-103',
            clienteId: 'CLI-3',
            clienteNombre: 'Mariana López',
            servicioId: 'SERV-3',
            servicioNombre: 'Manicura Spa & Gelish',
            empleadoId: 'EMP-3',
            empleadoNombre: 'Sofia Herrera',
            fecha: new Date().toISOString().split('T')[0],
            hora: '14:00',
            estado: 'REALIZADA',
            notas: 'Pago realizado con tarjeta de crédito.'
        }
    ],

    // Clientes mock
    clientes: [
        { id: 'CLI-1', nombre: 'Valentina Ríos', documento: '1098765432', telefono: '3001234567', email: 'valentina@gmail.com', citasTotales: 5 },
        { id: 'CLI-2', nombre: 'Carlos Mendoza', documento: '1012345678', telefono: '3109876543', email: 'carlos.m@hotmail.com', citasTotales: 2 },
        { id: 'CLI-3', nombre: 'Mariana López', documento: '1033445566', telefono: '3205554433', email: 'mariana.lopez@yahoo.com', citasTotales: 8 },
        { id: 'CLI-4', nombre: 'Andrea Restrepo', documento: '1077889900', telefono: '3157778899', email: 'andrea.r@gmail.com', citasTotales: 1 }
    ],

    // Empleados mock
    empleados: [
        { id: 'EMP-1', nombre: 'Camila Torres', cargo: 'Estilista Senior', especialidad: 'Corte y Cepillado', telefono: '3012223344', estado: 'ACTIVO' },
        { id: 'EMP-2', nombre: 'Mateo Gómez', cargo: 'Barbero Principal', especialidad: 'Barbería y Perfilado', telefono: '3023334455', estado: 'ACTIVO' },
        { id: 'EMP-3', nombre: 'Sofia Herrera', cargo: 'Especialista en Uñas', especialidad: 'Manicura Spa y Pedicura', telefono: '3034445566', estado: 'ACTIVO' }
    ],

    // Servicios mock
    servicios: [
        { id: 'SERV-1', nombre: 'Corte & Cepillado Profesional', duracionMin: 45, precio: 65000, recursos: 'Silla Estilista' },
        { id: 'SERV-2', nombre: 'Barbería Completa & Perfilado', duracionMin: 30, precio: 45000, recursos: 'Silla Barbero, Kit Navajas' },
        { id: 'SERV-3', nombre: 'Manicura Spa & Gelish', duracionMin: 60, precio: 55000, recursos: 'Estación Manicura, Lámpara UV' }
    ],

    // Recursos mock
    recursos: [
        { id: 'REC-1', nombre: 'Silla Estilista Hidráulica', cantidad: 4, estado: 'OPERATIVO' },
        { id: 'REC-2', nombre: 'Estación de Manicura', cantidad: 3, estado: 'OPERATIVO' },
        { id: 'REC-3', nombre: 'Lámpara Secado UV/LED', cantidad: 3, estado: 'OPERATIVO' }
    ],

    // Usuarios del sistema mock
    usuarios: [
        { id: 'USR-1', usuario: 'admin_owner', email: 'owner@salonbelleza.com', rol: 'OWNER', mfaActivo: true },
        { id: 'USR-2', usuario: 'recepcion_diana', email: 'diana.recepcion@salonbelleza.com', rol: 'RECEPTIONIST', mfaActivo: false }
    ],

    // Estado del MFA TOTP
    mfaState: {
        enabled: false,
        secret: 'JBSWY3DPEHPK3PXP',
        recoveryCodes: ['8492-1029', '5930-4821', '1948-5029', '3029-4820']
    }
};

// Configuración de módulos por rol
const ROLE_PERMISSIONS = {
    OWNER: ['dashboard', 'citas', 'clientes', 'usuarios', 'empleados', 'servicios', 'recursos', 'mfa'],
    RECEPTIONIST: ['citas', 'clientes']
};

const MODULE_NAV_CONFIG = [
    { id: 'dashboard', label: 'Dashboard', roles: ['OWNER'] },
    { id: 'citas', label: 'Agenda de Citas', roles: ['OWNER', 'RECEPTIONIST'] },
    { id: 'clientes', label: 'Clientes', roles: ['OWNER', 'RECEPTIONIST'] },
    { id: 'usuarios', label: 'Usuarios', roles: ['OWNER'] },
    { id: 'empleados', label: 'Empleados', roles: ['OWNER'] },
    { id: 'servicios', label: 'Servicios', roles: ['OWNER'] },
    { id: 'recursos', label: 'Recursos', roles: ['OWNER'] },
    { id: 'mfa', label: 'Seguridad MFA', roles: ['OWNER'] }
];

// ------------------------------------------------------------------
// 2. INICIALIZACIÓN Y GESTIÓN DE ROLES
// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Si no hay rol seleccionado, mostrar el overlay
    if (!state.currentRole) {
        document.getElementById('role-selector-overlay').classList.remove('hidden');
    }
    
    // Router Hash Listener
    window.addEventListener('hashchange', handleRouteHashChange);
});

function selectRole(role) {
    state.currentRole = role;
    
    // Ocultar overlay de rol y mostrar layout principal
    document.getElementById('role-selector-overlay').classList.add('hidden');
    document.getElementById('app-layout').classList.remove('hidden');

    // Actualizar badge de rol en el header
    const badgeEl = document.getElementById('current-role-badge');
    const textEl = document.getElementById('role-badge-text');
    
    if (role === 'OWNER') {
        badgeEl.className = 'role-badge role-badge--admin';
        textEl.textContent = 'Rol: Administrador (Owner)';
        state.currentRoute = 'dashboard';
    } else {
        badgeEl.className = 'role-badge role-badge--receptionist';
        textEl.textContent = 'Rol: Recepcionista';
        state.currentRoute = 'citas'; // Recepcionista inicia directo en Citas
    }

    renderNavigationMenu();
    navigateTo(state.currentRoute);
}

function showRoleSelectorModal() {
    document.getElementById('role-selector-overlay').classList.remove('hidden');
}

// ------------------------------------------------------------------
// 3. SPA ROUTER & RENDER ENGINE
// ------------------------------------------------------------------
function renderNavigationMenu() {
    const navMenuEl = document.getElementById('nav-menu');
    navMenuEl.innerHTML = '';

    MODULE_NAV_CONFIG.forEach(item => {
        // Mostrar solo si el rol actual tiene permiso
        if (item.roles.includes(state.currentRole)) {
            const li = document.createElement('li');
            li.className = 'nav-item';
            
            const a = document.createElement('a');
            a.className = `nav-link ${state.currentRoute === item.id ? 'nav-link--active' : ''}`;
            a.href = `#${item.id}`;
            a.textContent = item.label;
            
            li.appendChild(a);
            navMenuEl.appendChild(li);
        }
    });
}

function navigateTo(routeId) {
    window.location.hash = `#${routeId}`;
}

function handleRouteHashChange() {
    const hash = window.location.hash.replace('#', '') || (state.currentRole === 'RECEPTIONIST' ? 'citas' : 'dashboard');
    state.currentRoute = hash;
    
    renderNavigationMenu();
    renderCurrentView(hash);
}

function renderCurrentView(routeId) {
    const mainEl = document.getElementById('main-content');

    // Verificar permisos del rol para la ruta solicitada
    const allowedRoutes = ROLE_PERMISSIONS[state.currentRole] || [];
    if (!allowedRoutes.includes(routeId)) {
        renderAccessDeniedView(mainEl, routeId);
        return;
    }

    switch (routeId) {
        case 'dashboard':
            renderDashboardView(mainEl);
            break;
        case 'citas':
            renderCitasView(mainEl);
            break;
        case 'clientes':
            renderClientesView(mainEl);
            break;
        case 'usuarios':
            renderUsuariosView(mainEl);
            break;
        case 'empleados':
            renderEmpleadosView(mainEl);
            break;
        case 'servicios':
            renderServiciosView(mainEl);
            break;
        case 'recursos':
            renderRecursosView(mainEl);
            break;
        case 'mfa':
            renderMfaView(mainEl);
            break;
        default:
            renderCitasView(mainEl);
    }
}

// ------------------------------------------------------------------
// 4. VISTA 403: ACCESO DENEGADO POR ROL
// ------------------------------------------------------------------
function renderAccessDeniedView(container, targetRoute) {
    container.innerHTML = `
        <div class="access-denied">
            <h2>Acceso Restringido (HTTP 403)</h2>
            <p>Tu rol actual <strong>(${state.currentRole === 'RECEPTIONIST' ? 'Recepcionista' : state.currentRole})</strong> no tiene permisos para acceder al módulo de <strong>${targetRoute.toUpperCase()}</strong>.</p>
            <p class="form-help">Los recepcionistas solo tienen acceso autorizado a la Agenda de Citas y la Gestión de Clientes.</p>
            <button class="btn btn--primary" onclick="navigateTo('citas')">Ir a mi módulo autorizado (Citas)</button>
        </div>
    `;
}

// ------------------------------------------------------------------
// 5. VISTA: DASHBOARD DE MÉTRICAS (ADMIN)
// ------------------------------------------------------------------
function renderDashboardView(container) {
    const totalCitas = state.citas.length;
    const confirmadas = state.citas.filter(c => c.estado === 'CONFIRMADA').length;
    const ingresosEst = state.citas.reduce((acc, c) => acc + 60000, 0);

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Dashboard de Métricas</h1>
                <p>Resumen general del rendimiento del Salón de Belleza</p>
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div>
                    <div class="metric-card__val">${totalCitas}</div>
                    <div class="metric-card__lbl">Citas Agendadas Hoy</div>
                </div>
            </div>
            <div class="metric-card">
                <div>
                    <div class="metric-card__val">${confirmadas}</div>
                    <div class="metric-card__lbl">Citas Confirmadas</div>
                </div>
            </div>
            <div class="metric-card">
                <div>
                    <div class="metric-card__val">${state.clientes.length}</div>
                    <div class="metric-card__lbl">Clientes Registrados</div>
                </div>
            </div>
            <div class="metric-card">
                <div>
                    <div class="metric-card__val">$${ingresosEst.toLocaleString()}</div>
                    <div class="metric-card__lbl">Proyección del Día</div>
                </div>
            </div>
        </div>

        <div class="table-container">
            <div style="padding: 1rem 1.25rem; font-weight:700; border-bottom:1px solid var(--color-border-light);">
                Actividad Reciente de Citas
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Código Cita</th>
                        <th>Cliente</th>
                        <th>Servicio</th>
                        <th>Hora</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.citas.map(c => `
                        <tr>
                            <td><strong>${c.id}</strong></td>
                            <td>${c.clienteNombre}</td>
                            <td>${c.servicioNombre}</td>
                            <td>${c.hora}</td>
                            <td><span class="badge-status badge-status--${c.estado.toLowerCase()}">${c.estado}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ------------------------------------------------------------------
// 6. VISTA: CALENDARIO Y AGENDA DE CITAS (CORE)
// ------------------------------------------------------------------
function renderCitasView(container) {
    const todayStr = new Date().toISOString().split('T')[0];

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Agenda de Citas y Disponibilidad</h1>
                <p>Gestiona la asignación de franjas horarias y citas en tiempo real</p>
            </div>
            <button class="btn btn--primary" onclick="openAppointmentModal()">+ Agendar Nueva Cita</button>
        </div>

        <div class="citas-toolbar">
            <div class="citas-toolbar__filters">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Fecha:</label>
                    <input type="date" id="filter-citas-date" class="form-control" value="${todayStr}" onchange="refreshCalendarGrid()">
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Filtrar por Empleado:</label>
                    <select id="filter-citas-emp" class="form-control" onchange="refreshCalendarGrid()">
                        <option value="ALL">Todos los Empleados</option>
                        ${state.empleados.map(e => `<option value="${e.id}">${e.nombre} (${e.cargo})</option>`).join('')}
                    </select>
                </div>
            </div>
            <div>
                <span class="form-help">Selecciona una franja disponible para agendar directo.</span>
            </div>
        </div>

        <div class="calendar-container">
            <div class="calendar-header">
                <span>Franja Horaria</span>
                <span>Programación de la Jornada (08:00 AM - 06:00 PM)</span>
            </div>
            <div class="calendar-slots" id="calendar-slots-grid">
                <!-- Se dibuja dinámicamente con renderSlots() -->
            </div>
        </div>
    `;

    refreshCalendarGrid();
}

function refreshCalendarGrid() {
    const gridEl = document.getElementById('calendar-slots-grid');
    if (!gridEl) return;

    const selectedDate = document.getElementById('filter-citas-date')?.value || new Date().toISOString().split('T')[0];
    const selectedEmp = document.getElementById('filter-citas-emp')?.value || 'ALL';

    // Generar slots de 30 min desde 08:00 hasta 17:30
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
        const hStr = hour < 10 ? `0${hour}` : `${hour}`;
        slots.push(`${hStr}:00`);
        slots.push(`${hStr}:30`);
    }

    gridEl.innerHTML = slots.map(timeSlot => {
        // Buscar si hay cita en este slot
        const bookedAppointment = state.citas.find(c => {
            const matchDate = c.fecha === selectedDate;
            const matchTime = c.hora === timeSlot;
            const matchEmp = selectedEmp === 'ALL' || c.empleadoId === selectedEmp;
            return matchDate && matchTime && matchEmp && c.estado !== 'CANCELADA';
        });

        if (bookedAppointment) {
            return `
                <div class="slot-row">
                    <div class="slot-time">${timeSlot}</div>
                    <div class="slot-content">
                        <div class="slot-booked">
                            <div class="slot-booked__info">
                                <h5>${bookedAppointment.clienteNombre} &bull; <small style="color:var(--color-header-vinotinto); font-weight:bold;">${bookedAppointment.servicioNombre}</small></h5>
                                <p>Atendido por: <strong>${bookedAppointment.empleadoNombre}</strong> | Notas: ${bookedAppointment.notas || 'Sin notas'}</p>
                            </div>
                            <div style="display:flex; gap:0.5rem; align-items:center;">
                                <span class="badge-status badge-status--${bookedAppointment.estado.toLowerCase()}">${bookedAppointment.estado}</span>
                                <button class="btn btn--xs btn--secondary" onclick="toggleAppointmentStatus('${bookedAppointment.id}')">Cambiar Estado</button>
                                <button class="btn btn--xs btn--primary" style="background-color:var(--color-danger);" onclick="cancelAppointment('${bookedAppointment.id}')">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="slot-row">
                    <div class="slot-time">${timeSlot}</div>
                    <div class="slot-content">
                        <div class="slot-available" onclick="quickBookSlot('${selectedDate}', '${timeSlot}')">
                            + Disponible - Clic para Agendar (${timeSlot})
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function quickBookSlot(date, timeSlot) {
    openAppointmentModal();
    document.getElementById('app-date').value = date;
    
    // Poblar y seleccionar la hora indicada
    populateSlotsDropdown(timeSlot);
}

function populateSlotsDropdown(selectedTime = '') {
    const slotSelect = document.getElementById('app-slot');
    if (!slotSelect) return;

    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
        const hStr = hour < 10 ? `0${hour}` : `${hour}`;
        slots.push(`${hStr}:00`);
        slots.push(`${hStr}:30`);
    }

    slotSelect.innerHTML = slots.map(s => `
        <option value="${s}" ${s === selectedTime ? 'selected' : ''}>${s} hrs</option>
    `).join('');
}

// ------------------------------------------------------------------
// 7. VISTA: CLIENTES
// ------------------------------------------------------------------
function renderClientesView(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Gestión de Clientes</h1>
                <p>Directorio de clientes registrados y su historial de atenciones</p>
            </div>
            <button class="btn btn--primary" onclick="openClientModal()">+ Registrar Cliente</button>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre Completo</th>
                        <th>Documento</th>
                        <th>Teléfono</th>
                        <th>Correo</th>
                        <th>Citas Atendidas</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.clientes.map(cli => `
                        <tr>
                            <td><strong>${cli.id}</strong></td>
                            <td>${cli.nombre}</td>
                            <td>${cli.documento}</td>
                            <td>${cli.telefono}</td>
                            <td>${cli.email}</td>
                            <td><span class="badge-status badge-status--confirmada">${cli.citasTotales} citas</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ------------------------------------------------------------------
// 8. VISTAS ADMINISTRATIVAS (USUARIOS, EMPLEADOS, SERVICIOS, RECURSOS)
// ------------------------------------------------------------------
function renderUsuariosView(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Control de Usuarios del Sistema</h1>
                <p>Administración de credenciales de acceso y perfiles de rol (Admin / Recepción)</p>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID Usuario</th>
                        <th>Nombre de Usuario</th>
                        <th>Correo Electrónico</th>
                        <th>Rol Asignado</th>
                        <th>Estado MFA</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.usuarios.map(u => `
                        <tr>
                            <td><strong>${u.id}</strong></td>
                            <td>${u.usuario}</td>
                            <td>${u.email}</td>
                            <td>
                                <span class="role-badge role-badge--${u.rol === 'OWNER' ? 'admin' : 'receptionist'}">
                                    ${u.rol}
                                </span>
                            </td>
                            <td>
                                <span class="badge-status badge-status--${u.mfaActivo ? 'realizada' : 'pendiente'}">
                                    ${u.mfaActivo ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderEmpleadosView(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Plantilla de Empleados</h1>
                <p>Gestión del personal de atención, especialistas y barberos</p>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Cargo</th>
                        <th>Especialidad</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.empleados.map(e => `
                        <tr>
                            <td><strong>${e.id}</strong></td>
                            <td>${e.nombre}</td>
                            <td>${e.cargo}</td>
                            <td>${e.especialidad}</td>
                            <td>${e.telefono}</td>
                            <td><span class="badge-status badge-status--realizada">${e.estado}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderServiciosView(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Catálogo de Servicios</h1>
                <p>Servicios ofrecidos, duración estimada y precio al público</p>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre del Servicio</th>
                        <th>Duración</th>
                        <th>Precio (COP)</th>
                        <th>Recursos Asociados</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.servicios.map(s => `
                        <tr>
                            <td><strong>${s.id}</strong></td>
                            <td>${s.nombre}</td>
                            <td>${s.duracionMin} minutos</td>
                            <td><strong>$${s.precio.toLocaleString()}</strong></td>
                            <td>${s.recursos}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRecursosView(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Inventario de Recursos</h1>
                <p>Equipamiento y cabinas requeridas para los servicios</p>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre del Recurso</th>
                        <th>Cantidad Disponible</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.recursos.map(r => `
                        <tr>
                            <td><strong>${r.id}</strong></td>
                            <td>${r.nombre}</td>
                            <td>${r.cantidad} unidades</td>
                            <td><span class="badge-status badge-status--realizada">${r.estado}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ------------------------------------------------------------------
// 9. VISTA Y SIMULACIÓN DE MFA (DOBLE FACTOR)
// ------------------------------------------------------------------
function renderMfaView(container) {
    const isMfaActive = state.mfaState.enabled;

    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Seguridad y Autenticación de Doble Factor (MFA)</h1>
                <p>Protege la cuenta administrativa vinculando un generador de códigos TOTP</p>
            </div>
        </div>

        <div class="mfa-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <div>
                    <h3>Estado del Segundo Factor</h3>
                    <p class="form-help">Requiere código temporal TOTP al iniciar sesión</p>
                </div>
                <div>
                    <span class="badge-status badge-status--${isMfaActive ? 'realizada' : 'pendiente'}" style="font-size:0.9rem; padding:0.4rem 0.85rem;">
                        ${isMfaActive ? 'HABILITADO' : 'DESACTIVADO'}
                    </span>
                </div>
            </div>

            ${isMfaActive ? `
                <div style="background-color:var(--color-status-realizada-bg); border:1px solid #bbf7d0; padding:1.25rem; border-radius:0.5rem; margin-bottom:1.5rem;">
                    <h4 style="color:var(--color-status-realizada); margin-bottom:0.4rem;">MFA Habilitado en tu cuenta</h4>
                    <p style="font-size:0.88rem; color:#14532d;">Cada inicio de sesión solicitará el token dinámico de 6 dígitos desde tu aplicación autenticadora.</p>
                </div>

                <div style="margin-bottom:1.5rem;">
                    <h4>Códigos de Recuperación de Emergencia</h4>
                    <p class="form-help" style="margin-bottom:0.75rem;">Guarda estas llaves en un lugar seguro por si pierdes tu dispositivo móvil:</p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; background-color:var(--color-fondo-principal); padding:1rem; border-radius:0.5rem;">
                        ${state.mfaState.recoveryCodes.map(code => `<code style="font-weight:700; font-size:0.95rem;">${code}</code>`).join('')}
                    </div>
                </div>

                <button class="btn btn--secondary" onclick="disableMfa()">Desactivar MFA</button>
            ` : `
                <p style="margin-bottom:1.5rem; line-height:1.5;">Configurar la Autenticación de Doble Factor agrega una capa extra de seguridad para prevenir accesos no autorizados a la gestión del Salón de Belleza.</p>
                <button class="btn btn--primary" onclick="openMfaSetupModal()">Configurar y Activar MFA Ahora</button>
            `}
        </div>
    `;
}

function openMfaSetupModal() {
    document.getElementById('modal-mfa-setup').classList.remove('hidden');
}

function handleVerifyMfa(e) {
    e.preventDefault();
    const code = document.getElementById('mfa-totp-code').value.trim();

    if (code.length === 6) {
        state.mfaState.enabled = true;
        closeModal('modal-mfa-setup');
        alert('MFA Configurado y Activado Exitosamente.');
        renderMfaView(document.getElementById('main-content'));
    } else {
        alert('Por favor ingresa un código TOTP de 6 dígitos.');
    }
}

function disableMfa() {
    if (confirm('¿Estás seguro de desactivar la protección MFA?')) {
        state.mfaState.enabled = false;
        renderMfaView(document.getElementById('main-content'));
    }
}

function copyMfaSecret() {
    navigator.clipboard.writeText(state.mfaState.secret);
    alert('Clave secreta copiada al portapapeles: ' + state.mfaState.secret);
}

// ------------------------------------------------------------------
// 10. CONTROL DE MODALES Y SUBMIT DE FORMULARIOS
// ------------------------------------------------------------------
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function openAppointmentModal() {
    // Cargar listas en los selects
    const clientSelect = document.getElementById('app-client');
    const serviceSelect = document.getElementById('app-service');
    const empSelect = document.getElementById('app-employee');

    clientSelect.innerHTML = state.clientes.map(c => `<option value="${c.id}">${c.nombre} (Doc: ${c.documento})</option>`).join('');
    serviceSelect.innerHTML = state.servicios.map(s => `<option value="${s.id}">${s.nombre} - $${s.precio.toLocaleString()}</option>`).join('');
    empSelect.innerHTML = state.empleados.map(e => `<option value="${e.id}">${e.nombre} (${e.cargo})</option>`).join('');

    document.getElementById('app-date').value = new Date().toISOString().split('T')[0];
    populateSlotsDropdown('09:00');

    document.getElementById('modal-appointment').classList.remove('hidden');
}

function openClientModal() {
    document.getElementById('form-client').reset();
    document.getElementById('modal-client').classList.remove('hidden');
}

function handleSaveAppointment(e) {
    e.preventDefault();

    const clientSelect = document.getElementById('app-client');
    const serviceSelect = document.getElementById('app-service');
    const empSelect = document.getElementById('app-employee');

    const clientObj = state.clientes.find(c => c.id === clientSelect.value);
    const serviceObj = state.servicios.find(s => s.id === serviceSelect.value);
    const empObj = state.empleados.find(e => e.id === empSelect.value);

    const newApp = {
        id: `CIT-${100 + state.citas.length + 1}`,
        clienteId: clientObj.id,
        clienteNombre: clientObj.nombre,
        servicioId: serviceObj.id,
        servicioNombre: serviceObj.nombre,
        empleadoId: empObj.id,
        empleadoNombre: empObj.nombre,
        fecha: document.getElementById('app-date').value,
        hora: document.getElementById('app-slot').value,
        estado: 'CONFIRMADA',
        notas: document.getElementById('app-notes').value || 'Agendado mediante portal standalone'
    };

    state.citas.unshift(newApp);
    closeModal('modal-appointment');

    alert(`Cita ${newApp.id} agendada con éxito para ${newApp.clienteNombre} el ${newApp.fecha} a las ${newApp.hora}.`);
    
    if (state.currentRoute === 'citas') {
        refreshCalendarGrid();
    }
}

function handleSaveClient(e) {
    e.preventDefault();

    const newClient = {
        id: `CLI-${state.clientes.length + 1}`,
        nombre: document.getElementById('client-name').value,
        documento: document.getElementById('client-doc').value,
        telefono: document.getElementById('client-phone').value,
        email: document.getElementById('client-email').value || 'sin.correo@ejemplo.com',
        citasTotales: 0
    };

    state.clientes.unshift(newClient);
    closeModal('modal-client');

    alert(`Cliente ${newClient.nombre} registrado con éxito.`);
    
    if (state.currentRoute === 'clientes') {
        renderClientesView(document.getElementById('main-content'));
    }
}

function toggleAppointmentStatus(appId) {
    const app = state.citas.find(c => c.id === appId);
    if (!app) return;

    const flow = {
        'PENDIENTE': 'CONFIRMADA',
        'CONFIRMADA': 'REALIZADA',
        'REALIZADA': 'PENDIENTE'
    };

    app.estado = flow[app.estado] || 'CONFIRMADA';
    refreshCalendarGrid();
}

function cancelAppointment(appId) {
    const app = state.citas.find(c => c.id === appId);
    if (!app) return;

    if (confirm(`¿Deseas cancelar la cita ${appId} de ${app.clienteNombre}?`)) {
        app.estado = 'CANCELADA';
        refreshCalendarGrid();
    }
}

function onServiceChange() {}
function onDateOrEmployeeChange() {}
