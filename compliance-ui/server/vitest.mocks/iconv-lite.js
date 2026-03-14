// Mock for iconv-lite module
export function decode(buffer, encoding = 'utf8') {
    return buffer.toString(encoding);
}

export function encode(str, encoding = 'utf8') {
    return Buffer.from(str, encoding);
}

export function getCodec(encoding) {
    return {
        decode: (buffer) => buffer.toString(encoding),
        encode: (str) => Buffer.from(str, encoding),
    };
}

export default {
    decode,
    encode,
    getCodec,
};
