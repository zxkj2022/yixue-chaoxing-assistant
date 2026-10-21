const { test } = require('node:test');
const assert = require('node:assert/strict');
const createCourseAccess = require('../src/core/access');

const localToken = '00010f107f80abef020304050607feff';
const realToken = 'tk_' + 'A'.repeat(43);
const LOCAL_KEY = 'yixueLocalToken';

function setup({ savedLocal, savedReal = '', bytes } = {}) {
    const storage = new Map(savedLocal === undefined ? [] : [[LOCAL_KEY, savedLocal]]);
    const writes = [];
    const tokenWrites = [];
    const apiCalls = [];
    let currentReal = savedReal;
    const questionBank = {
        getToken: () => currentReal,
        isValidToken: value => typeof value === 'string' && /^tk_[A-Za-z0-9_-]{43}$/.test(value),
        setToken: value => {
            tokenWrites.push(value);
            currentReal = value;
        },
    };
    for (const method of ['search', 'balance', 'refreshBalance', 'health', 'request']) {
        questionBank[method] = (...args) => {
            apiCalls.push({ method, args });
            throw new Error('Local course access must not contact the question bank');
        };
    }
    const options = {
        questionBank,
        getValue: (key, fallback) => storage.has(key) ? storage.get(key) : fallback,
        setValue: (key, value) => {
            writes.push({ key, value });
            storage.set(key, value);
        },
        randomValues: target => {
            assert.ok(target instanceof Uint8Array);
            assert.equal(target.length, 16);
            target.set(bytes ?? [0, 1, 15, 16, 127, 128, 171, 239, 2, 3, 4, 5, 6, 7, 254, 255]);
            return target;
        },
    };
    return {
        access: createCourseAccess(options), storage, writes, tokenWrites, apiCalls,
        recreate: () => createCourseAccess(options),
    };
}

test('fresh install has no access and does not write storage or contact the question bank', () => {
    const { access, writes, tokenWrites, apiCalls } = setup();
    assert.equal(access.getLocalToken(), '');
    assert.equal(access.getDisplayToken(), '');
    assert.equal(access.hasAccess(), false);
    assert.deepEqual(writes, []);
    assert.deepEqual(tokenWrites, []);
    assert.deepEqual(apiCalls, []);
});

test('local generation encodes all byte boundaries as exactly 32 lowercase hexadecimal characters', () => {
    const { access, storage, writes, tokenWrites, apiCalls, recreate } = setup();
    assert.equal(access.createLocalToken(), localToken);
    assert.equal(storage.get(LOCAL_KEY), localToken);
    assert.deepEqual(writes, [{ key: LOCAL_KEY, value: localToken }]);
    assert.equal(access.getDisplayToken(), localToken);
    assert.equal(access.hasAccess(), true);
    const refreshed = recreate();
    assert.equal(refreshed.getLocalToken(), localToken);
    assert.equal(refreshed.getDisplayToken(), localToken);
    assert.equal(refreshed.hasAccess(), true);
    assert.deepEqual(tokenWrites, []);
    assert.deepEqual(apiCalls, []);
});

for (const [label, bytes, expected] of [
    ['zero bytes', new Uint8Array(16), '0'.repeat(32)],
    ['maximum bytes', new Uint8Array(16).fill(255), 'f'.repeat(32)],
]) {
    test(`local generation preserves ${label} without truncation or missing zero padding`, () => {
        const { access, tokenWrites, apiCalls } = setup({ bytes });
        assert.equal(access.createLocalToken(), expected);
        assert.equal(access.getLocalToken(), expected);
        assert.deepEqual(tokenWrites, []);
        assert.deepEqual(apiCalls, []);
    });
}

for (const [index, invalid] of [
    '', null, false, 1234, {}, ['a'.repeat(32)],
    'a'.repeat(31), 'a'.repeat(33), 'A'.repeat(32), 'g'.repeat(32),
    ' ' + 'a'.repeat(32), 'a'.repeat(32) + '\n', realToken,
].entries()) {
    test(`invalid persisted local value ${index + 1} cannot unlock the console`, () => {
        const { access, writes, tokenWrites, apiCalls } = setup({ savedLocal: invalid });
        assert.equal(access.getLocalToken(), '');
        assert.equal(access.getDisplayToken(), '');
        assert.equal(access.hasAccess(), false);
        assert.deepEqual(writes, []);
        assert.deepEqual(tokenWrites, []);
        assert.deepEqual(apiCalls, []);
    });
}

