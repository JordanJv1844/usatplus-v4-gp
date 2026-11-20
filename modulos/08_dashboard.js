// =========================================
// USAT+ v4 - MÓDULO 08: DASHBOARD INTELIGENTE Y MODAL MOODLE
// =========================================
(() => {
    const ENV = window.USAT_ENV;
    const CORE = window.USAT_CORE;
    if (!ENV || !CORE) return;
    if (!window.location.href.includes('Main.aspx')) return;

    const DICC_KEY = 'usat_diccionario_ids_moodle';
    const AUTH_TS_KEY = 'usat_moodle_auth_ts';
    const AUTH_TTL_MS = 15 * 60 * 1000; // 15 minutos

    let promesaAuth = null;

    function ejecutarMenuNativo(nombreArchivo) {
        const enlaces = document.querySelectorAll('a[onclick]');
        for (const a of enlaces) {
            if ((a.getAttribute('onclick') || '').includes(nombreArchivo)) {
                a.click();
                return true;
            }
        }
        return false;
    }

    async function autenticarYExtraerDiccionario(forzar = false) {
        const ultimoAuth = Number(sessionStorage.getItem(AUTH_TS_KEY) || '0');
        const diccGuardado = sessionStorage.getItem(DICC_KEY);

        if (!forzar && diccGuardado && (Date.now() - ultimoAuth < AUTH_TTL_MS)) {
            try { return JSON.parse(diccGuardado); } catch (e) {}
        }

        if (promesaAuth) return promesaAuth;

        promesaAuth = (async () => {
            try {
                let response = await fetch('https://intranet.usat.edu.pe/aulavirtual/my/', { credentials: 'same-origin' });
                let html = await response.text();

                if (html.includes('login/index.php') || html.includes('Aún no te haz identificado')) {
                    const respPuente = await fetch('aulavirtual.aspx', { credentials: 'same-origin' });
                    const htmlPuente = await respPuente.text();
                    const docPuente = new DOMParser().parseFromString(htmlPuente, 'text/html');
                    const formPuente = docPuente.querySelector('form');

                    if (formPuente) {
                        const formData = new URLSearchParams();
                        formPuente.querySelectorAll('input').forEach(input => {
                            if (input.name) formData.append(input.name, input.value || '');
                        });
                        const actionUrl = formPuente.getAttribute('action') || 'https://intranet.usat.edu.pe/aulavirtual/login/index.php';
                        await fetch(actionUrl, {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: formData.toString()
                        });
                        html = await (await fetch('https://intranet.usat.edu.pe/aulavirtual/my/', { credentials: 'same-origin' })).text();
                    }
                }

                sessionStorage.setItem(AUTH_TS_KEY, String(Date.now()));

                const matchKey = html.match(/"sesskey"\s*:\s*"([^"]+)"/) || html.match(/sesskey=([a-zA-Z0-9]+)/);
                if (matchKey && matchKey[1]) {
                    const sesskey = matchKey[1];
                    const rApi = await fetch(
                        `https://intranet.usat.edu.pe/aulavirtual/lib/ajax/service.php?sesskey=${encodeURIComponent(sesskey)}&info=core_course_get_enrolled_courses_by_timeline_classification`,
                        {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify([{
                                index: 0,
                                methodname: 'core_course_get_enrolled_courses_by_timeline_classification',
                                args: { offset: 0, limit: 30, classification: 'inprogress', sort: 'fullname', customfieldname: '', customfieldvalue: '' }
                            }])
                        }
                    );
                    const dataApi = await rApi.json();
                    if (dataApi && dataApi[0] && !dataApi[0].error) {
                        const cursosActivos = dataApi[0].data?.courses || [];
                        const diccionarioIDs = {};
                        cursosActivos.forEach(curso => {
                            const nombreLimpio = curso.fullname.replace(/^\d{4}-.{1,2}\s*-\s*/, '').trim();
                            diccionarioIDs[nombreLimpio.toLowerCase()] = curso.id;
                        });
                        sessionStorage.setItem(DICC_KEY, JSON.stringify(diccionarioIDs));
                        return diccionarioIDs;
                    }
                }
            } catch (err) {
                console.warn('[USAT+ Aula] Error sincronizando sesión Moodle:', err.message);
            } finally {
                promesaAuth = null;
            }

            try { return JSON.parse(sessionStorage.getItem(DICC_KEY) || '{}'); } catch (e) { return {}; }
        })();

        return promesaAuth;
    }

    async function abrirAulaVirtualModal(urlDestino) {
        let modal = document.getElementById('usat-moodle-modal');
        let iframe = document.getElementById('usat-moodle-iframe');
        let loader = document.getElementById('usat-moodle-loader');

        const cerrarModal = () => {
            if (!modal || modal.style.display === 'none') return;
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
                if (iframe) iframe.src = 'about:blank'; // Libera memoria al cerrar
            }, 220);
        };

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'usat-moodle-modal';
            modal.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;background:rgba(15,23,42,0.82);backdrop-filter:blur(3px);z-index:999999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.22s ease;';

            modal.innerHTML = `
                <style>
                    #usat-moodle-cerrar {
                        width: auto !important;
                        height: 32px !important;
                        padding: 0 12px !important;
                        margin: 0 !important;
                        background: #fef2f2 !important;
                        border: 1px solid #fecaca !important;
                        color: #dc2626 !important;
                        border-radius: 6px !important;
                        cursor: pointer !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 6px !important;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
                        font-weight: 700 !important;
                        font-size: 12.5px !important;
                        line-height: 1 !important;
                        white-space: nowrap !important;
                        flex-shrink: 0 !important;
                    }
                    #usat-moodle-cerrar:hover { background: #fee2e2 !important; }
                    #usat-moodle-cerrar svg {
                        width: 14px !important;
                        height: 14px !important;
                        min-width: 14px !important;
                        max-width: 14px !important;
                        flex-shrink: 0 !important;
                    }
                    #usat-moodle-loader svg {
                        width: 20px !important;
                        height: 20px !important;
                        min-width: 20px !important;
                        max-width: 20px !important;
                        flex-shrink: 0 !important;
                    }
                </style>
                <div style="width:96vw;height:95vh;background:#ffffff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.45);">
                    <div style="background:#ffffff;border-bottom:1px solid #e2e8f0;height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;flex-shrink:0;">
                        <span style="color:#dc2626;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14.5px;">Aula Virtual USAT</span>
                        <button type="button" id="usat-moodle-cerrar">
                            ${CORE.ICONOS.cerrar}<span>Cerrar</span>
                        </button>
                    </div>
                    <div style="flex:1;position:relative;background:#f1f5f9;">
                        <div id="usat-moodle-loader" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:10px;color:#475569;background:#f1f5f9;z-index:10;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
                            ${CORE.ICONOS.spinner}<span>Cargando Aula Virtual...</span>
                        </div>
                        <iframe id="usat-moodle-iframe" name="usat-moodle-iframe" style="width:100%;height:100%;border:none;position:relative;z-index:5;opacity:0;transition:opacity 0.2s ease;"></iframe>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            iframe = document.getElementById('usat-moodle-iframe');
            loader = document.getElementById('usat-moodle-loader');

            modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });
            document.getElementById('usat-moodle-cerrar').addEventListener('click', cerrarModal);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display !== 'none') cerrarModal();
            });

            iframe.onload = () => {
                if (iframe.src === 'about:blank') return;
                if (loader) loader.style.display = 'none';
                iframe.style.opacity = '1';

                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    if (!doc) return;

                    if (!doc.getElementById('usat-moodle-custom-css')) {
                        const s = doc.createElement('style');
                        s.id = 'usat-moodle-custom-css';
                        s.textContent = '#page-footer, .back-to-top { display: none !important; }';
                        doc.head.appendChild(s);
                    }

                    doc.querySelectorAll('a[href]').forEach(a => {
                        a.setAttribute('target', '_self');
                        a.removeAttribute('onclick');
                        if (a.href.includes('forcedownload')) {
                            try {
                                const u = new URL(a.href, doc.baseURI);
                                u.searchParams.delete('forcedownload');
                                a.href = u.toString();
                            } catch (e) {}
                        }
                    });
                } catch (e) {}
            };
        } else {
            modal.style.display = 'flex';
        }

        requestAnimationFrame(() => { modal.style.opacity = '1'; });
        if (loader) loader.style.display = 'flex';
        iframe.style.opacity = '0';

        await autenticarYExtraerDiccionario(false);
        iframe.src = urlDestino;
    }

    // API global para 09_horario.js
    window.abrirAulaVirtualModal = abrirAulaVirtualModal;
    window.USAT_AULA = {
        abrirModal: abrirAulaVirtualModal,
        asegurarDiccionarioCursos: autenticarYExtraerDiccionario,
        ejecutarMenuNativo
    };

    function asegurarEstilosDashboard() {
        if (document.getElementById('usat-dashboard-css')) return;
        const style = document.createElement('style');
        style.id = 'usat-dashboard-css';
        style.textContent = `
            #usat-dashboard-accesos {
                background: #ffffff !important;
                border-radius: 8px !important;
                border: 1px solid #cbd5e1 !important;
                margin-top: 12px !important;
                margin-bottom: 18px !important;
                overflow: hidden !important;
                box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05) !important;
            }
            .usat-btn-dash {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                padding: 12px 15px !important;
                background-color: #ffffff !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                transition: all 0.18s ease !important;
                text-decoration: none !important;
                height: 48px !important;
                width: 100% !important;
                box-sizing: border-box !important;
                outline: none !important;
            }
            .usat-btn-dash:hover {
                border-color: #dc2626 !important;
                box-shadow: inset 4px 0 0 0 #dc2626, 0 4px 8px rgba(15, 23, 42, 0.08) !important;
            }
            .usat-btn-dash svg {
                width: 20px !important;
                height: 20px !important;
                flex-shrink: 0 !important;
                stroke: #475569 !important;
                transition: stroke 0.18s ease !important;
            }
            .usat-btn-dash span {
                color: #334155 !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
                white-space: nowrap !important;
                transition: color 0.18s ease !important;
            }
            .usat-btn-dash:hover span { color: #dc2626 !important; }
            .usat-btn-dash:hover svg { stroke: #dc2626 !important; }
        `;
        document.head.appendChild(style);
    }

    function montarDashboard() {
        const anuncio = document.getElementById('anuncio');
        if (!anuncio) return;
        const contenedorPadre = anuncio.closest('.panel') || anuncio.parentElement;
        contenedorPadre.style.display = 'none';

        if (document.getElementById('usat-dashboard-accesos')) return;
        asegurarEstilosDashboard();

        const html = `
            <div id="usat-dashboard-accesos">
                <div style="background-color:#dc2626;padding:11px 18px;">
                    <h3 style="margin:0;color:#ffffff;font-size:14.5px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Accesos principales</h3>
                </div>
                <div style="padding:16px;background:#f8fafc;">
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
                        <a href="#" id="usat-btn-ficha" class="usat-btn-dash">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                            <span>Ficha de matrícula</span>
                        </a>
                        <a href="#" id="usat-btn-historial" class="usat-btn-dash">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            <span>Historial académico</span>
                        </a>
                        <a href="#" id="usat-btn-aula-nativa" class="usat-btn-dash">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                            <span>Aula virtual</span>
                        </a>
                        <a href="#" id="usat-btn-mis-cursos" class="usat-btn-dash">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            <span>Mis cursos</span>
                        </a>
                        <a href="#" id="usat-btn-notas" class="usat-btn-dash">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                            <span>Calificaciones</span>
                        </a>
                        <a href="#" id="usat-btn-carnet" class="usat-btn-dash">
                            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="11" r="2.5"></circle><line x1="14" y1="10" x2="18" y2="10"></line><line x1="14" y1="14" x2="18" y2="14"></line></svg>
                            <span>Mostrar carnet</span>
                        </a>
                    </div>
                </div>
            </div>
        `;

        contenedorPadre.insertAdjacentHTML('beforebegin', html);

        document.getElementById('usat-btn-ficha').addEventListener('click', (e) => { e.preventDefault(); ejecutarMenuNativo('cursosmatriculados.aspx'); });
        document.getElementById('usat-btn-historial').addEventListener('click', (e) => { e.preventDefault(); ejecutarMenuNativo('historialacademico.aspx'); });
        document.getElementById('usat-btn-aula-nativa').addEventListener('click', (e) => { e.preventDefault(); ejecutarMenuNativo('aulavirtual.aspx'); });
        document.getElementById('usat-btn-notas').addEventListener('click', (e) => { e.preventDefault(); ejecutarMenuNativo('calificadorestudiante.aspx'); });
        document.getElementById('usat-btn-mis-cursos').addEventListener('click', (e) => {
            e.preventDefault();
            abrirAulaVirtualModal('https://intranet.usat.edu.pe/aulavirtual/my/');
        });

        document.getElementById('usat-btn-carnet').addEventListener('click', (e) => {
            e.preventDefault();
            ejecutarMenuNativo('cursosmatriculados.aspx');
            let intentos = 0;
            const sabueso = setInterval(() => {
                intentos++;
                const boton = document.querySelector('#divCarnet a[title*="VISUALIZAR CARNET"]');
                if (!boton) {
                    if (intentos >= 24) clearInterval(sabueso);
                    return;
                }
                clearInterval(sabueso);
                boton.click();
            }, 350);
        });
    }

    function desmontarDashboard() {
        document.getElementById('usat-dashboard-accesos')?.remove();
        const anuncio = document.getElementById('anuncio');
        if (anuncio) {
            const padre = anuncio.closest('.panel') || anuncio.parentElement;
            if (padre) padre.style.display = '';
        }
    }

    if (ENV.getSetting('dashboardEnabled', true)) montarDashboard();

    ENV.onSettingsChanged((changes) => {
        if (!changes.dashboardEnabled) return;
        changes.dashboardEnabled.newValue !== false ? montarDashboard() : desmontarDashboard();
    });
})();