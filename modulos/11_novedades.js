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
        id: 'novedad-v4.1.0-caratulas',             // CAMBIA ESTE ID en cada nueva actualización
        etiqueta: 'USAT+ · NUEVA FUNCIÓN',
        titulo: 'Generador de Carátulas USAT',
        resumen: 'Crea tus carátulas en segundos desde cualquier curso del Aula Virtual, con tus datos ya autocompletados y listas en Word, PDF o para pegar.',
        duracionHoras: 24,
        imagen: 'https://jordanjv1844.github.io/usat-plus/assets/novedad_caratulas.webp',
        imagenEnTarjeta: false,                     // Solo se muestra dentro del modal
        modal: {
            subtitulo: '¿Dónde encontrarlo y cómo funciona?',
            descripcion: 'Entra a cualquier curso del Aula Virtual y presiona el botón rojo "Generar Carátula" (arriba a la derecha). Tu nombre, asignatura y docente se completan automáticamente.',
            puntos: [
                {
                    titulo: '1. Plantilla (A: Clásica / B: Alternativa):',
                    texto: 'Elige entre el formato tradicional USAT o el diseño alternativo con franjas rojas y marca de agua.'
                },
                {
                    titulo: '2. Modalidad (Individual / Grupal):',
                    texto: 'En modo grupal puedes agregar varios integrantes, ordenarlos de la A a la Z con un clic y la extensión recuerda tu grupo en cada curso.'
                },
                {
                    titulo: '3. Copiar vs. Descargar:',
                    texto: 'Ambas plantillas se descargan en PDF y Word (.docx) 100 % editable. Con el botón de copiar, en "Clásica" copias el formato editable listo para pegar en Word, mientras que en "Alternativa" se copia como imagen para conservar las franjas y el fondo.'
                },
                {
                    titulo: 'Vista previa fiel con zoom:',
                    texto: 'Revisa cómo quedará tu hoja A4 antes de exportar usando los controles de zoom o Ctrl + rueda.'
                }
            ],
            notaFinal: 'Tu Facultad y Escuela se guardan automáticamente para que no tengas que escribirlas en cada trabajo.'
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
                border-radius: 8px !important;
                border: 1px solid #cbd5e1 !important;
                display: block !important;
            }
            .usat-nov-img-clickable {
                cursor: zoom-in !important;
                transition: transform 0.15s ease, box-shadow 0.15s ease !important;
            }
            .usat-nov-img-clickable:hover {
                transform: scale(1.01) !important;
                box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15) !important;
            }
            .usat-nov-img-hint {
                margin-top: 6px !important;
                text-align: center !important;
                font-size: 11px !important;
                color: #64748b !important;
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
                z-index: 2147483646 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 16px !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            }
            .usat-nov-modal-box {
                background: #ffffff !important;
                width: 100% !important;
                max-width: 520px !important;
                max-height: 90vh !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                box-shadow: 0 20px 35px rgba(15, 23, 42, 0.35) !important;
                border: 1px solid #cbd5e1 !important;
            }
            .usat-nov-modal-box.con-imagen {
                max-width: 880px !important;
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
                padding: 20px !important;
                overflow-y: auto !important;
                color: #1e293b !important;
                font-size: 13px !important;
                line-height: 1.5 !important;
            }
            .usat-nov-modal-grid {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 20px !important;
                align-items: center !important;
            }
            @media (max-width: 760px) {
                .usat-nov-modal-grid {
                    grid-template-columns: 1fr !important;
                }
            }
            .usat-nov-modal-list {
                margin: 10px 0 14px !important;
                padding-left: 18px !important;
                color: #334155 !important;
            }
            .usat-nov-modal-list li { margin-bottom: 8px !important; }
            .usat-nov-modal-list strong { color: #0f172a !important; }
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

            /* Lightbox para ampliar captura con zoom y arrastre */
            #usat-novedad-lightbox {
                position: fixed !important;
                inset: 0 !important;
                background: rgba(15, 23, 42, 0.88) !important;
                backdrop-filter: blur(4px) !important;
                z-index: 2147483647 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 20px !important;
                overflow: hidden !important;
                user-select: none !important;
            }
            #usat-novedad-lightbox img {
                width: auto !important;
                height: auto !important;
                min-width: 0 !important;
                min-height: 0 !important;
                max-width: 90vw !important;
                max-height: 88vh !important;
                padding: 0 !important;
                margin: 0 !important;
                object-fit: contain !important;
                border-radius: 8px !important;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5) !important;
                background: #ffffff !important;
                transform-origin: center center !important;
                transition: transform 0.1s ease-out !important;
                cursor: zoom-in !important;
            }
            #usat-novedad-lightbox img.zoomed { cursor: grab !important; }
            #usat-novedad-lightbox img.dragging {
                cursor: grabbing !important;
                transition: none !important;
            }
            .usat-lb-bar {
                position: fixed !important;
                bottom: 20px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                z-index: 2147483647 !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
                background: rgba(15, 23, 42, 0.92) !important;
                padding: 5px 8px !important;
                border-radius: 8px !important;
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35) !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
            }
            .usat-lb-bar button {
                margin: 0 !important;
                background: transparent !important;
                border: none !important;
                color: #f8fafc !important;
                height: 28px !important;
                min-width: 28px !important;
                padding: 0 7px !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                line-height: 1 !important;
            }
            .usat-lb-bar button:hover { background: rgba(255, 255, 255, 0.16) !important; }
            .usat-lb-bar button svg {
                width: 14px !important;
                height: 14px !important;
                min-width: 14px !important;
                max-width: 14px !important;
            }
            .usat-lb-sep {
                width: 1px !important;
                height: 16px !important;
                background: rgba(255, 255, 255, 0.2) !important;
                margin: 0 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    function abrirLightbox(src) {
        if (document.getElementById('usat-novedad-lightbox')) return;
        const lb = document.createElement('div');
        lb.id = 'usat-novedad-lightbox';

        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Vista ampliada';
        img.draggable = false;

        const bar = document.createElement('div');
        bar.className = 'usat-lb-bar';
        bar.innerHTML = `
            <button type="button" id="usat-lb-out" title="Alejar">${CORE.ICONOS.menos}</button>
            <button type="button" id="usat-lb-reset" title="Restablecer zoom">100%</button>
            <button type="button" id="usat-lb-in" title="Acercar">${CORE.ICONOS.mas}</button>
            <span class="usat-lb-sep"></span>
            <button type="button" id="usat-lb-close" title="Cerrar (Esc)">${CORE.ICONOS.cerrar}</button>
        `;

        lb.appendChild(img);
        lb.appendChild(bar);
        document.body.appendChild(lb);

        let zoom = 1;
        let tx = 0;
        let ty = 0;
        let arrastrando = false;
        let inicioX = 0;
        let inicioY = 0;

        const lblZoom = bar.querySelector('#usat-lb-reset');
        const actualizarTransform = () => {
            if (zoom <= 1) {
                zoom = 1;
                tx = 0;
                ty = 0;
            }
            img.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
            img.classList.toggle('zoomed', zoom > 1);
            if (lblZoom) lblZoom.textContent = `${Math.round(zoom * 100)}%`;
        };

        const cambiarZoom = (delta) => {
            zoom = Math.min(3.5, Math.max(1, Math.round((zoom + delta) * 100) / 100));
            actualizarTransform();
        };

        // Intercepta la rueda normal y Ctrl + rueda para no hacer zoom a la página de atrás
        lb.addEventListener('wheel', (e) => {
            e.preventDefault();
            cambiarZoom(e.deltaY < 0 ? 0.25 : -0.25);
        }, { passive: false });

        // Doble clic sobre la imagen alterna entre 100% y 200%
        img.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            zoom = zoom > 1 ? 1 : 2;
            tx = 0;
            ty = 0;
            actualizarTransform();
        });

        // Arrastre con el mouse cuando la imagen está ampliada
        img.addEventListener('mousedown', (e) => {
            if (zoom <= 1 || e.button !== 0) return;
            e.preventDefault();
            arrastrando = true;
            inicioX = e.clientX - tx;
            inicioY = e.clientY - ty;
            img.classList.add('dragging');
        });

        const onMouseMove = (e) => {
            if (!arrastrando) return;
            tx = e.clientX - inicioX;
            ty = e.clientY - inicioY;
            actualizarTransform();
        };

        const onMouseUp = () => {
            if (!arrastrando) return;
            arrastrando = false;
            img.classList.remove('dragging');
        };

        const cerrarLb = () => {
            document.removeEventListener('keydown', onEscLb, true);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            lb.remove();
        };

        const onEscLb = (e) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation();
                cerrarLb();
            }
        };

        bar.addEventListener('click', (e) => e.stopPropagation());
        bar.querySelector('#usat-lb-in').addEventListener('click', () => cambiarZoom(0.25));
        bar.querySelector('#usat-lb-out').addEventListener('click', () => cambiarZoom(-0.25));
        bar.querySelector('#usat-lb-reset').addEventListener('click', () => { zoom = 1; actualizarTransform(); });
        bar.querySelector('#usat-lb-close').addEventListener('click', cerrarLb);

        // Solo cierra al hacer clic en el fondo oscuro (no al arrastrar la imagen)
        lb.addEventListener('click', (e) => {
            if (e.target === lb) cerrarLb();
        });

        document.addEventListener('keydown', onEscLb, true);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    function abrirModalExplicativo(alOcultarTarjeta) {
        if (document.getElementById('usat-novedad-modal')) return;
        const E = CORE.escapeHtml;
        const m = NOVEDAD_ACTUAL.modal || {};
        const tieneImagen = !!NOVEDAD_ACTUAL.imagen;

        const puntosHtml = Array.isArray(m.puntos) && m.puntos.length > 0
            ? `<ul class="usat-nov-modal-list">${m.puntos.map(p => {
                if (p && typeof p === 'object') {
                    return `<li><strong>${E(p.titulo)}</strong> ${E(p.texto)}</li>`;
                }
                return `<li>${E(p)}</li>`;
            }).join('')}</ul>`
            : '';

        const columnaTexto = `
            <div>
                ${m.subtitulo ? `<div style="font-size:11.5px;font-weight:700;color:#991b1b;text-transform:uppercase;margin-bottom:6px;">${E(m.subtitulo)}</div>` : ''}
                ${m.descripcion ? `<p style="margin:0 0 10px;">${E(m.descripcion)}</p>` : ''}
                ${puntosHtml}
                ${m.notaFinal ? `<div class="usat-nov-modal-note">${E(m.notaFinal)}</div>` : ''}
            </div>
        `;

        const columnaImagen = tieneImagen
            ? `<div>
                    <img class="usat-nov-img usat-nov-img-clickable" id="usat-nov-modal-img" src="${E(NOVEDAD_ACTUAL.imagen)}" alt="Guía visual del Generador de Carátulas">
                    <div class="usat-nov-img-hint">Haz clic en la imagen para ampliarla</div>
               </div>`
            : '';

        const overlay = document.createElement('div');
        overlay.id = 'usat-novedad-modal';
        overlay.innerHTML = `
            <div class="usat-nov-modal-box ${tieneImagen ? 'con-imagen' : ''}">
                <div class="usat-nov-modal-head">
                    <h3>${E(NOVEDAD_ACTUAL.titulo)}</h3>
                    <button type="button" class="usat-nov-close" id="usat-nov-modal-x" title="Cerrar">${CORE.ICONOS.cerrar}</button>
                </div>
                <div class="usat-nov-modal-content">
                    ${tieneImagen ? `<div class="usat-nov-modal-grid">${columnaTexto}${columnaImagen}</div>` : columnaTexto}
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

        const imgModal = document.getElementById('usat-nov-modal-img');
        if (imgModal) {
            imgModal.addEventListener('click', () => abrirLightbox(NOVEDAD_ACTUAL.imagen));
        }
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
                ${(NOVEDAD_ACTUAL.imagen && NOVEDAD_ACTUAL.imagenEnTarjeta) ? `<img class="usat-nov-img" style="margin-bottom:12px;" src="${E(NOVEDAD_ACTUAL.imagen)}" alt="Novedad USAT+">` : ''}
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