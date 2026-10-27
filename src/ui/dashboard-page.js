'use strict';

function prepareDashboardPage({ document, window }) {
    const html = document.documentElement, body = document.body;
    const originalMarker = html.getAttribute('data-yixue-dashboard-page');
    const resetProperties = ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'margin', 'padding', 'zoom', 'transform', 'position', 'display', 'overflow', 'overflow-x', 'overflow-y'];
    const originalStyles = [html, body].map(node => resetProperties.map(key => [key, node.style.getPropertyValue(key), node.style.getPropertyPriority(key)]));
    [html, body].forEach(node => resetProperties.forEach(key => node.style.removeProperty(key)));
    html.setAttribute('data-yixue-dashboard-page', '');
    const style = document.createElement('style');
    style.dataset.yixueDashboardPageStyle = '';
    style.textContent = `
html[data-yixue-dashboard-page],html[data-yixue-dashboard-page] body {
    display:block!important;position:static!important;float:none!important;box-sizing:border-box!important;
    width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;
    transform:none!important;zoom:1!important;overflow-x:clip!important;overflow-y:auto!important;-webkit-text-size-adjust:100%;text-size-adjust:100%;
}
html[data-yixue-dashboard-page] { zoom:var(--yixue-page-zoom,1)!important; }
html[data-yixue-dashboard-page] body { background:#f5f7fb; }
html[data-yixue-dashboard-page] #yixue-ui-root { display:block;width:100%;min-width:0; }
`;
    document.head.append(style);
    const viewportContent = 'width=device-width,initial-scale=1,viewport-fit=cover';
    function ensureViewport() {
        const viewports = Array.from(document.querySelectorAll('meta')).filter(node => node.name.toLowerCase() === 'viewport');
        const viewport = viewports.shift() || document.createElement('meta');
        if (viewport.name !== 'viewport') viewport.name = 'viewport';
        if (viewport.content !== viewportContent) viewport.content = viewportContent;
        for (const duplicate of viewports) duplicate.remove();
        if (!viewport.isConnected) document.head.append(viewport);
    }
    function syncScale() {
        const width = html.clientWidth || window.innerWidth;
        const deviceWidth = window.screen?.width;
        const touch = window.matchMedia('(pointer: coarse)').matches;
        const desktopPhone = touch && deviceWidth > 0 && deviceWidth <= 600 && width >= 760 && width > deviceWidth * 1.25;
        const scale = desktopPhone ? width / deviceWidth : 1;
        const value = String(scale);
        if (html.style.getPropertyValue('--yixue-page-zoom') !== value) html.style.setProperty('--yixue-page-zoom', value);
    }
    let frame;
    function scheduleScale() { window.cancelAnimationFrame(frame); frame = window.requestAnimationFrame(syncScale); }
    ensureViewport(); syncScale(); scheduleScale();
    const observer = new window.MutationObserver(() => { ensureViewport(); scheduleScale(); });
    observer.observe(document.head, { subtree: true, childList: true, attributes: true, attributeFilter: ['name', 'content'] });
    window.addEventListener('resize', scheduleScale);
    window.addEventListener('orientationchange', scheduleScale);
    return () => {
        observer.disconnect(); window.cancelAnimationFrame(frame);
        window.removeEventListener('resize', scheduleScale); window.removeEventListener('orientationchange', scheduleScale);
        style.remove(); html.style.removeProperty('--yixue-page-zoom');
        [html, body].forEach((node, index) => {
            for (const [key, value, priority] of originalStyles[index]) if (value) node.style.setProperty(key, value, priority);
        });
        if (originalMarker === null) html.removeAttribute('data-yixue-dashboard-page');
        else html.setAttribute('data-yixue-dashboard-page', originalMarker);
    };
}

module.exports = prepareDashboardPage;
