'use strict';

function createScreenAwake({ document, window, onChange }) {
    let enabled = true, running = false, disposed = false, version = 0;
    let lock = null, pending = null, state;
    const wanted = () => !disposed && enabled && running && !document.hidden;
    function report(value) {
        if (!disposed && value !== state) { state = value; onChange?.(value); }
    }
    function release(value) {
        if (!value || value.released) return;
        try { Promise.resolve(value.release()).catch(() => {}); } catch (_) {}
    }
    function sync() {
        if (disposed) return;
        if (!wanted()) {
            version++;
            const previous = lock; lock = null; release(previous);
            report(!running ? 'idle' : !enabled ? 'disabled' : 'background');
            return;
        }
        if (window.isSecureContext === false || typeof window.navigator?.wakeLock?.request !== 'function') { report('unavailable'); return; }
        if (lock && !lock.released) { report('active'); return; }
        if (pending) return;
        const requestedVersion = version;
        report('requesting');
        let request;
        try { request = window.navigator.wakeLock.request('screen'); }
        catch (_) { report('blocked'); return; }
        pending = Promise.resolve(request).then(value => {
            if (!wanted() || requestedVersion !== version) { release(value); return; }
            if (value.released) { report('released'); return; }
            lock = value;
            value.addEventListener('release', () => {
                if (lock !== value) return;
                lock = null;
                report(wanted() ? 'released' : !running ? 'idle' : !enabled ? 'disabled' : 'background');
            }, { once: true });
            report('active');
        }).catch(() => {
            if (wanted() && requestedVersion === version) report('blocked');
        }).finally(() => {
            pending = null;
            if (wanted() && requestedVersion !== version) sync();
        });
    }
    document.addEventListener('visibilitychange', sync);
    return {
        update(values = {}) {
            if (disposed) return;
            if (values.enabled !== undefined) enabled = Boolean(values.enabled);
            if (values.running !== undefined) running = Boolean(values.running);
            sync();
        },
        destroy() {
            if (disposed) return;
            disposed = true; version++;
            document.removeEventListener('visibilitychange', sync);
            const previous = lock; lock = null; release(previous);
        },
    };
}

module.exports = createScreenAwake;
