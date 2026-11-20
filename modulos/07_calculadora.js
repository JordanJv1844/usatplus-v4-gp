// =========================================
// USAT+ v4 - MÓDULO 07: CALCULADORA DE NOTAS V2
// =========================================
(() => {
    const CORE = window.USAT_CORE;
    const ENV = window.USAT_ENV;
    if (!CORE || !ENV) return;
    if (!window.location.href.toLowerCase().includes('calificadorestudiante.aspx')) return;

    let isSimulating = false;
    let originalTreeHTML = '';

    // Muestra los toasts en la ventana principal (Main.aspx) para que siempre sean visibles
    const mostrarToast = (opts) => {
        try {
            if (window.top && window.top.USAT_CORE && typeof window.top.USAT_CORE.toast === 'function') {
                return window.top.USAT_CORE.toast(opts);
            }
        } catch (e) {}
        return CORE.toast(opts);
    };

    function ajustarAlturaFramePadre(extra = 120) {
        try {
            if (window.frameElement) {
                window.frameElement.style.height = `${document.body.scrollHeight + extra}px`;
            }
        } catch (e) {}
    }

    function obtenerIdCurso() {
        const selects = document.querySelectorAll('select');
        let cursoSelect = document.getElementById('ddlCurso');
        if (!cursoSelect) {
            selects.forEach(sel => {
                if ((sel.id || '').toLowerCase().includes('curso') || (sel.name || '').toLowerCase().includes('curso')) {
                    cursoSelect = sel;
                }
            });
        }
        if (!cursoSelect && selects.length >= 2) cursoSelect = selects[1];

        if (cursoSelect && cursoSelect.options.length > 0 && cursoSelect.selectedIndex >= 0) {
            const texto = cursoSelect.options[cursoSelect.selectedIndex].text;
            return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
        }
        return 'general';
    }

    function asegurarEstilos() {
        if (document.getElementById('sim-styles')) return;
        const style = document.createElement('style');
        style.id = 'sim-styles';
        style.textContent = `
            .btn-simulador {
                width: 100%; margin-bottom: 6px; padding: 10px;
                background-color: #1e293b; color: #ffffff; border: none; border-radius: 7px;
                font-weight: 700; cursor: pointer; font-size: 13.5px;
                transition: background-color 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            }
            .btn-simulador:hover { background-color: #0f172a; }
            .btn-simulador.activo { background-color: #475569; }
            .btn-silabo {
                width: 100%; margin-bottom: 14px; padding: 8px;
                background-color: #059669; color: #ffffff; border: none; border-radius: 7px;
                font-weight: 700; cursor: pointer; font-size: 13px;
                display: none; align-items: center; justify-content: center; gap: 8px;
                transition: background-color 0.15s;
            }
            .btn-silabo:hover { background-color: #047857; }
            .btn-simulador svg, .btn-silabo svg { width: 16px !important; height: 16px !important; min-width: 16px !important; flex-shrink: 0 !important; }
            #tree.simulador-activo svg { width: 14px !important; height: 14px !important; min-width: 14px !important; flex-shrink: 0 !important; }

            #tree i.fa, #tree .icon, #tree img.activityicon { display: none !important; }
            #tree.simulador-activo li.list-group-item {
                border-left: 4px solid transparent !important;
                display: flex !important; align-items: center !important; justify-content: space-between !important;
            }

            #tree.simulador-activo .fila-ra {
                background-color: #fef2f2 !important; border-left-color: #dc2626 !important;
                border-bottom: 2px solid #fecaca !important; padding-left: 15px !important;
            }
            #tree.simulador-activo .texto-ra {
                font-weight: 700 !important; font-size: 12.5px !important; color: #dc2626!important;
                display: flex; align-items: center; gap: 8px; flex: 1; padding-right: 12px;
            }
            #tree.simulador-activo .badge-ra {
                background-color: #334155 !important; color: #ffffff !important; border: 1px solid #1e293b !important;
            }
            #tree.simulador-activo .badge-ra .sim-input {
                background-color: #475569 !important; color: #ffffff !important; border-color: transparent !important;
            }

            #tree.simulador-activo .fila-indicador {
                background-color: #f8fafc !important; padding-left: 30px !important;
                position: relative; border-bottom: 1px solid #e2e8f0 !important;
            }
            #tree.simulador-activo .fila-indicador::before { content: ""; position: absolute; left: 14px; top: 0; bottom: 50%; width: 1px; border-left: 2px solid #cbd5e1; }
            #tree.simulador-activo .fila-indicador::after  { content: ""; position: absolute; left: 14px; top: 50%; width: 10px; border-top: 2px solid #cbd5e1; }
            #tree.simulador-activo .texto-indicador {
                font-weight: 700 !important; font-size: 12px !important; color: #334155 !important;
                display: flex; align-items: center; gap: 8px; flex: 1; padding-right: 12px;
            }
            #tree.simulador-activo .badge-indicador {
                background-color: #e2e8f0 !important; color: #1e293b !important; border: 1px solid #cbd5e1 !important;
            }

            #tree.simulador-activo .fila-evaluacion {
                background-color: #ffffff !important; padding-left: 45px !important;
                position: relative; border-bottom: 1px dashed #e2e8f0 !important;
            }
            #tree.simulador-activo .fila-evaluacion::before { content: ""; position: absolute; left: 28px; top: 0; bottom: 50%; width: 1px; border-left: 2px solid #cbd5e1; }
            #tree.simulador-activo .fila-evaluacion::after  { content: ""; position: absolute; left: 28px; top: 50%; width: 10px; border-top: 2px solid #cbd5e1; }
            #tree.simulador-activo .texto-evaluacion {
                font-weight: 500 !important; font-size: 11.5px !important; color: #475569 !important;
                display: flex; align-items: center; gap: 8px; flex: 1; padding-right: 12px;
            }
            #tree.simulador-activo .badge-evaluacion {
                background-color: #f1f5f9 !important; color: #1e293b !important; border: 1px solid #cbd5e1 !important;
            }

            #tree.simulador-activo .sim-input {
                width: 60px; text-align: center; color: #0f172a; border: 1px solid #cbd5e1;
                border-radius: 4px; padding: 2px 4px; font-size: 12.5px; font-weight: 700; outline: none; box-sizing: border-box;
            }
            #tree.simulador-activo .sim-weight {
                width: 48px; text-align: center; color: #0f172a; border: 1px dashed #94a3b8;
                border-radius: 4px; padding: 2px 4px; font-size: 11.5px; font-weight: 600; outline: none;
                background-color: #ffffff; margin-right: 4px; box-sizing: border-box;
            }
            #tree.simulador-activo .sim-input:focus, #tree.simulador-activo .sim-weight:focus {
                border-color: #dc2626; box-shadow: 0 0 0 2px rgba(153, 27, 27, 0.16);
            }
            #tree.simulador-activo .badge {
                display: flex !important; align-items: center; gap: 4px; padding: 5px 8px !important;
                border-radius: 6px !important; font-size: 11px !important; font-weight: 600 !important;
                white-space: nowrap; flex-shrink: 0;
            }
            #tree.simulador-activo .unverified {
                background-color: #fee2e2 !important; border-color: #dc2626 !important; color: #dc2626 !important;
            }
            #tree.simulador-activo .sim-readonly {
                background-color: #e2e8f0 !important; color: #475569 !important; border-color: transparent !important;
            }
            #tree.simulador-activo .sim-peso-alerta {
                margin-left: 6px; padding: 1px 6px; border-radius: 4px;
                background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;
                font-size: 10px; font-weight: 700; display: none;
            }
            #tree.simulador-activo #sim-final-grade { font-size: 16px; font-weight: 900; color: #ffffff; }
            html, body { overflow-y: auto !important; padding-bottom: 120px !important; }
            .table-responsive { margin-bottom: 60px !important; overflow: visible !important; }
        `;
        document.head.appendChild(style);
    }

    function protegerInput(input) {
        ['click', 'mousedown', 'mouseup', 'keydown', 'focus'].forEach(ev => {
            input.addEventListener(ev, (e) => e.stopPropagation());
        });
    }

    function procesarPDFSilabo(texto) {
        const cleanText = texto.replace(/\s+/g, '').toUpperCase();
        const raRegex = /RA(\d)=((?:IND\d+\([\d.,]+\)\+?)+)/ig;
        const indWeights = {};
        let raMatches;
        let foundAny = false;

        while ((raMatches = raRegex.exec(cleanText)) !== null) {
            foundAny = true;
            const raIndex = parseInt(raMatches[1], 10);
            const indString = raMatches[2];
            const weights = [];
            const indRegex = /IND\d+\(([\d.,]+)\)/ig;
            let indMatch;
            while ((indMatch = indRegex.exec(indString)) !== null) {
                weights.push(parseFloat(indMatch[1].replace(',', '.')) * 100);
            }
            indWeights[raIndex] = weights;
        }

        if (!foundAny) {
            for (let i = 1; i <= 6; i++) {
                const laxRegex = new RegExp(`RA${i}[^A-Z]*=(.*?)(?:RA${i + 1}|NF|$)`, 'i');
                const match = cleanText.match(laxRegex);
                if (match) {
                    const weights = [];
                    const laxIndRegex = /IND\d+[^\d]+([\d.,]+)/ig;
                    let indMatch;
                    while ((indMatch = laxIndRegex.exec(match[1])) !== null) {
                        weights.push(parseFloat(indMatch[1].replace(',', '.')) * 100);
                    }
                    if (weights.length > 0) {
                        indWeights[i] = weights;
                        foundAny = true;
                    }
                }
            }
        }

        if (!foundAny) {
            mostrarToast({
                mensaje: 'No se detectaron fórmulas (RA / IND) en este sílabo. Ingresa los pesos manualmente.',
                tipo: 'warning',
                duracion: 6000
            });
            return false;
        }

        let uIdx = 0;
        let globalIndCounter = 1;

        while (uIdx < 6) {
            let iIdx = 0;
            while (true) {
                const indInput = document.querySelector(`.sim-weight[data-id="w-i-${uIdx}-${iIdx}"]`);
                if (!indInput) break;

                if (indWeights[uIdx + 1] && indWeights[uIdx + 1][iIdx] !== undefined) {
                    indInput.value = Number(indWeights[uIdx + 1][iIdx].toFixed(2));
                }

                const evals = [];
                let eIdx = 0;
                while (true) {
                    const evalInp = document.querySelector(`.sim-weight[data-id="w-e-${uIdx}-${iIdx}-${eIdx}"]`);
                    if (!evalInp) break;
                    evals.push(evalInp);
                    eIdx++;
                }

                if (evals.length === 1) {
                    evals[0].value = 100;
                    evals[0].classList.remove('unverified');
                } else if (evals.length > 1) {
                    const startIndex = cleanText.indexOf(`IND${globalIndCounter}`);
                    let endIndex = cleanText.indexOf(`IND${globalIndCounter + 1}`);
                    if (endIndex === -1) endIndex = cleanText.indexOf(`RA${uIdx + 2}`);
                    if (endIndex === -1) endIndex = cleanText.length;

                    let success = false;
                    if (startIndex !== -1) {
                        const block = cleanText.substring(startIndex, endIndex);
                        // Excluye 100% porque con 2+ evaluaciones ningún ítem individual vale 100% (evita leer filas "Total: 100%")
                        const evalRegex = /(?<!\d)(?:[1-9]\d(?:[.,]\d{1,2})?|5)(?=%|\.00(?!\d))/g;
                        const matches = block.match(evalRegex);

                        if (matches && matches.length >= evals.length) {
                            const nums = matches.map(m => parseFloat(m.replace(',', '.')));
                            // Prioriza el grupo consecutivo de pesos que sume 100%
                            let elegidos = null;
                            for (let s = 0; s <= nums.length - evals.length; s++) {
                                const slice = nums.slice(s, s + evals.length);
                                const suma = slice.reduce((a, b) => a + b, 0);
                                if (Math.abs(suma - 100) <= 0.5) {
                                    elegidos = slice;
                                    break;
                                }
                            }
                            const finales = elegidos || nums.slice(0, evals.length);
                            for (let k = 0; k < evals.length; k++) {
                                evals[k].value = finales[k];
                                evals[k].classList.toggle('unverified', !elegidos);
                            }
                            success = true;
                        }
                    }

                    if (!success) {
                        evals.forEach(evInp => { if (!evInp.value) evInp.classList.add('unverified'); });
                    }
                }

                iIdx++;
                globalIndCounter++;
            }
            uIdx++;
        }

        const firstInput = document.querySelector('.sim-weight');
        if (firstInput) firstInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }

    function recalcularTodo(units, finalGradeElement) {
        let finalGrade = 0;

        units.forEach((u) => {
            let unitSum = 0;
            let unitWeightSum = 0;
            let unitEvalsCount = 0;
            let unitHasWeights = false;

            u.indicators.forEach((ind) => {
                let indSum = 0;
                let indWeightSum = 0;
                let indEvalsCount = 0;
                let indHasWeights = false;

                ind.evaluations.forEach((ev) => {
                    const noteText = ev.noteInput.value.trim();
                    const note = noteText === '' ? 0 : parseFloat(noteText);
                    const weight = parseFloat(ev.weightInput.value);

                    if (!Number.isNaN(note)) {
                        if (!Number.isNaN(weight) && weight > 0) {
                            indSum += note * (weight / 100);
                            indWeightSum += weight;
                            indHasWeights = true;
                        } else {
                            indSum += note;
                        }
                        indEvalsCount++;
                    }
                });

                if (ind.warnEl) {
                    if (indHasWeights && Math.abs(indWeightSum - 100) > 0.1) {
                        ind.warnEl.textContent = `Pesos: ${Number(indWeightSum.toFixed(1))}%`;
                        ind.warnEl.style.display = 'inline-block';
                    } else {
                        ind.warnEl.style.display = 'none';
                    }
                }

                let indFinalAvg = 0;
                if (indWeightSum > 0) indFinalAvg = indSum / (indWeightSum / 100);
                else if (indEvalsCount > 0) indFinalAvg = indSum / indEvalsCount;

                if (ind.avgInput) ind.avgInput.value = Number.isNaN(indFinalAvg) ? '0.00' : indFinalAvg.toFixed(2);

                const indWeight = parseFloat(ind.weightInput ? ind.weightInput.value : NaN);
                if (!Number.isNaN(indFinalAvg)) {
                    if (!Number.isNaN(indWeight) && indWeight > 0) {
                        unitSum += indFinalAvg * (indWeight / 100);
                        unitWeightSum += indWeight;
                        unitHasWeights = true;
                    } else {
                        unitSum += indFinalAvg;
                    }
                    unitEvalsCount++;
                }
            });

            if (u.warnEl) {
                if (unitHasWeights && Math.abs(unitWeightSum - 100) > 0.1) {
                    u.warnEl.textContent = `Ind: ${Number(unitWeightSum.toFixed(1))}%`;
                    u.warnEl.style.display = 'inline-block';
                } else {
                    u.warnEl.style.display = 'none';
                }
            }

            let unitFinalAvg = 0;
            if (unitWeightSum > 0) unitFinalAvg = unitSum / (unitWeightSum / 100);
            else if (unitEvalsCount > 0) unitFinalAvg = unitSum / unitEvalsCount;

            if (u.unitAvgInput) u.unitAvgInput.value = Number.isNaN(unitFinalAvg) ? '0.00' : unitFinalAvg.toFixed(2);

            if (!Number.isNaN(unitFinalAvg) && u.weight > 0) {
                finalGrade += unitFinalAvg * u.weight;
            }
        });

        if (finalGradeElement) {
            finalGradeElement.textContent = finalGrade.toFixed(2);
            finalGradeElement.parentElement.style.backgroundColor = finalGrade >= 13.5 ? '#059669' : '#dc2626';
        }
    }

    function guardarNotasEnMemoria(storageKey) {
        const inputs = document.querySelectorAll('.sim-input:not(:disabled), .sim-weight');
        const data = {};
        inputs.forEach((inp) => {
            if (inp.dataset.id) data[inp.dataset.id] = inp.value;
        });
        ENV.setSettings({ [storageKey]: data });
    }

    function transformarACalculadora(tree) {
        const items = tree.querySelectorAll('li.list-group-item');
        const allUnits = [];
        let finalGradeElement = null;

        const storageKey = `usat_notas_v2_${obtenerIdCurso()}`;
        let currentUnit = null;
        let currentIndicator = null;
        let uIdx = 0;
        let iIdx = 0;
        let eIdx = 0;

        items.forEach((li) => {
            const badge = li.querySelector('.badge');
            const textContent = li.textContent.trim();

            const nombreFila = Array.from(li.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join(' ');
            const nombreSeguro = CORE.escapeHtml(nombreFila);

            if (textContent.includes('PROMEDIO') && textContent.includes('FINAL')) {
                if (badge) {
                    badge.innerHTML = `<span id="sim-final-grade">00.00</span>`;
                    finalGradeElement = badge.querySelector('#sim-final-grade');
                }
                return;
            }

            if (li.querySelector('b') && li.querySelector('b').textContent.includes('UNIDAD')) {
                currentUnit = { weight: 0, unitAvgInput: null, warnEl: null, indicators: [] };
                allUnits.push(currentUnit);
                currentIndicator = null;
                uIdx++;
                iIdx = 0;
                return;
            }

            if (badge && textContent.includes('Peso:')) {
                if (!currentUnit) {
                    currentUnit = { weight: 0, unitAvgInput: null, warnEl: null, indicators: [] };
                    allUnits.push(currentUnit);
                    uIdx++;
                }
                const weightMatch = textContent.match(/Peso:\s*([\d.]+)%/);
                currentUnit.weight = weightMatch ? parseFloat(weightMatch[1]) / 100 : 0;

                li.classList.add('fila-ra');
                li.innerHTML = `<span class="texto-ra">${CORE.ICONOS.tareas}<span>${nombreSeguro}</span><span class="sim-peso-alerta"></span></span>`;
                currentUnit.warnEl = li.querySelector('.sim-peso-alerta');

                const newBadge = document.createElement('span');
                newBadge.className = 'badge badge-ra';
                newBadge.innerHTML = `Peso: ${(currentUnit.weight * 100).toFixed(0)}% | <input type="number" class="sim-input sim-readonly" disabled title="Promedio automático del RA">`;
                li.appendChild(newBadge);
                currentUnit.unitAvgInput = newBadge.querySelector('input');
                return;
            }

            if (!badge) {
                if (!nombreFila) return;
                li.classList.add('fila-indicador');
                li.innerHTML = `<span class="texto-indicador">${CORE.ICONOS.llave}<span>${nombreSeguro}</span><span class="sim-peso-alerta"></span></span>`;

                const newBadge = document.createElement('span');
                newBadge.className = 'badge badge-indicador';
                newBadge.innerHTML = `Peso: <input type="number" class="sim-weight" data-id="w-i-${uIdx - 1}-${iIdx}" placeholder="%" title="Peso del indicador"> % | <input type="number" class="sim-input sim-readonly" disabled title="Promedio automático">`;
                li.appendChild(newBadge);

                currentIndicator = {
                    weightInput: newBadge.querySelector('.sim-weight'),
                    avgInput: newBadge.querySelector('.sim-input'),
                    warnEl: li.querySelector('.sim-peso-alerta'),
                    evaluations: []
                };
                if (currentUnit) currentUnit.indicators.push(currentIndicator);
                iIdx++;
                eIdx = 0;
                return;
            }

            if (badge && !textContent.includes('Peso:')) {
                li.classList.add('fila-evaluacion');
                li.innerHTML = `<span class="texto-evaluacion">${CORE.ICONOS.documento}<span>${nombreSeguro}</span></span>`;

                const textoNota = badge.textContent.trim();
                const val = textoNota.includes('Pendiente') ? '' : (textoNota.match(/[\d.]+/)?.[0] || '');

                const newBadge = document.createElement('span');
                newBadge.className = 'badge badge-evaluacion';
                newBadge.innerHTML = `Vale: <input type="number" class="sim-weight" data-id="w-e-${uIdx - 1}-${iIdx > 0 ? iIdx - 1 : 0}-${eIdx}" placeholder="%"> % | Nota: <input type="number" class="sim-input" data-real-val="${val}" data-id="n-e-${uIdx - 1}-${iIdx > 0 ? iIdx - 1 : 0}-${eIdx}" value="${val}" step="0.1" min="0" max="20" placeholder="-">`;
                li.appendChild(newBadge);

                if (!currentIndicator) {
                    currentIndicator = { weightInput: null, avgInput: null, warnEl: null, evaluations: [] };
                    if (currentUnit) currentUnit.indicators.push(currentIndicator);
                }
                currentIndicator.evaluations.push({
                    weightInput: newBadge.querySelector('.sim-weight'),
                    noteInput: newBadge.querySelector('.sim-input')
                });
                eIdx++;
            }
        });

        const inputs = document.querySelectorAll('.sim-input:not(:disabled), .sim-weight');
        inputs.forEach((inp) => {
            protegerInput(inp);
            inp.addEventListener('input', function () {
                this.classList.remove('unverified');
                recalcularTodo(allUnits, finalGradeElement);
                guardarNotasEnMemoria(storageKey);
            });
        });

        const saved = ENV.getSetting(storageKey, null);
        if (saved && typeof saved === 'object') {
            inputs.forEach((inp) => {
                const savedVal = saved[inp.dataset.id];
                if (savedVal === undefined) return;
                const isNoteInput = inp.classList.contains('sim-input') && !inp.hasAttribute('disabled');
                const realVal = inp.getAttribute('data-real-val') || '';
                inp.value = (isNoteInput && realVal !== '') ? realVal : savedVal;
                inp.classList.remove('unverified');
            });
        }

        recalcularTodo(allUnits, finalGradeElement);
    }

    function montarCalculadoraSiAplica() {
        const tree = document.getElementById('tree');
        if (!tree || tree.querySelectorAll('li').length === 0) return;

        const ddlCurso = document.getElementById('ddlCurso');
        if (ddlCurso && ddlCurso.selectedIndex <= 0) return;

        const container = document.querySelector('.table-responsive') || tree.parentElement;
        if (!container || container.querySelector('.btn-simulador')) return;

        isSimulating = false;
        originalTreeHTML = '';
        asegurarEstilos();

        const btnToggle = document.createElement('button');
        btnToggle.type = 'button';
        btnToggle.className = 'btn-simulador';
        btnToggle.innerHTML = `${CORE.ICONOS.calculadora}<span>Activar Calculadora de Notas</span>`;

        const btnSilabo = document.createElement('button');
        btnSilabo.type = 'button';
        btnSilabo.className = 'btn-silabo';
        btnSilabo.innerHTML = `${CORE.ICONOS.documento}<span>Autocompletar pesos con Sílabo (PDF)</span>`;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'application/pdf';
        fileInput.style.display = 'none';

        container.insertBefore(btnSilabo, container.firstChild);
        container.insertBefore(fileInput, container.firstChild);
        container.insertBefore(btnToggle, container.firstChild);

        btnToggle.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isSimulating) {
                originalTreeHTML = tree.innerHTML;
                tree.classList.add('simulador-activo');
                btnToggle.innerHTML = `${CORE.ICONOS.cerrar}<span>Desactivar Calculadora</span>`;
                btnToggle.classList.add('activo');
                btnSilabo.style.display = 'inline-flex';
                isSimulating = true;

                if (!localStorage.getItem('usat_pro_hideCalcWarning')) {
                    mostrarToast({
                        mensaje: 'Te recomendamos comparar los pesos con tu sílabo. El lector automático podría equivocarse al tomar los valores.',
                        tipo: 'warning',
                        duracion: 8000,
                        linkSecundario: 'No volver a mostrar',
                        alHacerSecundario: () => localStorage.setItem('usat_pro_hideCalcWarning', 'true')
                    });
                }

                transformarACalculadora(tree);
                setTimeout(() => ajustarAlturaFramePadre(220), 100);
            } else {
                tree.innerHTML = originalTreeHTML;
                tree.classList.remove('simulador-activo');
                btnToggle.innerHTML = `${CORE.ICONOS.calculadora}<span>Activar Calculadora de Notas</span>`;
                btnToggle.classList.remove('activo');
                btnSilabo.style.display = 'none';
                isSimulating = false;
                setTimeout(() => ajustarAlturaFramePadre(60), 100);
            }
        });

        btnSilabo.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });

        fileInput.addEventListener('change', function () {
            if (this.files.length === 0) return;
            const file = this.files[0];
            this.value = '';
            btnSilabo.disabled = true;
            btnSilabo.innerHTML = `${CORE.ICONOS.spinner}<span>Cargando lector y analizando sílabo...</span>`;

            const reader = new FileReader();
            reader.onload = async function () {
                try {
                    const pdfjsLib = await CORE.cargarLibreria('pdfjs');
                    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(this.result) }).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const tc = await page.getTextContent();
                        fullText += tc.items.map(it => it.str).join(' ') + ' ';
                    }

                    if (fullText.trim().length < 30) {
                        mostrarToast({
                            mensaje: 'Este sílabo parece estar escaneado (solo imágenes sin texto seleccionable). Ingresa los pesos manualmente.',
                            tipo: 'warning',
                            duracion: 7000
                        });
                        btnSilabo.innerHTML = `${CORE.ICONOS.alerta}<span>PDF sin texto seleccionable</span>`;
                        return;
                    }

                    const ok = procesarPDFSilabo(fullText);
                    if (ok) {
                        btnSilabo.innerHTML = `${CORE.ICONOS.check}<span>Pesos extraídos y guardados</span>`;
                        mostrarToast({ mensaje: 'Pesos del sílabo aplicados correctamente.', tipo: 'success' });
                    } else {
                        btnSilabo.innerHTML = `${CORE.ICONOS.documento}<span>Autocompletar pesos con Sílabo (PDF)</span>`;
                    }
                } catch (err) {
                    mostrarToast({ mensaje: `Error al leer el PDF: ${err.message}`, tipo: 'error', duracion: 6000 });
                    btnSilabo.innerHTML = `${CORE.ICONOS.cerrar}<span>Error al leer PDF</span>`;
                } finally {
                    btnSilabo.disabled = false;
                    setTimeout(() => {
                        btnSilabo.innerHTML = `${CORE.ICONOS.documento}<span>Autocompletar pesos con Sílabo (PDF)</span>`;
                    }, 3500);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    montarCalculadoraSiAplica();
    const obs = new MutationObserver(CORE.debounce(montarCalculadoraSiAplica, 220));
    obs.observe(document.body, { childList: true, subtree: true });
})();