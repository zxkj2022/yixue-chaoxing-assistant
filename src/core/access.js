'use strict';
function createCourseAccess({ questionBank, getValue, setValue, randomValues = bytes => crypto.getRandomValues(bytes) }) {
    const getLocalToken = () => {
        const value = getValue('yixueLocalToken', '');
        return typeof value === 'string' && value.length === 32 && /^[a-f0-9]{32}$/.test(value) ? value : '';
    };
    const getRealToken = () => { const value = questionBank.getToken(); return questionBank.isValidToken(value) ? value : ''; };
    const getDisplayToken = () => getRealToken() || getLocalToken();
    const createLocalToken = () => {
        const token = Array.from(randomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
        setValue('yixueLocalToken', token);
        return token;
    };
    const saveToken = value => {
        const token = String(value ?? '').trim();
        if (questionBank.isValidToken(token)) { questionBank.setToken(token); return token; }
        if (token && token === getLocalToken() && !getRealToken()) return token;
        throw new Error('请填写题库提供的 Token；本地随机 Token 不能用于查题。');
    };
    return { getLocalToken, getDisplayToken, createLocalToken, saveToken, hasAccess: () => Boolean(getDisplayToken()) };
}

module.exports = createCourseAccess;
