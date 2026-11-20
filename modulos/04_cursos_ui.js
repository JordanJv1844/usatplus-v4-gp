// =========================================
// USAT+ v4 - MÓDULO 04: LIMPIEZA DE CURSOS Y OVERHAUL MINIMALISTA
// =========================================
(() => {
    const ENV = window.USAT_ENV;
    const CORE = window.USAT_CORE;
    if (!ENV || !CORE) return;

    let observerCursos = null;

    // -----------------------------------------
    // 4.1 LIMPIEZA DE VISTA DE CURSOS (Solo /aulavirtual/my/)
    // -----------------------------------------
    function calcularCicloActual() {
        const dt = new Date();
        const dm = dt.getMonth();
        return `${dt.getFullYear()}-${dm > 6 ? 'II' : dm < 2 ? '0' : 'I'}`;
    }

    function ordenarValorCiclo(cicloStr) {
        const m = cicloStr.match(/^(\d{4})-(0|I|II)$/i);
        if (!m) return 0;
        const anio = Number(m[1]);
        const peso = m[2].toUpperCase() === 'II' ? 2 : m[2].toUpperCase() === 'I' ? 1 : 0;
        return anio * 10 + peso;
    }

    function filtrarTarjetasCursos() {
        const curCic = calcularCicloActual();
        const paginas = document.querySelectorAll(
            '[data-block="myoverview"] .paged-content-page-container [data-region="paged-content-page"]:not(.hidden)'
        );

        paginas.forEach((pagina) => {
            const items = Array.from(pagina.querySelectorAll('.list-group-item, .card.dashboard-card'));
            if (items.length === 0) return;

            // Determinar si hay al menos un curso del ciclo calculado; si no, elegir el más reciente disponible
            const nombres = items.map(card => card.querySelector('a.coursename, .multiline')?.textContent.trim() || '');
            let cicloObjetivo = curCic;

            if (!nombres.some(n => n.includes(curCic))) {
                let mejorCiclo = '';
                let mejorValor = -1;
                nombres.forEach((n) => {
                    const match = n.match(/\b(\d{4}-(?:II|I|0))\b/i);
                    if (match) {
                        const val = ordenarValorCiclo(match[1]);
                        if (val > mejorValor) {
                            mejorValor = val;
                            mejorCiclo = match[1].toUpperCase();
                        }
                    }
                });
                if (mejorCiclo) cicloObjetivo = mejorCiclo;
            }

            const vistos = new Set();
            items.forEach((card, i) => {
                const courseName = nombres[i];
                if (!courseName) return;
                const href = card.querySelector('a.coursename')?.getAttribute('href') || courseName;
                const coincide = courseName.toUpperCase().includes(cicloObjetivo);

                if (coincide && !vistos.has(href)) {
                    card.classList.remove('disabled-course');
                    vistos.add(href);
                } else {
                    card.classList.add('disabled-course');
                }
            });
        });
    }

    function activarFiltroCursos() {
        if (!window.location.href.includes('/aulavirtual/my/')) return;

        if (!document.getElementById('css-limpieza-cursos')) {
            const style = document.createElement('style');
            style.id = 'css-limpieza-cursos';
            style.textContent = `
                .block_myoverview [data-region="filter"] { clear: both !important; margin: 8px 0 14px !important; }
                .block_myoverview [data-region="courses-view"] { clear: both !important; margin: 12px 0 14px !important; }
                .block_myoverview [data-region="paging-bar-container"] { clear: both !important; margin-top: 10px !important; }

                [data-block="myoverview"] .paged-content-page-container [data-region="paged-content-page"]:not(.hidden) .list-group,
                [data-block="myoverview"] .dashboard-card-deck,
                [data-region="recentlyaccessedcourses-view-content"] .dashboard-card-deck {
                    display: grid !important;
                    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    gap: 12px !important;
                    border: none !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    box-sizing: border-box !important;
                    padding: 8px 0 0 !important;
                }
                [data-block="myoverview"] .paged-content-page-container .list-group > *,
                [data-block="myoverview"] .dashboard-card-deck > *,
                [data-region="recentlyaccessedcourses-view-content"] .dashboard-card-deck > * {
                    min-width: 0 !important;
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                }
                [data-block="myoverview"] .paged-content-page-container .list-group .list-group-item:not(.disabled-course),
                [data-block="myoverview"] .card.dashboard-card:not(.disabled-course),
                [data-region="recentlyaccessedcourses-view-content"] .card.dashboard-card {
                    position: relative !important;
                    cursor: pointer !important;
                    padding: 0 14px !important;
                    margin: 0 !important;
                    border-radius: 8px !important;
                    border: 1px solid #cbd5e1 !important;
                    background-color: #ffffff !important;
                    box-shadow: 0 2px 5px rgba(15, 23, 42, 0.05) !important;
                    height: 42px !important;
                    min-height: 42px !important;
                    max-height: 42px !important;
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    overflow: hidden !important;
                    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease !important;
                }
                [data-block="myoverview"] .disabled-course { display: none !important; }
                [data-block="myoverview"] .list-group-item:hover,
                [data-block="myoverview"] .card.dashboard-card:hover,
                [data-region="recentlyaccessedcourses-view-content"] .card.dashboard-card:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 8px rgba(15, 23, 42, 0.09) !important;
                    border-color: #dc2626 !important;
                }
                .categoryname,
                .card.dashboard-card .text-muted,
                .card.dashboard-card small,
                [data-block="myoverview"] .text-muted,
                [data-block="myoverview"] .col-md-1,
                [data-block="myoverview"] .progress,
                [data-block="myoverview"] .more-menu,
                [data-block="myoverview"] .card.dashboard-card .card-img,
                [data-block="myoverview"] .card.dashboard-card .card-img-top,
                [data-block="myoverview"] .card.dashboard-card .course-summary,
                [data-block="myoverview"] .card.dashboard-card [data-region="favourite-icon"],
                [data-region="recentlyaccessedcourses-view-content"] .card.dashboard-card .card-img,
                [data-region="recentlyaccessedcourses-view-content"] .card.dashboard-card [data-region="favourite-icon"] {
                    display: none !important;
                }
                [data-block="myoverview"] .list-group-item .row,
                [data-block="myoverview"] .list-group-item .col-md-11,
                [data-block="myoverview"] .card.dashboard-card .card-body,
                [data-block="myoverview"] .card.dashboard-card .course-info-container,
                [data-region="recentlyaccessedcourses-view-content"] .card.dashboard-card .card-body,
                [data-region="recentlyaccessedcourses-view-content"] .card.dashboard-card .course-info-container {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    height: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    overflow: hidden !important;
                    box-sizing: border-box !important;
                }
                [data-block="myoverview"] a.coursename,
                [data-block="myoverview"] .coursename,
                [data-block="myoverview"] .multiline,
                [data-region="recentlyaccessedcourses-view-content"] a.coursename,
                [data-region="recentlyaccessedcourses-view-content"] .coursename,
                [data-region="recentlyaccessedcourses-view-content"] .multiline {
                    display: block !important;
                    flex: 1 1 auto !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    overflow: hidden !important;
                    white-space: nowrap !important;
                    text-overflow: ellipsis !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    line-height: 18px !important;
                    color: #1e293b !important;
                    text-decoration: none !important;
                    padding: 0 !important;
                }
                [data-block="myoverview"] .list-group-item:hover .coursename,
                [data-block="myoverview"] .card.dashboard-card:hover .coursename,
                [data-block="myoverview"] .card.dashboard-card:hover .multiline,
                [data-region="recentlyaccessedcourses-view-content"] .card.dashboard-card:hover .coursename,
                [data-region="recentlyaccessedcourses-view-content"] .card.dashboard-card:hover .multiline {
                    color: #dc2626 !important;
                }
                [data-block="myoverview"] a.coursename::after,
                [data-region="recentlyaccessedcourses-view-content"] a.coursename::after {
                    content: "" !important;
                    position: absolute !important;
                    inset: 0 !important;
                    z-index: 5 !important;
                }
            `;
            document.head.appendChild(style);
        }

        const filtrarDebounced = CORE.debounce(filtrarTarjetasCursos, 120);
        let intentos = 0;
        const esperaInicial = setInterval(() => {
            intentos++;
            const hayCursos = document.querySelector('[data-block="myoverview"] a.coursename, [data-block="myoverview"] .multiline');
            if (!hayCursos && intentos < 20) return;

            clearInterval(esperaInicial);

            const dropdownProgreso = document.querySelector('#groupingdropdown span');
            const btnProgreso = document.querySelector('a[data-filter="grouping"][data-value="inprogress"]');
            if (dropdownProgreso && btnProgreso && !dropdownProgreso.textContent.includes('En progreso')) {
                btnProgreso.click();
            }

            setTimeout(() => {
                const dropdownVista = document.querySelector('#displaydropdown span');
                const btnLista = document.querySelector('a[data-display-option="display"][data-value="list"]');
                if (dropdownVista && btnLista && !dropdownVista.textContent.includes('Lista')) {
                    btnLista.click();
                }
                filtrarDebounced();
            }, 350);

            filtrarTarjetasCursos();

            const coursesView = document.querySelector('[data-region="courses-view"]');
            if (coursesView && !observerCursos) {
                observerCursos = new MutationObserver(filtrarDebounced);
                observerCursos.observe(coursesView, { childList: true, subtree: true });
            }
        }, 350);
    }

    function desactivarFiltroCursos() {
        document.getElementById('css-limpieza-cursos')?.remove();
        document.querySelectorAll('.disabled-course').forEach(el => el.classList.remove('disabled-course'));
        if (observerCursos) {
            observerCursos.disconnect();
            observerCursos = null;
        }
    }

    // -----------------------------------------
    // 4.2 OVERHAUL MINIMALISTA
    // -----------------------------------------
    function activarOverhaul() {
        if (window.location.href.includes('/mod/')) return;

        const txtUser = document.getElementById('txtUsername');
        const txtPass = document.getElementById('txtPassword');
        if (txtUser && txtPass) {
            document.body.classList.add('usat-login-page');
            txtUser.placeholder = 'Código Universitario';
            txtPass.placeholder = 'Contraseña';

            const agregarIconoInput = (input, id, svg) => {
                if (document.getElementById(id)) return;
                const wrap = document.createElement('div');
                wrap.className = 'usat-input-wrap';
                input.parentNode.insertBefore(wrap, input);
                wrap.appendChild(input);
                const ico = document.createElement('span');
                ico.id = id;
                ico.className = 'usat-input-icon';
                ico.innerHTML = svg;
                wrap.appendChild(ico);
            };
            agregarIconoInput(txtUser, 'usat-ico-user', `<svg viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`);
            agregarIconoInput(txtPass, 'usat-ico-pass', `<svg viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`);

            const form = txtUser.closest('form') || document.body;
            form.querySelectorAll('span, label, p, b').forEach((el) => {
                if (el.children.length > 0) return;
                const t = el.textContent.trim();
                if (t === 'Código universitario' || t === 'Contraseña') {
                    el.style.display = 'none';
                }
            });
        }

        if (document.getElementById('usat-overhaul-minimalista')) return;
        const style = document.createElement('style');
        style.id = 'usat-overhaul-minimalista';
        style.textContent = `
            body, html, #wrapper, #page, td, th, p, span, input, button, select, textarea {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                letter-spacing: -0.01em !important;
            }
            body, #page, #wrapper, #page-content, #region-main-box, #region-main {
                background-color: #f1f5f9 !important;
                background-image: none !important;
            }
            #page-content, #region-main { padding: 8px 12px !important; }
            .course-content .section.main, .block {
                background-color: #ffffff !important;
                border-radius: 12px !important;
                border: 1px solid #cbd5e1 !important;
                box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05) !important;
                padding: 12px 16px !important;
                margin-bottom: 12px !important;
            }
            .contentwithoutlink, .activity.label {
                border: none !important;
                box-shadow: none !important;
                background: transparent !important;
                padding: 2px 0 !important;
                margin: 0 !important;
            }
            .course-content .well:not(.course-pano):not(.course-banner),
            .course-content .panel:not(.course-pano):not(.course-banner) {
                background-color: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 8px !important;
                padding: 6px 12px !important;
                margin-bottom: 8px !important;
                box-shadow: none !important;
            }
            #section-0 .well,
            .course-content .well:has(.course-pano),
            .course-content .well:has(.course-banner) {
                background-color: transparent !important;
                border: none !important;
                padding: 0 !important;
                box-shadow: none !important;
            }
            .section .activity:not(.label) {
                padding: 4px 8px !important;
                margin: 2px 0 !important;
                border-radius: 5px !important;
                border-bottom: 1px solid #f1f5f9 !important;
                font-size: 12px !important;
                transition: background-color 0.15s ease !important;
            }
            .section .activity:not(.label):hover { background-color: #f8fafc !important; }
            .section .activity a { color: #1e293b !important; font-weight: 500 !important; text-decoration: none !important; }
            .section .activity a:hover { color: #dc2626 !important; }
            .nav-tabs { border-bottom: 2px solid #cbd5e1 !important; margin-bottom: 10px !important; background: transparent !important; }
            .nav-tabs .nav-link, .nav-tabs > li > a {
                border: none !important;
                background: transparent !important;
                color: #64748b !important;
                font-weight: 600 !important;
                padding: 5px 12px !important;
                font-size: 12px !important;
                border-bottom: 2px solid transparent !important;
                margin-bottom: -2px !important;
                border-radius: 6px 6px 0 0 !important;
            }
            .nav-tabs .nav-link.active, .nav-tabs > li.active > a {
                color: #dc2626 !important;
                background-color: #ffffff !important;
                border-bottom-color: #dc2626 !important;
                font-weight: 700 !important;
            }
            #divleft, .sidebar { background-color: #ffffff !important; border-right: 1px solid #cbd5e1 !important; }
            .block_navigation .block_tree li a { color: #475569 !important; padding: 2px 4px !important; font-size: 11.5px !important; border-radius: 4px !important; display: inline-block !important; }
            .block_navigation .block_tree li a:hover { background-color: #f1f5f9 !important; color: #dc2626 !important; text-decoration: none !important; }
            .course-pano, .course-banner {
                width: 100% !important;
                max-width: 100% !important;
                min-height: 160px !important;
                height: auto !important;
                padding: 8px 10px !important;
                margin: 0 0 10px 0 !important;
                border: none !important;
                background-color: transparent !important;
                background-size: 100% 100% !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                border-radius: 10px !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
            }

            /* Estilos acotados exclusivamente a la pantalla de Login */
            body.usat-login-page .login-container,
            body.usat-login-page .login-box,
            body.usat-login-page form#form1 > div[style*="background-color: white"],
            body.usat-login-page div[style*="background-color:#ffffff"] {
                border-radius: 16px !important;
                box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12) !important;
                border: none !important;
                padding: 25px 20px !important;
            }
            body.usat-login-page #txtUsername,
            body.usat-login-page #txtPassword {
                background-color: #f8fafc !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 8px !important;
                padding: 13px 14px 13px 42px !important;
                color: #0f172a !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                width: 100% !important;
                box-sizing: border-box !important;
                margin-bottom: 4px !important;
                background-repeat: no-repeat !important;
                background-position: 14px center !important;
                background-size: 18px !important;
                transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
            }
            body.usat-login-page .usat-input-wrap {
                position: relative !important;
                width: 100% !important;
                display: block !important;
            }
            body.usat-login-page .usat-input-icon {
                position: absolute !important;
                left: 14px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                pointer-events: none !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 3 !important;
            }
            body.usat-login-page .usat-input-icon svg {
                width: 18px !important;
                height: 18px !important;
                min-width: 18px !important;
                max-width: 18px !important;
            }
            body.usat-login-page #txtUsername:focus,
            body.usat-login-page #txtPassword:focus {
                border-color: #dc2626 !important;
                background-color: #ffffff !important;
                box-shadow: 0 0 0 3px rgba(153, 27, 27, 0.15) !important;
                outline: none !important;
            }
            body.usat-login-page #lnkbtnIngresar {
                border-radius: 8px !important;
                font-weight: 700 !important;
                letter-spacing: 0.4px !important;
                padding: 12px !important;
                text-transform: uppercase !important;
            }
        `;
        document.head.appendChild(style);
    }

    function desactivarOverhaul() {
        document.getElementById('usat-overhaul-minimalista')?.remove();
        document.body.classList.remove('usat-login-page');
    }

    // Arranque y escucha en vivo desde popup
    if (ENV.getSetting('vistaCursosActivada', true)) activarFiltroCursos();
    if (ENV.getSetting('vistaMinimalistaActivada', true)) activarOverhaul();

    ENV.onSettingsChanged((changes) => {
        if (changes.vistaCursosActivada) {
            changes.vistaCursosActivada.newValue !== false ? activarFiltroCursos() : desactivarFiltroCursos();
        }
        if (changes.vistaMinimalistaActivada) {
            changes.vistaMinimalistaActivada.newValue !== false ? activarOverhaul() : desactivarOverhaul();
        }
    });
})();