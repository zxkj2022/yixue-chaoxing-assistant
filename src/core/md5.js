'use strict';
// Independent implementation of the RFC 1321 algorithm, for host protocol compatibility.
// Specification: https://www.rfc-editor.org/rfc/rfc1321 (not its reference C implementation).
const rotations = [[7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]];
const constants = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0);

function md5(value) {
    const input = new TextEncoder().encode(String(value));
    const size = Math.ceil((input.length + 9) / 64) * 64;
    const bytes = new Uint8Array(size);
    bytes.set(input);
    bytes[input.length] = 128;
    const view = new DataView(bytes.buffer);
    const bits = BigInt(input.length) * 8n;
    view.setUint32(size - 8, Number(bits & 0xffffffffn), true);
    view.setUint32(size - 4, Number(bits >> 32n), true);
    const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    for (let offset = 0; offset < size; offset += 64) {
        let [a, b, c, d] = state;
        for (let step = 0; step < 64; step++) {
            const round = Math.floor(step / 16);
            let mixed, word;
            if (round === 0) { mixed = (b & c) | (~b & d); word = step; }
            else if (round === 1) { mixed = (d & b) | (~d & c); word = (5 * step + 1) % 16; }
            else if (round === 2) { mixed = b ^ c ^ d; word = (3 * step + 5) % 16; }
            else { mixed = c ^ (b | ~d); word = (7 * step) % 16; }
            const sum = (a + mixed + constants[step] + view.getUint32(offset + 4 * word, true)) >>> 0;
            const shift = rotations[round][step % 4];
            const next = (b + ((sum << shift) | (sum >>> (32 - shift)))) >>> 0;
            [a, b, c, d] = [d, next, b, c];
        }
        [a, b, c, d].forEach((word, index) => { state[index] = (state[index] + word) >>> 0; });
    }
    return state.map(word => Array.from({ length: 4 }, (_, index) => ((word >>> (index * 8)) & 255).toString(16).padStart(2, '0')).join('')).join('');
}
module.exports = md5;
