# Especificación de Requisitos de Software (SRS) - Estándar IEEE 830
**Proyecto:** Frontend del Sistema de Gestión para Salón de Belleza  
**Estado:** Borrador de Diseño / Especificación Preliminar (Antes de la Implementación)

---

## Control de Documento
| Versión | Fecha | Descripción | Autor |
|---|---|---|---|
| 0.1 | 18/07/2026 | Creación del documento de requisitos base, enrutamiento y vistas. | Departamento de Análisis y Diseño |

---

## 1. Introducción

### 1.1 Propósito
Este documento define la Especificación de Requisitos de Software (SRS) para el frontend del Sistema de Gestión de Salón de Belleza. El propósito es detallar los requisitos funcionales, no funcionales y de interfaz de usuario de la aplicación cliente SPA (Single Page Application) antes de iniciar su construcción. El público objetivo incluye arquitectos de software, desarrolladores frontend, y analistas de calidad.

### 1.2 Alcance
El sistema a desarrollar consiste en una aplicación web interactiva que servirá de interfaz para la gestión de un salón de belleza. El alcance del frontend abarca:
*   Módulo de Autenticación y Autorización (Login, Registro y flujo MFA).
*   Gestión y Programación de Citas (calendario de disponibilidad, conflictos de horario).
*   Panel de Control (Dashboard) con KPIs del negocio.
*   Módulos CRUD para entidades clave: Clientes, Empleados, Servicios, Recursos y Configuración de Usuario.
*   Enrutamiento en el cliente y validaciones locales avanzadas.

Este software se integrará con una API REST externa que maneja la persistencia y la lógica del negocio.

### 1.3 Definiciones, Acrónimos y Abreviaturas
*   **MFA (Multi-Factor Authentication):** Autenticación de múltiples factores.
*   **SPA (Single Page Application):** Aplicación de una sola página.
*   **DOM (Document Object Model):** Estructura jerárquica del navegador.
*   **BEM (Block, Element, Modifier):** Metodología de nomenclatura para clases CSS.
*   **JWT (JSON Web Token):** Token estándar para autenticación en cabeceras HTTP.
*   **XSS (Cross-Site Scripting):** Tipo de vulnerabilidad en aplicaciones web.
*   **WCAG (Web Content Accessibility Guidelines):** Directrices de accesibilidad web.

### 1.4 Referencias
*   Estándar IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications.
*   Documentación de la API del Backend (repositorio de referencia para contratos de datos).
*   Pautas de Accesibilidad al Contenido en la Web (WCAG 2.1).

### 1.5 Resumen del Documento
El resto de este documento está organizado de la siguiente manera:
*   **Sección 2:** Describe la perspectiva general del producto, la arquitectura MVC Vanilla propuesta, el enrutador cliente y las restricciones.
*   **Sección 3:** Especifica en detalle los requisitos de interfaces externas (mockups/borradores de pantallas), los requisitos funcionales detallados de cada módulo y los requisitos no funcionales (seguridad, rendimiento y calidad).

---

## 2. Descripción General

### 2.1 Perspectiva del Producto
El frontend es un sistema autónomo que se ejecuta en el navegador del cliente. Utilizará una arquitectura modular basada en **MVC Vanilla** (Model-View-Controller puro, sin frameworks como React o Angular) para asegurar un control absoluto del DOM y tiempos de carga mínimos.

#### 2.1.1 Esquema de Arquitectura Propuesta
```text
      ┌─────────────────────────────────────────────────────────┐
      │                   Navegador Web (DOM)                   │
      └────────────────────────────┬────────────────────────────┘
                                   │ Eventos del Usuario
                                   ▼
      ┌─────────────────────────────────────────────────────────┐
      │                        ROUTER                           │
      │        (Escucha el evento window 'hashchange')          │
      └────────────────────────────┬────────────────────────────┘
                                   │ Carga el módulo correcto
                                   ▼
      ┌─────────────────────────────────────────────────────────┐
      │                      CONTROLLER                         │
      │           (Orquesta la interacción y el flujo)          │
      └───────────────┬───────────────────────────┬─────────────┘
                      │                           │
                      ▼                           ▼
      ┌────────────────────────┐      ┌────────────────────────┐
      │          VIEW          │      │        SERVICE         │
      │   (Renderiza HTML)     │      │ (Cliente HTTP / Fetch) │
      └────────────────────────┘      └───────────┬────────────┘
                                                  │
                                                  ▼
                                      ┌────────────────────────┐
                                      │      API BACKEND       │
                                      │    (Servidor REST)     │
                                      └────────────────────────┘
```

