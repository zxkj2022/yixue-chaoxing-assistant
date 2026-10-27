'use strict';

const { normalizeType, stripOptionLabel, isBooleanChoice, booleanValue, normalizeBooleanOptions } = require('./matcher.js');
const { readCollectedAnswer, hasReviewEvidence } = require('./collection-answer.js');
const { decodeFontCopy } = require('./font-codec.js');

const ROOT_SELECTOR = '.TiMu, .noSplitBx, .Py-mian1, .questionLi, [data-question-id], .question-item';
const TITLE_SELECTOR = '.fontLabel, .Zy_TItle, .mark_name, .Py-m1-title, .question-title, .question-stem, .stem';
const OMIT_SELECTOR = 'script,style,noscript,input,textarea,select,button,[hidden],[aria-hidden="true"],.answer,.analysis,.answer-analysis,.Py_answer,.mark_answer,.rightAnswer,.correctAnswer,.right-answer,.correct-answer,.grading-result';
// DOM profiles read the rendered question content.
const ZH_PROFILES = [
    { root: '.question-area-content', type: 'div.flex.items-center.mb-\\[16px\\],[class*="question-type"],[class*="mb-[16px]"]', title: '.text-mainText.font-medium,[class*="question"][class*="title"]', options: 'label.user-select.group,label[class*="user-select"],label.group,[role="radio"],[role="checkbox"]' },
    { root: '.questionBox', type: '.questionTit', title: '.questionContent', options: '.optionUl label' },
    { root: '.questionContent', type: '.questionName', title: '.questionName .centent-pre', options: '.radio-view li.clearfix,.checkbox-views label.el-checkbox' },
    { root: '.exam-item', type: '.quest-type', title: '.quest-title .option-name', options: 'label' },
    { root: '.subject_node', exercise: true, options: '.node_detail' },
    { root: '#playTopic-dialog .topic', exercise: true, options: '.topic-item,.radio ul > li,[role="radio"],[role="checkbox"]' },
];

function questionTypeIds(element) {
    return new Set(Array.from(element.querySelectorAll('[name^="answertype"],input[id^="answertype"]'))
        .map(input => (input.name || input.id || '').replace(/^answertype/, '')).filter(Boolean));
}

function questionRoots(document) {
    const ignored = 'script,style,template,[hidden],[aria-hidden="true"],#yixue-ui-root,.analysis,.answer-analysis,.Py_answer,.mark_answer,.rightAnswer,.correctAnswer,.answerBg,.optionCon,.option-content,.answer-item,.question-option,.selectBox,.answer_p,.answerList,.stem_answer,li[qid]';
    const usable = node => node && !node.closest(ignored);
    let candidates = Array.from(document.querySelectorAll(ROOT_SELECTOR + ',' + ZH_PROFILES.map(profile => profile.root).join(',')))
        .filter(element => usable(element) && (element.matches(ROOT_SELECTOR) || profileFor(element)));
    if (!candidates.length) {
        candidates = Array.from(document.querySelectorAll('[name^="answertype"],input[id^="answertype"]'))
            .map(input => input.closest('li,section,fieldset') || input.parentElement).filter(usable);
    }
    let titles = Array.from(document.querySelectorAll(TITLE_SELECTOR)).filter(usable);
    for (const candidate of candidates) {
        const profile = profileFor(candidate);
        if (profile?.exercise) titles.push(candidate);
        else if (profile) titles.push(...Array.from(candidate.querySelectorAll(profile.title)).filter(usable));
        else if (!titles.some(title => candidate.contains(title))) titles.push(...Array.from(candidate.querySelectorAll('h3')).filter(usable));
    }
    titles = [...new Set(titles)];
    titles = titles.filter(title => !titles.some(other => other !== title && title.contains(other)));
    const counts = new Map(), known = new Set(candidates);
    for (const title of titles) for (let node = title; node; node = node.parentElement) counts.set(node, (counts.get(node) || 0) + 1);
    const hasContent = node => {
        const profile = profileFor(node);
        return Boolean((profile && node.querySelector(profile.options)) || node.matches('.questionLi') ||
            node.querySelector('input[type="radio"],input[type="checkbox"],textarea,input[type="text"],[contenteditable="true"],.edui-editor,.judgeoption,.answerBg,.answer-item,.question-option,.selectBox,.answer_p,.answerList li,.stem_answer,li[qid],.mark_answer,.Py_answer'));
    };
    const identified = node => node.tagName !== 'FORM' && (node.dataset.questionId ||
        (node.matches('.questionLi') && (node.getAttribute('data') || node.querySelector('.questionId')?.value)) || questionTypeIds(node).size === 1);
    const roots = titles.map(title => {
        const ancestors = [];
        let region = title;
        for (let node = title; node && node !== document.body && node !== document.documentElement && counts.get(node) === 1; node = node.parentElement) {
            region = node;
            if (known.has(node)) ancestors.push(node);
        }
        return ancestors.find(node => hasContent(node) && identified(node)) || ancestors.find(hasContent) ||
            (hasContent(region) ? region : ancestors[0] || null);
    });
    return [...new Set(roots)].filter(root => root && questionTypeIds(root).size <= 1);
}

