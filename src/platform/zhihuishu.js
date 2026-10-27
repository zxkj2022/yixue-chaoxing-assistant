'use strict';

function classifyZhihuishu(href) {
    let url;
    try { url = new URL(href); } catch { return null; }
    if (!/^https?:$/.test(url.protocol)) return null;
    const host = url.hostname.toLowerCase(), path = url.pathname + url.hash;
    if (host === 'hike-teaching-center.polymas.com') return /\/tools-hike\/studentStudyResource|\/aidedteaching\/sourceLearning/.test(path) ? 'study' : null;
    if (host !== 'zhihuishu.com' && !host.endsWith('.zhihuishu.com')) return null;
    if (/\/(?:ReviewExam|studentReviewTestOrExam|exam)(?:[/?#]|$)|\/atHomeworkExam\/stu\/(?:homeworkQ\/exerciseList|examQ\/examexercise)/i.test(path)) return 'questions';
    if (host === 'onlineweb.zhihuishu.com' && /\/onlinestuh5(?:[/?#]|$)/.test(path)) return 'entry';
    if (host === 'studyvideoh5.zhihuishu.com' || host === 'studyplush5.zhihuishu.com') return 'study';
    if (/\/(?:learnPage|singleCourse|aidedteaching\/sourceLearning|tools-hike\/studentStudyResource)(?:[/?#]|$)/.test(path)) return 'study';
    if (['studywisdomh5.zhihuishu.com', 'wisdom-mooc.zhihuishu.com'].includes(host) && /\/study\/index(?:[/?#]|$)/.test(path)) return 'study';
    return null;
}

// Selectors identify supported course players and their chapter lists.
const profiles = [
    { name: '共享课', list: 'li.video', current: '.current_play', done: '.time_icofinish', title: '.catalogue_title' },
    { name: '新共享课', list: '.child-main', current: '.current', done: '.finish-icon', parentDone: true, filter: item => Boolean(item.parentElement?.querySelector('.child-time')) },
    { name: '校内课', list: '.file-item', current: '.active', done: '.icon-finish', title: '.file-name' },
    { name: '智慧课', list: '.chapter-content .chapter-item', current: '.current', done: '.finish-icon', children: '.chapter-content-second' },
    { name: 'AI智慧课', list: '[class*="card-container"]', current: '.active', done: '.finished-icon', title: '.common-text,.video-title', activate: '.common-text,.video-title,.basic-info-video-card-container', filter: item => Boolean(item.querySelector('.icon-box.video,.icon-box.audio,[class*="icon-box"][class*="video"],[class*="icon-box"][class*="audio"]')) },
    { name: '新形态课程', list: '.resources-list .resources-item', current: '.active,.current,.selected', done: '.finished-icon,.finish-icon', title: '.resource-title,.name', filter: item => Boolean(item.querySelector('.icon-box.video,.icon-box.audio,.file-type-video,.file-type-audio,[class*="file-type"][class*="video"],[class*="icon-box"][class*="video"]')) },
];

function createZhihuishuStudy({ document, window = document.defaultView, settings = { get: (_key, fallback) => fallback }, signal, emit = () => {}, pollMs = 1000 } = {}) {
    if (!document || !window) throw new Error('缺少智慧树页面');
    let running = false, paused = false, status = 'idle', blocked = '', profile, current, media, source = '', pending, timer, observer, scheduled, playing = false, requestedRate;
    let lastSnapshot = '', lastNotice = '', generation = 0;
    let removeMediaListeners = () => {};
    const endedItems = new WeakSet();
    const log = (message, tone = 'info') => emit({ type: 'log', message, tone });
    const title = item => String(item?.querySelector(profile?.title || '.catalogue_title,.name')?.textContent || item?.textContent || '当前媒体').replace(/\s+/g, ' ').trim();
    const snapshot = () => ({ status, running, paused, blocked, title: title(current), profile: profile?.name || '', rate: Number(media?.playbackRate) || 1 });
    const publish = () => { const value = snapshot(), encoded = JSON.stringify(value); if (encoded !== lastSnapshot) { lastSnapshot = encoded; emit({ type: 'state', ...value }); } };
    const notice = (key, message) => { if (lastNotice !== key) { lastNotice = key; log(message, 'warning'); } };
    const visible = (node, mediaElement = false) => {
        if (!node?.isConnected) return false;
        for (let item = node; item?.nodeType === 1; item = item.parentElement) {
            const style = item.ownerDocument.defaultView?.getComputedStyle(item);
            const nativeAudio = mediaElement && item === node && item.tagName === 'AUDIO';
            if (item.hidden || item.getAttribute('aria-hidden') === 'true' || style?.display === 'none' && !nativeAudio || style?.visibility === 'hidden') return false;
        }
        return mediaElement || node.getClientRects().length > 0;
    };
    const blocker = () => {
        if ([...document.querySelectorAll('.yidun_popup,.yidun_modal,.geetest_panel,.geetest_holder')].some(node => visible(node))) return 'captcha';
        if ([...document.querySelectorAll('#playTopic-dialog,.ai-test-question-wrapper,.ai-class-exercise-dialog')].some(node => visible(node))) return 'exercise';
        if ([...document.querySelectorAll('.el-dialog,.el-overlay-dialog,[role="dialog"]')].some(node => !node.closest('[data-yixue-course-ui]') && visible(node))) return 'dialog';
        return '';
    };
    const directory = () => {
        for (const candidate of profiles) {
            const items = [...document.querySelectorAll(candidate.list)].flatMap(item => candidate.children && item.querySelector(candidate.children) ? [...item.querySelectorAll(candidate.children)] : [item]).filter(item => !candidate.filter || candidate.filter(item));
            if (items.length) return { profile: candidate, items };
        }
        return { profile: null, items: [] };
    };
    const complete = item => Boolean((profile?.parentDone ? item.parentElement : item)?.querySelector(profile?.done || '.finish-icon'));
    const readableDocuments = () => {
        const docs = [document];
        for (const frame of document.querySelectorAll('iframe')) {
            try { if (frame.contentDocument) docs.push(frame.contentDocument); } catch { /* A cross-origin player is controlled by its own document. */ }
        }
        return docs;
    };
    const findMedia = () => {
        for (const doc of readableDocuments()) {
            const candidates = [...doc.querySelectorAll('#vjs_container_html5_api, .preview-section video, .video-player-wrapper video, video, audio')];
            const found = candidates.find(node => ['VIDEO', 'AUDIO'].includes(node.tagName) && visible(node, true) && (mediaSource(node) || node.readyState > 0));
            if (found) return found;
        }
        return null;
    };
    const mediaSource = node => node?.currentSrc || node?.src || node?.querySelector('source')?.src || '';
    const pauseMedia = () => { playing = false; if (media && !media.paused) media.pause(); };
    const unbind = () => { removeMediaListeners(); removeMediaListeners = () => {}; playing = false; media = null; source = ''; };
    const applyRate = () => {
        if (!media) return;
        const requested = Number(settings.get('beisu', 1));
        requestedRate = requested;
        const capped = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 1.5) : 1;
        const choices = [...document.querySelectorAll('[data-rate],[data-playback-rate],.speedList li,.speed-list li,.vjs-menu-item')].map(node => {
            const value = node.getAttribute('data-rate') || node.getAttribute('data-playback-rate');
            const text = String(node.textContent || '').trim();
            return Number(value || text.match(/^(\d+(?:\.\d+)?)\s*(?:x|倍)$/i)?.[1]);
        }).filter(value => Number.isFinite(value) && value > 0 && value <= capped);
        const rate = choices.length ? Math.max(...choices) : capped;
        try { media.playbackRate = rate; } catch { notice('rate', '平台未接受所选倍速，已保留播放器设置。'); }
        if (requested > 1.5) notice('rate-cap', '智慧树播放倍速最高按 1.5 倍设置；平台可以进一步限制。');
    };
    const play = () => {
        if (!running || paused || blocked || !media || media.ended || playing) return;
        const token = generation, target = media;
        playing = true;
        try {
            Promise.resolve(target.play()).catch(() => {
                if (!running || token !== generation || media !== target) return;
                playing = false; blocked = 'autoplay'; status = 'blocked';
                notice('autoplay', '浏览器未允许自动播放，请点击页面播放器后再继续。'); publish();
            });
        } catch { playing = false; blocked = 'autoplay'; status = 'blocked'; notice('autoplay', '播放器未能开始播放，请手动播放后继续。'); publish(); }
    };
    const advance = (manual = false) => {
        if (!running || signal?.aborted || (!manual && paused)) return false;
        const reason = blocker();
        if (reason || blocked && blocked !== 'autoplay') return false;
        if (pending) return false;
        const data = directory(); profile = data.profile;
        const active = data.items.find(item => item.matches(profile.current)) || current;
        const index = data.items.indexOf(active);
        const ordered = [...data.items.slice(index + 1), ...data.items.slice(0, Math.max(index, 0))];
        const next = ordered.find(item => item !== active && !complete(item) && !endedItems.has(item));
        if (!next) {
            if (manual) { log('未发现下一未完成媒体，请继续当前媒体并核对平台目录。', 'warning'); return false; }
            status = data.items.length ? 'finished' : 'ended'; running = false;
            log(data.items.length ? '目录中的可播放媒体已遍历，请核对学习平台的实际完成进度。' : '当前媒体已播放结束；未识别到下一目录，请在平台核对。', 'info');
            cleanup(); publish(); return false;
        }
        generation++;
        pending = { target: next, previous: media, source, started: Date.now() };
        status = 'switching'; pauseMedia(); unbind();
        log('切换媒体：' + title(next));
        (profile.activate && next.querySelector(profile.activate) || next).click();
        publish(); schedule(); return true;
    };
    const bind = next => {
        unbind(); media = next; source = mediaSource(next); generation++;
        const target = next;
        const ended = () => {
            if (media !== target || !running || paused || blocked || blocker()) return;
            if (current) endedItems.add(current);
            log('当前媒体已播放结束，平台完成状态仍需核对。');
            advance();
        };
        const mediaPaused = () => { playing = false; if (!running || paused || blocked || pending || target.ended || blocker()) return; paused = true; status = 'paused'; publish(); };
        const mediaPlaying = () => {
            if (!running || paused || blocker()) { pauseMedia(); return; }
            if (blocked === 'autoplay') blocked = '';
            playing = true; status = 'playing'; publish();
        };
        target.addEventListener('ended', ended); target.addEventListener('pause', mediaPaused); target.addEventListener('playing', mediaPlaying);
        removeMediaListeners = () => { target.removeEventListener('ended', ended); target.removeEventListener('pause', mediaPaused); target.removeEventListener('playing', mediaPlaying); };
        applyRate(); play();
    };
    const refresh = () => {
        if (!running || signal?.aborted) return;
        const data = directory(); profile = data.profile;
        const active = data.items.find(item => item.matches(profile.current));
        const changed = active && active !== current;
        if (active) current = active;
        const reason = blocker();
        if (reason) {
            blocked = reason; status = 'blocked'; pauseMedia();
            notice(reason, reason === 'captcha' ? '检测到验证码，请手动完成验证后继续。' : reason === 'exercise' ? '检测到随堂练习，请核对并处理题目后继续播放。' : '检测到平台弹窗，请手动处理后继续播放。'); publish(); return;
        }
        if (blocked && blocked !== 'autoplay') { blocked = ''; status = paused ? 'paused' : 'waiting'; lastNotice = ''; }
        const next = findMedia();
        if (pending) {
            const sourceChanged = next && (next !== pending.previous || mediaSource(next) !== pending.source);
            if (sourceChanged && (!active || active === pending.target)) pending = null;
            else {
                if (Date.now() - pending.started > 15000) { pending = null; paused = true; status = 'paused'; notice('switch-timeout', '下一媒体加载超时，请手动打开目录后点击继续。'); }
                publish(); return;
            }
        }
        if (paused) { status = 'paused'; pauseMedia(); publish(); return; }
        if (active && complete(active)) { advance(); return; }
        if (!next) { status = 'waiting'; notice('waiting', '等待平台播放器与媒体加载；请先打开具体课程资源。'); publish(); return; }
        if (next.ended) { if (current) endedItems.add(current); advance(); return; }
        if (next !== media || mediaSource(next) !== source || changed) { if (blocked === 'autoplay') blocked = ''; bind(next); }
        else if (!blocked && !playing && !next.ended) play();
        if (Number(settings.get('beisu', 1)) !== requestedRate) applyRate();
        if (!blocked) status = next.ended ? 'ended' : 'playing';
        publish();
    };
    function schedule() {
        if (!running || scheduled) return;
        scheduled = window.setTimeout(() => { scheduled = null; refresh(); }, 0);
    }
    function cleanup() {
        window.clearInterval(timer); window.clearTimeout(scheduled); timer = null; scheduled = null;
        observer?.disconnect(); observer = null; unbind();
        signal?.removeEventListener('abort', stop); window.removeEventListener('pagehide', stop);
    }
    function start() {
        if (signal?.aborted) { status = 'stopped'; publish(); return snapshot(); }
        if (running) return resume();
        running = true; paused = false; blocked = ''; status = 'waiting'; lastNotice = ''; generation++;
        observer = new window.MutationObserver(records => {
            if (records.some(record => !(record.target.nodeType === 1 ? record.target : record.target.parentElement)?.closest('#yixue-ui-root'))) schedule();
        });
        observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'src', 'style', 'hidden', 'aria-hidden'] });
        timer = window.setInterval(refresh, Math.max(20, Number(pollMs) || 1000));
        signal?.addEventListener('abort', stop, { once: true }); window.addEventListener('pagehide', stop, { once: true });
        refresh(); return snapshot();
    }
    function pause(value = true) {
        if (!value) return resume();
        paused = true; if (running) status = 'paused'; pauseMedia(); publish(); return snapshot();
    }
    function resume() {
        if (!running) return start();
        paused = false; blocked = ''; lastNotice = ''; playing = false; refresh(); return snapshot();
    }
    function stop() {
        running = false; paused = false; blocked = ''; pending = null; generation++; status = 'stopped'; pauseMedia(); cleanup(); publish(); return snapshot();
    }
    return { start, pause, resume, next: () => advance(true), stop, destroy: stop, snapshot };
}
module.exports = { classifyZhihuishu, createZhihuishuStudy };