#### 2.1.2 Borrador del Enrutamiento por Hash
Para evitar sobrecargar el servidor y manejar la navegación internamente, se propone un esquema de **Hash Routing** (`#/ruta`).

**Especificación del flujo de enrutamiento:**
```text
[URL cambia a #/citas] ────> [Lectura de hash] ────> [Búsqueda en mapa de rutas]
                                                             │
     ┌───────────────────────────────────────────────────────┘
     ▼
[¿Existe la ruta?]
     ├── SÍ ──> [¿Requiere Auth/MFA?]
     │                ├── SÍ (Cumple) ──> [Ejecutar handler de la vista / Controller]
     │                └── NO (Falta auth) ──> [Redirigir a #/auth]
     │
     └── NO ──> [Redirigir a #/404]
```

### 2.2 Funciones del Producto
El sistema cumplirá con las siguientes funciones clave organizadas por módulos:
1.  **Módulo de Autenticación (Auth):** Permitir el registro de usuarios, login tradicional con usuario/contraseña, y validación mediante MFA.
2.  **Módulo de Citas (Citas):** Reserva, cancelación y visualización de citas de forma interactiva.
3.  **Módulo de Configuración (User Settings):** Activación de MFA (generación de secreto, escaneo de QR) y cambio de datos del usuario.
4.  **Módulos de Gestión (CRUDs):** Administrar Clientes, Empleados (con sus franjas horarias), Servicios (con asignación de recursos requeridos) y Recursos.
5.  **Módulo de Reportes (Dashboard):** Visualización de métricas críticas y tendencias del salón.

### 2.3 Clases y Características de Usuarios
*   **Propietario del Salón (Owner):** Acceso total a todos los módulos, incluyendo configuraciones críticas de empleados, tarifas de servicios y reportes financieros avanzados en el Dashboard.
*   **Recepcionista:** Acceso a la agenda de citas, gestión de clientes y servicios cotidianos. No puede alterar configuraciones de empleados ni ver KPIs críticos de facturación agregada.
*   **Cliente (Uso Indirecto):** Sus datos son registrados por el personal del salón; interactúa con el sistema a través del flujo de citas gestionado en recepción.

### 2.4 Restricciones de Diseño e Implementación
*   **Sin Frameworks:** La aplicación debe implementarse usando tecnologías web nativas (HTML5, CSS3, JavaScript ES6) sin frameworks de SPA (como React, Vue, o Angular).
*   **Enrutador Prototipo:** Se debe estructurar un enrutador customizado que escuche cambios en el hash de la ventana y cargue los módulos de forma dinámica en un contenedor principal del layout.
*   **Modularidad de Estilos:** Se usará CSS nativo estructurado bajo la convención BEM (`block__element--modifier`) y uso centralizado de variables CSS para facilitar cambios estéticos rápidos.
*   **Entorno de Pruebas:** Las especificaciones de calidad requieren que el código de vistas y controladores sea testable sin abrir un navegador real, utilizando Vitest y `jsdom`.

### 2.5 Suposiciones y Dependencias
*   Se asume que la API de backend RESTful estará disponible y cumplirá estrictamente con los contratos JSON especificados.
*   El navegador del cliente final debe soportar JavaScript ES6, APIs de Fetch modernas y almacenamiento en el cliente (LocalStorage / SessionStorage).

---

## 3. Requisitos Específicos

### 3.1 Requisitos de Interfaz Externa

#### 3.1.1 Interfaces de Usuario (Borradores y Diseños de Estructura - Mockups)

