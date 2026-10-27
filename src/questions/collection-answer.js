'use strict';
const { normalizeType, matchAnswer, splitAnswer, booleanValue, isBooleanChoice, normalizeBooleanOptions } = require('./matcher.js');
const { decodeFontCopy } = require('./font-codec.js');

const REVIEW_SELECTOR = '.Py_answer,.mark_answer,.answer,.answer-result,.answerResult,.answerBox,.answer-detail,.answerDetail,.rightAnswer,.correctAnswer,.right-answer,.correct-answer,.standard-answer,.reference-answer';
const STANDARD_SELECTOR = '.rightAnswer,.correctAnswer,.right-answer,.correct-answer,.standard-answer,.reference-answer';
const ANALYSIS_SELECTOR = '.analysis,.answer-analysis,.mark_analysis,.Py_Analysis,.answerAnalysis,.analysis-content';
const CORRECT_SELECTOR = '.Py_answer .dui,.mark_answer .dui,.answer-result .correct-mark,.grading-result.correct,[data-answer-status="correct"]';
const WRONG_SELECTOR = '.Py_answer .cuo,.mark_answer .cuo,.answer-result .wrong-mark,.grading-result.wrong,[data-answer-status="wrong"],[data-answer-status="partial"]';
const LABELS = /(正确答案|标准答案|参考答案|我的答案|你的答案|学生答案|答案解析|解析|本题得分|得分)\s*[:：]/g;

function isVisible(element) {
    if (!element || element.closest('script,style,noscript,input,textarea,select,button,[hidden],[aria-hidden="true"],#yixue-ui-root')) return false;
    for (let node = element; node?.nodeType === 1; node = node.parentElement) {
        const style = node.ownerDocument.defaultView?.getComputedStyle(node);
        if (style && (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || style.opacity === '0')) return false;
    }
    return true;
}

