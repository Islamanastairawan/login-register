export default class encryption {
    constructor(key) {
        this.key = key;
    }

    // Enkripsi teks
    encrypt(text) {
        let result = '';
        let keyIndex = 0;
        
        for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i);
            
            if (char.match(/[a-zA-Z0-9]/)) {
                const charCode = text.charCodeAt(i);
                const keyChar = this.key.charCodeAt(keyIndex % this.key.length);
                const shift = keyChar % 26;

                let encryptedCharCode;
                if (char.match(/[A-Z]/)) {
                    encryptedCharCode = ((charCode - 65 + shift) % 26) + 65;
                } else if (char.match(/[a-z]/)) {
                    encryptedCharCode = ((charCode - 97 + shift) % 26) + 97;
                } else { // Angka
                    encryptedCharCode = ((charCode - 48 + shift) % 10) + 48;
                }

                result += String.fromCharCode(encryptedCharCode);
                keyIndex++;
            } else {
                result += char;
            }
        }
        
        return result;
    }

    // Dekripsi teks
    decrypt(text) {
        let result = '';
        let keyIndex = 0;
        
        for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i);
            
            if (char.match(/[a-zA-Z0-9]/)) {
                const charCode = text.charCodeAt(i);
                const keyChar = this.key.charCodeAt(keyIndex % this.key.length);
                const shift = keyChar % 26;

                let decryptedCharCode;
                if (char.match(/[A-Z]/)) {
                    // RUMUS MODULO YANG DIPERBAIKI
                    decryptedCharCode = ((((charCode - 65 - shift) % 26) + 26) % 26) + 65;
                } else if (char.match(/[a-z]/)) {
                    // RUMUS MODULO YANG DIPERBAIKI
                    decryptedCharCode = ((((charCode - 97 - shift) % 26) + 26) % 26) + 97;
                } else { // Angka
                    // RUMUS MODULO YANG DIPERBAIKI
                    decryptedCharCode = ((((charCode - 48 - shift) % 10) + 10) % 10) + 48;
                }

                result += String.fromCharCode(decryptedCharCode);
                keyIndex++;
            } else {
                result += char;
            }
        }
        
        return result;
    }
}