##### A. Estructura General del Layout (Aplicación Logueada)
```text
+---------------------------------------------------------------------------------+
| [Logo] Salón de Belleza                       [Usuario: Admin (Owner)] [Cerrar] |
+---------------------------------------------------------------------------------+
|  MENÚ DE NAVEGACIÓN   |  CONTENEDOR DE CONTENIDO PRINCIPAL                      |
|  - [Dashboard]        |  ====================================================== |
|  - [Citas]            |                                                         |
|  - [Clientes]         |  Acá se inyecta dinámicamente el HTML de la vista       |
|  - [Empleados]        |  seleccionada a través del enrutador de hash.           |
|  - [Servicios]        |                                                         |
|  - [Recursos]         |  Ej. Si el hash es #/citas, el controlador de citas     |
|  - [Mi Cuenta]        |  renderiza aquí el formulario y la grilla.              |
|                       |                                                         |
+---------------------------------------------------------------------------------+
```

##### B. Borrador de Pantalla: Login / Autenticación (`#/auth`)
```text
                      +----------------------------------+
                      |       INICIO DE SESIÓN           |
                      +----------------------------------+
                      | Correo Electrónico:              |
                      | [ admin@salon.com              ] |
                      | Contraseña:                      |
                      | [ **********                   ] |
                      +----------------------------------+
                      |          [ INGRESAR ]            |
                      |  ¿No tienes cuenta? Registrate   |
                      +----------------------------------+
```

##### C. Borrador de Pantalla: Configuración de MFA (`#/mfa-setup`)
```text
                      +----------------------------------+
                      |      CONFIGURAR DOBLE FACTOR     |
                      +----------------------------------+
                      | 1. Escanea este código QR:       |
                      |      [QR CODE GRAPHIC PLACEHOLDER]  |
                      |                                  |
                      | Código de Verificación OTP:      |
                      | [ 123456 ]   [ Verificar y Activar]|
                      +----------------------------------+
```

##### D. Borrador de Pantalla: Reserva de Citas (`#/citas`)
```text
+---------------------------------------------------------------------------------+
| NUEVA CITA                                                                      |
|---------------------------------------------------------------------------------|
|  Cliente: [ Juan Pérez     ]  Servicio: [ Corte de Pelo - $15.00              ] |
|  Empleado: [ Ana María     ]  Fecha:    [ 19/07/2026 ]                          |
|                                                                                 |
|  HORARIOS DISPONIBLES:                                                          |
|  +--------+  +--------+  +--------+  +--------+                                 |
|  | 09:00  |  | 10:00  |  | 11:00  |  | 12:00  |                                 |
|  | [Select|  | [Select|  | [Select|  | [Select|                                 |
|  +--------+  +--------+  +--------+  +--------+                                 |
|                                                                                 |
|  [ REGISTRAR CITA ]                                                             |
+---------------------------------------------------------------------------------+
```

#### 3.1.2 Interfaces de Hardware
No existen requisitos especiales de hardware más allá de una computadora personal, tablet o smartphone con un navegador web moderno capaz de renderizar CSS3 y procesar JavaScript.

#### 3.1.3 Interfaces de Software
*   El frontend interactuará con el servidor backend mediante HTTP utilizando peticiones JSON asíncronas.
*   **HttpClient:** Implementación encapsulada utilizando `fetch` para realizar operaciones GET, POST, PUT, DELETE, inyectando de forma automatizada las cabeceras `Authorization: Bearer <Token>`.

#### 3.1.4 Interfaces de Comunicación
Toda la transmisión de datos sensibles (datos de clientes, tokens JWT, códigos de autenticación MFA) se realizará obligatoriamente sobre el protocolo de transferencia segura HTTPS.

---

### 3.2 Requisitos Funcionales

#### 3.2.1 Sistema de Autenticación y Autorización
*   **RF-01: Autenticación Clásica:** El sistema permitirá el inicio de sesión con correo electrónico y contraseña. Al validar las credenciales, si no se tiene activo MFA, el sistema almacenará el JWT y dará acceso al `/dashboard`.
*   **RF-02: Segundo Factor (MFA):** Si el usuario tiene activo el doble factor, se redirigirá a una pantalla de validación intermedia donde se solicitará un token OTP temporal de 6 dígitos antes de desbloquear la sesión completa.
*   **RF-03: Rutas Protegidas:** El enrutador verificará en cada transición si el usuario está autenticado y si su token JWT no ha expirado. De no cumplir, se forzará la redirección automática a la vista de login.