function reviewText(element) {
    if (!isVisible(element)) return '';
    // Preserve matching child positions while removing hidden descendants and form controls.
    function prune(original, cloned) {
        const originalChildren = [...original.children], clonedChildren = [...cloned.children];
        for (let index = originalChildren.length - 1; index >= 0; index--) {
            const child = originalChildren[index], counterpart = clonedChildren[index];
            if (!counterpart) continue;
            if (!isVisible(child)) counterpart.remove(); else prune(child, counterpart);
        }
    }
    const clean = element.cloneNode(true);
    if (decodeFontCopy(element, clean, { ignoreNode: node => !isVisible(node) })) return '';
    prune(element, clean);
    clean.querySelectorAll('br').forEach(node => node.replaceWith(clean.ownerDocument.createTextNode('\n')));
    clean.querySelectorAll('[data-latex],[data-formula],math').forEach(node => {
        const formula = node.getAttribute('data-latex') || node.getAttribute('data-formula') || node.getAttribute('alttext') || node.querySelector('annotation[encoding="application/x-tex"]')?.textContent;
        if (formula) node.textContent = formula;
    });
    clean.querySelectorAll('img').forEach(node => node.replaceWith(clean.ownerDocument.createTextNode(node.getAttribute('alt') || '[图片]')));
    clean.querySelectorAll('p,div,li,dd').forEach(node => node.append(clean.ownerDocument.createTextNode('\n')));
    return (clean.textContent || '').replace(/[\t \u00a0]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
}

function blankParts(raw) {
    const markers = [...raw.matchAll(/(?:^|\n)\s*[（(【\[]?(?:第\s*)?[\d一二三四五六七八九十]+\s*空\s*[）)】\]]?\s*[:：]\s*/g)];
    if (markers.length && !raw.slice(0, markers[0].index).replace(/[（(【\[]/g, '').trim()) {
        return markers.map((marker, index) => raw.slice(marker.index + marker[0].length, markers[index + 1]?.index ?? raw.length).replace(/[\s;；（(【\[]+$/g, '').trim());
    }
    return splitAnswer(raw);
}

function normalizeCollectedAnswer(question, raw, { source, analysis = '' } = {}) {
    if (!['published', 'graded_correct'].includes(source) || typeof raw !== 'string') return null;
    raw = raw.trim();
    if (!raw || raw.length > 10000 || /^(?:暂无答案|答案未公布|未公布|未提供|略|\[图片\]|[-*＊]+)$/.test(raw)) return null;
    const type = normalizeType(question.type);
    const judge = type === 'judge' || isBooleanChoice(question);
    let answer;
    if (judge && booleanValue(raw) !== null) answer = booleanValue(raw) ? '正确' : '错误';
    else if (['single', 'multiple', 'judge'].includes(type)) {
        const letters = /^[A-Z](?:[A-Z]|[\s,，、;；]+[A-Z])*$/i.test(raw.normalize('NFKC'));
        const match = matchAnswer(question, raw, { answerFormat: letters ? 'letters' : 'text' });
        if (!match.matched) return null;
        const booleanOptions = normalizeBooleanOptions(question);
        const options = booleanOptions ? booleanOptions.map(option => option.text) : question.choices?.length ? question.choices.map(choice => choice.text) : question.options || [];
        if (judge) {
            const truth = booleanValue(options[match.indices[0]]);
            if (truth === null) return null;
            answer = truth ? '正确' : '错误';
        } else answer = match.indices.map(index => options[index]).join('#!#');
    } else if (type === 'fill') {
        const parts = blankParts(raw);
        const count = question.fields?.length || parts.length;
        if (!parts.length || parts.some(part => !part) || parts.length !== count) return null;
        answer = parts.join('#!#');
    } else if (type === 'answer' || (type === 'unknown' && !/^[A-Z](?:[\s,，、;；]*[A-Z])*$/i.test(raw))) answer = raw;
    else return null;
    return { answer, answer_format: 'text', answer_source: source, analysis: typeof analysis === 'string' ? analysis.trim().slice(0, 20000) : '' };
}

function labeledAnswers(question, names) {
    const containers = [...question.element.querySelectorAll(REVIEW_SELECTOR)];
    const nodes = [...new Set(containers.flatMap(node => [node, ...node.querySelectorAll('span,p,div,dd,li')]))];
    const entries = [];
    for (const node of nodes) {
        const text = reviewText(node);
        const labels = [...text.matchAll(LABELS)];
        const values = [];
        for (let index = 0; index < labels.length; index++) {
            const label = labels[index];
            if (!names.includes(label[1])) continue;
            const value = text.slice(label.index + label[0].length, labels[index + 1]?.index ?? text.length).trim();
            if (value) values.push(value);
        }
        if (!labels.length && names.includes('正确答案') && node.matches(STANDARD_SELECTOR) && text) values.push(text);
        if (values.length) entries.push({ node, values });
    }
    const minimal = entries.filter(entry => !entries.some(other => other !== entry && entry.node.contains(other.node)));
    return [...new Set(minimal.flatMap(entry => entry.values))];
}

function grading(question) {
    const root = question.element;
    const text = [...root.querySelectorAll(REVIEW_SELECTOR + ',.grading-result')].map(reviewText).filter(Boolean).join('\n');
    const negative = [...root.querySelectorAll(WRONG_SELECTOR)].some(isVisible) || /(?:回答|作答|答题)(?:不正确|错误)|部分正确|你答错了/.test(text);
    const positive = [...root.querySelectorAll(CORRECT_SELECTOR)].some(isVisible) || /(?:本题)?(?:回答|作答|答题)正确|你答对了/.test(text);
    return !negative && positive;
}

function readCollectedAnswer(question) {
    const root = question.element;
    if (!root || question.encryptedFont) return null;
    const analysis = [...root.querySelectorAll(ANALYSIS_SELECTOR)].map(reviewText).find(Boolean)?.replace(/^(?:答案)?解析\s*[:：]?\s*/, '') || '';
    const published = labeledAnswers(question, ['正确答案', '标准答案', '参考答案']);
    const source = published.length ? 'published' : 'graded_correct';
    const candidates = published.length ? published : grading(question) ? labeledAnswers(question, ['我的答案', '你的答案', '学生答案']) : [];
    if (!candidates.length) return null;
    const normalized = candidates.map(raw => normalizeCollectedAnswer(question, raw, { source, analysis }));
    if (normalized.some(item => !item) || new Set(normalized.map(item => item.answer)).size !== 1) return null;
    return normalized[0];
}

function hasReviewEvidence(question) {
    return labeledAnswers(question, ['正确答案', '标准答案', '参考答案']).length > 0 ||
        [...question.element.querySelectorAll(CORRECT_SELECTOR + ',' + WRONG_SELECTOR)].some(isVisible) ||
        [...question.element.querySelectorAll('.grading-result')].some(node => /(?:回答|作答|答题)(?:正确|错误|不正确)|部分正确/.test(reviewText(node)));
}

function isReviewPath(href) {
    try { return /selectWorkQuestionYiPiYue|\/(?:viewWork|lookWork|workReview|reVersionPaperMarkContentNew)(?:[/?#]|$)|\/exam(?:-ans)?\/exam\/test\/(?:look|review)(?:[/?#]|$)/i.test(new URL(href).pathname); }
    catch { return false; }
}

module.exports = { normalizeCollectedAnswer, readCollectedAnswer, hasReviewEvidence, isReviewPath };
