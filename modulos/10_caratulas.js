// =========================================
// USAT+ v4 - MÓDULO 10: GENERADOR DE CARÁTULAS USAT
// =========================================
(() => {
    const ENV = window.USAT_ENV;
    const CORE = window.USAT_CORE;
    if (!ENV || !CORE) return;
    if (!window.location.href.includes('course/view.php')) return;

    const ASSETS_BASE = 'https://jordanjv1844.github.io/usat-plus/assets/caratula';
    const ASSETS = {
        escudoClasico: `${ASSETS_BASE}/escudo_clasico.png`,
        logoColor: `${ASSETS_BASE}/logo_usat_color.png`,
        franjas: `${ASSETS_BASE}/marco_franjas_b.png`
    };

    const imgCache = {};
    const imgInfoCache = {};
    let assetsPromise = null;
    let observerBoton = null;

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
        });
    }

    async function urlToDataURL(url) {
        try {
            const r = await fetch(url, { mode: 'cors', cache: 'force-cache' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return await blobToDataURL(await r.blob());
        } catch (e) {}
        return await new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const c = document.createElement('canvas');
                    c.width = img.naturalWidth;
                    c.height = img.naturalHeight;
                    c.getContext('2d').drawImage(img, 0, 0);
                    resolve(c.toDataURL('image/png'));
                } catch (err) { resolve(null); }
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }

    function infoImagen(dataUrl) {
        if (!dataUrl || dataUrl.indexOf('data:') !== 0) return null;
        let b;
        try {
            const bin = atob(dataUrl.split(',')[1]);
            b = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
        } catch (e) { return null; }
        if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) {
            const dv = new DataView(b.buffer);
            return { bytes: b, ext: 'png', w: dv.getUint32(16), h: dv.getUint32(20) };
        }
        if (b[0] === 0xFF && b[1] === 0xD8) {
            let i = 2;
            while (i < b.length - 9) {
                if (b[i] !== 0xFF) { i++; continue; }
                const m = b[i + 1];
                if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
                    return { bytes: b, ext: 'jpeg', h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
                }
                i += 2 + ((b[i + 2] << 8) | b[i + 3]);
            }
        }
        return null;
    }

    function cargarAssets() {
        if (!assetsPromise) {
            assetsPromise = Promise.all(Object.keys(ASSETS).map(async k => {
                const d = await urlToDataURL(ASSETS[k]);
                const info = infoImagen(d);
                if (d && info) { imgCache[k] = d; imgInfoCache[k] = info; }
            }));
        }
        return assetsPromise;
    }

    const srcImg = k => imgCache[k] || ASSETS[k];

    function atenuarImagen(dataUrl, alpha) {
        return new Promise(resolve => {
            if (!dataUrl) return resolve(null);
            const img = new Image();
            img.onload = () => {
                try {
                    const c = document.createElement('canvas');
                    c.width = img.naturalWidth;
                    c.height = img.naturalHeight;
                    const x = c.getContext('2d');
                    x.globalAlpha = alpha;
                    x.drawImage(img, 0, 0);
                    resolve(c.toDataURL('image/png'));
                } catch (e) { resolve(null); }
            };
            img.onerror = () => resolve(null);
            img.src = dataUrl;
        });
    }

    function descargarBlob(blob, nombre) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
    }

    const nombreArchivoSeguro = s => String(s || 'USAT').replace(/[\\/:*?"<>|]+/g, '').trim() || 'USAT';

    // ---------- ZIP + OpenXML DOCX ----------
    const CRC_TABLE = (() => {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[n] = c >>> 0;
        }
        return t;
    })();
    function crc32(b) {
        let c = 0xFFFFFFFF;
        for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    }
    function crearZip(archivos) {
        const enc = new TextEncoder();
        const u16 = n => [n & 255, (n >>> 8) & 255];
        const u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
        const partes = [], central = [];
        let offset = 0;
        for (const f of archivos) {
            const nombre = enc.encode(f.name);
            const crc = crc32(f.data), size = f.data.length;
            const local = new Uint8Array([0x50, 0x4B, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
                ...u32(crc), ...u32(size), ...u32(size), ...u16(nombre.length), ...u16(0)]);
            partes.push(local, nombre, f.data);
            central.push(new Uint8Array([0x50, 0x4B, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21),
                ...u32(crc), ...u32(size), ...u32(size), ...u16(nombre.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
                ...u32(0), ...u32(offset)]), nombre);
            offset += local.length + nombre.length + size;
        }
        const tamCentral = central.reduce((s, p) => s + p.length, 0);
        const fin = new Uint8Array([0x50, 0x4B, 5, 6, ...u16(0), ...u16(0), ...u16(archivos.length), ...u16(archivos.length),
            ...u32(tamCentral), ...u32(offset), ...u16(0)]);
        return new Blob([...partes, ...central, fin], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }

    const xmlEsc = s => String(s == null ? '' : s)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const tw = pt => Math.round(pt * 20);
    const emuCm = cm => Math.round(cm * 360000);

    function wRun(texto, o) {
        const f = o.font, sz = Math.round(o.size * 2);
        return `<w:r><w:rPr><w:rFonts w:ascii="${f}" w:hAnsi="${f}" w:eastAsia="${f}" w:cs="${f}"/>${o.bold ? '<w:b/><w:bCs/>' : ''}${o.caps ? '<w:caps/>' : ''}${o.color ? `<w:color w:val="${o.color}"/>` : ''}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${xmlEsc(texto)}</w:t></w:r>`;
    }
    const wSalto = '<w:r><w:br/></w:r>';
    function wPar(inner, before, line) {
        const sp = line
            ? `<w:spacing w:before="${tw(before)}" w:after="0" w:line="${tw(line)}" w:lineRule="exact"/>`
            : `<w:spacing w:before="${tw(before)}" w:after="0" w:line="240" w:lineRule="auto"/>`;
        return `<w:p><w:pPr>${sp}<w:jc w:val="center"/></w:pPr>${inner}</w:p>`;
    }
    function wGrafico(img, cx, cy) {
        return `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${img.id}" name="${img.name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${img.rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>`;
    }
    function wImagenInline(img, cx, cy) {
        return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${img.id}" name="${img.name}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>${wGrafico(img, cx, cy)}</wp:inline></w:drawing></w:r>`;
    }
    function wImagenFlotante(img, cx, cy, h, v, z, detras) {
        const pos = (eje, p) => `<wp:position${eje} relativeFrom="page">${p.align ? `<wp:align>${p.align}</wp:align>` : `<wp:posOffset>${p.off}</wp:posOffset>`}</wp:position${eje}>`;
        return `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${z}" behindDoc="${detras ? 1 : 0}" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/>${pos('H', h)}${pos('V', v)}<wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${img.id}" name="${img.name}"/><wp:cNvGraphicFramePr/>${wGrafico(img, cx, cy)}</wp:anchor></w:drawing></w:r>`;
    }

    async function construirDocx(est, lista) {
        await cargarAssets();
        const media = [];
        const faltantes = [];
        let idSeq = 1;
        function addImagen(clave, dataUrl) {
            const info = infoImagen(dataUrl || imgCache[clave]);
            if (!info) { faltantes.push(clave); return null; }
            const n = media.length + 1;
            media.push({ name: `image${n}.${info.ext}`, bytes: info.bytes });
            return { rid: `rIdImg${n}`, w: info.w, h: info.h, id: idSeq++, name: clave };
        }

        const esA = est.plantilla === 'clasica';
        const individual = est.modalidad === 'individual';
        const etiquetaGrupo = individual ? 'ESTUDIANTE:' : 'INTEGRANTES:';
        const PAGE_H = 841.9;
        let parrafos = '';
        let sectPr = '';
        let tieneFooter = false;

        if (esA) {
            const F = 'Times New Roman';
            const M = 70.85;
            const bodyH = PAGE_H - 2 * M - 26;
            const esc = addImagen('escudoClasico');
            let escCm = lista.length > 5 ? 5.2 : 6.8;
            const altoEsc = cm => esc ? (cm * 28.346 * esc.h / esc.w) + 6 : 0;

            const items = [];
            const add = (inner, before, line, extra) => { const it = Object.assign({ inner, before, line }, extra || {}); items.push(it); return it; };

            add(wRun('UNIVERSIDAD CATÓLICA SANTO TORIBIO DE MOGROVEJO', { font: F, size: 13, bold: true }), 0, 17);
            add(wRun(est.facultad || '', { font: F, size: 12, bold: true, caps: true }), 4, 16);
            add(wRun(est.escuela || '', { font: F, size: 11, bold: true, caps: true }), 4, 15);
            const itEsc = esc ? add('', 26, 0, { auto: true }) : null;
            add(wRun((est.titulo || '').toUpperCase(), { font: F, size: 14, bold: true }), 14, 19);
            add(wRun('CURSO:', { font: F, size: 11, bold: true }), 26, 15);
            add(wRun(est.curso || '', { font: F, size: 11 }), 2, 15);
            add(wRun('DOCENTE:', { font: F, size: 11, bold: true }), 18, 15);
            add(wRun(est.docente || '', { font: F, size: 11 }), 2, 15);
            const itLabel = add(wRun(etiquetaGrupo, { font: F, size: 11, bold: true }), 26, 15);
            lista.forEach(n => add(wRun(individual ? n : `• ${n}`, { font: F, size: 11 }), 2, 15));

            const total = () => items.reduce((s, it) => s + it.before + it.line, 0);
            if (itEsc) itEsc.line = altoEsc(escCm);
            while (total() > bodyH && escCm > 3.2 && itEsc) { escCm -= 0.4; itEsc.line = altoEsc(escCm); }
            itLabel.before = Math.max(26, itLabel.before + (bodyH - total()));

            if (itEsc) {
                const cx = emuCm(escCm), cy = Math.round(cx * esc.h / esc.w);
                itEsc.inner = wImagenInline(esc, cx, cy);
            }
            parrafos = items.map(it => wPar(it.inner, it.before, it.auto ? 0 : it.line)).join('');

            tieneFooter = !!est.lugarFecha;
            sectPr = `<w:sectPr>${tieneFooter ? '<w:footerReference w:type="default" r:id="rIdFooter"/>' : ''}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${tw(M)}" w:right="${tw(M)}" w:bottom="${tw(M)}" w:left="${tw(M)}" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>`;
        } else {
            const F = 'Calibri';
            const ROJO = 'dc2626';
            const TOP = 146;
            const BASE_BOTTOM = PAGE_H - 56.7;
            const marco = addImagen('franjas');
            const marcaBase = await atenuarImagen(imgCache.escudoClasico, 0.14);
            const marca = addImagen('marcaAgua', marcaBase);
            const logo = addImagen('logoColor');

            let anclas = '';
            if (marco) anclas += wImagenFlotante(marco, 7560000, 10692000, { off: 0 }, { off: 0 }, 1, true);
            if (marca) {
                const cx = emuCm(12.5), cy = Math.round(cx * marca.h / marca.w);
                anclas += wImagenFlotante(marca, cx, cy, { align: 'center' }, { align: 'center' }, 2, true);
            }
            if (logo) {
                const cx = emuCm(4.0), cy = Math.round(cx * logo.h / logo.w);
                anclas += wImagenFlotante(logo, cx, cy, { off: emuCm(13.4) }, { off: emuCm(1.5) }, 3, false);
            }

            const items = [];
            const add = (inner, before, line, gap, lineas) => items.push({ inner, before, line, gap: !!gap, lineas: lineas || 1 });

            add(anclas
                + wRun('UNIVERSIDAD CATÓLICA', { font: F, size: 20, bold: true, color: ROJO })
                + wSalto
                + wRun('SANTO TORIBIO DE MOGROVEJO – USAT', { font: F, size: 20, bold: true, color: ROJO }), 0, 31, false, 2);
            add(wRun(est.facultad || '', { font: F, size: 16, bold: true, caps: true }), 28.6, 20, true);
            add(wRun(est.escuela || '', { font: F, size: 14, bold: true, caps: true }), 17, 18, true);
            add(wRun('TEMA:', { font: F, size: 14, bold: true }), 48, 18, true);
            add(wRun(est.titulo || '', { font: F, size: 14 }), 21.7, 18, true);
            add(wRun('ASIGNATURA:', { font: F, size: 14, bold: true }), 34.4, 18, true);
            add(wRun(est.curso || '', { font: F, size: 14 }), 18.9, 18, true);
            add(wRun('DOCENTE:', { font: F, size: 14, bold: true }), 34.4, 18, true);
            add(wRun(est.docente || '', { font: F, size: 14 }), 18.9, 18, true);
            add(wRun(etiquetaGrupo, { font: F, size: 14, bold: true }), 50, 18, true);
            lista.forEach((n, i) => add(wRun(n, { font: F, size: 14 }), i === 0 ? 13 : 2, 18, i === 0));

            const tieneLinea = !!est.lugarFecha;
            let s = 1, pie = 0;
            for (;;) {
                const y = TOP + items.reduce((a, it) => a + (it.gap ? it.before * s : it.before) + it.line * it.lineas, 0);
                pie = Math.max(12, 712 - y);
                const fin = y + (tieneLinea ? pie + 16 : 0);
                if (fin <= BASE_BOTTOM || s <= 0.3) break;
                s = Math.round((s - 0.05) * 100) / 100;
            }
            parrafos = items.map(it => wPar(it.inner, it.gap ? it.before * s : it.before, it.line)).join('');
            if (tieneLinea) parrafos += wPar(wRun(est.lugarFecha, { font: F, size: 12, bold: true }), pie, 16);

            sectPr = `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${tw(TOP)}" w:right="1701" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>`;
        }

        const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        const XMLH = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        const nsDoc = `xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"`;

        const documentXml = `${XMLH}<w:document ${nsDoc}><w:body>${parrafos}${sectPr}</w:body></w:document>`;
        const footerXml = `${XMLH}<w:ftr ${nsDoc}><w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr>${wRun(est.lugarFecha || '', { font: 'Times New Roman', size: 11, bold: true })}</w:p></w:ftr>`;
        const stylesXml = `${XMLH}<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="es-PE" w:eastAsia="es-PE" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
        const settingsXml = `${XMLH}<w:settings xmlns:w="${W}"><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;
        const relsDoc = `${XMLH}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
            + `<Relationship Id="rIdStyles" Type="${R}/styles" Target="styles.xml"/>`
            + `<Relationship Id="rIdSettings" Type="${R}/settings" Target="settings.xml"/>`
            + (tieneFooter ? `<Relationship Id="rIdFooter" Type="${R}/footer" Target="footer1.xml"/>` : '')
            + media.map((m, i) => `<Relationship Id="rIdImg${i + 1}" Type="${R}/image" Target="media/${m.name}"/>`).join('')
            + `</Relationships>`;
        const relsRoot = `${XMLH}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`;
        const contentTypes = `${XMLH}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
            + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
            + `<Default Extension="xml" ContentType="application/xml"/>`
            + `<Default Extension="png" ContentType="image/png"/>`
            + `<Default Extension="jpeg" ContentType="image/jpeg"/>`
            + `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>`
            + `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>`
            + `<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>`
            + (tieneFooter ? `<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>` : '')
            + `</Types>`;

        const enc = new TextEncoder();
        const archivos = [
            { name: '[Content_Types].xml', data: enc.encode(contentTypes) },
            { name: '_rels/.rels', data: enc.encode(relsRoot) },
            { name: 'word/document.xml', data: enc.encode(documentXml) },
            { name: 'word/_rels/document.xml.rels', data: enc.encode(relsDoc) },
            { name: 'word/styles.xml', data: enc.encode(stylesXml) },
            { name: 'word/settings.xml', data: enc.encode(settingsXml) }
        ];
        if (tieneFooter) archivos.push({ name: 'word/footer1.xml', data: enc.encode(footerXml) });
        media.forEach(m => archivos.push({ name: `word/media/${m.name}`, data: m.bytes }));

        return { blob: crearZip(archivos), faltantes };
    }

    function esperarImagenes(raiz) {
        return Promise.all([...raiz.querySelectorAll('img')].map(img =>
            (img.complete && img.naturalWidth) ? Promise.resolve()
                : new Promise(r => { img.onload = img.onerror = r; })));
    }

    function imprimirPreviewComoPdf() {
        const el = document.getElementById('render-target');
        if (!el) return;
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
        document.body.appendChild(iframe);
        const d = iframe.contentWindow.document;
        d.open();
        d.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Carátula USAT</title><style>
            @page { size: A4; margin: 0; }
            html, body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            #hoja { width: 794px; height: 1122px; overflow: hidden; position: relative; }
            #esc { width: 470px; height: 665px; transform: scale(1.6894); transform-origin: 0 0; position: relative; overflow: hidden; font-family: 'Times New Roman', Times, serif; color: #000; }
        </style></head><body><div id="hoja"><div id="esc">${el.innerHTML}</div></div></body></html>`);
        d.close();
        setTimeout(() => {
            try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (e) {}
            setTimeout(() => iframe.remove(), 60000);
        }, 500);
    }

    function limpiarTexto(t) {
        return t.replace(/^[0-9]{4}-[I|V|X\d]+ - /i, '').replace(/\s*\([^)]*\)$/, '').replace(/Campus Virtual.*/i, '').trim();
    }

    function obtenerNombreCurso() {
        const breadcrumb = document.querySelector('.breadcrumb-item:last-child, ol.breadcrumb li:last-child');
        if (breadcrumb && breadcrumb.textContent.trim()) return limpiarTexto(breadcrumb.textContent);
        if (document.title) {
            const match = document.title.match(/(?:[0-9]{4}-[I|V|X\d]+\s*-\s*)([^-(]+)/i);
            if (match && match[1]) return match[1].trim();
        }
        const h1 = document.querySelector('.page-header-headings h1, #page-header h1, header h1');
        if (h1 && h1.textContent.trim()) return limpiarTexto(h1.textContent);
        return '';
    }

    function obtenerDatosMoodle() {
        const userElem = document.querySelector('.usertext, .usermenu .userbutton .usertext, .user-name');
        const estudiante = userElem ? userElem.textContent.trim() : '';
        const curso = obtenerNombreCurso();

        let docente = '';
        const summary = document.querySelector('#section-0 .summary, .course-content .summary');
        if (summary) {
            const matchDocente = summary.innerText.match(/Docente:\s*([^\n\r]+)/i);
            if (matchDocente && matchDocente[1]) docente = matchDocente[1].trim();
        }

        const idCurso = new URLSearchParams(window.location.search).get('id') || 'general';
        const grupoGuardado = localStorage.getItem(`usat_caratula_grupo_${idCurso}`) || estudiante;
        const facultadGuardada = localStorage.getItem('usat_perfil_facultad') || 'FACULTAD DE INGENIERÍA';
        const escuelaGuardada = localStorage.getItem('usat_perfil_escuela') || 'ESCUELA DE INGENIERÍA DE SISTEMAS Y COMPUTACIÓN';

        return { estudiante, curso, docente, idCurso, grupoGuardado, facultadGuardada, escuelaGuardada };
    }

    function inyectarBotonDisparador() {
        if (!ENV.getSetting('caratulasEnabled', true)) return;
        if (document.getElementById('btn-usat-caratula')) return;
        const listaActividades = document.querySelector('#section-0 ul.section, .course-content ul.section');
        if (!listaActividades) return;

        listaActividades.style.position = 'relative';
        const btn = document.createElement('button');
        btn.id = 'btn-usat-caratula';
        btn.type = 'button';
        btn.innerHTML = `${CORE.ICONOS.documento}<span>Generar Carátula</span>`;
        Object.assign(btn.style, {
            position: 'absolute', top: '4px', right: '15px', backgroundColor: '#dc2626',
            color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 14px',
            fontWeight: '600', fontSize: '12px', cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(153, 27, 27, 0.25)', display: 'inline-flex',
            alignItems: 'center', gap: '6px', zIndex: '10', transition: 'all 0.15s ease'
        });
        btn.onmouseover = () => { btn.style.backgroundColor = '#7f1d1d'; };
        btn.onmouseout = () => { btn.style.backgroundColor = '#dc2626'; };
        btn.onmousedown = () => { btn.style.transform = 'scale(0.97)'; };
        btn.onmouseup = () => { btn.style.transform = 'scale(1)'; };
        btn.onclick = mostrarModalCaratula;
        listaActividades.appendChild(btn);
    }

    function mostrarModalCaratula() {
        if (document.getElementById('modal-usat-caratula')) return;
        const datos = obtenerDatosMoodle();
        const E = CORE.escapeHtml;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'modal-usat-caratula';
        modalOverlay.innerHTML = `
            <style>
                #modal-usat-caratula { position:fixed; inset:0; background:rgba(15,23,42,0.65); backdrop-filter:blur(4px); z-index:99999; display:flex; align-items:center; justify-content:center; font-family:system-ui,-apple-system,sans-serif; }
                .usat-card-modal { background:#ffffff; width:95vw; max-width:1060px; height:90vh; max-height:840px; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.3); }
                .usat-modal-header { padding:14px 20px; background:#dc2626; color:#ffffff; display:flex; justify-content:space-between; align-items:center; }
                .usat-modal-header h2 { margin:0; font-size:15px; font-weight:700; }
                .usat-modal-close { background:none; border:none; color:#ffffff; cursor:pointer; opacity:0.85; display:inline-flex; align-items:center; padding:4px; }
                .usat-modal-close:hover { opacity:1; }
                .usat-modal-body { flex:1; display:grid; grid-template-columns:360px 1fr; overflow:hidden; background:#f8fafc; }
                .usat-controls { padding:18px; overflow-y:auto; display:flex; flex-direction:column; gap:12px; border-right:1px solid #e2e8f0; }
                .usat-field { display:flex; flex-direction:column; gap:3px; }
                .usat-field label { font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; }
                .usat-field input, .usat-field textarea { border:1px solid #cbd5e1; border-radius:6px; padding:7px 10px; font-size:12.5px; color:#1e293b; outline:none; background:#ffffff; }
                .usat-field input:focus, .usat-field textarea:focus { border-color:#dc2626; }
                .usat-segmented { display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#e2e8f0; padding:3px; border-radius:6px; }
                .usat-segmented button { border:none; padding:6px; font-size:12px; font-weight:600; border-radius:4px; cursor:pointer; background:transparent; color:#475569; }
                .usat-segmented button.active { background:#ffffff; color:#dc2626; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
                .usat-btn-sort { align-self:flex-end; background:none; border:none; color:#dc2626; font-size:11px; font-weight:600; cursor:pointer; padding:2px 4px; display:inline-flex; align-items:center; gap:4px; }
                .usat-preview-container { padding:20px; overflow-y:auto; display:flex; justify-content:center; align-items:flex-start; background:#64748b; }
                .usat-page-a4 { background:#ffffff; width:470px; height:665px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.3); position:relative; box-sizing:border-box; overflow:hidden; font-family:'Times New Roman',Times,serif; color:#000000; }
                .usat-modal-footer { padding:12px 20px; background:#ffffff; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:10px; }
                .usat-action-btn { border:none; border-radius:6px; padding:8px 14px; font-size:12px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
                .btn-secondary { background:#f1f5f9; color:#334155; }
                .btn-secondary:hover { background:#e2e8f0; }
                .btn-primary { background:#dc2626; color:#ffffff; }
                .btn-primary:hover { background:#7f1d1d; }
            </style>
            <div class="usat-card-modal">
                <div class="usat-modal-header">
                    <h2 style="color: #e8e9eb;">Generador de Carátulas USAT</h2>
                    <button type="button" class="usat-modal-close" id="btn-close-modal" title="Cerrar">${CORE.ICONOS.cerrar}</button>
                </div>
                <div class="usat-modal-body">
                    <div class="usat-controls">
                        <div class="usat-field">
                            <label>Plantilla Visual</label>
                            <div class="usat-segmented" id="seg-plantilla">
                                <button type="button" class="active" data-val="clasica">A: Clásica</button>
                                <button type="button" data-val="moderna">B: Alternativa</button>
                            </div>
                        </div>
                        <div class="usat-field">
                            <label>Modalidad</label>
                            <div class="usat-segmented" id="seg-modalidad">
                                <button type="button" class="active" data-val="individual">Individual</button>
                                <button type="button" data-val="grupal">Grupal</button>
                            </div>
                        </div>
                        <div class="usat-field"><label>Facultad</label><input type="text" id="input-facultad" value="${E(datos.facultadGuardada)}"></div>
                        <div class="usat-field"><label>Escuela</label><input type="text" id="input-escuela" value="${E(datos.escuelaGuardada)}"></div>
                        <div class="usat-field"><label>Título / Tema</label><input type="text" id="input-titulo" value="Primer Avance"></div>
                        <div class="usat-field"><label>Asignatura</label><input type="text" id="input-curso" value="${E(datos.curso)}"></div>
                        <div class="usat-field"><label>Docente</label><input type="text" id="input-docente" value="${E(datos.docente)}"></div>
                        <div class="usat-field" id="box-integrantes" style="display:none;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <label>Integrantes (1 por línea)</label>
                                <button type="button" class="usat-btn-sort" id="btn-sort-nombres">${CORE.ICONOS.ordenar}<span>Ordenar A-Z</span></button>
                            </div>
                            <textarea id="input-integrantes" rows="4">${E(datos.grupoGuardado)}</textarea>
                        </div>
                        <div class="usat-field"><label>Pie de Página (Lugar y Año)</label><input type="text" id="input-lugar" value="Chiclayo, ${new Date().getFullYear()}"></div>
                    </div>
                    <div class="usat-preview-container"><div class="usat-page-a4" id="render-target"></div></div>
                </div>
                <div class="usat-modal-footer">
                    <button type="button" class="usat-action-btn btn-secondary" id="btn-export-copy">${CORE.ICONOS.copiar}<span>Copiar Formato</span></button>
                    <button type="button" class="usat-action-btn btn-secondary" id="btn-export-pdf">${CORE.ICONOS.impresora}<span>Descargar PDF</span></button>
                    <button type="button" class="usat-action-btn btn-primary" id="btn-export-word">${CORE.ICONOS.documento}<span>Descargar Word (.docx)</span></button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        const estado = {
            plantilla: 'clasica', modalidad: 'individual', titulo: 'Primer Avance',
            facultad: datos.facultadGuardada, escuela: datos.escuelaGuardada,
            curso: datos.curso, docente: datos.docente, estudiante: datos.estudiante,
            integrantesTexto: datos.grupoGuardado, lugarFecha: `Chiclayo, ${new Date().getFullYear()}`
        };

        const getListaNombres = () => (
            estado.modalidad === 'individual'
                ? [estado.estudiante]
                : estado.integrantesTexto.split('\n').map(l => l.replace(/^[\s*•\-\d.)]+/, '').trim()).filter(Boolean)
        );

        function renderCaratula() {
            const preview = document.getElementById('render-target');
            if (!preview) return;
            const lista = getListaNombres();
            const footerHtml = estado.lugarFecha
                ? `<div style="position:absolute;bottom:20px;left:0;right:0;text-align:center;font-weight:bold;font-size:11px;">${E(estado.lugarFecha)}</div>`
                : '';

            if (estado.plantilla === 'clasica') {
                preview.innerHTML = `
                    <div style="position:relative;z-index:2;height:100%;padding:35px 30px;box-sizing:border-box;display:flex;flex-direction:column;">
                        <div style="text-align:center;line-height:1.3;">
                            <p style="margin:0;font-weight:bold;font-size:13px;text-transform:uppercase;">UNIVERSIDAD CATÓLICA SANTO TORIBIO DE MOGROVEJO</p>
                            <p style="margin:3px 0 0;font-weight:bold;font-size:12px;text-transform:uppercase;">${E(estado.facultad)}</p>
                            <p style="margin:3px 0 0;font-weight:bold;font-size:11px;text-transform:uppercase;">${E(estado.escuela)}</p>
                        </div>
                        <div style="text-align:center;margin:15px 0 10px;">
                            <img src="${srcImg('escudoClasico')}" width="180" style="width:180px;height:auto;" alt="Escudo USAT">
                        </div>
                        <div style="text-align:center;margin-bottom:15px;">
                            <p style="margin:0;font-weight:bold;font-size:13.5px;text-transform:uppercase;">${E(estado.titulo) || '&nbsp;'}</p>
                            <div style="margin-top:14px;">
                                <p style="margin:0;font-weight:bold;font-size:11.5px;">CURSO:</p>
                                <p style="margin:2px 0 0;font-size:11.5px;">${E(estado.curso) || '&nbsp;'}</p>
                            </div>
                            <div style="margin-top:12px;">
                                <p style="margin:0;font-weight:bold;font-size:11.5px;">DOCENTE:</p>
                                <p style="margin:2px 0 0;font-size:11.5px;">${E(estado.docente) || '&nbsp;'}</p>
                            </div>
                        </div>
                        <div style="text-align:center;margin-top:auto;padding-bottom:30px;">
                            <p style="margin:0 0 4px;font-weight:bold;font-size:11.5px;">${estado.modalidad === 'individual' ? 'ESTUDIANTE:' : 'INTEGRANTES:'}</p>
                            <div style="font-size:11px;line-height:1.45;">
                                ${lista.map(n => `<div>${estado.modalidad === 'individual' ? E(n) : `• ${E(n)}`}</div>`).join('')}
                            </div>
                        </div>
                        ${footerHtml}
                    </div>
                `;
            } else {
                preview.innerHTML = `
                    <div style="position:absolute;inset:0;z-index:1;pointer-events:none;">
                        <img src="${srcImg('franjas')}" style="width:100%;height:100%;object-fit:fill;" alt="Marco">
                    </div>
                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1;opacity:0.12;pointer-events:none;">
                        <img src="${srcImg('escudoClasico')}" width="280" style="width:280px;height:auto;" alt="Marca">
                    </div>
                    <div style="position:relative;z-index:2;height:100%;padding:35px 30px;box-sizing:border-box;display:flex;flex-direction:column;">
                        <div style="display:flex;justify-content:flex-end;">
                            <img src="${srcImg('logoColor')}" width="150" style="width:150px;height:auto;" alt="Logo USAT">
                        </div>
                        <div style="text-align:center;margin-top:15px;">
                            <p style="margin:0;color:#dc2626;font-weight:bold;font-size:13.5px;text-transform:uppercase;">UNIVERSIDAD CATÓLICA<br>SANTO TORIBIO DE MOGROVEJO – USAT</p>
                            <p style="margin:10px 0 0;font-weight:bold;font-size:11.5px;text-transform:uppercase;">${E(estado.facultad)}</p>
                            <p style="margin:2px 0 0;font-weight:bold;font-size:10.5px;text-transform:uppercase;">${E(estado.escuela)}</p>
                        </div>
                        <div style="text-align:center;margin:20px 0 10px;">
                            <p style="margin:0;font-weight:bold;font-size:11px;">TEMA:</p>
                            <p style="margin:2px 0 0;font-size:12px;">${E(estado.titulo) || '&nbsp;'}</p>
                            <p style="margin:14px 0 0;font-weight:bold;font-size:11px;">ASIGNATURA:</p>
                            <p style="margin:2px 0 0;font-size:12px;">${E(estado.curso) || '&nbsp;'}</p>
                            <p style="margin:14px 0 0;font-weight:bold;font-size:11px;">DOCENTE:</p>
                            <p style="margin:2px 0 0;font-size:12px;">${E(estado.docente) || '&nbsp;'}</p>
                        </div>
                        <div style="text-align:center;margin-top:auto;padding-bottom:30px;">
                            <p style="margin:0 0 4px;font-weight:bold;font-size:11px;">${estado.modalidad === 'individual' ? 'ESTUDIANTE:' : 'INTEGRANTES:'}</p>
                            <div style="font-size:11px;line-height:1.45;">
                                ${lista.map(n => `<div>${E(n)}</div>`).join('')}
                            </div>
                        </div>
                        ${footerHtml}
                    </div>
                `;
            }
        }

        const resetBotonCopiar = () => {
            const btn = document.getElementById('btn-export-copy');
            if (btn) btn.innerHTML = `${CORE.ICONOS.copiar}<span>Copiar Formato</span>`;
        };

        document.getElementById('input-titulo').oninput = (e) => { estado.titulo = e.target.value; resetBotonCopiar(); renderCaratula(); };
        document.getElementById('input-facultad').oninput = (e) => {
            estado.facultad = e.target.value;
            localStorage.setItem('usat_perfil_facultad', e.target.value);
            resetBotonCopiar();
            renderCaratula();
        };
        document.getElementById('input-escuela').oninput = (e) => {
            estado.escuela = e.target.value;
            localStorage.setItem('usat_perfil_escuela', e.target.value);
            resetBotonCopiar();
            renderCaratula();
        };
        document.getElementById('input-curso').oninput = (e) => { estado.curso = e.target.value; resetBotonCopiar(); renderCaratula(); };
        document.getElementById('input-docente').oninput = (e) => { estado.docente = e.target.value; resetBotonCopiar(); renderCaratula(); };
        document.getElementById('input-lugar').oninput = (e) => { estado.lugarFecha = e.target.value; resetBotonCopiar(); renderCaratula(); };
        document.getElementById('input-integrantes').oninput = (e) => {
            estado.integrantesTexto = e.target.value;
            localStorage.setItem(`usat_caratula_grupo_${datos.idCurso}`, e.target.value);
            resetBotonCopiar();
            renderCaratula();
        };

        document.querySelectorAll('#seg-plantilla button').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#seg-plantilla button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                estado.plantilla = btn.dataset.val;
                resetBotonCopiar();
                renderCaratula();
            };
        });
        document.querySelectorAll('#seg-modalidad button').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#seg-modalidad button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                estado.modalidad = btn.dataset.val;
                document.getElementById('box-integrantes').style.display = estado.modalidad === 'grupal' ? 'flex' : 'none';
                resetBotonCopiar();
                renderCaratula();
            };
        });

        document.getElementById('btn-sort-nombres').onclick = () => {
            const input = document.getElementById('input-integrantes');
            input.value = input.value.split('\n').map(l => l.trim()).filter(Boolean)
                .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })).join('\n');
            estado.integrantesTexto = input.value;
            localStorage.setItem(`usat_caratula_grupo_${datos.idCurso}`, input.value);
            resetBotonCopiar();
            renderCaratula();
        };

        let timerCopiar = null;
        document.getElementById('btn-export-copy').onclick = async () => {
            const btn = document.getElementById('btn-export-copy');
            await cargarAssets();
            const lista = getListaNombres();
            const esA = estado.plantilla === 'clasica';
            const footerCopy = (!esA && estado.lugarFecha)
                ? `<p style="margin:25pt 0 0;text-align:center;font-weight:bold;font-size:11pt;">${E(estado.lugarFecha)}</p>`
                : '';
            const imgTag = (clave, anchoPx, alt) => {
                const info = imgInfoCache[clave];
                const h = info ? Math.round(anchoPx * info.h / info.w) : 0;
                return `<img width="${anchoPx}"${h ? ` height="${h}"` : ''} src="${srcImg(clave)}" alt="${alt}">`;
            };

            const copyHtml = esA
                ? `<div style="font-family:'Times New Roman',serif;text-align:center;color:#000000;">
                    <p style="font-weight:bold;font-size:14pt;margin:0;">UNIVERSIDAD CATÓLICA SANTO TORIBIO DE MOGROVEJO</p>
                    <p style="font-weight:bold;font-size:12pt;margin:4pt 0 0;">${E(estado.facultad)}</p>
                    <p style="font-weight:bold;font-size:11pt;margin:4pt 0 0;">${E(estado.escuela)}</p>
                    <p style="margin:20pt 0;">${imgTag('escudoClasico', 260, 'Escudo')}</p>
                    <p style="font-weight:bold;font-size:14pt;margin:15pt 0 0;">${E((estado.titulo || '').toUpperCase())}</p>
                    <p style="font-weight:bold;margin:15pt 0 0;">CURSO:</p><p style="margin:2pt 0 0;">${E(estado.curso)}</p>
                    <p style="font-weight:bold;margin:12pt 0 0;">DOCENTE:</p><p style="margin:2pt 0 0;">${E(estado.docente)}</p>
                    <p style="font-weight:bold;margin:25pt 0 0;">${estado.modalidad === 'individual' ? 'ESTUDIANTE:' : 'INTEGRANTES:'}</p>
                    ${lista.map(n => `<p style="margin:2pt 0 0;">${estado.modalidad === 'individual' ? E(n) : `• ${E(n)}`}</p>`).join('')}
                    ${footerCopy}</div>`
                : `<div style="font-family:Calibri,Arial,sans-serif;text-align:center;color:#000000;">
                    <div style="text-align:right;">${imgTag('logoColor', 150, 'Logo')}</div>
                    <p style="font-weight:bold;font-size:20pt;color:#dc2626;margin:25pt 0 0;">UNIVERSIDAD CATÓLICA<br>SANTO TORIBIO DE MOGROVEJO – USAT</p>
                    <p style="font-weight:bold;font-size:16pt;margin:20pt 0 0;">${E(estado.facultad)}</p>
                    <p style="font-weight:bold;font-size:14pt;margin:10pt 0 0;">${E(estado.escuela)}</p>
                    <p style="font-weight:bold;font-size:14pt;margin:40pt 0 0;">TEMA:</p><p style="font-size:14pt;margin:4pt 0 0;">${E(estado.titulo)}</p>
                    <p style="font-weight:bold;font-size:14pt;margin:25pt 0 0;">ASIGNATURA:</p><p style="font-size:14pt;margin:4pt 0 0;">${E(estado.curso)}</p>
                    <p style="font-weight:bold;font-size:14pt;margin:25pt 0 0;">DOCENTE:</p><p style="font-size:14pt;margin:4pt 0 0;">${E(estado.docente)}</p>
                    <p style="font-weight:bold;font-size:14pt;margin:35pt 0 0;">${estado.modalidad === 'individual' ? 'ESTUDIANTE:' : 'INTEGRANTES:'}</p>
                    ${lista.map(n => `<p style="font-size:14pt;margin:2pt 0 0;">${E(n)}</p>`).join('')}
                    ${footerCopy}</div>`;

            try {
                const blob = new Blob([copyHtml], { type: 'text/html' });
                await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
                btn.innerHTML = `${CORE.ICONOS.check}<span>Copiado</span>`;
                clearTimeout(timerCopiar);
                timerCopiar = setTimeout(resetBotonCopiar, 4000);
            } catch (err) {
                CORE.toast({ mensaje: 'No se pudo copiar al portapapeles.', tipo: 'error' });
            }
        };

        document.getElementById('btn-export-word').onclick = async () => {
            try {
                const { blob, faltantes } = await construirDocx(estado, getListaNombres());
                descargarBlob(blob, `Caratula - ${nombreArchivoSeguro(estado.titulo)}.docx`);
                if (faltantes.length) {
                    CORE.toast({ mensaje: `Word generado, pero faltaron imágenes: ${faltantes.join(', ')}`, tipo: 'warning' });
                }
            } catch (err) {
                CORE.toast({ mensaje: `No se pudo generar el Word: ${err.message}`, tipo: 'error' });
            }
        };

        document.getElementById('btn-export-pdf').onclick = async () => {
            const btn = document.getElementById('btn-export-pdf');
            const orig = btn.innerHTML;
            btn.innerHTML = `${CORE.ICONOS.spinner}<span>Generando...</span>`;
            btn.disabled = true;
            let hoja = null;

            try {
                let html2pdfFn;
                try {
                    html2pdfFn = await CORE.cargarLibreria('html2pdf');
                } catch (errLib) {
                    CORE.toast({ mensaje: 'Abriendo impresión: elige "Guardar como PDF".', tipo: 'warning' });
                    imprimirPreviewComoPdf();
                    return;
                }

                await cargarAssets();
                renderCaratula();
                const original = document.getElementById('render-target');

                hoja = document.createElement('div');
                hoja.style.cssText = 'position:relative;width:794px;height:1122px;overflow:hidden;background:#ffffff;';
                const copia = original.cloneNode(true);
                copia.removeAttribute('id');
                copia.style.boxShadow = 'none';
                copia.style.transform = `scale(${794 / 470})`;
                copia.style.transformOrigin = '0 0';
                hoja.appendChild(copia);
                await esperarImagenes(hoja);

                const opt = {
                    margin: 0,
                    filename: `Caratula - ${nombreArchivoSeguro(estado.titulo)}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                await html2pdfFn().set(opt).from(hoja).toPdf().get('pdf').then(pdf => {
                    while (pdf.internal.getNumberOfPages() > 1) pdf.deletePage(pdf.internal.getNumberOfPages());
                }).save();
            } catch (err) {
                CORE.toast({ mensaje: `Error al generar PDF: ${err.message}`, tipo: 'error' });
            } finally {
                if (hoja) hoja.remove();
                btn.innerHTML = orig;
                btn.disabled = false;
            }
        };

        const cerrar = () => modalOverlay.remove();
        document.getElementById('btn-close-modal').onclick = cerrar;
        modalOverlay.onclick = (e) => { if (e.target === modalOverlay) cerrar(); };

        renderCaratula();
        cargarAssets().then(() => renderCaratula());
    }

    function iniciar() {
        inyectarBotonDisparador();
        const regionMain = document.getElementById('region-main') || document.body;
        if (!observerBoton) {
            observerBoton = new MutationObserver(CORE.debounce(inyectarBotonDisparador, 250));
            observerBoton.observe(regionMain, { childList: true, subtree: true });
        }
    }

    function detener() {
        document.getElementById('btn-usat-caratula')?.remove();
        document.getElementById('modal-usat-caratula')?.remove();
        if (observerBoton) {
            observerBoton.disconnect();
            observerBoton = null;
        }
    }

    if (ENV.getSetting('caratulasEnabled', true)) iniciar();

    ENV.onSettingsChanged((changes) => {
        if (!changes.caratulasEnabled) return;
        changes.caratulasEnabled.newValue !== false ? iniciar() : detener();
    });
})();