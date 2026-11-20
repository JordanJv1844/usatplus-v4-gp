// =========================================
// USAT+ v4 - MÓDULO 00: NÚCLEO COMPARTIDO
// =========================================
(() => {
    if (window.USAT_CORE) return;

    const ICONOS = {
        alerta: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        llave: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>`,
        calculadora: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>`,
        cerrar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        documento: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
        reloj: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        tareas: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="15" y2="16"></line></svg>`,
        calendario: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
        chinchetaHueca: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
        chinchetaSolida: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
        ojo: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
        copiar: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
        descargar: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
        actualizar: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
        ampliar: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
        mas: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        menos: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        impresora: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
        ordenar: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"></path></svg>`,
        spinner: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="flex-shrink:0;animation:usatCoreSpin .8s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`
    };

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function debounce(fn, wait = 150) {
        let timer = null;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), wait);
        };
    }

    function asegurarEstilosCore() {
        if (document.getElementById('usat-core-css')) return;
        const style = document.createElement('style');
        style.id = 'usat-core-css';
        style.textContent = `
            @keyframes usatCoreSpin { to { transform: rotate(360deg); } }
            @keyframes usatToastIn {
                from { transform: translateX(-110%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes usatToastOut {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(8px); opacity: 0; }
            }
            @keyframes usatToastBar {
                from { width: 100%; }
                to { width: 0%; }
            }
            #usat-toast-container {
                position: fixed !important;
                bottom: 20px !important;
                left: 20px !important;
                z-index: 2147483640 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                pointer-events: none !important;
                max-width: 340px !important;
            }
            .usat-toast {
                position: relative !important;
                overflow: hidden !important;
                pointer-events: auto !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 6px !important;
                padding: 11px 14px !important;
                border-radius: 8px !important;
                box-shadow: 0 6px 18px rgba(15, 23, 42, 0.16) !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
                font-size: 12.5px !important;
                font-weight: 500 !important;
                line-height: 1.35 !important;
                animation: usatToastIn 0.25s ease-out forwards !important;
                border-left: 4px solid #0284c7 !important;
                background: #f0f9ff !important;
                color: #0c4a6e !important;
            }
            .usat-toast-main {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 10px !important;
            }
            .usat-toast-footer {
                display: flex !important;
                justify-content: flex-end !important;
                border-top: 1px solid rgba(0, 0, 0, 0.08) !important;
                padding-top: 5px !important;
            }
            .usat-toast-link {
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                color: inherit !important;
                font-size: 11px !important;
                font-weight: 500 !important;
                text-decoration: underline !important;
                opacity: 0.8 !important;
                cursor: pointer !important;
                transition: opacity 0.15s !important;
            }
            .usat-toast-link:hover { opacity: 1 !important; }
            .usat-toast.success { border-left-color: #10b981 !important; background: #ecfdf5 !important; color: #064e3b !important; }
            .usat-toast.warning { border-left-color: #d97706 !important; background: #fffbeb !important; color: #78350f !important; }
            .usat-toast.error   { border-left-color: #dc2626 !important; background: #fef2f2 !important; color: #dc2626!important; }
            .usat-toast-content {
                display: flex !important;
                align-items: flex-start !important;
                gap: 9px !important;
                flex: 1 !important;
                min-width: 0 !important;
            }
            .usat-toast-content svg {
                width: 18px !important;
                height: 18px !important;
                min-width: 18px !important;
                max-width: 18px !important;
                margin-top: 1px !important;
                flex-shrink: 0 !important;
                display: block !important;
            }
            .usat-toast-actions {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                flex-shrink: 0 !important;
                position: static !important;
            }
            .usat-toast-btn {
                border: 1px solid currentColor !important;
                background: rgba(255, 255, 255, 0.7) !important;
                color: inherit !important;
                border-radius: 5px !important;
                padding: 4px 8px !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                white-space: nowrap !important;
                cursor: pointer !important;
                transition: opacity 0.15s !important;
            }
            .usat-toast-btn:hover { opacity: 0.8 !important; }
            .usat-toast-bar {
                position: absolute !important;
                left: 0 !important;
                bottom: 0 !important;
                height: 3px !important;
                background: currentColor !important;
                opacity: 0.45 !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function toast({ mensaje, tipo = 'info', duracion = 4500, botonTexto = '', alHacerClic = null, linkSecundario = '', alHacerSecundario = null }) {
        asegurarEstilosCore();
        let container = document.getElementById('usat-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'usat-toast-container';
            document.body.appendChild(container);
        }

        const icono = tipo === 'success' ? ICONOS.check
            : tipo === 'warning' || tipo === 'error' ? ICONOS.alerta
            : ICONOS.reloj;

        const el = document.createElement('div');
        el.className = `usat-toast ${tipo}`;

        const cerrar = () => {
            if (!el.isConnected) return;
            el.style.animation = 'usatToastOut 0.25s ease forwards';
            setTimeout(() => el.remove(), 260);
        };

        const mainRow = document.createElement('div');
        mainRow.className = 'usat-toast-main';

        const content = document.createElement('div');
        content.className = 'usat-toast-content';
        content.innerHTML = `${icono}<span>${escapeHtml(mensaje)}</span>`;
        mainRow.appendChild(content);

        if (botonTexto && typeof alHacerClic === 'function') {
            const actions = document.createElement('div');
            actions.className = 'usat-toast-actions';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'usat-toast-btn';
            btn.textContent = botonTexto;
            btn.addEventListener('click', () => { alHacerClic(); cerrar(); });
            actions.appendChild(btn);
            mainRow.appendChild(actions);
        }
        el.appendChild(mainRow);

        if (linkSecundario && typeof alHacerSecundario === 'function') {
            const footer = document.createElement('div');
            footer.className = 'usat-toast-footer';
            const link = document.createElement('button');
            link.type = 'button';
            link.className = 'usat-toast-link';
            link.textContent = linkSecundario;
            link.addEventListener('click', () => { alHacerSecundario(); cerrar(); });
            footer.appendChild(link);
            el.appendChild(footer);
        }

        if (duracion > 0) {
            const bar = document.createElement('div');
            bar.className = 'usat-toast-bar';
            bar.style.animation = `usatToastBar ${duracion}ms linear forwards`;
            el.appendChild(bar);
            setTimeout(cerrar, duracion);
        }

        container.appendChild(el);
        return { cerrar, elemento: el };
    }

    // Cargador bajo demanda de librerías pesadas desde GitHub Pages (libs/)
    const promesasLibs = new Map();

    function cargarScriptConBypassAMD(url) {
        return new Promise((resolve, reject) => {
            const defOriginal = window.define;
            const restaurar = () => { if (window.define !== defOriginal) window.define = defOriginal; };
            try { window.define = undefined; } catch (e) {}

            const s = document.createElement('script');
            s.src = url;
            s.async = true;
            s.onload = () => { restaurar(); resolve(); };
            s.onerror = () => { restaurar(); s.remove(); reject(new Error(`No se pudo cargar ${url}`)); };
            (document.head || document.documentElement).appendChild(s);
        });
    }

    async function cargarLibreria(nombre) {
        const baseSeguro = 'https://jordanjv1844.github.io/usat-plus/libs/';

        if (nombre === 'pdfjs') {
            if (typeof window.pdfjsLib !== 'undefined') return window.pdfjsLib;
            if (!promesasLibs.has('pdfjs')) {
                promesasLibs.set('pdfjs', (async () => {
                    let usoCdn = false;
                    try {
                        await cargarScriptConBypassAMD(`${baseSeguro}pdf.min.js`);
                    } catch (e) {
                        usoCdn = true;
                        await cargarScriptConBypassAMD('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js');
                    }
                    if (typeof window.pdfjsLib === 'undefined') throw new Error('pdfjsLib no inicializó.');
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = usoCdn
                        ? 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
                        : `${baseSeguro}pdf.worker.min.js`;
                    return window.pdfjsLib;
                })().catch(err => { promesasLibs.delete('pdfjs'); throw err; }));
            }
            return promesasLibs.get('pdfjs');
        }

        if (nombre === 'html2pdf') {
            if (typeof window.html2pdf !== 'undefined') return window.html2pdf;
            if (!promesasLibs.has('html2pdf')) {
                promesasLibs.set('html2pdf', (async () => {
                    try {
                        await cargarScriptConBypassAMD(`${baseSeguro}html2pdf.bundle.min.js`);
                    } catch (e) {
                        await cargarScriptConBypassAMD('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
                    }
                    if (typeof window.html2pdf === 'undefined') throw new Error('html2pdf no inicializó.');
                    return window.html2pdf;
                })().catch(err => { promesasLibs.delete('html2pdf'); throw err; }));
            }
            return promesasLibs.get('html2pdf');
        }

        throw new Error(`Librería desconocida: ${nombre}`);
    }

    // Guardián de sesión anti-timeout (solo en ventana principal)
    function iniciarGuardianSesion() {
        if (window.self !== window.top) return;
        if (!window.location.href.includes('usat.edu.pe')) return;

        const INTERVALO_MS = 20 * 60 * 1000;
        const endpoint = window.location.href.includes('aulavirtual')
            ? 'https://intranet.usat.edu.pe/aulavirtual/my/'
            : 'https://intranet.usat.edu.pe/campusestudiante/Main.aspx';

        setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            fetch(endpoint, { credentials: 'same-origin', cache: 'no-store' }).catch(() => {});
        }, INTERVALO_MS);
    }

    window.USAT_CORE = {
        ICONOS,
        escapeHtml,
        debounce,
        toast,
        cargarLibreria
    };
    window.ICONOS_USAT = ICONOS;

    iniciarGuardianSesion();
})();