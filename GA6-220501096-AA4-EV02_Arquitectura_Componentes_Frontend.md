# Arquitectura de Componentes Front-End

**Aprendiz:** Daniel Steban Diaz Osorio  
**Programa:** Análisis y Desarrollo de Software (ADSO)  
**Ficha:** 3336047  
**Evidencia:** GA6-220501096-AA4-EV02 — Establecer los componentes front-end de la aplicación web  
**Proyecto:** Bella & Co. (frontend-salon-belleza)  

---

## 1. Introducción

La transición de la fase de prototipado a la fase de desarrollo en producción requiere una especificación técnica rigurosa de la arquitectura visual y funcional del código. El presente documento establece de manera exhaustiva y 100% fiel al repositorio en producción (`frontend-salon-belleza`) la arquitectura de componentes Front-End de la aplicación web de gestión integral **Bella & Co.**.

A diferencia de modelos hipotéticos o de maquetación genérica, esta especificación describe la implementación real construida bajo HTML5 semántico, CSS3 modular (siguiendo metodología **BEM** y **CSS Custom Properties**), arquitectura basada en componentes funcionales nativos (`renderView` / `.view.js`) y un enrutador dinámico en SPA (Single Page Application) sin frameworks pesados.

---

## 2. Objetivo

Describir y documentar formalmente la arquitectura técnica de los componentes HTML5 y CSS3 que conforman la interfaz de usuario de **Bella & Co.**, detallando las etiquetas semánticas, clases BEM, tokens CSS de diseño, desacoplamiento por módulos de características (*features*) y el layout base reactivo. Esto garantiza el mantenimiento, la escalabilidad, la accesibilidad y el cumplimiento de los estándares de desarrollo de software.

---

## 3. Principios de Arquitectura Front-End y Estilos Globales

### 3.1. Metodología BEM (Block Element Modifier)
Todas las vistas y componentes del sistema utilizan clases BEM estrictas para evitar el acoplamiento de estilos y garantizar nombres expresivos y modulares:
- **Bloque (`.block`):** Representa el contenedor principal del componente o feature (ej. `.layout`, `.auth`, `.dashboard`, `.citas`, `.paginated-list`).
- **Elemento (`.block__element`):** Subcomponente descendiente internamente ligado (ej. `.layout__header`, `.auth__input`, `.dashboard__card-value`, `.citas__slot`).
- **Modificador (`.block__element--modifier`):** Variación de estado o aspecto (ej. `.layout__nav-link--active`, `.auth__btn--primary`, `.dashboard__card--completed`, `.citas__slot--selected`).

### 3.2. Sistema de Tokens CSS (Variables Nativas `:root`)
Ubicados en `src/shared/styles/global.css`, definen la paleta corporativa y estados de la interfaz:
```css
:root {
    /* Paleta Vinotinto Corporativa */
    --color-fondo-principal: #f8f3f4;
    --color-texto-principal: #2c1a1e;
    --color-superficie: #ffffff;
    --color-header-vinotinto-claro: #8a3f52;
    --color-vinotinto-hover: #72333e;
    --color-vinotinto-soft: #f3e8eb;
    --color-vinotinto-border: #eadde0;
    --color-vinotinto-contrast: #5c3344;

    /* Feedback & Estados */
    --color-feedback-error-bg: #fdecea;
    --color-feedback-error-text: #b71c1c;
    --color-feedback-success-bg: #e8f5e9;
    --color-feedback-success-text: #1b5e20;
    --color-status-active: #388e3c;
    --color-status-inactive: #9e9e9e;

    /* Roles */
    --color-role-owner: #7b1fa2;
    --color-role-receptionist: #1976d2;
}
```

---

## 4. Definición de Componentes Front-End del Sistema Real

A continuación se detallan los componentes técnicos reales implementados en el código fuente (`src/`):

---

### 4.1. Contenedores Estructurales y Layout Base (`LayoutShell`)
**Ubicación:** `src/shared/components/layout/layout.view.js` y `layout.css`

El Layout Shell actúa como la estructura maestra envolvente de la aplicación SPA. Se renderiza dinámicamente injecting el contenido de la ruta activa en `<main class="app__content layout__content">`.

* **Componentes HTML Semánticos:**
  * `<section class="layout">`: Contenedor principal raíz.
  * `<header class="layout__header">`: Barra superior corporativa que agrupa el título de la marca, el menú de navegación dinámico y el menú de sesión del usuario.
  * `<div class="layout__brand">`: Encabezado visual con `<h1>` (`.layout__salon-title`) y `<p>` (`.layout__salon-subtitle`).
  * `<nav class="layout__nav" aria-label="Navegación principal">`: Barra de navegación primaria con enlaces `<a>` (`.layout__nav-link`), aplicando el atributo `data-layout-route` y la clase modificadora `.layout__nav-link--active` al ítem activo.
  * `<div class="layout__user-menu-wrapper">`: Componente dropdown de usuario con `<button id="layout-user-menu-btn" aria-expanded="false">` y contenedor desplegable `<div id="layout-user-dropdown" hidden>`.
  * `<main class="app__content layout__content">`: Tag semántico dinámico donde el enrutador (`router.js`) monta cada vista de módulo.

