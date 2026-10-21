'use strict';

const { normalizeType, stripOptionLabel } = require('./matcher.js');

const ROOT_SELECTOR = '.TiMu, .noSplitBx, .Py-mian1, [data-question-id], .question-item';
const TITLE_SELECTOR = '.Zy_TItle, .mark_name, .Py-m1-title, .question-title, .question-stem, .stem';
const OMIT_SELECTOR = 'script,style,noscript,input,textarea,select,button,[hidden],[aria-hidden="true"],.answer,.analysis,.answer-analysis';

function formulaText(element) {
    return element.getAttribute('data-latex') || element.getAttribute('data-formula') || element.getAttribute('alttext') ||
        element.querySelector?.('annotation[encoding="application/x-tex"]')?.textContent || '';
}

function visibleText(element) {
    if (!element) return '';
    const copy = element.cloneNode(true);
    copy.querySelectorAll(OMIT_SELECTOR).forEach(node => node.remove());
    copy.querySelectorAll('[data-latex],[data-formula],math').forEach(node => {
        const formula = formulaText(node);
        if (formula) node.textContent = ' ' + formula + ' ';
    });
    copy.querySelectorAll('img').forEach(node => {
        const text = formulaText(node) || node.getAttribute('alt') || '[图片]';
        node.replaceWith(copy.ownerDocument.createTextNode(' ' + text + ' '));
    });
    copy.querySelectorAll('br').forEach(node => node.replaceWith(copy.ownerDocument.createTextNode(' ')));
    return (copy.textContent || '').replace(/\s+/g, ' ').trim();
}

function cleanTitle(value) {
    return String(value || '')
        .replace(/^\s*(?:第\s*[\d一二三四五六七八九十百零〇]+\s*题\s*[:：.、]?|[（(【[]?\s*[\d一二三四五六七八九十百零〇]+\s*[）)】\].、．:：])\s*/, '')
        .replace(/^\s*[（(【[]\s*(?:单选题?|多选题?|判断题?|填空题?)\s*[,，、]?\s*(?:\d+(?:\.\d+)?\s*分)?\s*[）)】\]]\s*/, '')
        .trim();
}

function optionContainer(input, root) {
    const label = input.closest('label');
    if (label && root.contains(label)) return label;
    if (input.id) {
        const linked = Array.from(root.querySelectorAll('label')).find(item => item.htmlFor === input.id);
        if (linked) return linked;
    }
    const wrapper = input.closest('li,.judgeoption,.answerBg,.answer-item,.question-option,.selectBox,.answer_p');
    return wrapper && root.contains(wrapper) ? wrapper : input.parentElement;
}

function readChoices(root) {
    if (root.matches('.Py-mian1')) {
        const marker = root.querySelector('[name^="answertype"],input[id^="answertype"]');
        const expectedId = (marker?.name || marker?.id || '').replace(/^answertype/, '').replace(/\D/g, '');
        return Array.from(root.querySelectorAll('li.clearfix[id-param]'))
            .filter(element => !expectedId || element.getAttribute('id-param').replace(/\D/g, '') === expectedId)
            .map((element, index) => {
            const textNode = element.querySelector('.fl.after,label[for],label,.after');
            const text = stripOptionLabel(visibleText(textNode || element));
            const letter = element.querySelector('em[id-param]')?.getAttribute('id-param')?.toUpperCase() || String.fromCharCode(65 + index);
            return { index, text, letter, element, input: null };
            }).filter(item => item.text);
    }
    const controls = Array.from(root.querySelectorAll('input[type="radio"],input[type="checkbox"]'));
    if (controls.length) return controls.map((input, index) => {
        const element = optionContainer(input, root);
        return { index, text: stripOptionLabel(visibleText(element)), element, input };
    });
    const candidates = Array.from(root.querySelectorAll('.judgeoption,.answerBg,.answer-item,.question-option,.selectBox,.answer_p,.answerList li,.stem_answer li,ul li'));
    return candidates.filter(item => !candidates.some(other => other !== item && other.contains(item)))
        .map((element, index) => ({ index, text: stripOptionLabel(visibleText(element)), element, input: null }))
        .filter(item => item.text);
}

