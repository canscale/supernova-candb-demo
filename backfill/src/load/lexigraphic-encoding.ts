// Code taken from https://github.com/substack/lexicographic-integer/blob/master/index.js


export function pack (n: number, enc?: 'hex'): string | number[] {
    n = Math.floor(n);
    // modify the original algorithm above to account for negative numbers
    // https://stackoverflow.com/questions/9939760/how-do-i-convert-an-integer-to-binary-in-javascript
    if (n < 0) return `-${(n >>> 0).toString(2)}`
    if (n < 0 || n === Infinity) throw new Error();
    
    var bytes;
    var max = 251;
    var x = n - max;
    
    if (n < max) {
        bytes = [ n ];
    }
    else if (x < 256) {
        bytes = [ max, x ];
    }
    else if (x < 256*256) {
        bytes = [ max + 1, Math.floor(x / 256), x % 256 ];
    }
    else if (x < 256*256*256) {
        bytes = [
            max + 2,
            Math.floor(x / 256 / 256),
            Math.floor(x / 256) % 256,
            x % 256
        ];
    }
    else if (x < 256*256*256*256) {
        bytes = [
            max + 3,
            Math.floor(x / 256 / 256 / 256),
            Math.floor(x / 256 / 256) % 256,
            Math.floor(x / 256) % 256,
            x % 256
        ];
    }
    else {
        var exp = Math.floor(Math.log(x) / Math.log(2)) - 32;
        bytes = [ 255 ];
        bytes.push.apply(bytes, pack(exp) as number[]);
        var res = x / Math.pow(2, exp - 11);
        bytes.push.apply(bytes, bytesOf(x / Math.pow(2, exp - 11)));
    }
    if (enc === 'hex') return encodeHex(bytes);
    // else -> enc === undefined 
    else return bytes;
};


function encodeHex(bytes: number[]) {
    var s = '';
    for (var i = 0, l = bytes.length; i < l; i++) {
        var b = bytes[i];
        var c = b.toString(16);
        if (b < 16) c = '0' + c;
        s += c;
    }
    return s;
}

function bytesOf (x: number) {
    x = Math.floor(x);
    var bytes = [];
    for (var i = 0, d = 1; i < 6; i++, d *= 256) {
        bytes.unshift(Math.floor(x / d) % 256);
    }
    return bytes;
}