function profileFor(element) {
    return ZH_PROFILES.find(profile => element.matches(profile.root) && (profile.exercise || element.querySelector(profile.title))) || null;
}

function exerciseStem(element, profile) {
    const copy = element.cloneNode(true);
    copy.querySelectorAll(profile.options + ',ul,ol,.el-pager,.pagination,button,input,textarea,select,.answer,.analysis,.answer-analysis').forEach(node => node.remove());
    return copy;
}

function formulaText(element) {
    return element.getAttribute('data-latex') || element.getAttribute('data-formula') || element.getAttribute('alttext') ||
        element.querySelector?.('annotation[encoding="application/x-tex"]')?.textContent || '';
}

function resourceUrl(element) {
    try {
        const raw = element.getAttribute('data-src') || element.getAttribute('_src') || element.getAttribute('src') || element.querySelector('source')?.getAttribute('src');
        if (!raw) return '';
        const url = new URL(raw, element.ownerDocument.baseURI);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
        for (const key of [...url.searchParams.keys()]) if (/token|auth|cookie|session|password/i.test(key)) url.searchParams.delete(key);
        return url.href;
    } catch (_) { return ''; }
}

function visibleText(element, { excludeMarkers = false } = {}) {
    if (!element) return '';
    const copy = element.cloneNode(true);
    decodeFontCopy(element, copy, { ignoreSelector: OMIT_SELECTOR });
    copy.querySelectorAll(OMIT_SELECTOR).forEach(node => node.remove());
    if (excludeMarkers) copy.querySelectorAll('.num_option,.num_option_dx,.addMultipleChoice,.option-label,.option-letter,.option_num,.optionNum,em[id-param]').forEach(marker => {
        const label = (marker.textContent || '').normalize('NFKC').trim();
        if (!/^[A-Z][.、:)]?$/i.test(label)) return;
        if (marker.matches('em[id-param]') && marker.getAttribute('id-param').toUpperCase() !== label[0].toUpperCase()) return;
        marker.remove();
    });
    copy.querySelectorAll('[data-latex],[data-formula],math').forEach(node => {
        const formula = formulaText(node);
        if (formula) node.textContent = ' ' + formula + ' ';
    });
    copy.querySelectorAll('img,audio,iframe,.audioReader').forEach(node => {
        const text = formulaText(node) || [node.getAttribute('alt'), resourceUrl(node).replace(/^https?:\/\//, '')].filter(Boolean).join(' ') || '[媒体]';
        node.replaceWith(copy.ownerDocument.createTextNode(' ' + text + ' '));
    });
    copy.querySelectorAll('br').forEach(node => node.replaceWith(copy.ownerDocument.createTextNode(' ')));
    return (copy.textContent || '').replace(/\s+/g, ' ').trim();
}

function hasEncryptedFont(element) {
    if (!element) return false;
    const copy = element.cloneNode(true);
    return decodeFontCopy(element, copy, { ignoreSelector: OMIT_SELECTOR });
}

function cleanTitle(value) {
    return String(value || '')
        .replace(/^\s*(?:第\s*[\d一二三四五六七八九十百零〇]+\s*题\s*[:：.、]?|[（(【[]?\s*[\d一二三四五六七八九十百零〇]+\s*[）)】\].、．:：])\s*/, '')
        .replace(/^\s*[（(【[]\s*(?:单选题?|多选题?|判断题?|填空题?)\s*[,，、]?\s*(?:\d+(?:\.\d+)?\s*(?:分|points?))?\s*[）)】\]]\s*/i, '')
        .trim();
}

function choiceText(element) {
    if (!element) return '';
    const content = element.querySelector('.optionCon,.option-content,.after');
    if (content && !content.closest(OMIT_SELECTOR)) {
        const body = visibleText(content);
        if (body) return stripOptionLabel(body);
    }
    const text = visibleText(element, { excludeMarkers: true });
    if (text) return stripOptionLabel(text);
    const accessible = element.querySelector('[aria-label],[title],img[alt]');
    return stripOptionLabel(element.getAttribute('aria-label') || element.getAttribute('title') ||
        accessible?.getAttribute('aria-label') || accessible?.getAttribute('title') || accessible?.getAttribute('alt') || '');
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

function readChoices(root, profile, type) {
    if (profile) {
        if (!['single', 'multiple', 'judge'].includes(type) && !(profile.exercise && type === 'unknown')) return [];
        const candidates = Array.from(root.querySelectorAll(profile.options));
        return candidates.filter(element => !candidates.some(other => other !== element && other.contains(element)))
            .map((element, index) => ({ index, text: choiceText(element), element, input: element.matches('input[type="radio"],input[type="checkbox"]') ? element : element.querySelector('input[type="radio"],input[type="checkbox"]') }))
            .filter(item => item.text);
    }
    if (root.matches('.questionLi')) {
        const id = root.dataset.questionId || root.getAttribute('data') || root.querySelector('.questionId')?.value;
        const markers = id ? Array.from(root.querySelectorAll('[class]')).filter(element => element.classList.contains('choice' + id)) : [];
        if (markers.length) return markers.map((element, index) => ({
            index, text: choiceText(element.nextElementSibling), element, contentElement: element.nextElementSibling, input: null,
        })).filter(item => item.text);
    }
    if (root.matches('.TiMu.newTiMu') && root.querySelector('li[qid]')) {
        return Array.from(root.querySelectorAll('li[qid]')).map((element, index) => {
            const contentElement = element.querySelector('.after,.optionCon,.option-content') || element;
            const marker = element.querySelector('.num_option,.num_option_dx,.addMultipleChoice');
            const letter = (marker?.getAttribute('data') || marker?.textContent || '').trim().toUpperCase();
            return { index, text: choiceText(contentElement), letter, element, contentElement, input: null };
        }).filter(item => item.text);
    }
    if (root.matches('.Py-mian1')) {
        const marker = root.querySelector('[name^="answertype"],input[id^="answertype"]');
        const expectedId = (marker?.name || marker?.id || '').replace(/^answertype/, '').replace(/\D/g, '');
        return Array.from(root.querySelectorAll('li.clearfix[id-param]'))
            .filter(element => !expectedId || element.getAttribute('id-param').replace(/\D/g, '') === expectedId)
            .map((element, index) => {
            const textNode = element.querySelector('.fl.after,.after,.optionCon,.option-content');
            const text = choiceText(textNode || element);
            const letter = element.querySelector('em[id-param]')?.getAttribute('id-param')?.toUpperCase() || String.fromCharCode(65 + index);
            return { index, text, letter, element, input: null };
            }).filter(item => item.text);
    }
    const controls = Array.from(root.querySelectorAll('input[type="radio"],input[type="checkbox"]'));
    if (controls.length) return controls.map((input, index) => {
        const element = optionContainer(input, root);
        let text = choiceText(element);
        if (!text && type === 'judge') {
            const truth = booleanValue(input.value);
            if (truth !== null) text = truth ? '正确' : '错误';
        }
        return { index, text, element, input };
    });
    const candidates = Array.from(root.querySelectorAll('.judgeoption,.answerBg,.answer-item,.question-option,.selectBox,.answer_p,.answerList li,.stem_answer > div,.stem_answer > label,.stem_answer li,ul li'));
    return candidates.filter(item => !candidates.some(other => other !== item && other.contains(item)))
        .map((element, index) => ({ index, text: choiceText(element.querySelector('.optionCon,.option-content') || element), element, input: null }))
        .filter(item => item.text);
}

function readFields(root) {
    const namedEditors = Array.from(root.querySelectorAll('[id^="answerEditor"],[name^="answerEditor"],[data-editor-id]'));
    const editors = namedEditors.length ? namedEditors : Array.from(root.querySelectorAll('.edui-editor'));
    const fields = editors.filter(item => !editors.some(other => other !== item && other.contains(item)))
        .map(element => ({ kind: 'editor', element, id: element.dataset.editorId || (element.name?.startsWith('answerEditor') && element.name) || element.id }));
    const controls = Array.from(root.querySelectorAll('textarea,input[type="text"],[contenteditable="true"],.answerInput'));
    for (const element of controls) {
        if (fields.some(field => field.element === element || field.element.contains(element) || element.contains(field.element))) continue;
        if (element.closest('.edui-editor')) continue;
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
            const url = resourceUrl(element);
            if (!url) return;
            asset = { kind: 'image', url, alt: element.getAttribute('alt') || '' };
        }
        if (!asset) return;
        const key = JSON.stringify(asset);
        if (!seen.has(key)) { assets.push(asset); seen.add(key); }
    });
    return assets;
}