function readFields(root) {
    const editors = Array.from(root.querySelectorAll('[id^="answerEditor"],.edui-editor,[data-editor-id]'));
    const fields = editors.filter(item => !editors.some(other => other !== item && other.contains(item)))
        .map(element => ({ kind: 'editor', element, id: element.dataset.editorId || element.id }));
    const controls = Array.from(root.querySelectorAll('textarea,input[type="text"],[contenteditable="true"],.answerInput'));
    for (const element of controls) {
        if (fields.some(field => field.element === element || field.element.contains(element) || element.contains(field.element))) continue;
        if (element.type === 'hidden' || element.hidden || element.closest('[hidden],[aria-hidden="true"]')) continue;
        fields.push({ kind: element.isContentEditable || element.getAttribute('contenteditable') === 'true' || !['INPUT', 'TEXTAREA'].includes(element.tagName) ? 'contenteditable' : 'input', element, id: element.id });
    }
    if (!fields.length) {
        for (const iframe of root.querySelectorAll('iframe[id^="ueditor"],iframe[id*="Editor"]')) {
            const id = iframe.id.replace(/_iframe$/, '');
            fields.push({ kind: 'editor', element: iframe, id });
        }
    }
    return fields;
}

function readAssets(root) {
    const assets = [];
    const seen = new Set();
    root.querySelectorAll('img,[data-latex],[data-formula],math').forEach(element => {
        if (element.closest(OMIT_SELECTOR)) return;
        let asset;
        const formula = formulaText(element).trim();
        if (formula) asset = { kind: 'formula', formula: formula.slice(0, 4000), alt: element.getAttribute('alt') || '' };
        else if (element.tagName === 'IMG') {
            try {
                const raw = element.getAttribute('data-src') || element.getAttribute('src');
                if (!raw) return;
                const url = new URL(raw, root.ownerDocument.baseURI);
                if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return;
                // Credentials in resource query strings are unrelated to question content.
                for (const key of [...url.searchParams.keys()]) if (/token|auth|cookie|session|password/i.test(key)) url.searchParams.delete(key);
                asset = { kind: 'image', url: url.href, alt: element.getAttribute('alt') || '' };
            } catch (_) { return; }
        }
        if (!asset) return;
        const key = JSON.stringify(asset);
        if (!seen.has(key)) { assets.push(asset); seen.add(key); }
    });
    return assets;
}

function readQuestions(document) {
    if (!document?.querySelectorAll) return [];
    let roots = Array.from(document.querySelectorAll(ROOT_SELECTOR));
    roots = roots.filter(item => !roots.some(other => other !== item && other.contains(item)));
    if (!roots.length) {
        roots = Array.from(document.querySelectorAll('[name^="answertype"]')).map(input => input.closest('li,section,fieldset') || input.parentElement);
        roots = [...new Set(roots)];
    }
    return roots.map((element, index) => {
        const titleNode = element.querySelector(TITLE_SELECTOR) || element.querySelector('h3');
        const typeInput = element.querySelector('[name^="answertype"],input[id^="answertype"]');
        const titleText = visibleText(titleNode);
        const typeText = typeInput?.value ?? element.dataset.type ?? visibleText(element.querySelector('.type_tit'));
        let type = normalizeType(typeText);
        if (type === 'unknown') type = normalizeType(titleText);
        const choices = readChoices(element);
        const fields = readFields(element);
        if (type === 'unknown' && choices.length) type = element.querySelector('input[type="checkbox"]') ? 'multiple' : 'single';
        if (type === 'unknown' && fields.length) type = 'fill';
        const assets = [];
        const assetKeys = new Set();
        for (const container of [titleNode, ...choices.map(choice => choice.element)].filter(Boolean)) {
            for (const asset of readAssets(container)) {
                const key = JSON.stringify(asset);
                if (!assetKeys.has(key)) { assets.push(asset); assetKeys.add(key); }
            }
        }
        const title = cleanTitle(titleText);
        const suffix = (typeInput?.name || typeInput?.id)?.replace(/^answertype/, '') || element.dataset.questionId || element.getAttribute('data') || element.id || String(index + 1);
        const host = element.matches('.Py-mian1') ? {
            kind: 'mobile-chapter',
            answerInput: Array.from(element.querySelectorAll('input[type="hidden"]')).find(input => {
                const key = input.name || input.id;
                return /^answer(?!type)/.test(key) && key.replace(/^answer/, '').replace(/\D/g, '') === suffix.replace(/\D/g, '');
            }) || null,
        } : null;
        return { id: suffix, title, type, options: choices.map(item => item.text), choices, fields, element, assets, host };
    }).filter(question => question.title);
}

function collectQuestions(document) {
    const seen = new Set();
    return readQuestions(document).flatMap(question => {
        const item = { title: question.title, options: question.options.slice(), type: question.type };
        if (question.assets.length) item.assets = question.assets;
        const key = JSON.stringify(item);
        if (seen.has(key)) return [];
        seen.add(key);
        return [item];
    });
}

module.exports = { readQuestions, collectQuestions, visibleText, cleanTitle };
