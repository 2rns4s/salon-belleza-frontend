(function () {
    "use strict";

    var VIEWS = {};

    VIEWS.login = function () {
        return [
            '<section class="auth">',
            '  <div class="auth__card">',
            '    <h2 class="auth__title">Iniciar sesi\u00f3n</h2>',
            '    <form class="auth__form">',
            '      <div class="auth__field">',
            '        <label class="auth__label" for="username">Usuario</label>',
            '        <input class="auth__input" type="text" id="username" name="username" placeholder="ej: admin" autocomplete="username" />',
            '      </div>',
            '      <div class="auth__field">',
            '        <label class="auth__label" for="login-password">Contrase\u00f1a</label>',
            '        <input class="auth__input" type="password" id="login-password" name="password" autocomplete="current-password" />',
            '      </div>',
            '      <button class="auth__btn auth__btn--primary" type="submit">Ingresar</button>',
            '    </form>',
            '    <button class="auth__btn auth__btn--secondary auth__btn--outside-form" type="button">\u00bfNo tienes cuenta? Crear cuenta</button>',
            '  </div>',
            '</section>',
        ].join("\n");
    };

    VIEWS.dashboard = function () {
        return [
            '<section class="dashboard">',
            '  <header class="dashboard__header">',
            '    <h2 class="dashboard__title">Dashboard</h2>',
            '    <p class="dashboard__subtitle">Resumen de rendimiento del sal\u00f3n</p>',
            '  </header>',
            '',
            '  <form class="dashboard__date-range">',
            '    <label class="dashboard__field">',
            '      <span class="dashboard__field-label">Fecha inicio</span>',
            '      <input class="dashboard__input" type="datetime-local" name="fechaInicio" value="2026-07-20T00:00" />',
            '    </label>',
            '    <label class="dashboard__field">',
            '      <span class="dashboard__field-label">Fecha fin</span>',
            '      <input class="dashboard__input" type="datetime-local" name="fechaFin" value="2026-07-27T23:59" />',
            '    </label>',
            '    <button class="dashboard__button dashboard__button--primary" type="submit">Consultar</button>',
            '  </form>',
            '',
            '  <div class="dashboard__metrics">',
            '    <article class="dashboard__card dashboard__card--total">',
            '      <h3 class="dashboard__card-title">Total Citas</h3>',
            '      <p class="dashboard__card-value">48</p>',
            '    </article>',
            '    <article class="dashboard__card dashboard__card--completed">',
            '      <h3 class="dashboard__card-title">Completadas</h3>',
            '      <p class="dashboard__card-value">32</p>',
            '    </article>',
            '    <article class="dashboard__card dashboard__card--cancelled">',
            '      <h3 class="dashboard__card-title">Canceladas</h3>',
            '      <p class="dashboard__card-value">8</p>',
            '    </article>',
            '    <article class="dashboard__card dashboard__card--rate">',
            '      <h3 class="dashboard__card-title">Tasa Completitud</h3>',
            '      <p class="dashboard__card-value">66.67%</p>',
            '    </article>',
            '  </div>',
            '',
            '  <section class="dashboard__servicios-top">',
            '    <h3 class="dashboard__section-title">Servicios m\u00e1s demandados</h3>',
            '    <ul class="dashboard__servicios-list">',
            '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">1</span><span class="dashboard__servicio-nombre">Corte de cabello</span><span class="dashboard__servicio-cantidad">18</span></li>',
            '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">2</span><span class="dashboard__servicio-nombre">Manicure</span><span class="dashboard__servicio-cantidad">14</span></li>',
            '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">3</span><span class="dashboard__servicio-nombre">Tinte</span><span class="dashboard__servicio-cantidad">10</span></li>',
            '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">4</span><span class="dashboard__servicio-nombre">Pedicure</span><span class="dashboard__servicio-cantidad">8</span></li>',
            '      <li class="dashboard__servicio-item"><span class="dashboard__servicio-rank">5</span><span class="dashboard__servicio-nombre">Peinado</span><span class="dashboard__servicio-cantidad">6</span></li>',
            '    </ul>',
            '  </section>',
            '</section>',
        ].join("\n");
    };

    VIEWS.citas = function () {
        return [
            '<section class="citas">',
            '  <header class="citas__header">',
            '    <h2 class="citas__title">Agenda de citas</h2>',
            '    <p class="citas__subtitle">Gestiona disponibilidad, clientes y reservas sin salir de la agenda.</p>',
            '  </header>',
            '',
            '  <form class="citas__filters">',
            '    <label class="citas__field">',
            '      <span class="citas__field-label">Fecha</span>',
            '      <input class="citas__input" type="date" value="2026-07-27" />',
            '    </label>',
            '    <label class="citas__field">',
            '      <span class="citas__field-label">Servicio</span>',
            '      <select class="citas__select"><option value="">Seleccionar servicio</option><option value="1">Corte de cabello</option><option value="2">Manicure</option><option value="3">Tinte</option><option value="4" selected>Pedicure</option></select>',
            '    </label>',
            '    <label class="citas__field">',
            '      <span class="citas__field-label">Empleado</span>',
            '      <select class="citas__select"><option value="">Seleccionar empleado</option><option value="1">Ana Mart\u00ednez</option><option value="2" selected>Carlos L\u00f3pez</option><option value="3">Mar\u00eda Garc\u00eda</option></select>',
            '    </label>',
            '    <label class="citas__field">',
            '      <span class="citas__field-label">Vista</span>',
            '      <select class="citas__select"><option value="day">D\u00eda</option><option value="week">Semana</option></select>',
            '    </label>',
            '    <div class="citas__actions">',
            '      <button class="citas__button citas__button--primary" type="submit">Actualizar agenda</button>',
            '      <button class="citas__button citas__button--secondary" type="button">Recargar</button>',
            '    </div>',
            '  </form>',
            '',
            '  <div class="citas__workspace">',
            '    <section class="citas__panel">',
            '      <h3 class="citas__panel-title">Disponibilidad</h3>',
            '      <div class="citas__slots-grid">',
            '        <button class="citas__slot" type="button">09:00</button>',
            '        <button class="citas__slot" type="button">10:00</button>',
            '        <button class="citas__slot citas__slot--selected" type="button">11:00</button>',
            '        <button class="citas__slot" type="button">11:30</button>',
            '        <button class="citas__slot" type="button">12:00</button>',
            '        <button class="citas__slot" type="button" disabled>14:00</button>',
            '        <button class="citas__slot" type="button">15:00</button>',
            '        <button class="citas__slot" type="button" disabled>16:00</button>',
            '        <button class="citas__slot" type="button">17:00</button>',
            '      </div>',
            '    </section>',
            '',
            '    <section class="citas__panel">',
            '      <h3 class="citas__panel-title">Reserva</h3>',
            '      <div class="citas__booking-summary">',
            '        <article class="citas__summary-card"><span class="citas__summary-label">Horario</span><strong class="citas__summary-value">2026-07-27 11:00</strong></article>',
            '        <article class="citas__summary-card"><span class="citas__summary-label">Cliente</span><strong class="citas__summary-value">Laura P\u00e9rez (3001234567)</strong></article>',
            '      </div>',
            '      <label class="citas__field">',
            '        <span class="citas__field-label">Empleado</span>',
            '        <select class="citas__select"><option value="">Seleccionar</option><option value="1">Ana Mart\u00ednez</option><option value="2" selected>Carlos L\u00f3pez</option></select>',
            '      </label>',
            '      <div class="citas__booking-actions">',
            '        <button class="citas__button citas__button--primary" type="button">Confirmar cita</button>',
            '      </div>',
            '    </section>',
            '  </div>',
            '',
            '  <section class="citas__panel">',
            '    <h3 class="citas__panel-title">Citas registradas</h3>',
            '    <div class="citas__section-tabs">',
            '      <button class="citas__section-tab citas__section-tab--active" type="button">Activas <span class="citas__section-tab-count">3</span></button>',
            '      <button class="citas__section-tab" type="button">Historial <span class="citas__section-tab-count">12</span></button>',
            '    </div>',
            '    <ul class="citas__list">',
            '      <li class="citas__list-item">',
            '        <div><p class="citas__item-title">Cliente: Laura P\u00e9rez</p><p class="citas__item-subtitle">Servicio: Corte de cabello | Empleado: Carlos L\u00f3pez</p><p class="citas__item-subtitle">Cita #101</p></div>',
            '        <div class="citas__item-meta"><span>27/07/2026</span><span>11:00</span><span class="citas__item-status citas__item-status--CONFIRMADA">CONFIRMADA</span></div>',
            '      </li>',
            '      <li class="citas__list-item">',
            '        <div><p class="citas__item-title">Cliente: Pedro Ram\u00edrez</p><p class="citas__item-subtitle">Servicio: Manicure | Empleado: Ana Mart\u00ednez</p><p class="citas__item-subtitle">Cita #102</p></div>',
            '        <div class="citas__item-meta"><span>27/07/2026</span><span>14:30</span><span class="citas__item-status citas__item-status--PENDIENTE">PENDIENTE</span></div>',
            '      </li>',
            '      <li class="citas__list-item">',
            '        <div><p class="citas__item-title">Cliente: Sof\u00eda Torres</p><p class="citas__item-subtitle">Servicio: Tinte | Empleado: Carlos L\u00f3pez</p><p class="citas__item-subtitle">Cita #103</p></div>',
            '        <div class="citas__item-meta"><span>27/07/2026</span><span>16:00</span><span class="citas__item-status citas__item-status--CONFIRMADA">CONFIRMADA</span></div>',
            '      </li>',
            '    </ul>',
            '  </section>',
            '</section>',
        ].join("\n");
    };

    VIEWS.clientes = function () {
        return [
            '<section class="clients">',
            '  <header class="clients__header">',
            '    <div class="clients__header-copy">',
            '      <h2 class="clients__title">Gesti\u00f3n de Clientes</h2>',
            '      <p class="clients__subtitle">Administra los clientes registrados en el sistema.</p>',
            '    </div>',
            '    <div class="clients__toolbar">',
            '      <button class="clients__button clients__button--secondary" type="button">Actualizar listado</button>',
            '      <button class="clients__button clients__button--primary" type="button" id="btn-clientes-create">Nuevo cliente</button>',
            '    </div>',
            '  </header>',
            '',
            '  <p class="clients__message clients__message--success" role="status">Cliente registrado exitosamente.</p>',
            '',
            '  <section class="clients__panel">',
            '    <div class="clients__table-wrapper">',
            '      <table class="clients__table">',
            '        <thead><tr>',
            '          <th>ID</th><th>Nombre completo</th><th>Documento</th><th>Tel\u00e9fono</th><th>Nombre base</th>',
            '        </tr></thead>',
            '        <tbody class="clients__table-body">',
            '          <tr><td>1</td><td>Laura P\u00e9rez</td><td>10203040</td><td>3001234567</td><td>Laura</td></tr>',
            '          <tr><td>2</td><td>Pedro Ram\u00edrez</td><td>11223344</td><td>3109876543</td><td>Pedro</td></tr>',
            '          <tr><td>3</td><td>Sof\u00eda Torres</td><td>99887766</td><td>3205566778</td><td>Sof\u00eda</td></tr>',
            '          <tr><td>4</td><td>Mar\u00eda Garc\u00eda</td><td>55443322</td><td>3154433221</td><td>Mar\u00eda</td></tr>',
            '          <tr><td>5</td><td>Juan Pérez</td><td>88776655</td><td>3012345678</td><td>Juan</td></tr>',
            '        </tbody>',
            '      </table>',
            '    </div>',
            '  </section>',
            '</section>',
        ].join("\n");
    };

    VIEWS.empleados = function () {
        return [
            '<section class="employees">',
            '  <header class="employees__header">',
            '    <div class="employees__header-copy">',
            '      <h2 class="employees__title">Gesti\u00f3n de Empleados</h2>',
            '      <p class="employees__subtitle">Administra datos base, franjas laborales y servicios asociados del equipo.</p>',
            '    </div>',
            '    <div class="employees__toolbar">',
            '      <button class="employees__button employees__button--secondary" type="button">Actualizar listado</button>',
            '      <button class="employees__button employees__button--primary" type="button">Nuevo empleado</button>',
            '    </div>',
            '  </header>',
            '',
            '  <div class="employees__table-wrapper">',
            '    <table class="employees__table">',
            '      <thead><tr>',
            '        <th>ID</th><th>Nombre completo</th><th>Correo</th><th>Tel\u00e9fono</th><th>Franjas</th><th>Servicios</th><th>Acciones</th>',
            '      </tr></thead>',
            '      <tbody class="employees__table-body">',
            '        <tr><td>1</td><td>Ana Mart\u00ednez</td><td>ana@salon.com</td><td>3001112233</td><td>5</td><td>3</td><td><button class="employees__action-btn employees__action-btn--edit" type="button">Editar</button> <button class="employees__action-btn employees__action-btn--delete" type="button">Eliminar</button></td></tr>',
            '        <tr><td>2</td><td>Carlos L\u00f3pez</td><td>carlos@salon.com</td><td>3004445566</td><td>5</td><td>4</td><td><button class="employees__action-btn employees__action-btn--edit" type="button">Editar</button> <button class="employees__action-btn employees__action-btn--delete" type="button">Eliminar</button></td></tr>',
            '        <tr><td>3</td><td>Mar\u00eda Garc\u00eda</td><td>maria@salon.com</td><td>3007778899</td><td>4</td><td>2</td><td><button class="employees__action-btn employees__action-btn--edit" type="button">Editar</button> <button class="employees__action-btn employees__action-btn--delete" type="button">Eliminar</button></td></tr>',
            '      </tbody>',
            '    </table>',
            '  </div>',
            '</section>',
        ].join("\n");
    };

    VIEWS.servicios = function () {
        return [
            '<section class="service-list">',
            '  <header class="service-list__header">',
            '    <h2 class="service-list__title">Gesti\u00f3n de Servicios</h2>',
            '    <div class="service-list__header-actions">',
            '      <button class="service-actions__btn service-actions__btn--refresh" type="button">Actualizar</button>',
            '      <button class="service-actions__btn service-actions__btn--create" type="button">Nuevo servicio</button>',
            '    </div>',
            '  </header>',
            '',
            '  <table class="service-list__table">',
            '    <thead><tr><th>ID</th><th>Nombre</th><th>Duraci\u00f3n</th><th>Recursos</th><th>Acciones</th></tr></thead>',
            '    <tbody class="service-list__table-body">',
            '      <tr><td>1</td><td>Corte de cabello</td><td>45 min</td><td>2 recurso(s)</td><td><button class="service-actions__btn service-actions__btn--edit" type="button">Editar</button> <button class="service-actions__btn service-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '      <tr><td>2</td><td>Manicure</td><td>30 min</td><td>3 recurso(s)</td><td><button class="service-actions__btn service-actions__btn--edit" type="button">Editar</button> <button class="service-actions__btn service-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '      <tr><td>3</td><td>Tinte</td><td>90 min</td><td>4 recurso(s)</td><td><button class="service-actions__btn service-actions__btn--edit" type="button">Editar</button> <button class="service-actions__btn service-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '      <tr><td>4</td><td>Pedicure</td><td>40 min</td><td>2 recurso(s)</td><td><button class="service-actions__btn service-actions__btn--edit" type="button">Editar</button> <button class="service-actions__btn service-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '      <tr><td>5</td><td>Peinado</td><td>35 min</td><td>1 recurso(s)</td><td><button class="service-actions__btn service-actions__btn--edit" type="button">Editar</button> <button class="service-actions__btn service-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '    </tbody>',
            '  </table>',
            '</section>',
        ].join("\n");
    };

    VIEWS.recursos = function () {
        return [
            '<section class="resource-list">',
            '  <header class="resource-list__header">',
            '    <h2 class="resource-list__title">Gesti\u00f3n de Recursos</h2>',
            '    <div class="resource-list__header-actions">',
            '      <button class="resource-actions__btn resource-actions__btn--refresh" type="button">Actualizar</button>',
            '      <button class="resource-actions__btn resource-actions__btn--create" type="button">Nuevo recurso</button>',
            '    </div>',
            '  </header>',
            '',
            '  <table class="resource-list__table">',
            '    <thead><tr><th>ID</th><th>Nombre</th><th>Cantidad total</th><th>Acciones</th></tr></thead>',
            '    <tbody class="resource-list__table-body">',
            '      <tr><td>1</td><td>Tijeras profesionales</td><td>10</td><td><button class="resource-actions__btn resource-actions__btn--edit" type="button">Editar</button> <button class="resource-actions__btn resource-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '      <tr><td>2</td><td>Peines</td><td>15</td><td><button class="resource-actions__btn resource-actions__btn--edit" type="button">Editar</button> <button class="resource-actions__btn resource-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '      <tr><td>3</td><td>Esmaltes</td><td>30</td><td><button class="resource-actions__btn resource-actions__btn--edit" type="button">Editar</button> <button class="resource-actions__btn resource-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '      <tr><td>4</td><td>Secadores</td><td>5</td><td><button class="resource-actions__btn resource-actions__btn--edit" type="button">Editar</button> <button class="resource-actions__btn resource-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '      <tr><td>5</td><td>Capas de peluquer\u00eda</td><td>8</td><td><button class="resource-actions__btn resource-actions__btn--edit" type="button">Editar</button> <button class="resource-actions__btn resource-actions__btn--delete" type="button">Eliminar</button></td></tr>',
            '    </tbody>',
            '  </table>',
            '</section>',
        ].join("\n");
    };

    VIEWS.usuarios = function () {
        return [
            '<section class="usuarios">',
            '  <header class="usuarios__header">',
            '    <div class="usuarios__header-copy">',
            '      <h2 class="usuarios__title">Gesti\u00f3n de Usuarios</h2>',
            '      <p class="usuarios__subtitle">Administra los usuarios del sistema y sus roles.</p>',
            '    </div>',
            '    <div class="usuarios__toolbar">',
            '      <button class="usuarios__btn usuarios__btn--primary" type="button">Nuevo usuario</button>',
            '    </div>',
            '  </header>',
            '',
            '  <div class="usuarios__table-wrapper">',
            '    <table class="usuarios__table">',
            '      <thead><tr>',
            '        <th>ID</th><th>Usuario</th><th>Rol</th><th>ID Empleado</th><th>Estado</th><th>MFA</th><th>Acciones</th>',
            '      </tr></thead>',
            '      <tbody class="usuarios__table-body">',
            '        <tr><td>1</td><td>admin</td><td><span class="usuarios__badge usuarios__badge--owner">OWNER</span></td><td>1</td><td><span class="usuarios__badge usuarios__badge--active">Activo</span></td><td>\u2713</td><td><button class="usuarios__btn usuarios__btn--secondary" type="button">Editar</button> <button class="usuarios__btn usuarios__btn--danger" type="button">Desactivar</button></td></tr>',
            '        <tr><td>2</td><td>recepcion</td><td><span class="usuarios__badge usuarios__badge--receptionist">RECEPTIONIST</span></td><td>2</td><td><span class="usuarios__badge usuarios__badge--active">Activo</span></td><td>\u2713</td><td><button class="usuarios__btn usuarios__btn--secondary" type="button">Editar</button> <button class="usuarios__btn usuarios__btn--danger" type="button">Desactivar</button></td></tr>',
            '        <tr><td>3</td><td>maria.g</td><td><span class="usuarios__badge usuarios__badge--receptionist">RECEPTIONIST</span></td><td>3</td><td><span class="usuarios__badge usuarios__badge--active">Activo</span></td><td>\u2717</td><td><button class="usuarios__btn usuarios__btn--secondary" type="button">Editar</button> <button class="usuarios__btn usuarios__btn--danger" type="button">Desactivar</button></td></tr>',
            '        <tr><td>4</td><td>carlos.l</td><td><span class="usuarios__badge usuarios__badge--receptionist">RECEPTIONIST</span></td><td>4</td><td><span class="usuarios__badge usuarios__badge--inactive">Inactivo</span></td><td>\u2717</td><td><button class="usuarios__btn usuarios__btn--secondary" type="button">Editar</button> <button class="usuarios__btn usuarios__btn--danger" disabled type="button">Desactivar</button></td></tr>',
            '      </tbody>',
            '    </table>',
            '  </div>',
            '</section>',
        ].join("\n");
    };

    VIEWS.mfa = function () {
        return [
            '<section class="mfa">',
            '  <div class="mfa__card">',
            '    <h2 class="mfa__title">Activaci\u00f3n de MFA</h2>',
            '    <p class="mfa__description">Protege tu cuenta habilitando autenticaci\u00f3n en dos pasos con una app autenticadora.</p>',
            '    <button class="mfa__btn mfa__btn--primary" type="button">Activar MFA</button>',
            '  </div>',
            '</section>',
        ].join("\n");
    };

    VIEWS.userSettings = function () {
        return [
            '<section class="user-settings">',
            '  <div class="user-settings__card">',
            '    <h1 class="user-settings__title">Opciones de cuenta</h1>',
            '    <p class="user-settings__subtitle">Administra la seguridad y preferencias de tu cuenta.</p>',
            '    <div class="user-settings__menu">',
            '      <button class="user-settings__menu-item" type="button">',
            '        <span class="user-settings__menu-icon">\uD83D\uDD10</span>',
            '        <div class="user-settings__menu-content">',
            '          <h3 class="user-settings__menu-title">Autenticaci\u00f3n en dos pasos (MFA)</h3>',
            '          <p class="user-settings__menu-desc">Agrega una capa extra de seguridad a tu cuenta.</p>',
            '        </div>',
            '        <div class="user-settings__menu-meta">',
            '          <span class="user-settings__status-badge">Pendiente</span>',
            '          <span class="user-settings__menu-arrow">\u203A</span>',
            '        </div>',
            '      </button>',
            '    </div>',
            '  </div>',
            '</section>',
        ].join("\n");
    };

    /* ---- Router ---- */
    var currentView = "dashboard";
    var appEl = document.getElementById("app");

    function render(viewName) {
        currentView = viewName;
        appEl.innerHTML = [
            '<section class="layout">',
            '  <header class="layout__header">',
            '    <div class="layout__brand">',
            '      <h1 class="layout__salon-title">Sal\u00f3n de Belleza</h1>',
            '      <p class="layout__salon-subtitle">Sistema de Gesti\u00f3n Integral</p>',
            '    </div>',
            '    <nav class="layout__nav" id="main-nav">',
            '      <button class="layout__nav-link" data-view="login">Login</button>',
            '      <button class="layout__nav-link" data-view="dashboard">Dashboard</button>',
            '      <button class="layout__nav-link" data-view="citas">Citas</button>',
            '      <button class="layout__nav-link" data-view="clientes">Clientes</button>',
            '      <button class="layout__nav-link" data-view="empleados">Empleados</button>',
            '      <button class="layout__nav-link" data-view="servicios">Servicios</button>',
            '      <button class="layout__nav-link" data-view="recursos">Recursos</button>',
            '      <button class="layout__nav-link" data-view="usuarios">Usuarios</button>',
            '      <button class="layout__nav-link" data-view="mfa">MFA</button>',
            '      <button class="layout__nav-link" data-view="userSettings">Config</button>',
            '    </nav>',
            '  </header>',
            '  <main class="layout__content" id="app-content">',
            (VIEWS[viewName] || VIEWS.dashboard)(),
            '  </main>',
            '</section>',
        ].join("\n");

        var navLinks = document.querySelectorAll("#main-nav .layout__nav-link");
        for (var i = 0; i < navLinks.length; i++) {
            var link = navLinks[i];
            if (link.getAttribute("data-view") === viewName) {
                link.classList.add("layout__nav-link--active");
            } else {
                link.classList.remove("layout__nav-link--active");
            }
        }
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
