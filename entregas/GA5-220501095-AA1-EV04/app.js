(function () {
    "use strict";

    var VIEWS = {};

    /* ==================== LAYOUT ==================== */

    function renderLayout(viewName, contentHtml) {
        var navLinks = [
            { view: "login", label: "Login" },
            { view: "dashboard", label: "Dashboard" },
            { view: "citas", label: "Citas" },
            { view: "clientes", label: "Clientes" },
            { view: "empleados", label: "Empleados" },
            { view: "servicios", label: "Servicios" },
            { view: "recursos", label: "Recursos" },
            { view: "usuarios", label: "Usuarios" },
            { view: "mfa", label: "MFA" },
            { view: "userSettings", label: "Config" },
        ];

        var navHtml = "";
        for (var i = 0; i < navLinks.length; i++) {
            var link = navLinks[i];
            var activeClass = link.view === viewName ? ' layout__nav-link--active' : '';
            navHtml += '<button class="layout__nav-link' + activeClass + '" data-view="' + link.view + '">' + link.label + '</button>';
        }

        return ''
            + '<section class="layout">'
            + '  <header class="layout__header">'
            + '    <div class="layout__brand">'
            + '      <h1 class="layout__salon-title">Salon de Belleza</h1>'
            + '      <p class="layout__salon-subtitle">Gestion integral del salon de belleza</p>'
            + '    </div>'
            + '    <div class="layout__navigation-container">'
            + '      <nav class="layout__nav" aria-label="Navegacion principal">' + navHtml + '</nav>'
            + '    </div>'
            + '    <div class="layout__session">'
            + '      <div class="layout__user-menu-wrapper">'
            + '        <button class="layout__user-menu-trigger" type="button">'
            + '          <span class="layout__user-label">Usuario</span>'
            + '          <strong class="layout__user-value">admin</strong>'
            + '          <span class="layout__role-badge">OWNER</span>'
            + '          <span class="layout__menu-arrow">⋮</span>'
            + '        </button>'
            + '      </div>'
            + '      <button class="layout__logout-button" type="button">Cerrar Sesion</button>'
            + '    </div>'
            + '  </header>'
            + '  <main class="layout__content">'
            + contentHtml
            + '  </main>'
            + '</section>';
    }

    /* ==================== AUTH / LOGIN ==================== */

    VIEWS.login = function () {
        return renderLayout("login", ''
            + '<section class="auth">'
            + '  <div class="auth__card">'
            + '    <h2 class="auth__title">Iniciar sesion</h2>'
            + '    <form class="auth__form" id="login-form" novalidate>'
            + '      <div class="auth__field">'
            + '        <label class="auth__label" for="username">Usuario</label>'
            + '        <input class="auth__input" type="text" id="username" name="username" value="" autocomplete="username" required />'
            + '        <span class="auth__field-error" id="error-username"></span>'
            + '      </div>'
            + '      <div class="auth__field">'
            + '        <label class="auth__label" for="password">Contrasena</label>'
            + '        <input class="auth__input" type="password" id="password" name="password" autocomplete="current-password" required />'
            + '        <span class="auth__field-error" id="error-password"></span>'
            + '      </div>'
            + '      <button class="auth__btn auth__btn--primary" type="submit">Ingresar</button>'
            + '    </form>'
            + '    <button class="auth__btn auth__btn--secondary auth__btn--outside-form" type="button" id="btn-signup">'
            + '      No tienes cuenta? Crear cuenta'
            + '    </button>'
            + '  </div>'
            + '</section>'
        );
    };

    /* ==================== DASHBOARD ==================== */

    VIEWS.dashboard = function () {
        return renderLayout("dashboard", ''
            + '<section class="dashboard">'
            + '  <header class="dashboard__header">'
            + '    <h2 class="dashboard__title">Dashboard</h2>'
            + '    <p class="dashboard__subtitle">Resumen de rendimiento del salon</p>'
            + '  </header>'
            + '  <form class="dashboard__date-range" id="dashboard-date-form" novalidate>'
            + '    <label class="dashboard__field">'
            + '      <span class="dashboard__field-label">Fecha inicio</span>'
            + '      <input class="dashboard__input" type="datetime-local" name="fechaInicio" value="2026-07-20T00:00" required />'
            + '    </label>'
            + '    <label class="dashboard__field">'
            + '      <span class="dashboard__field-label">Fecha fin</span>'
            + '      <input class="dashboard__input" type="datetime-local" name="fechaFin" value="2026-07-27T23:59" required />'
            + '    </label>'
            + '    <button class="dashboard__button dashboard__button--primary" type="submit">Consultar</button>'
            + '  </form>'
            + '  <div class="dashboard__metrics">'
            + '    <article class="dashboard__card dashboard__card--total">'
            + '      <h3 class="dashboard__card-title">Total Citas</h3>'
            + '      <p class="dashboard__card-value">48</p>'
            + '    </article>'
            + '    <article class="dashboard__card dashboard__card--completed">'
            + '      <h3 class="dashboard__card-title">Completadas</h3>'
            + '      <p class="dashboard__card-value">32</p>'
            + '    </article>'
            + '    <article class="dashboard__card dashboard__card--cancelled">'
            + '      <h3 class="dashboard__card-title">Canceladas</h3>'
            + '      <p class="dashboard__card-value">8</p>'
            + '    </article>'
            + '    <article class="dashboard__card dashboard__card--rate">'
            + '      <h3 class="dashboard__card-title">Tasa Completitud</h3>'
            + '      <p class="dashboard__card-value">66.67%</p>'
            + '    </article>'
            + '  </div>'
            + '  <section class="dashboard__servicios-top">'
            + '    <h3 class="dashboard__section-title">Servicios mas demandados</h3>'
            + '    <ul class="dashboard__servicios-list">'
            + '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">1</span><span class="dashboard__servicio-nombre">Corte de cabello</span><span class="dashboard__servicio-cantidad">18</span></li>'
            + '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">2</span><span class="dashboard__servicio-nombre">Manicure</span><span class="dashboard__servicio-cantidad">14</span></li>'
            + '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">3</span><span class="dashboard__servicio-nombre">Tinte</span><span class="dashboard__servicio-cantidad">10</span></li>'
            + '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">4</span><span class="dashboard__servicio-nombre">Pedicure</span><span class="dashboard__servicio-cantidad">8</span></li>'
            + '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">5</span><span class="dashboard__servicio-nombre">Peinado</span><span class="dashboard__servicio-cantidad">6</span></li>'
            + '    </ul>'
            + '  </section>'
            + '</section>'
        );
    };

    /* ==================== CLIENTES ==================== */

    VIEWS.clientes = function () {
        return renderLayout("clientes", ''
            + '<section class="clients">'
            + '  <header class="clients__header">'
            + '    <div class="clients__header-copy">'
            + '      <h2 class="clients__title">Gestion de Clientes</h2>'
            + '      <p class="clients__subtitle">Administra los clientes registrados en el sistema.</p>'
            + '    </div>'
            + '    <div class="clients__toolbar">'
            + '      <button class="clients__button clients__button--secondary" id="clients-refresh-btn" type="button">Actualizar listado</button>'
            + '      <button class="clients__button clients__button--primary" id="clients-open-create-btn" type="button">Nuevo cliente</button>'
            + '    </div>'
            + '  </header>'
            + '  <p class="clients__message clients__message--success" role="status">Cliente registrado exitosamente.</p>'
            + '  <section class="clients__panel">'
            + '    <div class="clients__table-wrapper">'
            + '      <table class="clients__table" aria-describedby="clients-table-caption">'
            + '        <caption class="clients__table-caption" id="clients-table-caption">Listado de clientes registrados</caption>'
            + '        <thead class="clients__table-head">'
            + '          <tr class="clients__table-head-row">'
            + '            <th class="clients__table-head-cell" scope="col">ID</th>'
            + '            <th class="clients__table-head-cell" scope="col">Nombre completo</th>'
            + '            <th class="clients__table-head-cell" scope="col">Documento</th>'
            + '            <th class="clients__table-head-cell" scope="col">Telefono</th>'
            + '            <th class="clients__table-head-cell" scope="col">Nombre base</th>'
            + '          </tr>'
            + '        </thead>'
            + '        <tbody class="clients__table-body">'
            + '          <tr class="clients__table-row clients__table-row--data"><td class="clients__table-cell">1</td><td class="clients__table-cell clients__table-cell--name">Laura Perez</td><td class="clients__table-cell">10203040</td><td class="clients__table-cell">3001234567</td><td class="clients__table-cell">Laura</td></tr>'
            + '          <tr class="clients__table-row clients__table-row--data"><td class="clients__table-cell">2</td><td class="clients__table-cell clients__table-cell--name">Pedro Ramirez</td><td class="clients__table-cell">11223344</td><td class="clients__table-cell">3109876543</td><td class="clients__table-cell">Pedro</td></tr>'
            + '          <tr class="clients__table-row clients__table-row--data"><td class="clients__table-cell">3</td><td class="clients__table-cell clients__table-cell--name">Sofia Torres</td><td class="clients__table-cell">99887766</td><td class="clients__table-cell">3205566778</td><td class="clients__table-cell">Sofia</td></tr>'
            + '          <tr class="clients__table-row clients__table-row--data"><td class="clients__table-cell">4</td><td class="clients__table-cell clients__table-cell--name">Maria Garcia</td><td class="clients__table-cell">55443322</td><td class="clients__table-cell">3154433221</td><td class="clients__table-cell">Maria</td></tr>'
            + '          <tr class="clients__table-row clients__table-row--data"><td class="clients__table-cell">5</td><td class="clients__table-cell clients__table-cell--name">Juan Perez</td><td class="clients__table-cell">88776655</td><td class="clients__table-cell">3012345678</td><td class="clients__table-cell">Juan</td></tr>'
            + '        </tbody>'
            + '      </table>'
            + '    </div>'
            + '  </section>'
            + '</section>'
        );
    };

    /* ==================== CITAS ==================== */

    VIEWS.citas = function () {
        return renderLayout("citas", ''
            + '<section class="citas">'
            + '  <header class="citas__header">'
            + '    <h2 class="citas__title">Agenda de citas</h2>'
            + '    <p class="citas__subtitle">Gestiona disponibilidad, clientes y reservas sin salir de la agenda.</p>'
            + '  </header>'
            + '  <form class="citas__filters" id="citas-filter-form">'
            + '    <label class="citas__field">'
            + '      <span class="citas__field-label">Fecha</span>'
            + '      <input class="citas__input" type="date" name="selectedDate" value="2026-07-27" required />'
            + '    </label>'
            + '    <label class="citas__field">'
            + '      <span class="citas__field-label">Servicio</span>'
            + '      <select class="citas__select" id="citas-service-select" name="selectedServiceId">'
            + '        <option value="">Seleccionar servicio</option>'
            + '        <option value="1">Corte de cabello</option>'
            + '        <option value="2">Manicure</option>'
            + '        <option value="3">Tinte</option>'
            + '        <option value="4" selected>Pedicure</option>'
            + '      </select>'
            + '    </label>'
            + '    <label class="citas__field">'
            + '      <span class="citas__field-label">Empleado</span>'
            + '      <select class="citas__select" id="citas-employee-select" name="selectedEmployeeId">'
            + '        <option value="">Seleccionar empleado</option>'
            + '        <option value="1">Ana Martinez</option>'
            + '        <option value="2" selected>Carlos Lopez</option>'
            + '        <option value="3">Maria Garcia</option>'
            + '      </select>'
            + '    </label>'
            + '    <label class="citas__field">'
            + '      <span class="citas__field-label">Vista</span>'
            + '      <select class="citas__select" id="citas-view-mode" name="selectedViewMode">'
            + '        <option value="day" selected>Dia</option>'
            + '        <option value="week">Semana</option>'
            + '      </select>'
            + '    </label>'
            + '    <div class="citas__actions">'
            + '      <button class="citas__button citas__button--primary" type="submit">Actualizar agenda</button>'
            + '      <button class="citas__button citas__button--secondary" id="citas-refresh-btn" type="button">Recargar</button>'
            + '    </div>'
            + '  </form>'
            + '  <div id="citas-agenda-panel">'
            + '    <div class="citas__workspace">'
            + '      <section class="citas__panel">'
            + '        <h3 class="citas__panel-title">Disponibilidad dual</h3>'
            + '        <div class="citas__slots-grid">'
            + '          <button class="citas__slot citas__slot--available" type="button" aria-label="Seleccionar horario 09:00"><span class="citas__slot-time">09:00</span></button>'
            + '          <button class="citas__slot citas__slot--available" type="button" aria-label="Seleccionar horario 10:00"><span class="citas__slot-time">10:00</span></button>'
            + '          <button class="citas__slot citas__slot--available citas__slot--selected" type="button" aria-label="Seleccionar horario 11:00"><span class="citas__slot-time">11:00</span></button>'
            + '          <button class="citas__slot citas__slot--available" type="button" aria-label="Seleccionar horario 14:00"><span class="citas__slot-time">14:00</span></button>'
            + '          <button class="citas__slot citas__slot--available" type="button" aria-label="Seleccionar horario 15:00"><span class="citas__slot-time">15:00</span></button>'
            + '          <button class="citas__slot citas__slot--available" type="button" aria-label="Seleccionar horario 16:00"><span class="citas__slot-time">16:00</span></button>'
            + '          <button class="citas__slot citas__slot--available" type="button" aria-label="Seleccionar horario 17:00"><span class="citas__slot-time">17:00</span></button>'
            + '        </div>'
            + '      </section>'
            + '      <section class="citas__panel">'
            + '        <h3 class="citas__panel-title">Reserva y quick-add</h3>'
            + '        <div class="citas__booking-summary">'
            + '          <article class="citas__summary-card"><span class="citas__summary-label">Horario</span><strong class="citas__summary-value">2026-07-27 11:00</strong></article>'
            + '          <article class="citas__summary-card"><span class="citas__summary-label">Cliente</span><strong class="citas__summary-value">Laura Perez (3001234567)</strong></article>'
            + '        </div>'
            + '        <label class="citas__field">'
            + '          <span class="citas__field-label">Empleado</span>'
            + '          <select class="citas__select" id="citas-booking-employee-select">'
            + '            <option value="">Seleccionar empleado</option>'
            + '            <option value="1">Ana Martinez</option>'
            + '            <option value="2" selected>Carlos Lopez</option>'
            + '            <option value="3">Maria Garcia</option>'
            + '          </select>'
            + '        </label>'
            + '        <form class="citas__search-form" id="citas-client-search-form" novalidate>'
            + '          <div class="citas__search-grid">'
            + '            <label class="citas__field"><span class="citas__field-label">Documento</span><input class="citas__input" type="text" name="documentNumber" placeholder="Ej: 10203040" /></label>'
            + '            <label class="citas__field"><span class="citas__field-label">Telefono</span><input class="citas__input" type="text" name="phone" placeholder="Ej: 3001234567" /></label>'
            + '            <label class="citas__field"><span class="citas__field-label">Nombre</span><input class="citas__input" type="text" name="name" placeholder="Ej: Ana" /></label>'
            + '          </div>'
            + '          <div class="citas__actions citas__actions--inline"><button class="citas__button citas__button--secondary" id="citas-search-client-btn" type="submit">Buscar cliente</button></div>'
            + '        </form>'
            + '        <p class="citas__empty-text">Busca por documento, telefono o nombre para seleccionar cliente.</p>'
            + '        <div class="citas__booking-actions">'
            + '          <button class="citas__button citas__button--primary" id="citas-create-appointment-btn" type="button">Confirmar cita</button>'
            + '        </div>'
            + '      </section>'
            + '    </div>'
            + '    <section class="citas__panel">'
            + '      <h3 class="citas__panel-title">Citas registradas</h3>'
            + '      <div class="citas__section-tabs" role="tablist">'
            + '        <button class="citas__section-tab citas__section-tab--active" type="button" data-citas-view="active">Activas <span class="citas__section-tab-count">3</span></button>'
            + '        <button class="citas__section-tab" type="button" data-citas-view="history">Historial <span class="citas__section-tab-count">12</span></button>'
            + '      </div>'
            + '      <ul class="citas__list">'
            + '        <li class="citas__list-item citas__list-item--status-CONFIRMADA">'
            + '          <div class="citas__item-main"><p class="citas__item-title">Cliente: Laura Perez</p><p class="citas__item-subtitle">Servicio: Corte de cabello | Empleado: Carlos Lopez</p><p class="citas__item-subtitle">Cita #101</p></div>'
            + '          <div class="citas__item-meta"><p class="citas__item-date">27/07/2026</p><p class="citas__item-time">11:00</p><p class="citas__item-status citas__item-status--CONFIRMADA">CONFIRMADA</p></div>'
            + '          <div class="citas__item-actions">'
            + '            <label class="citas__field"><span class="citas__field-label">Estado</span><select class="citas__select citas__select--compact"><option value="PENDIENTE">PENDIENTE</option><option value="CONFIRMADA" selected>CONFIRMADA</option></select></label>'
            + '            <button class="citas__button citas__button--secondary citas__appointment-update-btn" type="button">Actualizar</button>'
            + '            <button class="citas__button citas__button--danger citas__appointment-delete-btn" type="button">Eliminar</button>'
            + '          </div>'
            + '        </li>'
            + '        <li class="citas__list-item citas__list-item--status-PENDIENTE">'
            + '          <div class="citas__item-main"><p class="citas__item-title">Cliente: Pedro Ramirez</p><p class="citas__item-subtitle">Servicio: Manicure | Empleado: Ana Martinez</p><p class="citas__item-subtitle">Cita #102</p></div>'
            + '          <div class="citas__item-meta"><p class="citas__item-date">27/07/2026</p><p class="citas__item-time">14:30</p><p class="citas__item-status citas__item-status--PENDIENTE">PENDIENTE</p></div>'
            + '          <div class="citas__item-actions">'
            + '            <label class="citas__field"><span class="citas__field-label">Estado</span><select class="citas__select citas__select--compact"><option value="PENDIENTE" selected>PENDIENTE</option><option value="CONFIRMADA">CONFIRMADA</option></select></label>'
            + '            <button class="citas__button citas__button--secondary citas__appointment-update-btn" type="button">Actualizar</button>'
            + '            <button class="citas__button citas__button--danger citas__appointment-delete-btn" type="button">Eliminar</button>'
            + '          </div>'
            + '        </li>'
            + '        <li class="citas__list-item citas__list-item--status-CONFIRMADA">'
            + '          <div class="citas__item-main"><p class="citas__item-title">Cliente: Sofia Torres</p><p class="citas__item-subtitle">Servicio: Tinte | Empleado: Carlos Lopez</p><p class="citas__item-subtitle">Cita #103</p></div>'
            + '          <div class="citas__item-meta"><p class="citas__item-date">27/07/2026</p><p class="citas__item-time">16:00</p><p class="citas__item-status citas__item-status--CONFIRMADA">CONFIRMADA</p></div>'
            + '          <div class="citas__item-actions">'
            + '            <label class="citas__field"><span class="citas__field-label">Estado</span><select class="citas__select citas__select--compact"><option value="PENDIENTE">PENDIENTE</option><option value="CONFIRMADA" selected>CONFIRMADA</option></select></label>'
            + '            <button class="citas__button citas__button--secondary citas__appointment-update-btn" type="button">Actualizar</button>'
            + '            <button class="citas__button citas__button--danger citas__appointment-delete-btn" type="button">Eliminar</button>'
            + '          </div>'
            + '        </li>'
            + '      </ul>'
            + '    </section>'
            + '  </div>'
            + '</section>'
        );
    };

    /* ==================== EMPLEADOS ==================== */

    VIEWS.empleados = function () {
        return renderLayout("empleados", ''
            + '<section class="employees">'
            + '  <header class="employees__header">'
            + '    <div class="employees__header-copy">'
            + '      <h2 class="employees__title">Gestion de Empleados</h2>'
            + '      <p class="employees__subtitle">Administra datos base, franjas laborales y servicios asociados del equipo.</p>'
            + '    </div>'
            + '    <div class="employees__toolbar">'
            + '      <button class="employees__button employees__button--secondary" id="employees-refresh-btn" type="button">Actualizar listado</button>'
            + '      <button class="employees__button employees__button--primary" id="employees-open-create-btn" type="button">Nuevo empleado</button>'
            + '    </div>'
            + '  </header>'
            + '  <p class="employees__message employees__message--success" role="status"><span class="employees__message-text">Operacion completada exitosamente.</span></p>'
            + '  <section class="employees__panel">'
            + '    <div class="employees__table-wrapper">'
            + '      <table class="employees__table" aria-describedby="employees-table-caption">'
            + '        <caption class="employees__table-caption" id="employees-table-caption">Listado de empleados registrados</caption>'
            + '        <thead class="employees__table-head">'
            + '          <tr class="employees__table-head-row">'
            + '            <th class="employees__table-head-cell" scope="col">ID</th>'
            + '            <th class="employees__table-head-cell" scope="col">Nombre completo</th>'
            + '            <th class="employees__table-head-cell" scope="col">Correo</th>'
            + '            <th class="employees__table-head-cell" scope="col">Telefono</th>'
            + '            <th class="employees__table-head-cell" scope="col">Franjas</th>'
            + '            <th class="employees__table-head-cell" scope="col">Servicios</th>'
            + '            <th class="employees__table-head-cell" scope="col">Acciones</th>'
            + '          </tr>'
            + '        </thead>'
            + '        <tbody class="employees__table-body">'
            + '          <tr class="employees__table-row employees__table-row--data"><td class="employees__table-cell">1</td><td class="employees__table-cell employees__table-cell--name">Ana Martinez</td><td class="employees__table-cell">ana@salon.com</td><td class="employees__table-cell">3001112233</td><td class="employees__table-cell">5</td><td class="employees__table-cell">3</td><td class="employees__table-cell employees__table-cell--actions"><button class="employees__action-btn employees__action-btn--edit" type="button" data-employee-edit-id="1">Editar</button><button class="employees__action-btn employees__action-btn--delete" type="button" data-employee-delete-id="1">Eliminar</button></td></tr>'
            + '          <tr class="employees__table-row employees__table-row--data"><td class="employees__table-cell">2</td><td class="employees__table-cell employees__table-cell--name">Carlos Lopez</td><td class="employees__table-cell">carlos@salon.com</td><td class="employees__table-cell">3004445566</td><td class="employees__table-cell">5</td><td class="employees__table-cell">4</td><td class="employees__table-cell employees__table-cell--actions"><button class="employees__action-btn employees__action-btn--edit" type="button" data-employee-edit-id="2">Editar</button><button class="employees__action-btn employees__action-btn--delete" type="button" data-employee-delete-id="2">Eliminar</button></td></tr>'
            + '          <tr class="employees__table-row employees__table-row--data"><td class="employees__table-cell">3</td><td class="employees__table-cell employees__table-cell--name">Maria Garcia</td><td class="employees__table-cell">maria@salon.com</td><td class="employees__table-cell">3007778899</td><td class="employees__table-cell">4</td><td class="employees__table-cell">2</td><td class="employees__table-cell employees__table-cell--actions"><button class="employees__action-btn employees__action-btn--edit" type="button" data-employee-edit-id="3">Editar</button><button class="employees__action-btn employees__action-btn--delete" type="button" data-employee-delete-id="3">Eliminar</button></td></tr>'
            + '        </tbody>'
            + '      </table>'
            + '    </div>'
            + '  </section>'
            + '</section>'
        );
    };

    /* ==================== SERVICIOS ==================== */

    VIEWS.servicios = function () {
        return renderLayout("servicios", ''
            + '<section class="service-list">'
            + '  <header class="service-list__header">'
            + '    <h2 class="service-list__title">Gestion de Servicios</h2>'
            + '    <div class="service-list__header-actions">'
            + '      <button class="service-actions__btn service-actions__btn--refresh" type="button">Actualizar</button>'
            + '      <button class="service-actions__btn service-actions__btn--create" type="button">Nuevo servicio</button>'
            + '    </div>'
            + '  </header>'
            + '  <p class="service-list__message service-list__message--success" role="status">Operacion completada exitosamente.</p>'
            + '  <table class="service-list__table">'
            + '    <thead class="service-list__table-head"><tr><th class="service-list__table-header">ID</th><th class="service-list__table-header">Nombre</th><th class="service-list__table-header">Duracion</th><th class="service-list__table-header">Recursos</th><th class="service-list__table-header">Acciones</th></tr></thead>'
            + '    <tbody class="service-list__table-body" id="services-table-body">'
            + '      <tr class="service-list__table-row service-list__table-row--data"><td class="service-list__table-cell">1</td><td class="service-list__table-cell service-list__table-cell--name">Corte de cabello</td><td class="service-list__table-cell">45 min</td><td class="service-list__table-cell">2 recurso(s)</td><td class="service-list__table-cell service-list__table-cell--actions"><button class="service-actions__btn service-actions__btn--edit" type="button" data-service-edit-id="1">Editar</button><button class="service-actions__btn service-actions__btn--delete" type="button" data-service-delete-id="1">Eliminar</button></td></tr>'
            + '      <tr class="service-list__table-row service-list__table-row--data"><td class="service-list__table-cell">2</td><td class="service-list__table-cell service-list__table-cell--name">Manicure</td><td class="service-list__table-cell">30 min</td><td class="service-list__table-cell">3 recurso(s)</td><td class="service-list__table-cell service-list__table-cell--actions"><button class="service-actions__btn service-actions__btn--edit" type="button" data-service-edit-id="2">Editar</button><button class="service-actions__btn service-actions__btn--delete" type="button" data-service-delete-id="2">Eliminar</button></td></tr>'
            + '      <tr class="service-list__table-row service-list__table-row--data"><td class="service-list__table-cell">3</td><td class="service-list__table-cell service-list__table-cell--name">Tinte</td><td class="service-list__table-cell">90 min</td><td class="service-list__table-cell">4 recurso(s)</td><td class="service-list__table-cell service-list__table-cell--actions"><button class="service-actions__btn service-actions__btn--edit" type="button" data-service-edit-id="3">Editar</button><button class="service-actions__btn service-actions__btn--delete" type="button" data-service-delete-id="3">Eliminar</button></td></tr>'
            + '      <tr class="service-list__table-row service-list__table-row--data"><td class="service-list__table-cell">4</td><td class="service-list__table-cell service-list__table-cell--name">Pedicure</td><td class="service-list__table-cell">40 min</td><td class="service-list__table-cell">2 recurso(s)</td><td class="service-list__table-cell service-list__table-cell--actions"><button class="service-actions__btn service-actions__btn--edit" type="button" data-service-edit-id="4">Editar</button><button class="service-actions__btn service-actions__btn--delete" type="button" data-service-delete-id="4">Eliminar</button></td></tr>'
            + '      <tr class="service-list__table-row service-list__table-row--data"><td class="service-list__table-cell">5</td><td class="service-list__table-cell service-list__table-cell--name">Peinado</td><td class="service-list__table-cell">35 min</td><td class="service-list__table-cell">1 recurso(s)</td><td class="service-list__table-cell service-list__table-cell--actions"><button class="service-actions__btn service-actions__btn--edit" type="button" data-service-edit-id="5">Editar</button><button class="service-actions__btn service-actions__btn--delete" type="button" data-service-delete-id="5">Eliminar</button></td></tr>'
            + '    </tbody>'
            + '  </table>'
            + '</section>'
        );
    };

    /* ==================== RECURSOS ==================== */

    VIEWS.recursos = function () {
        return renderLayout("recursos", ''
            + '<section class="resource-list">'
            + '  <header class="resource-list__header">'
            + '    <h2 class="resource-list__title">Gestion de Recursos</h2>'
            + '    <div class="resource-list__header-actions">'
            + '      <button class="resource-actions__btn resource-actions__btn--refresh" type="button">Actualizar</button>'
            + '      <button class="resource-actions__btn resource-actions__btn--create" type="button">Nuevo recurso</button>'
            + '    </div>'
            + '  </header>'
            + '  <p class="resource-list__message resource-list__message--success" role="status">Operacion completada exitosamente.</p>'
            + '  <table class="resource-list__table">'
            + '    <thead class="resource-list__table-head"><tr><th class="resource-list__table-header">ID</th><th class="resource-list__table-header">Nombre</th><th class="resource-list__table-header">Cantidad total</th><th class="resource-list__table-header">Acciones</th></tr></thead>'
            + '    <tbody class="resource-list__table-body" id="resources-table-body">'
            + '      <tr class="resource-list__table-row resource-list__table-row--data"><td class="resource-list__table-cell">1</td><td class="resource-list__table-cell resource-list__table-cell--name">Tijeras profesionales</td><td class="resource-list__table-cell">10</td><td class="resource-list__table-cell resource-list__table-cell--actions"><button class="resource-actions__btn resource-actions__btn--edit" type="button" data-resource-edit-id="1">Editar</button><button class="resource-actions__btn resource-actions__btn--delete" type="button" data-resource-delete-id="1">Eliminar</button></td></tr>'
            + '      <tr class="resource-list__table-row resource-list__table-row--data"><td class="resource-list__table-cell">2</td><td class="resource-list__table-cell resource-list__table-cell--name">Peines</td><td class="resource-list__table-cell">15</td><td class="resource-list__table-cell resource-list__table-cell--actions"><button class="resource-actions__btn resource-actions__btn--edit" type="button" data-resource-edit-id="2">Editar</button><button class="resource-actions__btn resource-actions__btn--delete" type="button" data-resource-delete-id="2">Eliminar</button></td></tr>'
            + '      <tr class="resource-list__table-row resource-list__table-row--data"><td class="resource-list__table-cell">3</td><td class="resource-list__table-cell resource-list__table-cell--name">Esmaltes</td><td class="resource-list__table-cell">30</td><td class="resource-list__table-cell resource-list__table-cell--actions"><button class="resource-actions__btn resource-actions__btn--edit" type="button" data-resource-edit-id="3">Editar</button><button class="resource-actions__btn resource-actions__btn--delete" type="button" data-resource-delete-id="3">Eliminar</button></td></tr>'
            + '      <tr class="resource-list__table-row resource-list__table-row--data"><td class="resource-list__table-cell">4</td><td class="resource-list__table-cell resource-list__table-cell--name">Secadores</td><td class="resource-list__table-cell">5</td><td class="resource-list__table-cell resource-list__table-cell--actions"><button class="resource-actions__btn resource-actions__btn--edit" type="button" data-resource-edit-id="4">Editar</button><button class="resource-actions__btn resource-actions__btn--delete" type="button" data-resource-delete-id="4">Eliminar</button></td></tr>'
            + '    </tbody>'
            + '  </table>'
            + '</section>'
        );
    };

    /* ==================== USUARIOS ==================== */

    VIEWS.usuarios = function () {
        return renderLayout("usuarios", ''
            + '<section class="usuarios">'
            + '  <header class="usuarios__header">'
            + '    <div class="usuarios__header-copy">'
            + '      <h2 class="usuarios__title">Gestion de Usuarios</h2>'
            + '      <p class="usuarios__subtitle">Administra los usuarios del sistema y sus roles.</p>'
            + '    </div>'
            + '    <div class="usuarios__toolbar">'
            + '      <button class="usuarios__btn usuarios__btn--primary" type="button" data-action="open-create-modal">Nuevo usuario</button>'
            + '    </div>'
            + '  </header>'
            + '  <p class="usuarios__message usuarios__message--success" role="status">Operacion completada exitosamente.</p>'
            + '  <section class="usuarios__panel">'
            + '    <div class="usuarios__table-wrapper">'
            + '      <table class="usuarios__table" aria-describedby="usuarios-table-caption">'
            + '        <caption class="usuarios__table-caption" id="usuarios-table-caption">Listado de usuarios del sistema</caption>'
            + '        <thead class="usuarios__table-head">'
            + '          <tr class="usuarios__table-head-row">'
            + '            <th class="usuarios__table-head-cell" scope="col">ID</th>'
            + '            <th class="usuarios__table-head-cell" scope="col">Nombre de usuario</th>'
            + '            <th class="usuarios__table-head-cell" scope="col">Rol</th>'
            + '            <th class="usuarios__table-head-cell" scope="col">ID Empleado</th>'
            + '            <th class="usuarios__table-head-cell" scope="col">Estado</th>'
            + '            <th class="usuarios__table-head-cell" scope="col">MFA</th>'
            + '            <th class="usuarios__table-head-cell" scope="col">Acciones</th>'
            + '          </tr>'
            + '        </thead>'
            + '        <tbody class="usuarios__table-body">'
            + '          <tr class="usuarios__table-row usuarios__table-row--data"><td class="usuarios__table-cell">1</td><td class="usuarios__table-cell usuarios__table-cell--username">admin</td><td class="usuarios__table-cell usuarios__table-cell--badge"><span class="usuarios__badge usuarios__badge--owner">OWNER</span></td><td class="usuarios__table-cell">1</td><td class="usuarios__table-cell usuarios__table-cell--badge"><span class="usuarios__badge usuarios__badge--active">Activo</span></td><td class="usuarios__table-cell">\u2713</td><td class="usuarios__table-cell usuarios__table-cell--actions"><button class="usuarios__btn usuarios__btn--secondary" type="button" data-action="open-edit-modal" data-user-id="1">Editar</button><button class="usuarios__btn usuarios__btn--danger" type="button" data-action="open-deactivate-modal" data-user-id="1" data-user-name="admin">Desactivar</button></td></tr>'
            + '          <tr class="usuarios__table-row usuarios__table-row--data"><td class="usuarios__table-cell">2</td><td class="usuarios__table-cell usuarios__table-cell--username">recepcion</td><td class="usuarios__table-cell usuarios__table-cell--badge"><span class="usuarios__badge usuarios__badge--receptionist">RECEPTIONIST</span></td><td class="usuarios__table-cell">2</td><td class="usuarios__table-cell usuarios__table-cell--badge"><span class="usuarios__badge usuarios__badge--active">Activo</span></td><td class="usuarios__table-cell">\u2713</td><td class="usuarios__table-cell usuarios__table-cell--actions"><button class="usuarios__btn usuarios__btn--secondary" type="button" data-action="open-edit-modal" data-user-id="2">Editar</button><button class="usuarios__btn usuarios__btn--danger" type="button" data-action="open-deactivate-modal" data-user-id="2" data-user-name="recepcion">Desactivar</button></td></tr>'
            + '          <tr class="usuarios__table-row usuarios__table-row--data"><td class="usuarios__table-cell">3</td><td class="usuarios__table-cell usuarios__table-cell--username">maria.g</td><td class="usuarios__table-cell usuarios__table-cell--badge"><span class="usuarios__badge usuarios__badge--receptionist">RECEPTIONIST</span></td><td class="usuarios__table-cell">3</td><td class="usuarios__table-cell usuarios__table-cell--badge"><span class="usuarios__badge usuarios__badge--active">Activo</span></td><td class="usuarios__table-cell">\u2717</td><td class="usuarios__table-cell usuarios__table-cell--actions"><button class="usuarios__btn usuarios__btn--secondary" type="button" data-action="open-edit-modal" data-user-id="3">Editar</button><button class="usuarios__btn usuarios__btn--danger" type="button" data-action="open-deactivate-modal" data-user-id="3" data-user-name="maria.g">Desactivar</button></td></tr>'
            + '          <tr class="usuarios__table-row usuarios__table-row--data"><td class="usuarios__table-cell">4</td><td class="usuarios__table-cell usuarios__table-cell--username">carlos.l</td><td class="usuarios__table-cell usuarios__table-cell--badge"><span class="usuarios__badge usuarios__badge--receptionist">RECEPTIONIST</span></td><td class="usuarios__table-cell">4</td><td class="usuarios__table-cell usuarios__table-cell--badge"><span class="usuarios__badge usuarios__badge--inactive">Inactivo</span></td><td class="usuarios__table-cell">\u2717</td><td class="usuarios__table-cell usuarios__table-cell--actions"><button class="usuarios__btn usuarios__btn--secondary" type="button" data-action="open-edit-modal" data-user-id="4">Editar</button><button class="usuarios__btn usuarios__btn--danger" type="button" disabled>Desactivar</button></td></tr>'
            + '        </tbody>'
            + '      </table>'
            + '    </div>'
            + '  </section>'
            + '</section>'
        );
    };

    /* ==================== MFA ==================== */

    VIEWS.mfa = function () {
        return renderLayout("mfa", ''
            + '<section class="mfa">'
            + '  <div class="mfa__card">'
            + '    <h2 class="mfa__title">Activacion de MFA</h2>'
            + '    <p class="mfa__description">Protege tu cuenta habilitando autenticacion en dos pasos con una app autenticadora.</p>'
            + '    <button class="mfa__btn mfa__btn--primary" id="btn-setup-start" type="button">Activar MFA</button>'
            + '  </div>'
            + '</section>'
        );
    };

    /* ==================== USER SETTINGS ==================== */

    VIEWS.userSettings = function () {
        return renderLayout("userSettings", ''
            + '<div class="user-settings">'
            + '  <div class="user-settings__card">'
            + '    <h1 class="user-settings__title">Opciones de cuenta</h1>'
            + '    <p class="user-settings__subtitle">Administra la seguridad y preferencias de tu cuenta.</p>'
            + '    <div class="user-settings__menu">'
            + '      <button id="user-settings-mfa-btn" class="user-settings__menu-item user-settings__menu-item--mfa" type="button">'
            + '        <div class="user-settings__menu-icon">\uD83D\uDD10</div>'
            + '        <div class="user-settings__menu-content">'
            + '          <h3 class="user-settings__menu-title">Autenticacion en dos pasos (MFA)</h3>'
            + '          <p class="user-settings__menu-desc">Agrega una capa extra de seguridad a tu cuenta.</p>'
            + '        </div>'
            + '        <div class="user-settings__menu-meta">'
            + '          <span class="user-settings__status-badge">Pendiente</span>'
            + '          <span class="user-settings__menu-arrow">\u203A</span>'
            + '        </div>'
            + '      </button>'
            + '    </div>'
            + '  </div>'
            + '</div>'
        );
    };

    /* ==================== ROUTER ==================== */

    var appEl = document.getElementById("app");

    function render(viewName) {
        var renderFn = VIEWS[viewName];
        if (!renderFn) renderFn = VIEWS.dashboard;
        appEl.innerHTML = renderFn();
    }

    document.addEventListener("click", function (e) {
        var target = e.target;
        while (target && target !== document) {
            if (target.hasAttribute && target.hasAttribute("data-view")) {
                e.preventDefault();
                render(target.getAttribute("data-view"));
                return;
            }
            target = target.parentElement;
        }
    });

    render("dashboard");
})();
