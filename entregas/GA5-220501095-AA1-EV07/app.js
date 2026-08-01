(function () {
    "use strict";

    // 1. ESTADO DE LA APLICACIÓN
    const state = {
        currentView: "home", // "home" | "agendar" | "catalogo" | "perfil"
        wizardStep: 1,       // 1 | 2 | 3
        user: {
            name: "Laura",
            role: "Cliente Premium",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256"
        },
        services: [
            { id: 1, name: "Corte de Cabello", price: "$45.000", time: "45 min", desc: "Corte personalizado con lavado y peinado básico.", icon: "fa-scissors" },
            { id: 2, name: "Tinte y Color", price: "$120.000", time: "120 min", desc: "Coloración completa con productos sin amoníaco.", icon: "fa-brush" },
            { id: 3, name: "Manicure", price: "$35.000", time: "30 min", desc: "Perfilado, limpieza de cutícula y esmaltado tradicional.", icon: "fa-hand-sparkles" }
        ],
        availableDays: [
            { dayName: "Vie", dayNumber: "31", dateStr: "2026-07-31" },
            { dayName: "Sáb", dayNumber: "01", dateStr: "2026-08-01" },
            { dayName: "Dom", dayNumber: "02", dateStr: "2026-08-02" },
            { dayName: "Lun", dayNumber: "03", dateStr: "2026-08-03" },
            { dayName: "Mar", dayNumber: "04", dateStr: "2026-08-04" },
            { dayName: "Mié", dayNumber: "05", dateStr: "2026-08-05" },
            { dayName: "Jue", dayNumber: "06", dateStr: "2026-08-06" }
        ],
        availableTimes: ["09:00 AM", "10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"],
        // Cita activa / en edición / próxima cita
        nextAppointment: {
            serviceName: "Manicure",
            dateStr: "Hoy",
            timeStr: "15:00",
            status: "Programada"
        },
        // Selección actual del flujo de agendamiento
        bookingSelection: {
            service: null,
            day: null,
            time: null
        }
    };

    // 2. ELEMENTOS DEL DOM
    let appContainer = null;

    // 3. FUNCIONES DE RENDERIZACIÓN

    function showToast(message, type = "info") {
        const existingToast = document.querySelector(".toast");
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement("div");
        toast.className = `toast toast--show ${type === "success" ? "toast--success" : ""}`;
        toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i> <span>${message}</span>`;
        
        const screen = document.querySelector(".phone-mockup__screen");
        if (screen) {
            screen.appendChild(toast);
            setTimeout(() => {
                toast.classList.remove("toast--show");
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // Render principal de la app
    function renderApp() {
        appContainer.innerHTML = `
            <div class="app-container">
                ${renderHeader()}
                <main class="app-content">
                    ${renderActiveView()}
                </main>
                ${renderFooter()}
            </div>
        `;
        bindEvents();
    }

    // Header superior según la vista
    function renderHeader() {
        if (state.currentView === "perfil") {
            return `
                <header class="app-header">
                    <div class="app-header__greeting">
                        <span class="app-header__greeting-title">Mi Perfil</span>
                    </div>
                    <button class="app-header__settings-btn" id="btn-settings" aria-label="Ajustes">
                        <i class="fa-solid fa-gear"></i>
                    </button>
                </header>
            `;
        }

        let titleStr = "Inicio";
        let subtitleStr = "Salón de Belleza";
        if (state.currentView === "agendar") {
            titleStr = "Agendar Cita";
            subtitleStr = `Paso ${state.wizardStep} de 3`;
        } else if (state.currentView === "catalogo") {
            titleStr = "Catálogo";
            subtitleStr = "Nuestros Servicios";
        }

        return `
            <header class="app-header">
                <div class="app-header__greeting">
                    <span class="app-header__greeting-title" id="header-greeting">Hola, ${state.user.name}</span>
                    <span class="app-header__greeting-subtitle">${subtitleStr}</span>
                </div>
                <img class="app-header__profile-img" src="${state.user.avatar}" alt="Foto de perfil de ${state.user.name}">
            </header>
        `;
    }

    // Footer con bottom navigation
    function renderFooter() {
        const views = [
            { id: "home", label: "Inicio", icon: "fa-house" },
            { id: "agendar", label: "Agendar", icon: "fa-calendar-days" },
            { id: "catalogo", label: "Catálogo", icon: "fa-book-open" },
            { id: "perfil", label: "Perfil", icon: "fa-user" }
        ];

        let html = '<footer class="app-footer">';
        views.forEach(v => {
            const isActive = state.currentView === v.id;
            html += `
                <button class="nav-item ${isActive ? 'nav-item--active' : ''}" data-nav="${v.id}">
                    <i class="fa-solid ${v.icon}"></i>
                    <span>${v.label}</span>
                </button>
            `;
        });
        html += '</footer>';
        return html;
    }

    // Renderizar la vista seleccionada
    function renderActiveView() {
        switch (state.currentView) {
            case "home":
                return renderHomeView();
            case "agendar":
                return renderAgendarWizard();
            case "catalogo":
                return renderCatalogoView();
            case "perfil":
                return renderPerfilView();
            default:
                return renderHomeView();
        }
    }

    // --- PANTALLA 1: HOME / DASHBOARD ---
    function renderHomeView() {
        return `
            <div class="dashboard-view">
                <!-- CARD PRINCIPAL (DESTACADO) -->
                <article class="featured-card">
                    <span class="featured-card__tag">Próxima Cita</span>
                    <h3 class="featured-card__title">${state.nextAppointment.dateStr}, ${state.nextAppointment.timeStr} - ${state.nextAppointment.serviceName}</h3>
                    <div class="featured-card__details">
                        <i class="fa-solid fa-circle-check"></i>
                        <span>Estado: ${state.nextAppointment.status}</span>
                    </div>
                    <button class="featured-card__btn" id="btn-modify-appointment">Modificar</button>
                </article>

                <!-- SECCIÓN CENTRAL: CUADRÍCULA (GRID) -->
                <h4 class="app-subtitle-section">Accesos Rápidos</h4>
                <div class="quick-grid">
                    <button class="quick-grid__btn" id="grid-book">
                        <div class="quick-grid__icon"><i class="fa-solid fa-calendar-plus"></i></div>
                        <span class="quick-grid__label">Agendar Nueva Cita</span>
                    </button>
                    
                    <button class="quick-grid__btn" id="grid-catalog">
                        <div class="quick-grid__icon"><i class="fa-solid fa-images"></i></div>
                        <span class="quick-grid__label">Ver Catálogo</span>
                    </button>
                    
                    <button class="quick-grid__btn quick-grid__btn--double" id="grid-promotions">
                        <div class="quick-grid__icon"><i class="fa-solid fa-tags"></i></div>
                        <div class="quick-grid__label">
                            <strong>Mis Promociones</strong>
                            <p style="font-size:0.75rem; font-weight:normal; color:var(--color-texto-secundario);">Tienes 2 cupones activos</p>
                        </div>
                    </button>
                </div>

                <!-- BANNER DE PROMOCIÓN DESTACADA -->
                <div class="promo-banner">
                    <i class="fa-solid fa-gift promo-banner__icon"></i>
                    <div class="promo-banner__content">
                        <span class="promo-banner__title">¡Descuento de Cumpleaños!</span>
                        <span class="promo-banner__text">20% de descuento en Tinte y Color durante este mes.</span>
                    </div>
                </div>
            </div>
        `;
    }

    // --- PANTALLA 2: WIZARD DE AGENDAMIENTO ---
    function renderAgendarWizard() {
        let stepContent = "";

        // Generar contenido del paso activo
        if (state.wizardStep === 1) {
            stepContent = renderWizardStep1();
        } else if (state.wizardStep === 2) {
            stepContent = renderWizardStep2();
        } else if (state.wizardStep === 3) {
            stepContent = renderWizardStep3();
        }

        return `
            <div class="wizard">
                <!-- Barra de Progreso del Wizard -->
                <div class="wizard-progress">
                    <div class="wizard-step-container">
                        <div class="wizard-step ${state.wizardStep >= 1 ? 'wizard-step--active' : ''} ${state.wizardStep > 1 ? 'wizard-step--completed' : ''}">1</div>
                        <span class="wizard-step-label">Servicio</span>
                    </div>
                    <div class="wizard-step-container">
                        <div class="wizard-step ${state.wizardStep >= 2 ? 'wizard-step--active' : ''} ${state.wizardStep > 2 ? 'wizard-step--completed' : ''}">2</div>
                        <span class="wizard-step-label">Fecha/Hora</span>
                    </div>
                    <div class="wizard-step-container">
                        <div class="wizard-step ${state.wizardStep >= 3 ? 'wizard-step--active' : ''}">3</div>
                        <span class="wizard-step-label">Confirmar</span>
                    </div>
                </div>

                <!-- Contenido dinámico del Paso -->
                <div class="wizard-step-content" style="margin-top: 2rem;">
                    ${stepContent}
                </div>

                <!-- Navegación del Wizard -->
                <div class="wizard-nav">
                    ${state.wizardStep > 1 ? '<button class="wizard-nav__btn" id="wizard-back">Atrás</button>' : '<div></div>'}
                    ${state.wizardStep < 3 ? `<button class="wizard-nav__btn wizard-nav__btn--primary" id="wizard-next" ${isNextDisabled() ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>Continuar</button>` : ''}
                </div>
            </div>
        `;
    }

    function isNextDisabled() {
        if (state.wizardStep === 1 && !state.bookingSelection.service) return true;
        if (state.wizardStep === 2 && (!state.bookingSelection.day || !state.bookingSelection.time)) return true;
        return false;
    }

    // Paso 1: Selección de Servicios
    function renderWizardStep1() {
        let html = '<h4 class="app-subtitle-section">Elige un Servicio</h4><div class="service-list">';
        state.services.forEach(s => {
            const isSelected = state.bookingSelection.service && state.bookingSelection.service.id === s.id;
            html += `
                <div class="service-card ${isSelected ? 'service-card--selected' : ''}" data-service-id="${s.id}">
                    <div class="service-card__icon">
                        <i class="fa-solid ${s.icon}"></i>
                    </div>
                    <div class="service-card__info">
                        <span class="service-card__name">${s.name}</span>
                        <p class="service-card__desc">${s.desc}</p>
                        <div class="service-card__price-time">
                            <span class="service-card__price">${s.price}</span>
                            <span class="service-card__time"><i class="fa-regular fa-clock"></i> ${s.time}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // Paso 2: Selección de Fecha y Hora
    function renderWizardStep2() {
        let dayHtml = '<h4 class="app-subtitle-section">Selecciona el Día</h4><div class="calendar-slider">';
        state.availableDays.forEach(d => {
            const isSelected = state.bookingSelection.day && state.bookingSelection.day.dateStr === d.dateStr;
            dayHtml += `
                <div class="calendar-day ${isSelected ? 'calendar-day--selected' : ''}" data-date="${d.dateStr}">
                    <span class="calendar-day__name">${d.dayName}</span>
                    <span class="calendar-day__number">${d.dayNumber}</span>
                </div>
            `;
        });
        dayHtml += '</div>';

        let timeHtml = '<h4 class="app-subtitle-section" style="margin-top: 1.5rem;">Selecciona la Hora</h4><div class="time-grid">';
        state.availableTimes.forEach(t => {
            const isSelected = state.bookingSelection.time === t;
            // Deshabilitar de forma ilustrativa una hora si coincide con la cita de Laura hoy para mostrar validación de solapamiento
            const isDisabled = d && state.bookingSelection.day && state.bookingSelection.day.dayNumber === "31" && t === "03:00 PM";
            timeHtml += `
                <button class="time-slot ${isSelected ? 'time-slot--selected' : ''} ${isDisabled ? 'time-slot--disabled' : ''}" 
                        data-time="${t}" ${isDisabled ? 'disabled' : ''}>
                    ${t}
                </button>
            `;
        });
        timeHtml += '</div>';

        return dayHtml + timeHtml;
    }

    // Paso 3: Confirmación de Cita con FAB
    function renderWizardStep3() {
        const s = state.bookingSelection.service;
        const d = state.bookingSelection.day;
        const t = state.bookingSelection.time;

        return `
            <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                <h4 class="app-subtitle-section">Resumen del Agendamiento</h4>
                
                <div class="confirm-details">
                    <div class="confirm-details__item">
                        <div class="confirm-details__icon"><i class="fa-solid fa-sparkles"></i></div>
                        <div class="confirm-details__content">
                            <span class="confirm-details__label">Servicio</span>
                            <span class="confirm-details__value">${s ? s.name : "No seleccionado"}</span>
                        </div>
                    </div>
                    
                    <div class="confirm-details__item">
                        <div class="confirm-details__icon"><i class="fa-solid fa-calendar-day"></i></div>
                        <div class="confirm-details__content">
                            <span class="confirm-details__label">Fecha</span>
                            <span class="confirm-details__value">${d ? `${d.dayName} ${d.dayNumber} de Agosto` : "No seleccionada"}</span>
                        </div>
                    </div>

                    <div class="confirm-details__item">
                        <div class="confirm-details__icon"><i class="fa-solid fa-clock"></i></div>
                        <div class="confirm-details__content">
                            <span class="confirm-details__label">Hora</span>
                            <span class="confirm-details__value">${t ? t : "No seleccionada"}</span>
                        </div>
                    </div>

                    <div class="confirm-details__item" style="border-top: 1px solid var(--color-vinotinto-border); padding-top: 0.8rem;">
                        <div class="confirm-details__icon"><i class="fa-solid fa-tag"></i></div>
                        <div class="confirm-details__content">
                            <span class="confirm-details__label">Total Estimado</span>
                            <span class="confirm-details__price">${s ? s.price : "$0"}</span>
                        </div>
                    </div>
                </div>

                <p style="font-size:0.75rem; color:var(--color-texto-secundario); text-align:center; padding:0 0.5rem;">
                    * Puedes cancelar o reprogramar esta cita sin cargo adicional hasta 24 horas antes del servicio.
                </p>

                <!-- BOTÓN FLOTANTE PRINCIPAL (FAB) -->
                <button class="fab-confirm" id="btn-confirm-booking" aria-label="Confirmar Reserva">
                    <i class="fa-solid fa-check"></i>
                    <span>Confirmar Reserva</span>
                </button>
            </div>
        `;
    }

    // --- PANTALLA 3: PERFIL DEL USUARIO ---
    function renderPerfilView() {
        return `
            <div class="profile-view">
                <!-- HEADER DE PERFIL -->
                <div class="profile-card">
                    <img class="profile-card__avatar" src="${state.user.avatar}" alt="Avatar de ${state.user.name}">
                    <h3 class="profile-card__name">${state.user.name}</h3>
                    <span class="profile-card__role">${state.user.role}</span>
                </div>

                <!-- LISTA DE OPCIONES (LIST TILES) -->
                <h4 class="app-subtitle-section">Configuración</h4>
                <div class="list-tile-container">
                    <div class="list-tile" id="tile-personal">
                        <div class="list-tile__icon"><i class="fa-solid fa-user-gear"></i></div>
                        <div class="list-tile__content">
                            <span class="list-tile__title">Datos Personales</span>
                            <p class="list-tile__subtitle">Información de contacto y preferencias</p>
                        </div>
                        <i class="fa-solid fa-chevron-right list-tile__arrow"></i>
                    </div>

                    <div class="list-tile" id="tile-payment">
                        <div class="list-tile__icon"><i class="fa-solid fa-credit-card"></i></div>
                        <div class="list-tile__content">
                            <span class="list-tile__title">Métodos de Pago</span>
                            <p class="list-tile__subtitle">Tarjetas guardadas y facturación</p>
                        </div>
                        <i class="fa-solid fa-chevron-right list-tile__arrow"></i>
                    </div>

                    <div class="list-tile" id="tile-history">
                        <div class="list-tile__icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
                        <div class="list-tile__content">
                            <span class="list-tile__title">Historial de Citas</span>
                            <p class="list-tile__subtitle">Consulta tus citas y servicios pasados</p>
                        </div>
                        <i class="fa-solid fa-chevron-right list-tile__arrow"></i>
                    </div>

                    <div class="list-tile list-tile--danger" id="tile-logout">
                        <div class="list-tile__icon"><i class="fa-solid fa-right-from-bracket"></i></div>
                        <div class="list-tile__content">
                            <span class="list-tile__title">Cerrar Sesión</span>
                            <p class="list-tile__subtitle">Salir de tu cuenta de forma segura</p>
                        </div>
                        <i class="fa-solid fa-chevron-right list-tile__arrow"></i>
                    </div>
                </div>
            </div>
        `;
    }

    // --- CATÁLOGO ---
    function renderCatalogoView() {
        return `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <h4 class="app-subtitle-section">Nuestra Galería de Estilos</h4>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem;">
                    <div style="background-color: var(--color-superficie); border-radius: 12px; overflow: hidden; border:1px solid var(--color-vinotinto-border);">
                        <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=200" alt="Corte de cabello" style="width:100%; height:120px; object-fit:cover;">
                        <div style="padding: 0.5rem; text-align: center; font-size:0.8rem; font-weight:700;">Cortes Modernos</div>
                    </div>
                    <div style="background-color: var(--color-superficie); border-radius: 12px; overflow: hidden; border:1px solid var(--color-vinotinto-border);">
                        <img src="https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=200" alt="Coloración de cabello" style="width:100%; height:120px; object-fit:cover;">
                        <div style="padding: 0.5rem; text-align: center; font-size:0.8rem; font-weight:700;">Color & Balayage</div>
                    </div>
                    <div style="background-color: var(--color-superficie); border-radius: 12px; overflow: hidden; border:1px solid var(--color-vinotinto-border);">
                        <img src="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=200" alt="Uñas manicura" style="width:100%; height:120px; object-fit:cover;">
                        <div style="padding: 0.5rem; text-align: center; font-size:0.8rem; font-weight:700;">Diseño de Uñas</div>
                    </div>
                    <div style="background-color: var(--color-superficie); border-radius: 12px; overflow: hidden; border:1px solid var(--color-vinotinto-border);">
                        <img src="https://images.unsplash.com/photo-1522337360788-8b13edd793be?auto=format&fit=crop&q=80&w=200" alt="Peinados" style="width:100%; height:120px; object-fit:cover;">
                        <div style="padding: 0.5rem; text-align: center; font-size:0.8rem; font-weight:700;">Peinados de Gala</div>
                    </div>
                </div>

                <button class="wizard-nav__btn wizard-nav__btn--primary" id="btn-back-home" style="margin-top: 1rem; width: 100%;">
                    Volver al Inicio
                </button>
            </div>
        `;
    }

    // 4. CONTROLADORES DE EVENTOS / BINDINGS

    function bindEvents() {
        // --- Navegación del Footer ---
        const navButtons = document.querySelectorAll("[data-nav]");
        navButtons.forEach(btn => {
            btn.addEventListener("click", function () {
                const targetView = this.getAttribute("data-nav");
                state.currentView = targetView;
                if (targetView === "agendar") {
                    state.wizardStep = 1;
                }
                renderApp();
            });
        });

        // --- Acciones de Home/Dashboard ---
        const btnModify = document.getElementById("btn-modify-appointment");
        if (btnModify) {
            btnModify.addEventListener("click", () => {
                // Iniciar flujo de agendamiento cargando la cita actual como preseleccionada
                const currentService = state.services.find(s => s.name === state.nextAppointment.serviceName);
                state.bookingSelection.service = currentService || state.services[0];
                state.bookingSelection.day = state.availableDays[0];
                state.bookingSelection.time = state.nextAppointment.timeStr === "15:00" ? "02:30 PM" : state.nextAppointment.timeStr;
                state.currentView = "agendar";
                state.wizardStep = 2; // Llevar a paso de fecha y hora para modificar
                renderApp();
                showToast("Modificando tu cita activa...", "info");
            });
        }

        const gridBook = document.getElementById("grid-book");
        if (gridBook) {
            gridBook.addEventListener("click", () => {
                state.currentView = "agendar";
                state.wizardStep = 1;
                state.bookingSelection = { service: null, day: null, time: null };
                renderApp();
            });
        }

        const gridCatalog = document.getElementById("grid-catalog");
        if (gridCatalog) {
            gridCatalog.addEventListener("click", () => {
                state.currentView = "catalogo";
                renderApp();
            });
        }

        const gridPromotions = document.getElementById("grid-promotions");
        if (gridPromotions) {
            gridPromotions.addEventListener("click", () => {
                showToast("Cupón de 10% y 20% disponibles en tu bandeja.", "success");
            });
        }

        // --- Acciones del Wizard ---
        // Paso 1: Seleccionar Servicio
        const serviceCards = document.querySelectorAll(".service-card");
        serviceCards.forEach(card => {
            card.addEventListener("click", function () {
                const sId = parseInt(this.getAttribute("data-service-id"));
                state.bookingSelection.service = state.services.find(s => s.id === sId);
                renderApp();
            });
        });

        // Paso 2: Seleccionar Día
        const dayCards = document.querySelectorAll(".calendar-day");
        dayCards.forEach(card => {
            card.addEventListener("click", function () {
                const dateStr = this.getAttribute("data-date");
                state.bookingSelection.day = state.availableDays.find(d => d.dateStr === dateStr);
                renderApp();
            });
        });

        // Paso 2: Seleccionar Hora
        const timeSlots = document.querySelectorAll(".time-slot");
        timeSlots.forEach(slot => {
            slot.addEventListener("click", function () {
                if (this.disabled) return;
                state.bookingSelection.time = this.getAttribute("data-time");
                renderApp();
            });
        });

        // Wizard: Botón Siguiente
        const btnNext = document.getElementById("wizard-next");
        if (btnNext) {
            btnNext.addEventListener("click", () => {
                if (state.wizardStep < 3) {
                    state.wizardStep++;
                    renderApp();
                }
            });
        }

        // Wizard: Botón Atrás
        const btnBack = document.getElementById("wizard-back");
        if (btnBack) {
            btnBack.addEventListener("click", () => {
                if (state.wizardStep > 1) {
                    state.wizardStep--;
                    renderApp();
                }
            });
        }

        // Wizard Paso 3: Confirmación Final (FAB)
        const btnConfirmBooking = document.getElementById("btn-confirm-booking");
        if (btnConfirmBooking) {
            btnConfirmBooking.addEventListener("click", () => {
                const s = state.bookingSelection.service;
                const d = state.bookingSelection.day;
                const t = state.bookingSelection.time;

                if (s && d && t) {
                    // Actualizar la próxima cita con lo reservado
                    state.nextAppointment = {
                        serviceName: s.name,
                        dateStr: d.dateStr === "2026-07-31" ? "Hoy" : `${d.dayName} ${d.dayNumber}`,
                        timeStr: t,
                        status: "Confirmada"
                    };

                    showToast("¡Reserva confirmada exitosamente!", "success");

                    // Redireccionar al home después de 1.5 segundos
                    setTimeout(() => {
                        state.currentView = "home";
                        state.bookingSelection = { service: null, day: null, time: null };
                        renderApp();
                    }, 1500);
                }
            });
        }

        // --- Acciones de Perfil ---
        const tilePersonal = document.getElementById("tile-personal");
        if (tilePersonal) {
            tilePersonal.addEventListener("click", () => {
                showToast("Abriendo Datos Personales de Laura...", "info");
            });
        }

        const tilePayment = document.getElementById("tile-payment");
        if (tilePayment) {
            tilePayment.addEventListener("click", () => {
                showToast("Métodos de Pago: Visa terminada en 4321.", "info");
            });
        }

        const tileHistory = document.getElementById("tile-history");
        if (tileHistory) {
            tileHistory.addEventListener("click", () => {
                showToast("Cargando Historial: 12 servicios completados.", "info");
            });
        }

        const tileLogout = document.getElementById("tile-logout");
        if (tileLogout) {
            tileLogout.addEventListener("click", () => {
                // Confirmación preventora de toque accidental
                const confirmLogout = confirm("¿Estás seguro de que deseas cerrar sesión?");
                if (confirmLogout) {
                    showToast("Sesión cerrada. Redirigiendo...", "info");
                }
            });
        }

        const btnSettings = document.getElementById("btn-settings");
        if (btnSettings) {
            btnSettings.addEventListener("click", () => {
                showToast("Configuración de la aplicación móvil.", "info");
            });
        }

        // --- Botón de vuelta al Inicio ---
        const btnBackHome = document.getElementById("btn-back-home");
        if (btnBackHome) {
            btnBackHome.addEventListener("click", () => {
                state.currentView = "home";
                renderApp();
            });
        }
    }

    // 5. INICIALIZACIÓN
    document.addEventListener("DOMContentLoaded", () => {
        appContainer = document.getElementById("app");
        if (appContainer) {
            renderApp();
        }
    });

})();
