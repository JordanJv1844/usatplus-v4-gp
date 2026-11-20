// =========================================
// USAT+ v4 - MÓDULO 05: VISTA PREVIA INSTANTÁNEA Y VISOR PDF
// =========================================
(() => {
    const CORE = window.USAT_CORE;
    if (!CORE) return;
    if (!window.location.href.includes('course/view.php')) return;

    const MAX_PREVIEW_BYTES = 25 * 1024 * 1024; // 25 MB
    const BINARIOS_NO_PREVIEW = new Set([
        'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'zip', 'rar', '7z', 'exe', 'msi', 'iso', 'mp3', 'mp4', 'avi', 'mkv'
    ]);
    const IMAGENES_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);
    const TEXTO_EXT = new Set([
        'sql', 'txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'java', 'cpp', 'c', 'h', 'ino', 'py', 'md', 'yml', 'yaml'
    ]);

    let cerrarModalActivo = null;

    function asegurarEstilos() {
        if (document.getElementById('usat-preview-styles')) return;
        const style = document.createElement('style');
        style.id = 'usat-preview-styles';
        style.textContent = `
            .btn-usat-preview {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 5px !important;
                margin-left: 8px !important;
                padding: 2px 8px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                color: #dc2626 !important;
                background-color: #fef2f2 !important;
                border: 1px solid #fecaca !important;
                border-radius: 5px !important;
                cursor: pointer !important;
                vertical-align: middle !important;
                transition: all 0.15s ease !important;
                line-height: 1.2 !important;
            }
            .btn-usat-preview:hover {
                background-color: #dc2626 !important;
                color: #ffffff !important;
                border-color: #dc2626 !important;
                transform: translateY(-1px) !important;
            }
            #usat-modal-overlay {
                position: fixed !important;
                inset: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background-color: rgba(15, 23, 42, 0.68) !important;
                backdrop-filter: blur(3px) !important;
                z-index: 999999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            #usat-modal-box {
                background-color: #ffffff !important;
                width: 92vw !important;
                height: 88vh !important;
                border-radius: 12px !important;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35) !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                border: 1px solid #cbd5e1 !important;
            }
            #usat-modal-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 10px 16px !important;
                background-color: #ffffff !important;
                border-bottom: 1px solid #e2e8f0 !important;
                flex-shrink: 0 !important;
                height: 54px !important;
                box-sizing: border-box !important;
            }
            #usat-modal-body {
                flex: 1 !important;
                width: 100% !important;
                height: 100% !important;
                background-color: #f1f5f9 !important;
                position: relative !important;
                overflow: auto !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .usat-modal-btn-action {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                padding: 0 13px !important;
                height: 33px !important;
                border-radius: 6px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                color: #ffffff !important;
                text-decoration: none !important;
                border: none !important;
                cursor: pointer !important;
                transition: opacity 0.15s ease !important;
                box-sizing: border-box !important;
            }
            .usat-modal-btn-action.usat-oculto { display: none !important; }
            .usat-modal-btn-action:hover { opacity: 0.9 !important; color: #ffffff !important; }
            #usat-btn-cerrar-modal {
                background-color: #f1f5f9 !important;
                color: #0f172a !important;
                border: none !important;
                width: 33px !important;
                height: 33px !important;
                padding: 0 !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: background-color 0.15s ease !important;
            }
            #usat-btn-cerrar-modal:hover { background-color: #e2e8f0 !important; }
            .usat-code-viewer {
                width: 100%;
                height: 100%;
                margin: 0 !important;
                padding: 18px !important;
                background-color: #0f172a !important;
                color: #e2e8f0 !important;
                font-family: "Consolas", "Monaco", "Courier New", monospace !important;
                font-size: 13px !important;
                line-height: 1.5 !important;
                overflow: auto !important;
                box-sizing: border-box !important;
                white-space: pre-wrap !important;
                word-break: break-word !important;
            }
        `;
        document.head.appendChild(style);
    }

    function esArchivoNoPrevisualizable(actividad, titulo) {
        const imgIcon = actividad.querySelector('img.activityicon, img.icon');
        const srcIcono = (imgIcon?.src || '').toLowerCase();
        const altIcono = (imgIcon?.alt || '').toLowerCase();
        const textoTitulo = titulo.toLowerCase();

        const iconosBloqueados = [
            'f/document', 'f/word', 'powerpoint', 'spreadsheet', 'excel', 'calc', 'archive', 'zip', 'mp3', 'mp4', 'audio', 'video'
        ];
        if (iconosBloqueados.some(tipo => srcIcono.includes(tipo) || altIcono.includes(tipo))) {
            return true;
        }
        return /\.(docx?|pptx?|xlsx?|zip|rar|7z|exe|msi|iso)$/i.test(textoTitulo);
    }

    function inyectarBotonesPreview() {
        asegurarEstilos();
        const actividades = document.querySelectorAll('.section .activity.resource');

        actividades.forEach((actividad) => {
            const enlace = actividad.querySelector('a[href*="mod/resource/view.php"]');
            if (!enlace || actividad.querySelector('.btn-usat-preview')) return;

            const cloneEnlace = enlace.cloneNode(true);
            cloneEnlace.querySelectorAll('.accesshide').forEach(el => el.remove());
            const titulo = cloneEnlace.textContent.replace(/\s*Archivo$/i, '').trim();

            if (esArchivoNoPrevisualizable(actividad, titulo)) return;

            const btnPreview = document.createElement('button');
            btnPreview.type = 'button';
            btnPreview.className = 'btn-usat-preview';
            btnPreview.innerHTML = `${CORE.ICONOS.ojo}<span>Ver</span>`;
            btnPreview.title = 'Vista previa instantánea';

            btnPreview.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                abrirModalVistaPrevia(enlace.href, titulo, btnPreview);
            });

            enlace.parentNode.insertBefore(btnPreview, enlace.nextSibling);
        });
    }

    async function abrirModalVistaPrevia(urlOriginal, titulo, botonOrigen) {
        if (typeof cerrarModalActivo === 'function') {
            cerrarModalActivo(true);
        }

        const controller = new AbortController();
        let blobUrlActual = null;
        let cerrado = false;
        const urlDirecta = urlOriginal.includes('?') ? `${urlOriginal}&redirect=1` : `${urlOriginal}?redirect=1`;
        const tituloSeguro = CORE.escapeHtml(titulo);

        const overlay = document.createElement('div');
        overlay.id = 'usat-modal-overlay';
        overlay.innerHTML = `
            <div id="usat-modal-box">
                <div id="usat-modal-header">
                    <div style="display:flex;align-items:center;gap:10px;overflow:hidden;">
                        <span id="usat-modal-badge" style="background:#e2e8f0;color:#334155;font-size:11px;font-weight:700;padding:4px 8px;border-radius:4px;text-transform:uppercase;">CARGANDO</span>
                        <span style="font-weight:700;font-size:14px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${tituloSeguro}">${tituloSeguro}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                        <button type="button" id="usat-btn-copiar-codigo" class="usat-modal-btn-action usat-oculto" style="background:#1e293b;">
                            ${CORE.ICONOS.copiar}<span>Copiar código</span>
                        </button>
                        <a id="usat-btn-descargar-modal" href="${CORE.escapeHtml(urlDirecta)}" target="_blank" rel="noopener" class="usat-modal-btn-action" style="background:#dc2626;">
                            ${CORE.ICONOS.descargar}<span>Descargar</span>
                        </a>
                        <button type="button" id="usat-btn-cerrar-modal" title="Cerrar (Esc)">
                            ${CORE.ICONOS.cerrar}
                        </button>
                    </div>
                </div>
                <div id="usat-modal-body">
                    <div style="display:inline-flex;align-items:center;gap:8px;color:#475569;font-size:13.5px;font-weight:600;">
                        ${CORE.ICONOS.spinner}<span>Cargando vista previa...</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });

        const headerElement = document.getElementById('usat-modal-header');
        const ajustarEscalaZoom = () => {
            if (!headerElement) return;
            const dpr = window.devicePixelRatio || 1;
            headerElement.style.zoom = dpr < 0.85 ? (0.95 / dpr).toFixed(2) : '1';
        };
        ajustarEscalaZoom();
        window.addEventListener('resize', ajustarEscalaZoom);

        const limpiarYCerrar = (inmediato = false) => {
            if (cerrado) return;
            cerrado = true;
            cerrarModalActivo = null;
            controller.abort();
            if (blobUrlActual) {
                URL.revokeObjectURL(blobUrlActual);
                blobUrlActual = null;
            }
            window.removeEventListener('resize', ajustarEscalaZoom);
            document.removeEventListener('keydown', manejadorEscape);

            if (inmediato) {
                overlay.remove();
            } else {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 200);
            }
        };
        cerrarModalActivo = limpiarYCerrar;

        const manejadorEscape = (e) => { if (e.key === 'Escape') limpiarYCerrar(); };
        document.addEventListener('keydown', manejadorEscape);
        document.getElementById('usat-btn-cerrar-modal').addEventListener('click', () => limpiarYCerrar());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) limpiarYCerrar(); });

        const bodyContainer = document.getElementById('usat-modal-body');
        const badgeElement = document.getElementById('usat-modal-badge');
        const btnCopiar = document.getElementById('usat-btn-copiar-codigo');
        const btnDescargar = document.getElementById('usat-btn-descargar-modal');

        const descargarYQuitarBoton = () => {
            limpiarYCerrar(true);
            if (botonOrigen) botonOrigen.remove();
            window.open(urlDirecta, '_blank');
        };

        try {
            const response = await fetch(urlDirecta, {
                signal: controller.signal,
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            const contentLength = Number(response.headers.get('content-length') || '0');
            const urlFinal = decodeURIComponent(response.url || '').split('?')[0];
            const extension = urlFinal.includes('.') ? urlFinal.split('.').pop().toLowerCase() : '';

            // Validación previa a descargar el cuerpo para evitar doble descarga y consumo excesivo de RAM
            if (BINARIOS_NO_PREVIEW.has(extension) || (contentLength > MAX_PREVIEW_BYTES)) {
                controller.abort();
                descargarYQuitarBoton();
                return;
            }

            const rawBlob = await response.blob();
            if (cerrado) return;

            const asignarDescarga = (urlBlob, extFinal) => {
                if (!btnDescargar) return;
                btnDescargar.href = urlBlob;
                btnDescargar.download = `${titulo}.${extFinal}`;
                btnDescargar.removeAttribute('target');
            };

            if (contentType.includes('pdf') || extension === 'pdf') {
                btnCopiar.classList.add('usat-oculto');
                badgeElement.textContent = 'PDF';
                badgeElement.style.background = '#fee2e2';
                badgeElement.style.color = '#dc2626';

                const pdfBlob = rawBlob.type === 'application/pdf'
                    ? rawBlob
                    : new Blob([rawBlob], { type: 'application/pdf' });
                blobUrlActual = URL.createObjectURL(pdfBlob);
                asignarDescarga(blobUrlActual, 'pdf');

                bodyContainer.innerHTML = `<iframe src="${blobUrlActual}#view=FitH" style="width:100%;height:100%;border:none;display:block;"></iframe>`;
            } else if (contentType.startsWith('image/') || IMAGENES_EXT.has(extension)) {
                btnCopiar.classList.add('usat-oculto');
                badgeElement.textContent = extension.toUpperCase() || 'IMAGEN';
                badgeElement.style.background = '#dcfce7';
                badgeElement.style.color = '#166534';

                blobUrlActual = URL.createObjectURL(rawBlob);
                asignarDescarga(blobUrlActual, extension || 'png');

                bodyContainer.innerHTML = `<img src="${blobUrlActual}" style="max-width:95%;max-height:95%;object-fit:contain;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />`;
            } else if (contentType.startsWith('text/') || TEXTO_EXT.has(extension) || rawBlob.size < 300 * 1024) {
                const texto = await rawBlob.text();
                if (cerrado) return;

                if (texto.includes('\u0000')) {
                    // Ya tenemos el blob en memoria: descargamos directo sin repetir petición
                    const dlUrl = URL.createObjectURL(rawBlob);
                    const a = document.createElement('a');
                    a.href = dlUrl;
                    a.download = `${titulo}${extension ? '.' + extension : ''}`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(dlUrl), 3000);
                    limpiarYCerrar(true);
                    if (botonOrigen) botonOrigen.remove();
                    return;
                }

                badgeElement.textContent = extension ? extension.toUpperCase() : 'TEXTO';
                badgeElement.style.background = '#e0e7ff';
                badgeElement.style.color = '#1e40af';

                blobUrlActual = URL.createObjectURL(rawBlob);
                asignarDescarga(blobUrlActual, extension || 'txt');

                const pre = document.createElement('pre');
                pre.className = 'usat-code-viewer';
                pre.textContent = texto;
                bodyContainer.innerHTML = '';
                bodyContainer.appendChild(pre);

                btnCopiar.classList.remove('usat-oculto');
                btnCopiar.onclick = () => {
                    navigator.clipboard.writeText(texto);
                    btnCopiar.innerHTML = `${CORE.ICONOS.check}<span>Copiado</span>`;
                    setTimeout(() => {
                        btnCopiar.innerHTML = `${CORE.ICONOS.copiar}<span>Copiar código</span>`;
                    }, 2000);
                };
            } else {
                descargarYQuitarBoton();
            }
        } catch (err) {
            if (err.name === 'AbortError' || cerrado) return;
            descargarYQuitarBoton();
        }
    }

    inyectarBotonesPreview();
    const regionMain = document.getElementById('region-main') || document.body;
    const obs = new MutationObserver(CORE.debounce(inyectarBotonesPreview, 250));
    obs.observe(regionMain, { childList: true, subtree: true });
})();