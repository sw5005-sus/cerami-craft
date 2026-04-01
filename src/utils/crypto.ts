import forge from 'node-forge';

export const decryptAES_GCM = (encryptedBase64: string, aesKeyBase64: string): string | null => {
  try {
    console.log('--- 🔐 启动 GCM 终极解密引擎 ---');
    
    // 1. 将 Base64 还原为二进制字符串
    const keyBytes = forge.util.decode64(aesKeyBase64);
    const payloadBytes = forge.util.decode64(encryptedBase64);

    console.log(`[诊断] 钥匙长度: ${keyBytes.length} 字节 (GCM-256 必须是 32)`);
    console.log(`[诊断] 载荷总长度: ${payloadBytes.length} 字节`);

    // 2. 🛡️ 核心修复：使用 Forge 专属的 Buffer 进行极度精准的字节切割
    const payloadBuffer = forge.util.createBuffer(payloadBytes, 'raw');

    // 按照后端规则：前 12 字节是 Nonce，最后 16 字节是 Tag，中间是密文
    const nonce = payloadBuffer.getBytes(12);
    
    // 剩下的长度里，扣除最后 16 个字节的 Tag，剩下的就是密文
    const cipherLength = payloadBuffer.length() - 16;
    const ciphertext = payloadBuffer.getBytes(cipherLength);
    
    const tag = payloadBuffer.getBytes(16);

    console.log(`[诊断] 切割结果 -> Nonce: ${nonce.length}, 密文: ${ciphertext.length}, Tag: ${tag.length} (必须是16)`);

    // 3. 组装解密器
    const decipher = forge.cipher.createDecipher('AES-GCM', keyBytes);
    
    decipher.start({
      iv: nonce,
      tag: forge.util.createBuffer(tag, 'raw'), 
      // ⚠️ 极其小众的坑：问一下后端，有没有用 AAD (Additional Authenticated Data)？
      // 如果后端加了 AAD，这里必须加上 additionalData: 'xxx'，否则一定失败！
    });
    
    decipher.update(forge.util.createBuffer(ciphertext, 'raw'));
    
    // 4. 一锤定音的校验
    const pass = decipher.finish();

    if (pass) {
      const result = forge.util.decodeUtf8(decipher.output.getBytes());
      console.log('✅ GCM 校验完美通过！');
      return result;
    } else {
      console.error('❌ GCM finish() 返回 false：密文或 Tag 遭破坏，或者钥匙不对！');
      return null;
    }
  } catch (error) {
    console.error('🚨 解密引擎发生内部崩溃:', error);
    return null;
  }
};