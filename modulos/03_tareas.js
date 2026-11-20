// =========================================
// USAT+ v4 - MÓDULO 03: MONITOR DE TAREAS PENDIENTES
// =========================================
(() => {
    const ENV = window.USAT_ENV;
    const CORE = window.USAT_CORE;
    if (!ENV || !CORE) return;

    const CACHE_KEY = 'usat_cache_tareas_v4';
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
    const ESTADO_KEY = 'estadoTareasUSAT';

    const MESES = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
        enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
        julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
    };

    function formatearFechaEspanol(valor, textoOriginal = '') {
        const texto = String(textoOriginal || '').replace(/\s+/g, ' ').trim();
        let fechaDetectada = null;

        if (valor !== undefined && valor !== null && valor !== '') {
            if (typeof valor === 'number' || /^\d{10,13}$/.test(String(valor))) {
                let n = Number(valor);
                if (n < 1e12) n *= 1000;
                const d = new Date(n);
                if (!Number.isNaN(d.getTime())) fechaDetectada = d;
            } else {
                const d = new Date(valor);
                if (!Number.isNaN(d.getTime())) fechaDetectada = d;
            }
        }

        if (!fechaDetectada && texto) {
            const m = texto.match(/(\d{1,2})\s+(?:de\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{4}))?(?:[,\s]+(\d{1,2}):(\d{2})\s*(am|pm)?)?/i);
            if (m) {
                const dia = Number(m[1]);
                const mes = MESES[m[2].toLowerCase()];
                const anio = m[3] ? Number(m[3]) : new Date().getFullYear();
                let hora = m[4] ? Number(m[4]) : 0;
                const minuto = m[5] ? Number(m[5]) : 0;
                const ampm = (m[6] || '').toLowerCase();
                if (ampm === 'pm' && hora < 12) hora += 12;
                if (ampm === 'am' && hora === 12) hora = 0;

                fechaDetectada = new Date(anio, mes, dia, hora, minuto);
                if (!m[3] && fechaDetectada.getTime() < Date.now() - 86400000) {
                    fechaDetectada.setFullYear(anio + 1);
                }
            }
        }

        if (!fechaDetectada) return texto || 'Fecha por confirmar';
        const tieneHora = /T\d{2}:\d{2}|\d{1,2}:\d{2}/i.test(`${valor || ''} ${texto}`);
        return new Intl.DateTimeFormat('es-PE', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            ...(tieneHora ? { hour: 'numeric', minute: '2-digit' } : {})
        }).format(fechaDetectada);
    }

    async function obtenerTareas(forzarRed = false) {
        if (!forzarRed) {
            try {
                const raw = sessionStorage.getItem(CACHE_KEY);
                if (raw) {
                    const cache = JSON.parse(raw);
                    if (cache && Array.isArray(cache.tareas) && (Date.now() - cache.ts < CACHE_TTL_MS)) {
                        return cache.tareas;
                    }
                }
            } catch (e) {}
        }

        const response = await fetch('https://intranet.usat.edu.pe/aulavirtual/calendar/view.php?view=upcoming', {
            credentials: 'same-origin'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const eventos = doc.querySelectorAll('.event');
        const tareas = [];

        eventos.forEach((el) => {
            const titulo = el.querySelector('.name, .eventname, .card-title')?.textContent.trim() || 'Tarea pendiente';
            const fechaEl = el.querySelector('time[datetime], [data-timestamp], [data-date], .date, .col-11');
            const fechaOriginal = fechaEl?.textContent?.trim() || '';
            const timestampRaw = fechaEl?.getAttribute('data-timestamp');
            const valorFecha = fechaEl?.getAttribute('datetime')
                || fechaEl?.getAttribute('data-date')
                || (timestampRaw ? Number(timestampRaw) : '')
                || '';
            const fecha = formatearFechaEspanol(valorFecha, fechaOriginal);

            const enlaces = Array.from(el.querySelectorAll('a'));
            const linkActividad = enlaces.find(a => a.href && a.href.includes('/mod/'));
            const enlace = linkActividad
                ? linkActividad.href
                : (enlaces.find(a => a.href && a.href !== '#' && !a.href.includes('calendar/view.php'))?.href || '#');

            const cursoEl = el.querySelector('[data-course-name], .course-name, .coursename, .course-name a, .course a');
            let curso = cursoEl?.getAttribute('data-course-name') || cursoEl?.textContent?.trim() || '';
            if (!curso) {
                const enlaceCurso = enlaces.find(a => /\/course\/view\.php(?:\?|$)/i.test(a.href));
                curso = enlaceCurso?.textContent?.trim() || '';
            }
            curso = curso
                .replace(/\s+/g, ' ')
                .replace(/^\d{4}\s*[-–—]\s*(?:I{1,3}|IV|V|VI|VII|VIII|IX|X|0)\s*[-–—:]?\s*/i, '')
                .trim();

            if (curso && titulo.toLowerCase().includes(curso.toLowerCase())) curso = '';
            tareas.push({ titulo, curso, fecha, enlace });
        });

        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), tareas }));
        } catch (e) {}

        return tareas;
    }

    function asegurarEstilos() {
        if (document.getElementById('usat-tareas-css')) return;
        const style = document.createElement('style');
        style.id = 'usat-tareas-css';
        style.textContent = `
            @keyframes usatTareasShrink {
                from { width: 100%; }
                to { width: 0%; }
            }
            #contenedor-tareas-usat {
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                z-index: 999990 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
                pointer-events: none !important;
            }
            #btn-mini-tareas {
                pointer-events: auto !important;
                background-color: #dc2626 !important;
                color: #ffffff !important;
                border: 1px solid #dc2626!important;
                padding: 9px 14px !important;
                border-radius: 8px !important;
                cursor: pointer !important;
                font-weight: 700 !important;
                font-size: 12.5px !important;
                box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18) !important;
                align-items: center !important;
                gap: 8px !important;
                transition: background-color 0.15s ease !important;
            }
            #btn-mini-tareas:hover { background-color: #dc2626!important; }
            #panel-tareas-usat {
                pointer-events: auto !important;
                width: 310px !important;
                background-color: #ffffff !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 10px !important;
                box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18) !important;
                overflow: hidden !important;
            }
            #panel-tareas-usat .usat-tareas-header {
                background-color: #dc2626 !important;
                padding: 9px 11px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                position: relative !important;
                color: #ffffff !important;
            }
            #panel-tareas-usat .usat-tareas-icon-btn {
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
                color: #ffffff !important;
                padding: 4px !important;
                margin: 0 1px !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 4px !important;
                transition: opacity 0.15s, background-color 0.15s !important;
            }
            #panel-tareas-usat .usat-tareas-icon-btn:hover {
                background: rgba(255, 255, 255, 0.15) !important;
            }
            #barra-progreso-tareas {
                position: absolute !important;
                bottom: 0 !important;
                left: 0 !important;
                height: 3px !important;
                background-color: rgba(255, 255, 255, 0.85) !important;
                width: 100%;
            }
            #barra-progreso-tareas.animando {
                animation: usatTareasShrink 8s linear forwards !important;
            }
            #panel-tareas-usat:hover #barra-progreso-tareas.animando {
                animation-play-state: paused !important;
            }
            #panel-tareas-usat ul {
                list-style: none !important;
                padding: 0 !important;
                margin: 0 !important;
                max-height: 230px !important;
                overflow-y: auto !important;
                overscroll-behavior: contain !important;
            }
            #panel-tareas-usat li {
                padding: 9px 11px !important;
                border-bottom: 1px solid #f1f5f9 !important;
                transition: background-color 0.15s !important;
            }
            #panel-tareas-usat li:hover { background-color: #f8fafc !important; }
            #panel-tareas-usat li a {
                color: #1e293b !important;
                text-decoration: none !important;
                font-size: 12px !important;
                font-weight: 600 !important;
            }
            #panel-tareas-usat li a:hover { color: #dc2626 !important; }
        `;
        document.head.appendChild(style);
    }

    function renderLista(tareas) {
        return tareas.map(t => {
            const titulo = CORE.escapeHtml(t.titulo);
            const curso = CORE.escapeHtml(t.curso);
            const fecha = CORE.escapeHtml(t.fecha);
            const enlace = CORE.escapeHtml(t.enlace);
            return `
                <li>
                    <div style="margin-bottom:3px;line-height:1.35;overflow-wrap:anywhere;">
                        <a href="${enlace}" title="${titulo}">${titulo}</a>${curso ? ` <span style="color:#64748b;font-size:11px;">·</span> <span title="${curso}" style="display:inline;padding:1px 6px;border:1px solid #e2e8f0;border-radius:999px;background:#f1f5f9;color:#475569;font-size:9.5px;font-weight:600;">${curso}</span>` : ''}
                    </div>
                    <span style="color:#64748b;font-size:10.5px;font-weight:600;display:inline-flex;align-items:center;gap:5px;">
                        ${CORE.ICONOS.calendario}
                        <span>${fecha}</span>
                    </span>
                </li>
            `;
        }).join('');
    }

    async function montarMonitor(forzarRed = false) {
        if (!ENV.getSetting('monitorTareasEnabled', true)) return;
        try {
            const tareas = await obtenerTareas(forzarRed);
            ENV.updateBadge(tareas.length);

            const previo = document.getElementById('contenedor-tareas-usat');
            if (tareas.length === 0) {
                if (previo) previo.remove();
                return;
            }

            asegurarEstilos();
            if (previo) previo.remove();

            const estadoMemoria = sessionStorage.getItem(ESTADO_KEY) || 'nuevo';
            let isPinned = estadoMemoria === 'fijado';

            const contenedor = document.createElement('div');
            contenedor.id = 'contenedor-tareas-usat';
            contenedor.innerHTML = `
                <div id="panel-tareas-usat" style="display:${estadoMemoria === 'nuevo' || isPinned ? 'block' : 'none'};">
                    <div class="usat-tareas-header">
                        <span style="font-size:12.5px;font-weight:700;display:inline-flex;align-items:center;gap:7px;">
                            ${CORE.ICONOS.alerta}
                            <span id="usat-tareas-titulo">${tareas.length} Tarea(s)</span>
                        </span>
                        <div style="display:flex;align-items:center;">
                            <button type="button" id="btn-refrescar-tareas" class="usat-tareas-icon-btn" title="Actualizar lista">
                                ${CORE.ICONOS.actualizar}
                            </button>
                            <button type="button" id="btn-fijar-tareas" class="usat-tareas-icon-btn" style="opacity:${isPinned ? '1' : '0.6'};" title="Fijar panel">
                                ${isPinned ? CORE.ICONOS.chinchetaSolida : CORE.ICONOS.chinchetaHueca}
                            </button>
                            <button type="button" id="btn-cerrar-tareas" class="usat-tareas-icon-btn" title="Ocultar panel">
                                ${CORE.ICONOS.cerrar}
                            </button>
                        </div>
                        <div id="barra-progreso-tareas" style="display:${isPinned ? 'none' : 'block'};"></div>
                    </div>
                    <ul id="usat-tareas-lista">${renderLista(tareas)}</ul>
                </div>
                <button type="button" id="btn-mini-tareas" style="display:${estadoMemoria !== 'nuevo' && !isPinned ? 'inline-flex' : 'none'};">
                    ${CORE.ICONOS.tareas}
                    <span>${tareas.length} Tareas Pendientes</span>
                </button>
            `;
            document.body.appendChild(contenedor);

            const panel = document.getElementById('panel-tareas-usat');
            const miniBtn = document.getElementById('btn-mini-tareas');
            const btnCerrar = document.getElementById('btn-cerrar-tareas');
            const btnFijar = document.getElementById('btn-fijar-tareas');
            const btnRefrescar = document.getElementById('btn-refrescar-tareas');
            const barra = document.getElementById('barra-progreso-tareas');

            const ocultarPanel = (estadoFinal) => {
                panel.style.display = 'none';
                miniBtn.style.display = 'inline-flex';
                barra.classList.remove('animando');
                sessionStorage.setItem(ESTADO_KEY, estadoFinal);
            };

            const iniciarCuentaRegresiva = () => {
                if (isPinned) return;
                barra.style.display = 'block';
                barra.classList.remove('animando');
                void barra.offsetWidth; // reinicia la animación CSS
                barra.classList.add('animando');
            };

            barra.addEventListener('animationend', () => {
                if (!isPinned) ocultarPanel('oculto_automatico');
            });

            btnCerrar.addEventListener('click', (e) => {
                e.preventDefault();
                ocultarPanel('cerrado_manual');
            });

            btnFijar.addEventListener('click', (e) => {
                e.preventDefault();
                isPinned = !isPinned;
                if (isPinned) {
                    btnFijar.innerHTML = CORE.ICONOS.chinchetaSolida;
                    btnFijar.style.opacity = '1';
                    barra.style.display = 'none';
                    barra.classList.remove('animando');
                    sessionStorage.setItem(ESTADO_KEY, 'fijado');
                } else {
                    btnFijar.innerHTML = CORE.ICONOS.chinchetaHueca;
                    btnFijar.style.opacity = '0.6';
                    sessionStorage.setItem(ESTADO_KEY, 'nuevo');
                    iniciarCuentaRegresiva();
                }
            });

            miniBtn.addEventListener('click', () => {
                miniBtn.style.display = 'none';
                panel.style.display = 'block';
                isPinned = true;
                btnFijar.innerHTML = CORE.ICONOS.chinchetaSolida;
                btnFijar.style.opacity = '1';
                barra.style.display = 'none';
                barra.classList.remove('animando');
                sessionStorage.setItem(ESTADO_KEY, 'fijado');
            });

            btnRefrescar.addEventListener('click', async (e) => {
                e.preventDefault();
                btnRefrescar.innerHTML = CORE.ICONOS.spinner;
                await montarMonitor(true);
            });

            if (estadoMemoria === 'nuevo' && !isPinned) {
                iniciarCuentaRegresiva();
            }
        } catch (error) {
            console.warn('[USAT+ Tareas] Error al cargar tareas:', error.message);
        }
    }

    ENV.onSettingsChanged((changes) => {
        if (!changes.monitorTareasEnabled) return;
        const activo = changes.monitorTareasEnabled.newValue !== false;
        const el = document.getElementById('contenedor-tareas-usat');
        if (activo) montarMonitor(false);
        else if (el) el.remove();
    });

    montarMonitor(false);
})();