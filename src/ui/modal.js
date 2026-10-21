'use strict';

const { element, button, brand } = require('./dom');

function createModalHost({ document, window, root, logoUrl }) {
    const stack = [];
    const focusable = sheet => [...sheet.querySelectorAll('button, input, a[href], select, textarea, [tabindex]')]
        .filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);
    const keyboard = event => {
        const modal = stack.at(-1);
        if (!modal) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
            modal.close();
        } else if (event.key === 'Tab') {
            const items = focusable(modal.sheet);
            const index = items.indexOf(document.activeElement);
            if (!items.length) {
                event.preventDefault();
                modal.sheet.focus();
            } else if (index < 0 || (event.shiftKey && index === 0) || (!event.shiftKey && index === items.length - 1)) {
                event.preventDefault();
                items[event.shiftKey ? items.length - 1 : 0].focus();
            }
            event.stopImmediatePropagation();
        }
    };
    window.addEventListener('keydown', keyboard, true);

    function open({ id, title, subtitle = '', compact = false, onClose = () => {} }) {
        const previousFocus = document.activeElement;
        const layer = element(document, 'div', { id: `${id}-layer`, className: 'yx-modal-layer', 'data-yixue-course-ui': 'true' });
        const backdrop = element(document, 'div', { className: 'yx-modal-backdrop', 'aria-hidden': 'true' });
        const sheet = element(document, 'section', {
            id, className: `yx-course-sheet${compact ? ' yx-compact' : ''}`, role: 'dialog',
            'aria-modal': 'true', 'aria-label': title, tabIndex: -1,
        });
        const heading = element(document, 'div', { className: 'yx-course-heading' }, [
            brand(document, logoUrl, 'yx-course-mark'),
            element(document, 'div', {}, [element(document, 'h2', { text: title }), element(document, 'p', { className: 'yx-course-subtitle', text: subtitle })]),
        ]);
        const closeButton = button(document, '×', () => close(), { className: 'yx-close', 'aria-label': '关闭' });
        heading.append(closeButton);
        sheet.append(heading);
        layer.append(backdrop, sheet);
        root.append(layer);
        let closed = false;
        const cleanups = [];
        function close(value) {
            if (closed) return;
            closed = true;
            const wasTop = stack.at(-1) === handle;
            const index = stack.indexOf(handle);
            if (index >= 0) stack.splice(index, 1);
            for (const cleanup of cleanups) cleanup();
            layer.remove();
            onClose(value);
            if (wasTop) {
                const upper = stack.at(-1);
                if (upper) (focusable(upper.sheet)[0] || upper.sheet).focus();
                else if (previousFocus?.isConnected) previousFocus.focus?.();
            }
        }
        const handle = { sheet, layer, close, destroy: close, onCleanup: cleanup => cleanups.push(cleanup), get closed() { return closed; } };
        stack.push(handle);
        backdrop.addEventListener('click', () => { if (stack.at(-1) === handle) close(); });
        window.queueMicrotask(() => {
            if (!closed && stack.at(-1) === handle) (focusable(sheet)[0] || sheet).focus();
        });
        return handle;
    }

    return {
        open,
        closeAll: () => { for (const modal of [...stack].reverse()) modal.close(); },
        destroy: () => { for (const modal of [...stack].reverse()) modal.close(); window.removeEventListener('keydown', keyboard, true); },
    };
}

module.exports = createModalHost;
