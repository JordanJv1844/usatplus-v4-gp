// =========================================
// USAT+ v4 - MÓDULO 09: HORARIO INTERACTIVO
// =========================================
(() => {
    const ENV = window.USAT_ENV;
    const CORE = window.USAT_CORE;
    if (!ENV || !CORE) return;
    if (!window.location.href.includes('Main.aspx')) return;

    const CACHE_KEY = 'usat_cache_horario_v4';
    const CACHE_TTL_MS = 30 * 60 * 1000;
    const PREFS_KEY = 'usat_horario_prefs';
    const COLORES_KEY = 'usat_colores_horario';

    let cursoActualSeleccionado = '';
    let datosHorarioMemoria = null; // { cursos: [], modUSAT: '2' }
    let timerNotasActivo = null;
    let escalaModal = 1;

    function cargarPreferencias() {
        try {
            const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
            if (saved && typeof saved === 'object') return saved;
        } catch (e) {}
        return {
            sombras: true, mayusculas: false, horas: true, fmt24: false, diasSinCursos: true,
            tamDias: 12, tamNom: 10, tamHora: 9, espNom: 1.1, radEsq: 4, anchCol: 100, altFil: 40, espaciado: 4
        };
    }

    function asegurarEstilos() {
        if (document.getElementById('usat-horario-css')) return;
        const style = document.createElement('style');
        style.id = 'usat-horario-css';
        style.textContent = `
            :root {
                --usat-tam-dias: 12px; --usat-tam-nom: 10px; --usat-tam-hora: 9px;
                --usat-esp-nom: 1.1; --usat-rad-esq: 4px; --usat-anch-col: minmax(100px, 1fr);
                --usat-alt-fil: 40px; --usat-espaciado: 4px; --usat-sombra-bloque: 0 4px 8px rgba(0,0,0,0.22);
                --usat-txt-transform: none;
            }
            #usat-horario-wrapper {
                background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1;
                margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            }
            .usat-calendario-container { overflow-x: auto; padding: 14px; background: #ffffff; }
            .usat-grid-header {
                display: grid; grid-template-columns: repeat(6, var(--usat-anch-col));
                background: #e2e8f0; color: #0f172a; font-weight: 700; text-align: center;
                padding: 8px 0; font-size: var(--usat-tam-dias); border-radius: 6px 6px 0 0;
            }
            .usat-grid-body {
                display: grid; grid-template-columns: repeat(6, var(--usat-anch-col));
                min-height: 200px; border-left: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1;
            }
            .usat-dia-col {
                border-right: 1px dashed #cbd5e1; position: relative; padding: 6px 4px;
                display: flex; flex-direction: column; gap: var(--usat-espaciado);
                background: repeating-linear-gradient(0deg, transparent, transparent 39px, #f1f5f9 39px, #f1f5f9 40px);
            }
            .usat-curso-bloque {
                color: #ffffff; padding: 6px; border-radius: var(--usat-rad-esq);
                cursor: pointer; transition: transform 0.1s ease, filter 0.1s ease; text-align: center;
                box-shadow: var(--usat-sombra-bloque); display: flex; flex-direction: column;
                gap: 3px; min-height: var(--usat-alt-fil); align-items: center; justify-content: center;
            }
            .usat-curso-bloque:hover { transform: scale(1.02); filter: brightness(1.08); }
            .usat-bloque-hora { font-weight: 700; font-size: var(--usat-tam-hora); background: rgba(0,0,0,0.18); border-radius: 3px; padding: 2px 5px; }
            .usat-bloque-nombre { line-height: var(--usat-esp-nom); font-weight: 600; font-size: var(--usat-tam-nom); text-transform: var(--usat-txt-transform); word-break: break-word; }
            .usat-ocultar-horas .usat-bloque-hora { display: none !important; }
            .usat-col-oculta { display: none !important; }

            .usat-panel-contenedor { padding: 0 15px 12px; border-top: 1px solid #e2e8f0; background: #f8fafc; border-radius: 0 0 8px 8px; }
            .usat-panel-header { padding: 10px 4px; color: #475569; font-size: 13px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
            .usat-panel-body { display: none; padding: 6px 4px; }
            .usat-panel-body.activo { display: block; }
            .usat-panel-instruccion { font-size: 12px; color: #64748b; margin-bottom: 12px; }
            .usat-controles-grid { display: grid; grid-template-columns: 1fr; gap: 10px; font-size: 12.5px; color: #334155; }
            .usat-control-fila { display: flex; align-items: center; cursor: pointer; font-weight: 600; }
            #usat-body-personalizar .usat-control-fila input[type="checkbox"] {
                appearance: auto !important; -webkit-appearance: checkbox !important;
                display: inline-block !important; visibility: visible !important; opacity: 1 !important;
                position: static !important; width: 14px !important; height: 14px !important;
                margin: 0 8px 0 0 !important; cursor: pointer !important; accent-color: #dc2626;
            }
            .usat-control-rango { display: flex; align-items: center; justify-content: space-between; max-width: 400px; font-size: 12px; }
            .usat-control-rango span { width: 145px; }
            .usat-control-rango input[type="range"] { flex-grow: 1; height: 6px; border-radius: 3px; background: #cbd5e1; appearance: none; outline: none; cursor: pointer; }
            .usat-control-rango input[type="range"]::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #dc2626; cursor: pointer; }
            .usat-panel-footer { display: flex !important; align-items: center !important; gap: 8px; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px; flex-wrap: wrap; }
            .usat-btn-accion {
                margin: 0 !important; padding: 7px 12px !important; width: auto !important; height: auto !important;
                border: 1px solid #cbd5e1 !important; background: #ffffff !important; border-radius: 6px !important;
                font-size: 12px !important; font-weight: 600 !important; line-height: 1.2 !important;
                cursor: pointer !important; display: inline-flex !important; align-items: center !important;
                justify-content: center !important; gap: 6px !important; color: #334155 !important;
                white-space: nowrap !important; box-sizing: border-box !important;
            }
            .usat-btn-accion:hover { background: #f1f5f9 !important; border-color: #94a3b8 !important; }
            .usat-btn-accion svg {
                width: 14px !important; height: 14px !important;
                min-width: 14px !important; max-width: 14px !important;
                flex-shrink: 0 !important; display: block !important;
            }

            #usat-modal-ampliar {
                position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.85);
                z-index: 999998; display: none; flex-direction: column; align-items: center; justify-content: center;
            }
            .usat-modal-toolbar { position: absolute; top: 14px; width: 94%; display: flex; justify-content: space-between; align-items: center; }
            .usat-modal-btn {
                margin: 0 6px 0 0 !important; background: #1e293b !important; border: 1px solid #334155 !important;
                color: #ffffff !important; padding: 7px 12px !important; width: auto !important; height: auto !important;
                font-size: 12.5px !important; font-weight: 600 !important; line-height: 1.2 !important;
                cursor: pointer !important; border-radius: 6px !important; white-space: nowrap !important;
                display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important;
            }
            .usat-modal-btn svg {
                width: 15px !important; height: 15px !important;
                min-width: 15px !important; max-width: 15px !important;
                flex-shrink: 0 !important; display: block !important;
            }
            .usat-modal-btn:hover { background: #334155; }
            .usat-modal-close { background: #dc2626; border-color: #dc2626; }
            .usat-modal-close:hover { background: #7f1d1d; }
            #usat-clon-contenedor {
                background: #ffffff; padding: 18px; border-radius: 8px; max-width: 95vw; max-height: 85vh;
                overflow: auto; transform-origin: center top; transition: transform 0.2s ease;
            }

            #usat-popover-horario {
                position: absolute; --usat-popover-color: #334155; --usat-flecha-x: 60px;
                background: var(--usat-popover-color); color: #ffffff; border-radius: 6px;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22); padding: 4px 0; width: 122px;
                box-sizing: border-box; z-index: 999995; display: none; flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            }
            #usat-popover-horario::before {
                content: ""; position: absolute; top: -7px; left: calc(var(--usat-flecha-x) - 7px);
                width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent;
                border-bottom: 7px solid var(--usat-popover-color);
            }
            .usat-pop-btn {
                padding: 7px 11px; border: none; background: transparent; color: #ffffff;
                cursor: pointer; font-size: 11.5px; font-weight: 600; text-align: left;
                display: flex; align-items: center; gap: 7px; width: 100%; box-sizing: border-box;
            }
            .usat-pop-btn:hover { background: rgba(0, 0, 0, 0.16); }
        `;
        document.head.appendChild(style);
    }

    function convertirA24h(rango, formato24 = true) {
        if (!rango) return rango;
        return rango.replace(
            /(\d{1,2}):(\d{2})(?:\s*(AM|PM|A\.?\s*M\.?|P\.?\s*M\.?))?/gi,
            (match, horaTexto, minutos, sufijo) => {
                let hora = parseInt(horaTexto, 10);
                if (sufijo) {
                    const periodo = sufijo.replace(/\./g, '').replace(/\s+/g, '').toUpperCase();
                    if (periodo === 'PM' && hora < 12) hora += 12;
                    if (periodo === 'AM' && hora === 12) hora = 0;
                }
                if (formato24) return `${String(hora).padStart(2, '0')}:${minutos}`;
                const periodo = hora >= 12 ? 'PM' : 'AM';
                return `${hora % 12 || 12}:${minutos} ${periodo}`;
            }
        );
    }

    function aplicarPreferenciasUI(prefs) {
        const root = document.documentElement;
        root.style.setProperty('--usat-sombra-bloque', prefs.sombras ? '0 4px 10px rgba(0,0,0,0.28)' : 'none');
        root.style.setProperty('--usat-txt-transform', prefs.mayusculas ? 'uppercase' : 'none');
        root.style.setProperty('--usat-tam-dias', `${prefs.tamDias}px`);
        root.style.setProperty('--usat-tam-nom', `${prefs.tamNom}px`);
        root.style.setProperty('--usat-tam-hora', `${prefs.tamHora}px`);
        root.style.setProperty('--usat-esp-nom', prefs.espNom);
        root.style.setProperty('--usat-rad-esq', `${prefs.radEsq}px`);
        root.style.setProperty('--usat-anch-col', `minmax(${prefs.anchCol}px, 1fr)`);
        root.style.setProperty('--usat-alt-fil', `${prefs.altFil}px`);
        root.style.setProperty('--usat-espaciado', `${prefs.espaciado}px`);

        const wrapper = document.getElementById('usat-horario-wrapper');
        if (wrapper) {
            wrapper.classList.toggle('usat-ocultar-horas', !prefs.horas);
        }
    }

    async function obtenerDatosHorario(forzarRed = false) {
        if (!forzarRed && datosHorarioMemoria) return datosHorarioMemoria;

        if (!forzarRed) {
            try {
                const raw = sessionStorage.getItem(CACHE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && Array.isArray(parsed.cursos) && (Date.now() - parsed.ts < CACHE_TTL_MS)) {
                        datosHorarioMemoria = { cursos: parsed.cursos, modUSAT: parsed.modUSAT };
                        return datosHorarioMemoria;
                    }
                }
            } catch (e) {}
        }

        const resp = await fetch('cursosmatriculados.aspx', { credentials: 'same-origin' });
        const html = await resp.text();
        const matchCursos = html.match(/var\s+_lstCursosMatriculados\s*=\s*(\[.*?\]);/s);
        const matchMod = html.match(/id="hdmod"\s+value="(\d+)"/i);
        const modUSAT = matchMod ? matchMod[1] : '2';

        if (!matchCursos || !matchCursos[1]) return null;
        const cursos = JSON.parse(matchCursos[1]);
        datosHorarioMemoria = { cursos, modUSAT };

        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), cursos, modUSAT }));
        } catch (e) {}

        return datosHorarioMemoria;
    }

    function dibujarCalendario(cursosRaw, modUSAT, prefs) {
        let coloresGuardados = {};
        try { coloresGuardados = JSON.parse(localStorage.getItem(COLORES_KEY) || '{}'); } catch (e) {}
        const paletaDefault = ['#0284c7', '#059669', '#dc2626', '#4f46e5', '#d97706', '#0f766e'];
        let colorIndex = 0;
        const mapaColores = {};
        const diasConClase = new Set();

        ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'].forEach(d => {
            const c = document.getElementById(`col-${d}`);
            if (c) c.innerHTML = '';
        });

        const obtenerMinutosInicio = (valor) => {
            const m = String(valor || '').trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM|A\.?\s*M\.?|P\.?\s*M\.?)?/i);
            if (!m) return Number.MAX_SAFE_INTEGER;
            let h = parseInt(m[1], 10);
            const min = parseInt(m[2], 10);
            const per = (m[3] || '').replace(/[.\s]/g, '').toUpperCase();
            if (per === 'PM' && h < 12) h += 12;
            if (per === 'AM' && h === 12) h = 0;
            return h * 60 + min;
        };

        const cursosOrdenados = [...cursosRaw].sort(
            (a, b) => obtenerMinutosInicio(a.nombre_Hor) - obtenerMinutosInicio(b.nombre_Hor)
        );

        cursosOrdenados.forEach((curso) => {
            let diaCodigo = modUSAT === '2' ? curso.dia_Lho : curso.dia_Lho2;
            if (!diaCodigo || !diaCodigo.trim()) diaCodigo = curso.dia_Lho || curso.dia_Lho2;
            if (!diaCodigo || !curso.nombre_Hor) return;

            diasConClase.add(diaCodigo);
            const nombreLimpio = String(curso.nombre_Cur || '').trim();
            if (!mapaColores[nombreLimpio]) {
                mapaColores[nombreLimpio] = coloresGuardados[nombreLimpio] || paletaDefault[colorIndex % paletaDefault.length];
                colorIndex++;
            }

            const columna = document.getElementById(`col-${diaCodigo}`);
            if (!columna) return;

            const nombreVisible = prefs.mayusculas
                ? nombreLimpio.toLocaleUpperCase('es-PE')
                : nombreLimpio.toLocaleLowerCase('es-PE').replace(/(^|[.!?]\s+)(\p{L})/gu, (m, i, l) => i + l.toLocaleUpperCase('es-PE'));

            const txtHora = convertirA24h(`${curso.nombre_Hor} - ${curso.horaFin_Lho}`, !!prefs.fmt24);

            columna.insertAdjacentHTML(
                'beforeend',
                `<div class="usat-curso-bloque" data-curso="${CORE.escapeHtml(nombreLimpio)}" style="background-color:${CORE.escapeHtml(mapaColores[nombreLimpio])};">
                    <span class="usat-bloque-hora">${CORE.escapeHtml(txtHora)}</span>
                    <span class="usat-bloque-nombre" style="text-transform:none !important;">${CORE.escapeHtml(nombreVisible)}</span>
                </div>`
            );
        });

        ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'].forEach(d => {
            const col = document.getElementById(`col-${d}`);
            const head = document.querySelector(`#usat-horario-head div[data-dia="${d}"]`);
            if (!col || !head) return;
            const ocultar = !prefs.diasSinCursos && !diasConClase.has(d);
            col.classList.toggle('usat-col-oculta', ocultar);
            head.classList.toggle('usat-col-oculta', ocultar);
        });
    }

    async function descargarFoto(elementoDestino, btnActivo) {
        const textoOriginal = btnActivo.innerHTML;
        btnActivo.innerHTML = `${CORE.ICONOS.spinner}<span>Generando PNG...</span>`;
        btnActivo.disabled = true;

        try {
            if (!elementoDestino || !elementoDestino.isConnected) throw new Error('Horario no disponible.');
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            const root = elementoDestino;
            const rootRect = root.getBoundingClientRect();
            const cssWidth = Math.max(root.scrollWidth, root.clientWidth);
            const cssHeight = Math.max(root.scrollHeight, root.clientHeight);
            const sx = (root.clientWidth > 0 ? rootRect.width / root.clientWidth : 1) || 1;
            const sy = (root.clientHeight > 0 ? rootRect.height / root.clientHeight : 1) || 1;

            const rectRel = (el) => {
                const r = el.getBoundingClientRect();
                return { x: (r.left - rootRect.left) / sx, y: (r.top - rootRect.top) / sy, w: r.width / sx, h: r.height / sy };
            };

            const canvas = document.createElement('canvas');
            const pixelRatio = 2;
            canvas.width = Math.ceil(cssWidth * pixelRatio);
            canvas.height = Math.ceil(cssHeight * pixelRatio);
            const ctx = canvas.getContext('2d');
            ctx.scale(pixelRatio, pixelRatio);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, cssWidth, cssHeight);

            const roundRect = (x, y, w, h, radius) => {
                const r = Math.max(0, Math.min(Number(radius) || 0, w / 2, h / 2));
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.arcTo(x + w, y, x + w, y + h, r);
                ctx.arcTo(x + w, y + h, x, y + h, r);
                ctx.arcTo(x, y + h, x, y, r);
                ctx.arcTo(x, y, x + w, y, r);
                ctx.closePath();
            };
            const parsePx = (v, fb = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : fb; };
            const getColor = (el, prop, fb) => { const v = getComputedStyle(el)[prop]; return v && v !== 'rgba(0, 0, 0, 0)' ? v : fb; };
            const wrapText = (text, maxWidth, font) => {
                ctx.font = font;
                const lines = [];
                const words = String(text || '').trim().split(/\s+/).filter(Boolean);
                let line = '';
                words.forEach(word => {
                    const cand = line ? `${line} ${word}` : word;
                    if (ctx.measureText(cand).width <= maxWidth) line = cand;
                    else { if (line) lines.push(line); line = word; }
                });
                if (line) lines.push(line);
                return lines.length ? lines : [''];
            };

            const header = root.querySelector('.usat-grid-header');
            const body = root.querySelector('.usat-grid-body');
            const hr = rectRel(header);
            ctx.fillStyle = getColor(header, 'backgroundColor', '#e2e8f0');
            ctx.fillRect(hr.x, hr.y, hr.w, hr.h);

            header.querySelectorAll('[data-dia]').forEach(day => {
                if (getComputedStyle(day).display === 'none') return;
                const r = rectRel(day);
                const cs = getComputedStyle(day);
                ctx.fillStyle = cs.color || '#0f172a';
                ctx.font = `${cs.fontWeight || '700'} ${parsePx(cs.fontSize, 12)}px ${cs.fontFamily || 'Arial, sans-serif'}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(day.textContent.trim(), r.x + r.w / 2, r.y + r.h / 2, Math.max(1, r.w - 4));
            });

            body.querySelectorAll('.usat-dia-col').forEach(col => {
                if (getComputedStyle(col).display === 'none') return;
                const r = rectRel(col);
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 3]);
                ctx.strokeRect(r.x, r.y, r.w, r.h);
                ctx.setLineDash([]);
            });

            root.querySelectorAll('.usat-curso-bloque').forEach(block => {
                if (getComputedStyle(block).display === 'none') return;
                const r = rectRel(block);
                if (r.w <= 0 || r.h <= 0) return;
                const cs = getComputedStyle(block);
                const pad = Math.max(2, parsePx(cs.paddingTop, 6));
                const radius = parsePx(cs.borderTopLeftRadius, 4);

                ctx.save();
                if (cs.boxShadow && cs.boxShadow !== 'none') {
                    ctx.shadowColor = 'rgba(0,0,0,0.2)';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetY = 2;
                }
                ctx.fillStyle = getColor(block, 'backgroundColor', '#059669');
                roundRect(r.x, r.y, r.w, r.h, radius);
                ctx.fill();
                ctx.restore();

                const hourEl = block.querySelector('.usat-bloque-hora');
                const nameEl = block.querySelector('.usat-bloque-nombre');
                const showHour = hourEl && getComputedStyle(hourEl).display !== 'none';
                const hourText = showHour ? hourEl.textContent.trim() : '';
                const nameText = nameEl ? nameEl.textContent.trim() : '';

                let hourSize = hourEl ? parsePx(getComputedStyle(hourEl).fontSize, 9) : 9;
                let nameSize = nameEl ? parsePx(getComputedStyle(nameEl).fontSize, 10) : 10;
                const textWidth = Math.max(8, r.w - pad * 2 - 4);
                const availH = Math.max(8, r.h - pad * 2);

                let nameLines = wrapText(nameText, textWidth, `600 ${nameSize}px Arial, sans-serif`);
                let hourH = showHour ? hourSize + 6 : 0;
                let nameLH = nameSize * 1.15;
                let totalH = (showHour ? hourH + 3 : 0) + nameLines.length * nameLH;

                while (totalH > availH && nameSize > 6.5) {
                    nameSize -= 0.5;
                    nameLH = nameSize * 1.15;
                    nameLines = wrapText(nameText, textWidth, `600 ${nameSize}px Arial, sans-serif`);
                    totalH = (showHour ? hourH + 3 : 0) + nameLines.length * nameLH;
                }

                let y = r.y + (r.h - totalH) / 2;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                if (showHour) {
                    ctx.font = `700 ${hourSize}px Arial, sans-serif`;
                    const bw = Math.min(textWidth, ctx.measureText(hourText).width + 10);
                    ctx.fillStyle = 'rgba(0,0,0,0.18)';
                    roundRect(r.x + (r.w - bw) / 2, y, bw, hourH, 3);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(hourText, r.x + r.w / 2, y + 3, textWidth);
                    y += hourH + 3;
                }
                ctx.font = `600 ${nameSize}px Arial, sans-serif`;
                ctx.fillStyle = '#ffffff';
                nameLines.forEach(line => {
                    ctx.fillText(line, r.x + r.w / 2, y, textWidth);
                    y += nameLH;
                });
            });

            const blob = await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('PNG vacío')), 'image/png'));
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = 'Mi_Horario_USAT.png';
            a.href = url;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            btnActivo.innerHTML = `${CORE.ICONOS.check}<span>Descargado</span>`;
        } catch (err) {
            CORE.toast({ mensaje: `No se pudo generar el PNG: ${err.message}`, tipo: 'error' });
            btnActivo.innerHTML = `${CORE.ICONOS.cerrar}<span>Error</span>`;
        } finally {
            btnActivo.disabled = false;
            setTimeout(() => { btnActivo.innerHTML = textoOriginal; }, 2000);
        }
    }

    function asegurarOverlays() {
        if (!document.getElementById('usat-popover-horario')) {
            const popover = document.createElement('div');
            popover.id = 'usat-popover-horario';
            popover.innerHTML = `
                <button type="button" class="usat-pop-btn" id="usat-pop-btn-aula">Abrir curso</button>
                <button type="button" class="usat-pop-btn" id="usat-pop-btn-notas">Ver notas</button>
                <div style="position:relative;width:100%;">
                    <button type="button" class="usat-pop-btn" style="pointer-events:none;">Cambiar color</button>
                    <input type="color" id="usat-pop-color" aria-label="Elegir color del curso" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;border:none;">
                </div>
            `;
            document.body.appendChild(popover);

            document.getElementById('usat-pop-color').addEventListener('input', (e) => {
                if (!cursoActualSeleccionado) return;
                const nuevoColor = e.target.value;
                let colores = {};
                try { colores = JSON.parse(localStorage.getItem(COLORES_KEY) || '{}'); } catch (err) {}
                colores[cursoActualSeleccionado] = nuevoColor;
                localStorage.setItem(COLORES_KEY, JSON.stringify(colores));

                document.querySelectorAll('.usat-curso-bloque').forEach(b => {
                    if (b.getAttribute('data-curso') === cursoActualSeleccionado) {
                        b.style.backgroundColor = nuevoColor;
                    }
                });
                popover.style.setProperty('--usat-popover-color', nuevoColor);
            });

            document.getElementById('usat-pop-btn-notas').addEventListener('click', () => {
                const nombreCurso = cursoActualSeleccionado;
                popover.style.display = 'none';
                if (!nombreCurso) return;

                const normalizar = (t) => (t || '')
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .toUpperCase().replace(/\s*\([A-Z0-9]+\)\s*$/, '').replace(/\s+/g, ' ').trim();

                const buscado = normalizar(nombreCurso);
                const abrio = window.USAT_AULA?.ejecutarMenuNativo('calificadorestudiante.aspx');
                if (!abrio) {
                    CORE.toast({ mensaje: 'No se encontró el acceso a Calificaciones.', tipo: 'error' });
                    return;
                }

                if (timerNotasActivo) clearInterval(timerNotasActivo);
                let intentos = 0;

                const buscarSelector = (doc) => {
                    if (!doc) return null;
                    const sel = doc.querySelector('#ddlCurso');
                    if (sel) return sel;
                    for (const f of doc.querySelectorAll('iframe, frame')) {
                        try {
                            const r = buscarSelector(f.contentDocument || f.contentWindow?.document);
                            if (r) return r;
                        } catch (e) {}
                    }
                    return null;
                };

                timerNotasActivo = setInterval(() => {
                    intentos++;
                    const selector = buscarSelector(document);
                    if (selector) {
                        const opcion = Array.from(selector.options).find(
                            o => o.value && o.value !== '-1' && normalizar(o.textContent) === buscado
                        );
                        if (opcion) {
                            clearInterval(timerNotasActivo);
                            timerNotasActivo = null;
                            selector.value = opcion.value;
                            const win = selector.ownerDocument.defaultView;
                            selector.dispatchEvent(new win.Event('change', { bubbles: true }));
                            return;
                        }
                    }
                    if (intentos >= 40) {
                        clearInterval(timerNotasActivo);
                        timerNotasActivo = null;
                        CORE.toast({ mensaje: `No se pudo seleccionar "${nombreCurso}" en Calificaciones.`, tipo: 'warning' });
                    }
                }, 250);
            });

            document.getElementById('usat-pop-btn-aula').addEventListener('click', async () => {
                popover.style.display = 'none';
                if (!cursoActualSeleccionado) return;

                if (!window.USAT_AULA) {
                    CORE.toast({ mensaje: 'Módulo del Aula Virtual no disponible.', tipo: 'error' });
                    return;
                }

                const buscado = cursoActualSeleccionado.replace(/^\d{4}-.{1,2}\s*-\s*/, '').trim().toLowerCase();
                const dicc = await window.USAT_AULA.asegurarDiccionarioCursos(false);
                let idMoodle = null;

                for (const [nombreMoodle, id] of Object.entries(dicc || {})) {
                    if (nombreMoodle.includes(buscado) || buscado.includes(nombreMoodle)) {
                        idMoodle = id;
                        break;
                    }
                }

                const destino = idMoodle
                    ? `https://intranet.usat.edu.pe/aulavirtual/course/view.php?id=${idMoodle}`
                    : 'https://intranet.usat.edu.pe/aulavirtual/my/';
                window.USAT_AULA.abrirModal(destino);
            });

            document.addEventListener('click', (e) => {
                const bloque = e.target.closest('.usat-curso-bloque');
                if (!bloque && !e.target.closest('#usat-popover-horario')) {
                    popover.style.display = 'none';
                    return;
                }
                if (bloque && !e.target.closest('#usat-modal-ampliar')) {
                    e.preventDefault();
                    e.stopPropagation();
                    cursoActualSeleccionado = bloque.getAttribute('data-curso') || '';
                    const colorActual = getComputedStyle(bloque).backgroundColor;
                    const rgb = colorActual.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (rgb) {
                        const hex = (v) => Number(v).toString(16).padStart(2, '0');
                        document.getElementById('usat-pop-color').value = `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
                    }
                    popover.style.setProperty('--usat-popover-color', colorActual);
                    popover.style.display = 'flex';

                    const rect = bloque.getBoundingClientRect();
                    const ancho = popover.offsetWidth;
                    const centro = rect.left + rect.width / 2;
                    const left = Math.max(8, Math.min(centro - ancho / 2, window.innerWidth - ancho - 8));
                    popover.style.left = `${left + window.scrollX}px`;
                    popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
                    popover.style.setProperty('--usat-flecha-x', `${Math.max(14, Math.min(centro - left, ancho - 14))}px`);
                }
            });
        }

        if (!document.getElementById('usat-modal-ampliar')) {
            const modal = document.createElement('div');
            modal.id = 'usat-modal-ampliar';
            modal.innerHTML = `
                <div class="usat-modal-toolbar">
                    <div>
                        <button type="button" class="usat-modal-btn" id="usat-mod-menos" title="Reducir">${CORE.ICONOS.menos}</button>
                        <button type="button" class="usat-modal-btn" id="usat-mod-mas" title="Aumentar">${CORE.ICONOS.mas}</button>
                    </div>
                    <div>
                        <button type="button" class="usat-modal-btn" id="usat-mod-dl">${CORE.ICONOS.descargar}<span>Descargar</span></button>
                        <button type="button" class="usat-modal-btn usat-modal-close" id="usat-mod-close">${CORE.ICONOS.cerrar}</button>
                    </div>
                </div>
                <div id="usat-clon-contenedor"></div>
            `;
            document.body.appendChild(modal);

            document.getElementById('usat-mod-close').addEventListener('click', () => { modal.style.display = 'none'; });
            document.getElementById('usat-mod-mas').addEventListener('click', () => {
                escalaModal = Math.min(2, escalaModal + 0.1);
                document.getElementById('usat-clon-contenedor').style.transform = `scale(${escalaModal})`;
            });
            document.getElementById('usat-mod-menos').addEventListener('click', () => {
                escalaModal = Math.max(0.5, escalaModal - 0.1);
                document.getElementById('usat-clon-contenedor').style.transform = `scale(${escalaModal})`;
            });
            document.getElementById('usat-mod-dl').addEventListener('click', function () {
                descargarFoto(document.querySelector('#usat-clon-contenedor .usat-calendario-container'), this);
            });
        }
    }

    async function montarHorario() {
        if (document.getElementById('usat-horario-wrapper')) return;
        asegurarEstilos();
        asegurarOverlays();

        // Anclaje independiente: usa Dashboard si está activo; si no, el contenedor de anuncio nativo
        const dashboard = document.getElementById('usat-dashboard-accesos');
        const anuncio = document.getElementById('anuncio');
        const nodoRef = dashboard || (anuncio ? (anuncio.closest('.panel') || anuncio.parentElement) : null);
        if (!nodoRef) return;

        const prefs = cargarPreferencias();
        const html = `
            <div id="usat-horario-wrapper" class="${!prefs.horas ? 'usat-ocultar-horas' : ''}">
                <div class="usat-calendario-container" id="usat-export-zona">
                    <div class="usat-grid-header" id="usat-horario-head">
                        <div data-dia="LU">LUN</div><div data-dia="MA">MAR</div><div data-dia="MI">MIE</div>
                        <div data-dia="JU">JUE</div><div data-dia="VI">VIE</div><div data-dia="SA">SAB</div>
                    </div>
                    <div class="usat-grid-body" id="usat-horario-body">
                        <div class="usat-dia-col" id="col-LU"></div><div class="usat-dia-col" id="col-MA"></div>
                        <div class="usat-dia-col" id="col-MI"></div><div class="usat-dia-col" id="col-JU"></div>
                        <div class="usat-dia-col" id="col-VI"></div><div class="usat-dia-col" id="col-SA"></div>
                    </div>
                </div>
                <div class="usat-panel-contenedor">
                    <div class="usat-panel-header" id="usat-btn-personalizar">
                        <span>Personalizar horario</span><span id="usat-chevron-pers">⌄</span>
                    </div>
                    <div class="usat-panel-body" id="usat-body-personalizar">
                        <div class="usat-panel-instruccion">Haz clic en cualquier curso del horario para abrirlo, ver sus notas o cambiar su color.</div>
                        <div class="usat-controles-grid">
                            <label class="usat-control-fila"><input type="checkbox" id="cfg-sombras" ${prefs.sombras ? 'checked' : ''}> Mostrar sombras</label>
                            <label class="usat-control-fila"><input type="checkbox" id="cfg-mayus" ${prefs.mayusculas ? 'checked' : ''}> Nombres en mayúsculas</label>
                            <label class="usat-control-fila"><input type="checkbox" id="cfg-horas" ${prefs.horas ? 'checked' : ''}> Mostrar indicador de horas</label>
                            <label class="usat-control-fila"><input type="checkbox" id="cfg-fmt24" ${prefs.fmt24 ? 'checked' : ''}> Usar formato de 24 horas</label>
                            <label class="usat-control-fila"><input type="checkbox" id="cfg-dias-vacios" ${prefs.diasSinCursos ? 'checked' : ''}> Mostrar días sin cursos</label>

                            <div class="usat-control-rango"><span>Tamaño de los días</span><input type="range" id="cfg-tam-dias" min="8" max="20" value="${prefs.tamDias}"></div>
                            <div class="usat-control-rango"><span>Tamaño de los nombres</span><input type="range" id="cfg-tam-nom" min="7" max="16" value="${prefs.tamNom}"></div>
                            <div class="usat-control-rango"><span>Tamaño de la hora</span><input type="range" id="cfg-tam-hora" min="7" max="14" value="${prefs.tamHora}"></div>
                            <div class="usat-control-rango"><span>Espacio de los nombres</span><input type="range" id="cfg-esp-nom" min="0.8" max="2" step="0.1" value="${prefs.espNom}"></div>
                            <div class="usat-control-rango"><span>Radio de esquinas</span><input type="range" id="cfg-rad-esq" min="0" max="20" value="${prefs.radEsq}"></div>
                            <div class="usat-control-rango"><span>Ancho de columnas</span><input type="range" id="cfg-anch-col" min="50" max="200" value="${prefs.anchCol}"></div>
                            <div class="usat-control-rango"><span>Alto de filas</span><input type="range" id="cfg-alt-fil" min="20" max="100" value="${prefs.altFil}"></div>
                            <div class="usat-control-rango"><span>Espaciado</span><input type="range" id="cfg-espaciado" min="0" max="15" value="${prefs.espaciado}"></div>
                        </div>
                        <div class="usat-panel-footer">
                            <button type="button" class="usat-btn-accion" id="usat-btn-ampliar">${CORE.ICONOS.ampliar}<span>Ampliar</span></button>
                            <button type="button" class="usat-btn-accion" id="usat-btn-descargar">${CORE.ICONOS.descargar}<span>Descargar PNG</span></button>
                            <button type="button" class="usat-btn-accion" id="usat-btn-refrescar-horario">${CORE.ICONOS.actualizar}<span>Actualizar</span></button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        nodoRef.insertAdjacentHTML(dashboard ? 'afterend' : 'beforebegin', html);
        aplicarPreferenciasUI(prefs);

        document.getElementById('usat-btn-personalizar').addEventListener('click', () => {
            const body = document.getElementById('usat-body-personalizar');
            body.classList.toggle('activo');
            document.getElementById('usat-chevron-pers').textContent = body.classList.contains('activo') ? '⌃' : '⌄';
        });

        const leerYGuardarPrefs = () => {
            const p = {
                sombras: document.getElementById('cfg-sombras').checked,
                mayusculas: document.getElementById('cfg-mayus').checked,
                horas: document.getElementById('cfg-horas').checked,
                fmt24: document.getElementById('cfg-fmt24').checked,
                diasSinCursos: document.getElementById('cfg-dias-vacios').checked,
                tamDias: document.getElementById('cfg-tam-dias').value,
                tamNom: document.getElementById('cfg-tam-nom').value,
                tamHora: document.getElementById('cfg-tam-hora').value,
                espNom: document.getElementById('cfg-esp-nom').value,
                radEsq: document.getElementById('cfg-rad-esq').value,
                anchCol: document.getElementById('cfg-anch-col').value,
                altFil: document.getElementById('cfg-alt-fil').value,
                espaciado: document.getElementById('cfg-espaciado').value
            };
            localStorage.setItem(PREFS_KEY, JSON.stringify(p));
            return p;
        };

        // Sliders: solo variables CSS (cero peticiones de red, cero re-render DOM)
        document.querySelectorAll('#usat-body-personalizar input[type="range"]').forEach(inp => {
            inp.addEventListener('input', () => aplicarPreferenciasUI(leerYGuardarPrefs()));
        });

        // Checkboxes: actualizan UI y redibujan desde memoria local
        document.querySelectorAll('#usat-body-personalizar input[type="checkbox"]').forEach(inp => {
            inp.addEventListener('change', () => {
                const p = leerYGuardarPrefs();
                aplicarPreferenciasUI(p);
                if (datosHorarioMemoria) {
                    dibujarCalendario(datosHorarioMemoria.cursos, datosHorarioMemoria.modUSAT, p);
                }
            });
        });

        document.getElementById('usat-btn-ampliar').addEventListener('click', () => {
            const zona = document.getElementById('usat-export-zona');
            const clon = document.getElementById('usat-clon-contenedor');
            clon.innerHTML = '';
            const copia = zona.cloneNode(true);
            copia.style.padding = '18px';
            clon.appendChild(copia);
            escalaModal = 1;
            clon.style.transform = 'scale(1)';
            document.getElementById('usat-modal-ampliar').style.display = 'flex';
        });

        document.getElementById('usat-btn-descargar').addEventListener('click', function () {
            descargarFoto(document.getElementById('usat-export-zona'), this);
        });

        document.getElementById('usat-btn-refrescar-horario').addEventListener('click', async function () {
            const orig = this.innerHTML;
            this.innerHTML = `${CORE.ICONOS.spinner}<span>Actualizando...</span>`;
            this.disabled = true;
            try {
                const datos = await obtenerDatosHorario(true);
                if (datos) dibujarCalendario(datos.cursos, datos.modUSAT, leerYGuardarPrefs());
            } finally {
                this.innerHTML = orig;
                this.disabled = false;
            }
        });

        try {
            const datos = await obtenerDatosHorario(false);
            if (datos) dibujarCalendario(datos.cursos, datos.modUSAT, prefs);
        } catch (err) {
            console.warn('[USAT+ Horario] Error cargando horario:', err.message);
        }
    }

    function desmontarHorario() {
        document.getElementById('usat-horario-wrapper')?.remove();
    }

    if (ENV.getSetting('horarioEnabled', true)) montarHorario();

    ENV.onSettingsChanged((changes) => {
        if (!changes.horarioEnabled) return;
        changes.horarioEnabled.newValue !== false ? montarHorario() : desmontarHorario();
    });
})();