* **Layout CSS:**
  * Utiliza **CSS Grid** en el contenedor raíz (`display: grid; grid-template-rows: auto 1fr; min-height: 100vh;`) para separar exactamente la cabecera y el cuerpo.
  * La cabecera usa **Flexbox** (`display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;`) para mantener el orden y ajuste responsivo.
  * Fondo con gradiente radial personalizado en tonalidades rosadas/vinotinto suave (`background: radial-gradient(...)`).

---

### 4.2. Módulo de Autenticación y Seguridad MFA (`AuthView` y `MfaView`)
**Ubicación:** `src/features/auth/auth.view.js`, `src/features/mfa/mfa.view.js`, `auth.css`, `mfa.css`

Maneja el acceso seguro a la plataforma con soporte para credenciales y autenticación de doble factor (MFA/TOTP).

* **Componentes HTML Semánticos:**
  * `<section class="auth">`: Envoltorio de centrado.
  * `<div class="auth__card">`: Tarjeta contenedora de elevación visual.
  * `<h2 class="auth__title">`: Título semántico de la vista ("Iniciar sesión" / "Verificación en dos pasos").
  * `<form class="auth__form" id="login-form" novalidate>` / `<form id="mfa-form">`: Formulario HTML con validación personalizada.
  * `<input class="auth__input" type="text" id="username">`: Captura de usuario con atributos `autocomplete="username"` y `required`.
  * `<input class="auth__input" type="password" id="password">`: Captura de clave con `autocomplete="current-password"`.
  * `<input class="auth__input auth__input--otp" type="text" id="totpCode" inputmode="numeric" pattern="[0-9]{6}" maxlength="6">`: Entrada optimizada para código OTP de 6 dígitos numéricos.
  * `<button class="auth__btn auth__btn--primary" type="submit">`: Botón de acción con estado condicional de carga (`disabled`).
  * `<p class="auth__error" role="alert">` / `<span class="auth__field-error">`: Elementos para retroalimentación accesible de errores de formulario.

* **Layout CSS:**
  * Centrado perfecto del contenedor mediante Flexbox en la vista: `display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 80px);`.
  * Estilizado de inputs con bordes utilizando variables nativas (`var(--color-input-border)`), transiciones suaves de `border-color` al enfoque (`:focus`) y sombreado `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)`.

---

### 4.3. Tarjetas de Indicadores KPI y Dashboard (`DashboardView`)
**Ubicación:** `src/features/dashboard/dashboard.view.js` y `dashboard.css`

Panel de analítica de rendimiento para el perfil propietario (OWNER) con filtrado por rango de fechas.

* **Componentes HTML Semánticos:**
  * `<section class="dashboard">`: Contenedor del panel.
  * `<form class="dashboard__date-range" id="dashboard-date-form">`: Formulario de filtrado temporal con entradas `<input type="datetime-local">`.
  * `<div class="dashboard__metrics">`: Grilla contenedora de métricas.
  * `<article class="dashboard__card dashboard__card--total">`: Tarjeta semántica `<article>` para la métrica "Total Citas".
  * `<article class="dashboard__card dashboard__card--completed">`: Tarjeta para "Completadas".
  * `<article class="dashboard__card dashboard__card--cancelled">`: Tarjeta para "Canceladas".
  * `<article class="dashboard__card dashboard__card--rate">`: Tarjeta para "Tasa Completitud".
  * Sub-etiquetas: `<h3 class="dashboard__card-title">` para el título del indicador y `<p class="dashboard__card-value">` para la cifra formateada (ej. `85.50%`).
  * `<ol class="dashboard__servicios-list">` con `<li>` para el Top de servicios más solicitados.

* **Layout CSS:**
  * `.dashboard__metrics` utiliza **CSS Grid** adaptativo: `display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;`.
  * Modificadores de color con borde lateral (*left border accent*) de 4px para diferenciar visualmente cada métrica (verde para completadas, rojo para canceladas, vinotinto para totales).
  * Tarjetas estilizadas con bordes redondeados (`border-radius: 0.75rem`) y fondo blanco elevado.

---

### 4.4. Módulo de Agendamiento de Citas (`CitasView` / `AppointmentsView`)
**Ubicación:** `src/features/citas/citas.view.js`, `citas.css`, `appointments.alias.css`

Es el módulo central interactivo de la aplicación. Divide la pantalla entre la consulta/agenda visual de disponibilidad y el formulario de agendamiento rápido.