test('only the exact persisted local token can be saved and remains isolated from real credentials', () => {
    const { access, storage, tokenWrites, apiCalls, recreate } = setup({ savedLocal: localToken });
    access.saveToken(' \t' + localToken + '\n');
    assert.equal(storage.get(LOCAL_KEY), localToken);
    assert.equal(recreate().getDisplayToken(), localToken);
    assert.equal(recreate().hasAccess(), true);
    assert.deepEqual(tokenWrites, []);
    assert.deepEqual(apiCalls, []);
});

for (const invalid of ['', '  ', 'a'.repeat(32), 'tk_short', 'not-a-token']) {
    test(`manually entered value ${JSON.stringify(invalid)} is rejected with an actionable message`, () => {
        const { access, writes, tokenWrites, apiCalls } = setup({ savedLocal: localToken });
        assert.throws(() => access.saveToken(invalid), /Token|令牌|标识|填写|凭据|格式/i);
        assert.equal(access.getLocalToken(), localToken);
        assert.deepEqual(writes, []);
        assert.deepEqual(tokenWrites, []);
        assert.deepEqual(apiCalls, []);
    });
}

test('an arbitrary 32-character local-looking token is rejected on a fresh install', () => {
    const { access, tokenWrites, apiCalls } = setup();
    assert.throws(() => access.saveToken(localToken), /Token|令牌|标识|填写|凭据|格式/i);
    assert.equal(access.hasAccess(), false);
    assert.deepEqual(tokenWrites, []);
    assert.deepEqual(apiCalls, []);
});

test('saving a real question-bank token trims it, preserves the local token and immediately takes priority', () => {
    const { access, storage, tokenWrites, apiCalls, recreate } = setup({ savedLocal: localToken });
    access.saveToken(' \t' + realToken + '\n');
    assert.deepEqual(tokenWrites, [realToken]);
    assert.equal(storage.get(LOCAL_KEY), localToken);
    assert.equal(access.getLocalToken(), localToken);
    assert.equal(access.getDisplayToken(), realToken);
    assert.equal(access.hasAccess(), true);
    assert.equal(recreate().getDisplayToken(), realToken);
    assert.deepEqual(apiCalls, []);
});

test('a valid real token grants access even without a local token', () => {
    const { access, tokenWrites, apiCalls } = setup({ savedReal: realToken });
    assert.equal(access.getLocalToken(), '');
    assert.equal(access.getDisplayToken(), realToken);
    assert.equal(access.hasAccess(), true);
    assert.deepEqual(tokenWrites, []);
    assert.deepEqual(apiCalls, []);
});

test('generating a local token never replaces an existing real token or changes its display priority', () => {
    const { access, tokenWrites, apiCalls, recreate } = setup({ savedReal: realToken });
    assert.equal(access.createLocalToken(), localToken);
    assert.equal(access.getLocalToken(), localToken);
    assert.equal(access.getDisplayToken(), realToken);
    assert.equal(recreate().getDisplayToken(), realToken);
    assert.deepEqual(tokenWrites, []);
    assert.deepEqual(apiCalls, []);
    assert.throws(() => access.saveToken(localToken), /Token|令牌|标识|填写|凭据|格式/i);
    assert.equal(access.getDisplayToken(), realToken);
    assert.deepEqual(tokenWrites, []);
    assert.deepEqual(apiCalls, []);
});

test('malformed real credentials do not mask a valid local token or grant access by themselves', () => {
    const local = setup({ savedLocal: localToken, savedReal: 'tk_invalid' });
    assert.equal(local.access.getDisplayToken(), localToken);
    assert.equal(local.access.hasAccess(), true);
    const empty = setup({ savedReal: 'tk_invalid' });
    assert.equal(empty.access.getDisplayToken(), '');
    assert.equal(empty.access.hasAccess(), false);
    assert.deepEqual(local.tokenWrites, []);
    assert.deepEqual(local.apiCalls, []);
    assert.deepEqual(empty.tokenWrites, []);
    assert.deepEqual(empty.apiCalls, []);
});
