// =========================================
// USAT+ v4 - MÓDULO 11: ANUNCIOS DE NOVEDADES (24h por usuario)
// =========================================
(() => {
    const CORE = window.USAT_CORE;
    if (!CORE) return;
    if (window.self !== window.top) return;
    if (!window.location.href.toLowerCase().includes('main.aspx')) return;

    // =========================================
    // CONFIGURACIÓN DEL ANUNCIO ACTUAL (Edita esto en cada actualización)
    // =========================================
    const NOVEDAD_ACTUAL = {
        activo: true,                               // Pon false si no quieres mostrar ningún anuncio
        id: 'novedad-v4.0.1-bienvenida',            // CAMBIA ESTE ID en cada nueva actualización
        etiqueta: 'USAT+ · NUEVO',
        titulo: 'Nueva versión USAT+ v4 disponible',
        resumen: 'Ahora el campus carga al instante, el horario ya no se congela al personalizarlo y la calculadora lee mejor tus sílabos.',
        duracionHoras: 24,
        imagen: '',                                 // Opcional: URL HTTPS de una captura en tu GitHub (assets/...)
        modal: {
            subtitulo: 'Resumen de mejoras en esta actualización',
            descripcion: 'Hemos optimizado la extensión por completo para que funcione mucho más rápido y sin interrupciones:',
            puntos: [
                'Auto-redirección y auto-login instantáneos al entrar al campus.',
                'Horario interactivo con personalización fluida y acceso directo a tus cursos y notas.',
                'Calculadora de notas mejorada con validación automática de pesos al subir tu sílabo PDF.',
                'Actualizaciones automáticas silenciosas: no tendrás que volver a instalar nada.'
            ],
            notaFinal: 'Puedes activar o desactivar cualquier módulo desde el ícono de USAT+ arriba a la derecha.'
        }
    };

    const STORAGE_KEY = 'usat_novedades_estado_v4';
    const DURACION_MS = (NOVEDAD_ACTUAL.duracionHoras || 24) * 60 * 60 * 1000;

    if (!NOVEDAD_ACTUAL.activo) return;

    function obtenerEstado() {
        const ahora = Date.now();
        try {
            const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (guardado && guardado.id === NOVEDAD_ACTUAL.id) {
                return guardado;
            }
        } catch (e) {}

        // Primera vez que este usuario ve esta novedad: arranca su contador de 24h
        const nuevo = { id: NOVEDAD_ACTUAL.id, vistoEn: ahora, cerrado: false };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo)); } catch (e) {}
        return nuevo;
    }

    function marcarComoCerrado() {
        const estado = obtenerEstado();
        estado.cerrado = true;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); } catch (e) {}
    }

    function formatearTiempoRestante(msRestantes) {
        const mins = Math.max(1, Math.ceil(msRestantes / 60000));
        if (mins < 60) return `${mins} min`;
        const horas = Math.ceil(msRestantes / (60 * 60 * 1000));
        return `${horas} h`;
    }

    function asegurarEstilos() {
        if (document.getElementById('usat-novedades-css')) return;
        const style = document.createElement('style');
        style.id = 'usat-novedades-css';
        style.textContent = `
            #usat-novedad-card {
                background: #ffffff !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                margin-top: 12px !important;
                margin-bottom: 18px !important;
                box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08) !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
                transition: opacity 0.2s ease, transform 0.2s ease !important;
            }
            #usat-novedad-card.ocultando {
                opacity: 0 !important;
                transform: translateY(-6px) !important;
            }
            .usat-nov-header {
                background: #1e293b !important;
                color: #ffffff !important;
                padding: 10px 13px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 8px !important;
            }
            .usat-nov-badge {
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                letter-spacing: 0.4px !important;
                text-transform: uppercase !important;
                color: #f8fafc !important;
            }
            .usat-nov-dot {
                width: 7px !important;
                height: 7px !important;
                border-radius: 50% !important;
                background: #ef4444 !important;
                flex-shrink: 0 !important;
            }
            .usat-nov-close {
                background: rgba(255, 255, 255, 0.12) !important;
                border: none !important;
                color: #ffffff !important;
                width: 24px !important;
                height: 24px !important;
                padding: 0 !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                flex-shrink: 0 !important;
                transition: background 0.15s ease !important;
            }
            .usat-nov-close:hover { background: rgba(255, 255, 255, 0.24) !important; }
            .usat-nov-close svg {
                width: 13px !important;
                height: 13px !important;
                min-width: 13px !important;
                max-width: 13px !important;
            }
            .usat-nov-body {
                padding: 14px !important;
                color: #1e293b !important;
            }
            .usat-nov-title {
                margin: 0 0 6px 0 !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                color: #0f172a !important;
                line-height: 1.3 !important;
            }
            .usat-nov-text {
                margin: 0 0 12px 0 !important;
                font-size: 12.5px !important;
                color: #475569 !important;
                line-height: 1.45 !important;
            }
            .usat-nov-img {
                width: 100% !important;
                height: auto !important;
                border-radius: 6px !important;
                border: 1px solid #e2e8f0 !important;
                margin-bottom: 12px !important;
                display: block !important;
            }
            .usat-nov-btn {
                width: 100% !important;
                padding: 8px 12px !important;
                background: #991b1b !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 6px !important;
                font-size: 12.5px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                transition: background 0.15s ease !important;
            }
            .usat-nov-btn:hover { background: #7f1d1d !important; }
            .usat-nov-footer {
                padding: 8px 14px !important;
                background: #f8fafc !important;
                border-top: 1px solid #e2e8f0 !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                font-size: 11px !important;
                color: #64748b !important;
                font-weight: 500 !important;
            }
            .usat-nov-footer svg {
                width: 13px !important;
                height: 13px !important;
                min-width: 13px !important;
                max-width: 13px !important;
                flex-shrink: 0 !important;
            }

            /* Modal explicativo */
            #usat-novedad-modal {
                position: fixed !important;
                inset: 0 !important;
                background: rgba(15, 23, 42, 0.68) !important;
                backdrop-filter: blur(3px) !important;
                z-index: 999999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 16px !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            }
            .usat-nov-modal-box {
                background: #ffffff !important;
                width: 100% !important;
                max-width: 500px !important;
                max-height: 88vh !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                box-shadow: 0 20px 35px rgba(15, 23, 42, 0.35) !important;
                border: 1px solid #cbd5e1 !important;
            }
            .usat-nov-modal-head {
                background: #991b1b !important;
                color: #ffffff !important;
                padding: 14px 18px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 10px !important;
            }
            .usat-nov-modal-head h3 {
                margin: 0 !important;
                font-size: 15px !important;
                font-weight: 700 !important;
                color: #ffffff !important;
            }
            .usat-nov-modal-content {
                padding: 18px !important;
                overflow-y: auto !important;
                color: #1e293b !important;
                font-size: 13px !important;
                line-height: 1.5 !important;
            }
            .usat-nov-modal-list {
                margin: 10px 0 14px !important;
                padding-left: 18px !important;
                color: #334155 !important;
            }
            .usat-nov-modal-list li { margin-bottom: 6px !important; }
            .usat-nov-modal-note {
                padding: 10px 12px !important;
                background: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 6px !important;
                font-size: 12px !important;
                color: #475569 !important;
            }
            .usat-nov-modal-foot {
                padding: 12px 18px !important;
                background: #f8fafc !important;
                border-top: 1px solid #e2e8f0 !important;
                display: flex !important;
                justify-content: flex-end !important;
                gap: 8px !important;
            }
            .usat-nov-btn-sec {
                padding: 8px 13px !important;
                background: #ffffff !important;
                color: #475569 !important;
                border: 1px solid #cbd5e1 !important;
                border-radius: 6px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
            }
            .usat-nov-btn-sec:hover { background: #f1f5f9 !important; color: #0f172a !important; }
            .usat-nov-btn-pri {
                padding: 8px 14px !important;
                background: #991b1b !important;
                color: #ffffff !important;
                border: none !important;
                border-radius: 6px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
            }
            .usat-nov-btn-pri:hover { background: #7f1d1d !important; }
        `;
        document.head.appendChild(style);
    }

    function abrirModalExplicativo(alOcultarTarjeta) {
        if (document.getElementById('usat-novedad-modal')) return;
        const E = CORE.escapeHtml;
        const m = NOVEDAD_ACTUAL.modal || {};
        const puntosHtml = Array.isArray(m.puntos) && m.puntos.length > 0
            ? `<ul class="usat-nov-modal-list">${m.puntos.map(p => `<li>${E(p)}</li>`).join('')}</ul>`
            : '';

        const overlay = document.createElement('div');
        overlay.id = 'usat-novedad-modal';
        overlay.innerHTML = `
            <div class="usat-nov-modal-box">
                <div class="usat-nov-modal-head">
                    <h3>${E(NOVEDAD_ACTUAL.titulo)}</h3>
                    <button type="button" class="usat-nov-close" id="usat-nov-modal-x" title="Cerrar">${CORE.ICONOS.cerrar}</button>
                </div>
                <div class="usat-nov-modal-content">
                    ${m.subtitulo ? `<div style="font-size:11.5px;font-weight:700;color:#991b1b;text-transform:uppercase;margin-bottom:6px;">${E(m.subtitulo)}</div>` : ''}
                    ${m.descripcion ? `<p style="margin:0 0 8px;">${E(m.descripcion)}</p>` : ''}
                    ${NOVEDAD_ACTUAL.imagen ? `<img class="usat-nov-img" src="${E(NOVEDAD_ACTUAL.imagen)}" alt="Vista previa">` : ''}
                    ${puntosHtml}
                    ${m.notaFinal ? `<div class="usat-nov-modal-note">${E(m.notaFinal)}</div>` : ''}
                </div>
                <div class="usat-nov-modal-foot">
                    <button type="button" class="usat-nov-btn-sec" id="usat-nov-modal-dismiss">Ocultar aviso</button>
                    <button type="button" class="usat-nov-btn-pri" id="usat-nov-modal-ok">Entendido</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const cerrar = () => {
            document.removeEventListener('keydown', onEsc);
            overlay.remove();
        };
        const onEsc = (e) => { if (e.key === 'Escape') cerrar(); };

        document.addEventListener('keydown', onEsc);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
        document.getElementById('usat-nov-modal-x').addEventListener('click', cerrar);
        document.getElementById('usat-nov-modal-ok').addEventListener('click', cerrar);
        document.getElementById('usat-nov-modal-dismiss').addEventListener('click', () => {
            cerrar();
            alOcultarTarjeta();
        });
    }

    function montarAnuncio() {
        const estado = obtenerEstado();
        const restanteMs = DURACION_MS - (Date.now() - estado.vistoEn);
        if (estado.cerrado || restanteMs <= 0) return true; // Ya no debe mostrarse

        const contenedor = document.getElementById('div_seccion_anuncios');
        if (!contenedor) return false;
        if (document.getElementById('usat-novedad-card')) return true;

        asegurarEstilos();
        const E = CORE.escapeHtml;

        const card = document.createElement('div');
        card.id = 'usat-novedad-card';
        card.innerHTML = `
            <div class="usat-nov-header">
                <span class="usat-nov-badge">
                    <span class="usat-nov-dot"></span>
                    <span>${E(NOVEDAD_ACTUAL.etiqueta || 'USAT+ · NUEVO')}</span>
                </span>
                <button type="button" class="usat-nov-close" id="usat-nov-card-close" title="Cerrar anuncio">
                    ${CORE.ICONOS.cerrar}
                </button>
            </div>
            <div class="usat-nov-body">
                <h4 class="usat-nov-title">${E(NOVEDAD_ACTUAL.titulo)}</h4>
                <p class="usat-nov-text">${E(NOVEDAD_ACTUAL.resumen)}</p>
                ${NOVEDAD_ACTUAL.imagen ? `<img class="usat-nov-img" src="${E(NOVEDAD_ACTUAL.imagen)}" alt="Novedad USAT+">` : ''}
                <button type="button" class="usat-nov-btn" id="usat-nov-card-more">Ver cómo funciona</button>
            </div>
            <div class="usat-nov-footer">
                ${CORE.ICONOS.reloj}
                <span>Este aviso se ocultará en ${formatearTiempoRestante(restanteMs)}</span>
            </div>
        `;

        contenedor.insertBefore(card, contenedor.firstChild);

        const ocultarTarjeta = () => {
            marcarComoCerrado();
            card.classList.add('ocultando');
            setTimeout(() => card.remove(), 220);
        };

        document.getElementById('usat-nov-card-close').addEventListener('click', ocultarTarjeta);
        document.getElementById('usat-nov-card-more').addEventListener('click', () => abrirModalExplicativo(ocultarTarjeta));
        return true;
    }

    if (!montarAnuncio()) {
        const obs = new MutationObserver(() => {
            if (montarAnuncio()) obs.disconnect();
        });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => obs.disconnect(), 10000);
    }
})();