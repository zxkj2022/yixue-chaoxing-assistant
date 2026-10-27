'use strict';

function createChapterVisits({ document, window, store, context, onLog, signal, intervalMs = 10000 } = {}) {
    const key = 'yixueChapterVisits:' + [context?.uid, context?.courseId, context?.classId].map(value => encodeURIComponent(String(value || ''))).join(':');
    const interval = Math.max(1000, Math.min(60000, Number(intervalMs) || 10000));
    const now = () => window?.Date?.now?.() ?? Date.now();
    const log = message => { try { onLog?.(message); } catch (_) {} };
    let active = false, paused = false, timer = null, misses = 0, steps = 0, deadline = 0;
    let seen = new Set();
    const read = (name, fallback) => { try { return store.read(name, fallback); } catch (_) { return fallback; } };
    const write = (name, value) => { try { store.write(name, value); } catch (_) {} };

    function hrefKey(raw) {
        try {
            const url = new URL(raw, document.baseURI || window.location.href);
            if (!['http:', 'https:'].includes(url.protocol) || url.origin !== window.location.origin || url.username || url.password || !/\/studentstudy(?:$|[/.])/i.test(url.pathname)) return '';
            const get = names => names.map(name => url.searchParams.get(name)).find(Boolean) || '';
            const course = get(['courseId', 'courseid']), clazz = get(['clazzid', 'classid', 'classId']);
            if ((course && context?.courseId && course !== String(context.courseId)) || (clazz && context?.classId && clazz !== String(context.classId))) return '';
            const chapter = get(['chapterId', 'chapterid', 'knowledgeid', 'knowledgeId']);
            if (!chapter) return '';
            return ['href', url.origin, url.pathname, course || context?.courseId || '', clazz || context?.classId || '', chapter].join('|');
        } catch (_) { return ''; }
    }
    function candidates() {
        const unique = new Map();
        for (const element of document.querySelectorAll('.posCatalog_name,a')) {
            if (element.hidden || element.disabled || element.getAttribute('aria-disabled') === 'true' || element.closest('[hidden],[aria-hidden="true"]')) continue;
            const onclick = element.getAttribute('onclick') || '';
            const href = element.getAttribute('href') || '';
            let identity = '';
            if (/\bgetTeacherAjax\s*\(/.test(onclick)) identity = 'onclick:' + onclick.trim();
            else if (/^javascript:\s*getTeacherAjax\s*\(/i.test(href)) identity = 'onclick:' + href.replace(/^javascript:\s*/i, '').trim();
            else if (href) identity = hrefKey(href);
            if (identity && !unique.has(identity)) unique.set(identity, { identity, element });
        }
        return [...unique.values()];
    }
    function cleanup() {
        active = false;
        if (timer !== null) window.clearTimeout(timer);
        timer = null;
        signal?.removeEventListener('abort', stop);
        window.removeEventListener('pagehide', cleanup);
    }
    function stop() {
        cleanup();
        write('doxxcs', false);
    }
    function schedule() {
        if (active) timer = window.setTimeout(tick, interval);
    }
    function tick() {
        timer = null;
        if (!active) return;
        if (signal?.aborted || read('doxxcs', false) !== true) { stop(); return; }
        if (now() >= deadline || steps >= 300 || seen.size >= 300) { log('章节访问辅助已达到本次运行上限，已停止。'); stop(); return; }
        if (paused) { schedule(); return; }
        const available = candidates();
        const next = available.find(candidate => !seen.has(candidate.identity));
        if (!next) {
            if (!available.length && ++misses < 3) { schedule(); return; }
            log(available.length ? '本次可访问的章节已遍历结束。' : '未找到可访问的章节入口，请打开课程章节目录。');
            stop(); return;
        }
        misses = 0;
        seen.add(next.identity); steps++;
        write(key, [...seen].slice(-300));
        try { next.element.click(); log('已打开第 ' + steps + ' 个章节入口，学习记录以平台更新为准。'); }
        catch (_) { log('章节入口未能打开，请在课程页面核对。'); stop(); return; }
        schedule();
    }
    function start() {
        if (active) return true;
        if (!document || !window || signal?.aborted || read('doxxcs', false) !== true) return false;
        if (window.performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload') {
            write('doxxcs', false); log('页面已刷新，章节访问辅助已停止。'); return false;
        }
        const stored = read(key, []);
        seen = new Set(Array.isArray(stored) ? stored.filter(value => typeof value === 'string').slice(-300) : []);
        const current = hrefKey(window.location.href);
        if (current) seen.add(current);
        active = true; paused = false; misses = 0; steps = 0; deadline = now() + 30 * 60 * 1000;
        signal?.addEventListener('abort', stop, { once: true });
        window.addEventListener('pagehide', cleanup);
        schedule();
        return true;
    }
    return { start, stop, pause(value = true) { paused = value !== false; } };
}

module.exports = { createChapterVisits };
