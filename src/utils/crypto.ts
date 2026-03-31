// src/utils/crypto.ts
import CryptoJS from 'crypto-js';

export const decryptAES = (encryptedBase64: string, aesKeyString: string) => {
  try {
    // 1. 把后端给的字符串密钥转成 CryptoJS 认识的格式
    const key = CryptoJS.enc.Utf8.parse(aesKeyString);

    // 2. 核心解密逻辑 (假设后端用的 ECB 模式 + Pkcs7 填充)
    const decrypted = CryptoJS.AES.decrypt(encryptedBase64, key, {
      mode: CryptoJS.mode.ECB, // 如果后端说用的是 CBC，这里就改成 CryptoJS.mode.CBC，并传入 iv
      padding: CryptoJS.pad.Pkcs7,
    });

    // 3. 把解密后的字节码转回 UTF-8 字符串
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      throw new Error('解密结果为空，可能是密钥错误或加密模式(ECB/CBC)不匹配');
    }
    
    return decryptedText;
  } catch (error) {
    console.error('❌ AES 解密引擎报错:', error);
    return null;
  }
};