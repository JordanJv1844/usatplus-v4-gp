// =========================================
// USAT+ v4 - MÓDULO 02: BLOQUEADOR DE ANUNCIOS INTELIGENTE
// =========================================
(() => {
    const ENV = window.USAT_ENV;
    const CORE = window.USAT_CORE;
    if (!ENV || !CORE) return;
    if (!ENV.getSetting('adBlockerEnabled', true)) return;

    const STORAGE_KEY = 'usat_registro_anuncios';
    const LIMITE_HORAS = 3;
    const DIAS_RETENCION = 30;

    function asegurarEstilos() {
        if (document.getElementById('usat-adblocker-css')) return;
        const style = document.createElement('style');
        style.id = 'usat-adblocker-css';
        style.textContent = `
            body:not(.modal-open) {
                padding-right: 0 !important;
                overflow-y: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    function limpiarRegistroAntiguo(registro, ahora) {
        const limiteMs = DIAS_RETENCION * 24 * 60 * 60 * 1000;
        const limpio = {};
        for (const [k, ts] of Object.entries(registro)) {
            if (typeof ts === 'number' && (ahora - ts) < limiteMs) {
                limpio[k] = ts;
            }
        }
        return limpio;
    }

    function initAdBlocker() {
        const contenedor = document.getElementById('id_anuncios_modal');
        if (!contenedor) return;

        const modales = Array.from(contenedor.querySelectorAll('.div_anuncio_modal'));
        if (modales.length === 0) return;

        asegurarEstilos();

        const ahora = Date.now();
        let registro = {};
        try {
            registro = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            registro = {};
        }
        registro = limpiarRegistroAntiguo(registro, ahora);

        const actualizarBackdrop = () => {
            const hayVisibles = modales.some(m => m.style.display !== 'none');
            let backdrop = document.querySelector('.modal-backdrop');

            if (hayVisibles) {
                contenedor.style.display = 'block';
                document.body.classList.add('modal-open');
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade in';
                    document.body.appendChild(backdrop);
                } else {
                    backdrop.style.display = 'block';
                }
            } else {
                contenedor.style.display = 'none';
                document.body.classList.remove('modal-open');
                document.body.style.paddingRight = '';
                document.body.style.overflow = '';
                if (backdrop) backdrop.style.display = 'none';
            }
        };

        const cerrarModalManual = (modal) => {
            modal.style.display = 'none';
            modal.classList.remove('in');
            actualizarBackdrop();
        };

        // Garantizar limpieza de backdrop al cerrar cualquier modal desde su botón nativo
        modales.forEach((modal) => {
            if (modal.dataset.usatHooked) return;
            modal.dataset.usatHooked = '1';
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('.close, [data-dismiss="modal"], .btn-cerrar')) {
                    setTimeout(() => cerrarModalManual(modal), 30);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const abierto = modales.find(m => m.style.display !== 'none');
            if (abierto) cerrarModalManual(abierto);
        });

        const bloqueados = [];
        let horasRestantesVisible = null;

        modales.forEach((modal, index) => {
            const tituloEl = modal.querySelector('.modal-title');
            const titulo = tituloEl ? tituloEl.textContent.trim() : `Anuncio_${index}`;

            if (!registro[titulo]) registro[titulo] = ahora;

            const horasTranscurridas = (ahora - registro[titulo]) / (1000 * 60 * 60);
            const esElMasNuevo = index === modales.length - 1;
            const dentroDeTiempo = horasTranscurridas <= LIMITE_HORAS;

            if (esElMasNuevo && dentroDeTiempo) {
                modal.style.display = 'block';
                modal.classList.add('in');
                horasRestantesVisible = Math.max(1, Math.ceil(LIMITE_HORAS - horasTranscurridas));
            } else {
                modal.style.display = 'none';
                modal.classList.remove('in');
                bloqueados.push({ modal, titulo });
            }
        });

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(registro));
        } catch (e) {}

        actualizarBackdrop();

        if (horasRestantesVisible !== null) {
            setTimeout(() => {
                CORE.toast({
                    mensaje: `El anuncio visible se ocultará en ${horasRestantesVisible} hora(s).`,
                    tipo: 'success',
                    duracion: 4000
                });
            }, 350);
        }

        if (bloqueados.length > 0) {
            const texto = bloqueados.length === 1
                ? `Anuncio ocultado: "${bloqueados[0].titulo.slice(0, 34)}${bloqueados[0].titulo.length > 34 ? '...' : ''}"`
                : `${bloqueados.length} anuncios antiguos ocultados`;

            CORE.toast({
                mensaje: texto,
                tipo: 'info',
                duracion: 4500,
                botonTexto: 'VER',
                alHacerClic: () => {
                    bloqueados.forEach(({ modal }) => {
                        modal.style.display = 'block';
                        modal.classList.add('in');
                    });
                    actualizarBackdrop();
                }
            });
        }
    }

    initAdBlocker();
})();