#### 3.2.2 Módulo de Gestión de Citas
*   **RF-04: Prevención de Solapamiento (Schedule Overlaps):** Al intentar agendar una cita para un empleado en un rango horario determinado, el sistema verificará a nivel de cliente que no existan colisiones con citas previas ya cargadas del mismo empleado.
*   **RF-05: Validación de Empleado por Servicio:** El dropdown de selección de empleados sólo mostrará aquellos profesionales calificados para realizar el servicio seleccionado.
*   **RF-06: Restricción de Recursos Físicos:** El sistema validará que los recursos asociados al servicio (cabinas de spa, sillones especiales, secadores) no se encuentren reservados para otra cita en el mismo bloque horario.

#### 3.2.3 Módulo de Empleados y Franjas Horarias
*   **RF-07: Definición de Horarios:** Permitirá dar de alta a empleados asociándoles un rango de disponibilidad semanal (días permitidos y rango de horas de inicio/fin).
*   **RF-08: CRUD de Empleados:** Creación, lectura, edición y desactivación de personal del salón.

#### 3.2.4 Módulo de Servicios y Recursos
*   **RF-09: Catálogo de Servicios:** Creación de registros de servicios indicando nombre, descripción, costo y duración en minutos.
*   **RF-10: Asignación de Recursos:** Permitirá definir qué recursos físicos del salón son requeridos de forma obligatoria para realizar un servicio.

#### 3.2.5 Módulo de Configuración de Usuario (User Settings)
*   **RF-11: Activación MFA:** Proveer un interruptor para iniciar la sincronización de MFA. El sistema debe solicitar la clave actual, mostrar un código QR representativo de la clave secreta y exigir la validación de un código OTP inicial para confirmar la activación exitosa.

---

### 3.3 Requisitos No Funcionales

#### 3.3.1 Requisitos de Rendimiento
*   **Carga Inicial:** El frontend debe inicializar el enrutamiento y la pantalla inicial en menos de 1.5 segundos en redes de velocidad estándar.
*   **Uso de Caché local:** La aplicación consumirá un mecanismo de almacenamiento en caché para catálogos estáticos (como lista de servicios o recursos) disminuyendo los llamados recurrentes innecesarios a la API.

#### 3.3.2 Requisitos de Seguridad
*   **Prevención XSS:** En todas las vistas dinámicas, los inputs y contenidos variables proveídos por el usuario o base de datos deben pasar por un filtro de escape HTML (HTML escaping in views) antes de inyectarse en el DOM.
*   **Manejo Seguro de Tokens:** Los JWT de sesión se almacenarán en estructuras de memoria volátil o almacenamiento web del navegador de forma segura. En caso de recibir un error HTTP 401 (No Autorizado) por parte del servidor, el frontend destruirá inmediatamente la sesión local y redirigirá al login.

#### 3.3.3 Requisitos de Calidad de Software (Accesibilidad y Usabilidad)
*   **HTML Semántico:** Uso correcto de etiquetas estructurales (`<main>`, `<nav>`, `<header>`, `<section>`, `<article>`).
*   **Cumplimiento WCAG (Nivel AA):** 
    *   Asegurar contraste mínimo de texto contra el fondo de 4.5:1.
    *   Soporte de navegación por teclado utilizando la tecla `TAB` y estilos claros para focos (`:focus`).
    *   Uso estricto de atributos `aria-label` en inputs interactivos y botones basados en iconos.
*   **Diseño de Código (Separation of Concerns):**
    *   Las Vistas (`*.view.js`) sólo construyen y manipulan elementos de DOM.
    *   Los Controladores (`*.controller.js`) reciben eventos y delegan a la capa de servicios.
    *   Los Servicios (`*.service.js`) manejan las conexiones e interacción con el HttpClient.

#### 3.3.4 Requisitos de Mantenibilidad y Verificación (QA)
*   La aplicación debe permitir la ejecución de pruebas unitarias y de integración sobre controladores, enrutadores y validadores.
*   Las pruebas usarán simulación del DOM en NodeJS (`jsdom`) evitando requerir navegadores reales pesados para validar lógica de interfaces.