* **Componentes HTML Semánticos:**
  * `<section class="citas appointments">`: Bloque principal con aliases BEM dobles (`citas__*` y `appointments__*`).
  * `<form class="citas__filters-form" id="citas-filters-form">`: Formulario con controles `<select>` para filtrar por Servicio y Empleado, y un `<input type="date">` para la fecha de consulta de agenda.
  * `<div class="citas__slots-grid">`: Grilla de franjas horarias (slots).
  * `<button class="citas__slot citas__slot--available" data-slot-datetime="...">`: Elemento interactivo `<button>` que representa cada hora disponible en la agenda.
  * `<form class="citas__booking-form" id="citas-booking-form">`: Formulario de reserva con selector de Cliente (`<select>`), campo de notas (`<textarea>`) y botón de confirmación (`<button type="submit">`).
  * `<div class="citas__table-wrapper">` con `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` para el listado estructurado de citas agendadas con sus respectivos estados (`CANCELADA`, `COMPLETADA`, `CONFIRMADA`).

* **Layout CSS:**
  * La vista utiliza una distribución en **CSS Grid** de 2 columnas para pantallas de escritorio:
    ```css
    .citas__layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    ```
  * `.citas__slots-grid` implementa **CSS Grid** flexible para la matriz de horas: `grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem;`.
  * Clases modificadoras de estado para slots: `.citas__slot--selected` (vinotinto resaltado), `.citas__slot--disabled` (opacidad reducida, cursor no permitido).

---

### 4.5. Componente Reutilizable de Tablas Paginadas (`PaginatedList`)
**Ubicación:** `src/components/PaginatedList.js`

Componente genérico reutilizado en los módulos de Clientes, Usuarios, Empleados, Servicios y Recursos para el despliegue de datos maestros.

* **Componentes HTML Semánticos:**
  * `<section class="paginated-list">`: Bloque reutilizable.
  * `<form class="paginated-list__search-form">`: Barra de búsqueda con `<input type="search">` y botón `<button type="submit">`.
  * `<div class="paginated-list__table-wrapper">`: Contenedor con scroll horizontal implícito.
  * `<table class="paginated-list__table">`: Tabla HTML estándar semántica (`<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`).
  * `<nav class="paginated-list__pagination" aria-label="Paginación">`: Contenedor de navegación entre páginas con botones Anterior/Siguiente y estado `Página X de Y`.

* **Layout CSS:**
  * Tabla con bordes limpios, cabeceras en vinotinto suave (`background-color: var(--color-vinotinto-soft)`), cambio de color al pasar el cursor sobre las filas (`.paginated-list__row:hover`) y paginador alineado con Flexbox (`display: flex; justify-content: space-between; align-items: center;`).

---

## 5. Cuadro Comparativo: Componentes Teóricos vs. Implementación Real

| Módulo / Componente | Propuesta Teórica Inicial | Implementación Real en Código (`src/`) |
| :--- | :--- | :--- |
| **Estructura Layout** | `<aside>` para menú lateral y `<main>` con CSS Grid estático. | Layout Shell unificado (`LayoutShell`) en `layout.view.js` con `<header>` superior dinámico, navegación horizontal por roles, menú desplegable de usuario (`dropdown`) y `<main class="app__content">`. |
| **Estilos & Paleta** | Estilos CSS aislados por etiqueta sin variables globales. | Sistema centralizado de **CSS Custom Properties** (`global.css`) con la paleta de marca vinotinto corporativa (`--color-header-vinotinto-claro: #8a3f52`) y metodología **BEM**. |
| **Autenticación (Login/MFA)** | Formulario básico de login sin soporte OTP. | Módulo `auth` y `mfa` desacoplados con validación `novalidate`, inputs tipo OTP (`inputmode="numeric"`, `pattern="[0-9]{6}"`), mensajes de error dinámicos y centrado con Flexbox. |
| **Dashboard (KPIs)** | Tarjetas genéricas en HTML estático. | Vista reactiva (`dashboard.view.js`) con tarjetas `<article>` BEM (`.dashboard__card--completed`, etc.), selector de rango de fecha `datetime-local` y grid auto-fit responsivo. |
| **Agendamiento (Citas)** | Formulario simple e hileras `<ul>`/`<li>` estáticas. | `citas.view.js` con layout en Grid 2 columnas, matriz dinámica de botones para slots horaria (`.citas__slots-grid`), tabla paginada de citas y soporte de aliases BEM (`citas` / `appointments`). |
| **Listados de Datos** | Tablas repetitivas maquetadas a mano en cada HTML. | Componente Javascript modular y reutilizable `PaginatedList.js` que encapsula filtrado, renderizado de tablas y paginación semántica accesible. |

---

## 6. Conclusión

La estructuración de los componentes front-end de **Bella & Co.** evidencia una arquitectura limpia, mantenible y alineada con los estándares modernos de desarrollo web. Al basarse en HTML5 semántico, nomenclatura BEM, CSS Custom Properties y una arquitectura modular SPA en JavaScript vanilla (sin dependencias pesadas de framework), se garantiza un rendimiento óptimo, alta accesibilidad y una correspondencia del 100% entre el código en producción y la documentación técnica entregada.
