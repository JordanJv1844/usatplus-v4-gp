// =========================================
// USAT+ v4 - MÓDULO 06: VISOR DE ACTIVIDADES EN LÍNEA
// =========================================
(() => {
    const CORE = window.USAT_CORE;
    if (!CORE) return;
    if (!window.location.href.includes('course/view.php')) return;

    function asegurarEstilos() {
        if (document.getElementById('usat-inline-activity-styles')) return;
        const style = document.createElement('style');
        style.id = 'usat-inline-activity-styles';
        style.textContent = `
            .btn-usat-inline {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 5px !important;
                padding: 3px 11px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                color: #1e293b !important;
                background-color: #f1f5f9 !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 14px !important;
                cursor: pointer !important;
                margin-left: 10px !important;
                transition: all 0.15s ease !important;
                text-decoration: none !important;
            }
            .btn-usat-inline:hover {
                background-color: #e2e8f0 !important;
                border-color: #94a3b8 !important;
            }
            .btn-usat-inline.cerrar {
                color: #dc2626 !important;
                background-color: #fef2f2 !important;
                border-color: #fecaca !important;
            }
            .usat-inline-container {
                margin-top: 10px !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 8px !important;
                background-color: #ffffff !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06) !important;
                width: 100% !important;
                animation: usatInlineDown 0.2s ease-out;
            }
            .usat-inline-toolbar {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                gap: 6px !important;
                padding: 7px 10px !important;
                background-color: #f8fafc !important;
                border-bottom: 1px solid #e2e8f0 !important;
            }
            .usat-inline-toolbar-group {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .usat-inline-toolbar button,
            .usat-inline-toolbar a {
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
                background-color: #ffffff !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 5px !important;
                padding: 4px 10px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                color: #334155 !important;
                cursor: pointer !important;
                text-decoration: none !important;
                transition: all 0.15s !important;
            }
            .usat-inline-toolbar button:hover,
            .usat-inline-toolbar a:hover {
                background-color: #f1f5f9 !important;
                color: #0f172a !important;
                border-color: #94a3b8 !important;
            }
            .usat-inline-iframe {
                width: 100% !important;
                border: none !important;
                background-color: #ffffff !important;
                transition: height 0.2s ease !important;
            }
            .usat-iframe-loading {
                padding: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-size: 12.5px;
                color: #475569;
                font-weight: 600;
            }
            @keyframes usatInlineDown {
                from { opacity: 0; transform: translateY(-4px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    function inyectarBotonesInline() {
        asegurarEstilos();
        const actividades = document.querySelectorAll('.section .activity:not(.resource)');

        actividades.forEach((actividad) => {
            const instancia = actividad.querySelector('.activityinstance');
            if (!instancia) return;

            const enlace = instancia.querySelector(
                'a[href*="mod/assign/view.php"], a[href*="mod/quiz/view.php"], a[href*="mod/forum/view.php"]'
            );
            if (!enlace || instancia.querySelector('.btn-usat-inline')) return;

            const btnToggle = document.createElement('button');
            btnToggle.type = 'button';
            btnToggle.className = 'btn-usat-inline';
            btnToggle.textContent = 'Ver actividad';

            let container = null;
            let iframe = null;
            let alturaIframe = 460;

            const cerrarYDestruir = () => {
                if (iframe) {
                    iframe.src = 'about:blank';
                    iframe = null;
                }
                if (container) {
                    container.remove();
                    container = null;
                }
                btnToggle.classList.remove('cerrar');
                btnToggle.textContent = 'Ver actividad';
            };

            btnToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (btnToggle.classList.contains('cerrar')) {
                    cerrarYDestruir();
                    return;
                }

                container = document.createElement('div');
                container.className = 'usat-inline-container';

                const toolbar = document.createElement('div');
                toolbar.className = 'usat-inline-toolbar';

                const grupoIzq = document.createElement('div');
                grupoIzq.className = 'usat-inline-toolbar-group';

                const btnRecargar = document.createElement('button');
                btnRecargar.type = 'button';
                btnRecargar.innerHTML = `${CORE.ICONOS.actualizar}<span>Recargar</span>`;

                const btnMenos = document.createElement('button');
                btnMenos.type = 'button';
                btnMenos.innerHTML = `${CORE.ICONOS.menos}<span>Altura</span>`;

                const btnMas = document.createElement('button');
                btnMas.type = 'button';
                btnMas.innerHTML = `${CORE.ICONOS.mas}<span>Altura</span>`;

                grupoIzq.append(btnRecargar, btnMenos, btnMas);

                const linkNuevaPestana = document.createElement('a');
                linkNuevaPestana.href = enlace.href;
                linkNuevaPestana.target = '_blank';
                linkNuevaPestana.rel = 'noopener';
                linkNuevaPestana.innerHTML = `${CORE.ICONOS.ampliar}<span>Abrir aparte</span>`;

                toolbar.append(grupoIzq, linkNuevaPestana);

                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'usat-iframe-loading';
                loadingDiv.innerHTML = `${CORE.ICONOS.spinner}<span>Cargando vista limpia de la actividad...</span>`;

                iframe = document.createElement('iframe');
                iframe.className = 'usat-inline-iframe';
                iframe.src = enlace.href;
                iframe.style.height = `${alturaIframe}px`;
                iframe.style.display = 'none';

                btnRecargar.onclick = () => {
                    if (!iframe) return;
                    iframe.style.display = 'none';
                    loadingDiv.style.display = 'flex';
                    iframe.src = enlace.href;
                };
                btnMenos.onclick = () => {
                    alturaIframe = Math.max(240, alturaIframe - 150);
                    if (iframe) iframe.style.height = `${alturaIframe}px`;
                };
                btnMas.onclick = () => {
                    alturaIframe += 150;
                    if (iframe) iframe.style.height = `${alturaIframe}px`;
                };

                iframe.onload = () => {
                    loadingDiv.style.display = 'none';
                    if (!iframe) return;
                    iframe.style.display = 'block';
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc && !iframeDoc.getElementById('usat-inline-clean-css')) {
                            const s = iframeDoc.createElement('style');
                            s.id = 'usat-inline-clean-css';
                            s.textContent = `
                                header, footer, nav, #page-header, #page-navbar,
                                #block-region-side-pre, #block-region-side-post,
                                .activity-navigation, .moodle-actionmenu,
                                #theme_lambda-user-menu, .navbar {
                                    display: none !important;
                                }
                                #page-content, #region-main-box, #region-main, [role="main"] {
                                    padding: 0 !important;
                                    margin: 0 !important;
                                    border: none !important;
                                    box-shadow: none !important;
                                    width: 100% !important;
                                    background-color: #ffffff !important;
                                }
                                body {
                                    background: #ffffff !important;
                                    padding: 10px 14px !important;
                                    overflow-x: hidden !important;
                                    font-size: 13px !important;
                                }
                            `;
                            iframeDoc.head.appendChild(s);
                        }
                    } catch (err) {}
                };

                container.append(toolbar, loadingDiv, iframe);
                actividad.appendChild(container);

                btnToggle.classList.add('cerrar');
                btnToggle.textContent = 'Cerrar vista';
            });

            instancia.appendChild(btnToggle);
        });
    }

    inyectarBotonesInline();
    const regionMain = document.getElementById('region-main') || document.body;
    const obs = new MutationObserver(CORE.debounce(inyectarBotonesInline, 250));
    obs.observe(regionMain, { childList: true, subtree: true });
})();