function readQuestions(document) {
    if (!document?.querySelectorAll) return [];
    const roots = questionRoots(document);
    return roots.map((element, index) => {
        const profile = profileFor(element);
        const titleNode = profile?.exercise ? exerciseStem(element, profile) : (profile && element.querySelector(profile.title)) || element.querySelector('.fontLabel') || element.querySelector(TITLE_SELECTOR) || element.querySelector('h3');
        const legacyId = element.dataset.questionId || element.getAttribute('data') || element.querySelector('.questionId')?.value;
        const typeInput = element.querySelector('[name^="answertype"],input[id^="answertype"]') ||
            (legacyId && Array.from(document.querySelectorAll('input[name]')).find(input => input.name === 'type' + legacyId));
        const titleText = visibleText(titleNode);
        const typeText = (profile?.type && visibleText(element.querySelector(profile.type))) || typeInput?.value || element.dataset.type || element.querySelector('li[qtype]')?.getAttribute('qtype') || visibleText(element.querySelector('.type_tit'));
        let type = normalizeType(typeText);
        if (type === 'unknown') type = normalizeType(titleText);
        const choices = readChoices(element, profile, type);
        const fields = readFields(element);
        if (type === 'unknown' && choices.length) {
            if (element.querySelector('input[type="checkbox"],[role="checkbox"]')) type = 'multiple';
            else if (!profile?.exercise || element.querySelector('input[type="radio"],[role="radio"],.radio')) type = 'single';
        }
        if (type === 'unknown' && fields.length) type = 'fill';
        const booleanOptions = normalizeBooleanOptions({ type, choices });
        if (booleanOptions) choices.forEach((choice, index) => {
            choice.text = booleanOptions[index].text;
            choice.letter = booleanOptions[index].letter;
        });
        const assets = [];
        const assetKeys = new Set();
        const containers = [titleNode, ...choices.map(choice => choice.contentElement || choice.element)].filter(Boolean);
        const encryptedFont = containers.some(hasEncryptedFont);
        for (const container of containers) {
            for (const asset of readAssets(container)) {
                const key = JSON.stringify(asset);
                if (!assetKeys.has(key)) { assets.push(asset); assetKeys.add(key); }
            }
        }
        const title = cleanTitle(titleText);
        if (profile?.exercise && (!title || !['single', 'multiple', 'judge'].includes(type) || !choices.length || /^(?:单选题?|多选题?|判断题?|是非题?|填空题?)$/.test(title))) return null;
        const suffix = (typeInput?.name || typeInput?.id)?.replace(/^(?:answertype|type)/, '') || legacyId || element.id || String(index + 1);
        const host = (element.matches('.Py-mian1') || (element.matches('.TiMu.newTiMu') && element.querySelector('li[qid]'))) ? {
            kind: element.matches('.Py-mian1') ? 'mobile-chapter' : 'modern-chapter',
            answerInput: Array.from(element.querySelectorAll('input[type="hidden"]')).find(input => {
                const key = input.name || input.id;
                return /^answer(?!type)/.test(key) && key.replace(/^answer/, '').replace(/\D/g, '') === suffix.replace(/\D/g, '');
            }) || null,
        } : null;
        const nativeId = (typeInput?.name || typeInput?.id)?.replace(/^(?:answertype|type)/, '') || legacyId || '';
        return { id: suffix, nativeId, title, type, options: choices.map(item => item.text), choices, fields, element, assets, host, encryptedFont };
    }).filter(question => question?.title);
}

function collectQuestions(document) {
    const seen = new Set();
    return readQuestions(document).flatMap(question => {
        if (question.encryptedFont) return [];
        const answer = readCollectedAnswer(question);
        if (!answer && !questionsReady([question])) return [];
        const item = { title: question.title, options: question.options.slice(), type: isBooleanChoice(question) ? 'judge' : question.type };
        if (question.assets.length) item.assets = question.assets;
        if (answer) Object.assign(item, answer);
        const key = JSON.stringify(item);
        if (seen.has(key)) return [];
        seen.add(key);
        return [item];
    });
}

function isReviewDocument(document) {
    const questions = readQuestions(document);
    return questions.length > 0 && questions.every(hasReviewEvidence);
}

function questionsReady(questions) {
    return questions.length > 0 && questions.every(question => question.type === 'fill' ? question.fields.length > 0 : ['single', 'multiple', 'judge'].includes(question.type) ? question.choices.length > 0 : true);
}

function waitForQuestions(document, { signal, timeoutMs = 10000, settleMs = 150, requireDecoded = false } = {}) {
    return new Promise((resolve, reject) => {
        const window = document.defaultView;
        let observer, timer, settleTimer, fingerprint = '', finished = false;
        const finish = (error, questions) => {
            if (finished) return;
            finished = true; clearTimeout(timer); clearTimeout(settleTimer); observer?.disconnect();
            signal?.removeEventListener('abort', abort);
            error ? reject(error) : resolve(questions);
        };
        const abort = () => finish(Object.assign(new Error('题目读取已取消'), { name: 'AbortError' }));
        const check = () => {
            const questions = readQuestions(document);
            const ready = questionsReady(questions) && (!requireDecoded || questions.every(question => !question.encryptedFont));
            const next = ready ? JSON.stringify(questions.map(question => [question.id, question.title, question.options, question.fields.length])) : '';
            if (next === fingerprint) return;
            fingerprint = next; clearTimeout(settleTimer);
            if (next) settleTimer = setTimeout(() => { const current = readQuestions(document); if (questionsReady(current) && (!requireDecoded || current.every(question => !question.encryptedFont))) finish(null, current); else check(); }, settleMs);
        };
        if (signal?.aborted) { abort(); return; }
        signal?.addEventListener('abort', abort, { once: true });
        observer = new window.MutationObserver(check);
        observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true });
        timer = setTimeout(() => finish(new Error('未识别到可作答题目，页面可能未加载完成、已提交或需要重新登录，请在学习通核对。')), timeoutMs);
        check();
    });
}

module.exports = { readQuestions, collectQuestions, isReviewDocument, visibleText, cleanTitle, waitForQuestions, questionsReady };
