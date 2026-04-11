import forge from 'node-forge';
import { decryptAES_GCM } from '../crypto';

jest.mock('node-forge');

describe('decryptAES_GCM', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('应该成功解密有效的GCM密文', () => {
    // 准备
    const mockPlaintext = 'Hello, World!';
    const keyBytes = 'mock-key-bytes';
    const payloadBytes = 'nonce-12bytes' + 'ciphertext' + 'tag-16bytes';
    
    // Mock forge 方法
    (forge.util.decode64 as jest.Mock)
      .mockReturnValueOnce(keyBytes) // key
      .mockReturnValueOnce(payloadBytes); // payload

    const mockBuffer = {
      length: () => payloadBytes.length,
      getBytes: jest.fn()
        .mockReturnValueOnce('nonce-12bytes') // nonce
        .mockReturnValueOnce('ciphertext') // ciphertext
        .mockReturnValueOnce('tag-16bytes'), // tag
    };

    (forge.util.createBuffer as jest.Mock).mockReturnValue(mockBuffer);

    const mockDecipher = {
      start: jest.fn(),
      update: jest.fn(),
      finish: jest.fn().mockReturnValue(true),
      output: {
        getBytes: jest.fn().mockReturnValue(mockPlaintext),
      },
    };

    (forge.cipher.createDecipher as jest.Mock).mockReturnValue(mockDecipher);
    (forge.util.decodeUtf8 as jest.Mock).mockReturnValue(mockPlaintext);

    // 执行
    const result = decryptAES_GCM('encrypted-base64', 'key-base64');

    // 验证
    expect(result).toBe(mockPlaintext);
    expect(mockDecipher.start).toHaveBeenCalled();
    expect(mockDecipher.update).toHaveBeenCalled();
    expect(mockDecipher.finish).toHaveBeenCalled();
  });

  it('当 GCM finish() 返回 false 时应该返回 null', () => {
    const keyBytes = 'mock-key-bytes';
    const payloadBytes = 'nonce-12bytes' + 'ciphertext' + 'tag-16bytes';

    (forge.util.decode64 as jest.Mock)
      .mockReturnValueOnce(keyBytes)
      .mockReturnValueOnce(payloadBytes);

    const mockBuffer = {
      length: () => payloadBytes.length,
      getBytes: jest.fn()
        .mockReturnValueOnce('nonce-12bytes')
        .mockReturnValueOnce('ciphertext')
        .mockReturnValueOnce('tag-16bytes'),
    };

    (forge.util.createBuffer as jest.Mock).mockReturnValue(mockBuffer);

    const mockDecipher = {
      start: jest.fn(),
      update: jest.fn(),
      finish: jest.fn().mockReturnValue(false), // ❌ GCM 校验失败
    };

    (forge.cipher.createDecipher as jest.Mock).mockReturnValue(mockDecipher);

    const result = decryptAES_GCM('encrypted-base64', 'key-base64');

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('GCM finish() 返回 false')
    );
  });

  it('当异常时应该捕获并返回 null', () => {
    (forge.util.decode64 as jest.Mock).mockImplementation(() => {
      throw new Error('Base64 decode failed');
    });

    const result = decryptAES_GCM('invalid-base64', 'key-base64');

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('解密引擎发生内部崩溃'),
      expect.any(Error)
    );
  });

  it('应该正确处理钥匙长度检验', () => {
    const keyBytes = 'key32-bytes-for-aes256'; // 假设是 32 字节
    const payloadBytes = 'nonce-12bytes' + 'ciphertext' + 'tag-16bytes';

    (forge.util.decode64 as jest.Mock)
      .mockReturnValueOnce(keyBytes)
      .mockReturnValueOnce(payloadBytes);

    const mockBuffer = {
      length: () => payloadBytes.length,
      getBytes: jest.fn()
        .mockReturnValueOnce('nonce-12bytes')
        .mockReturnValueOnce('ciphertext')
        .mockReturnValueOnce('tag-16bytes'),
    };

    (forge.util.createBuffer as jest.Mock).mockReturnValue(mockBuffer);

    const mockDecipher = {
      start: jest.fn(),
      update: jest.fn(),
      finish: jest.fn().mockReturnValue(true),
      output: { getBytes: jest.fn().mockReturnValue('plaintext') },
    };

    (forge.cipher.createDecipher as jest.Mock).mockReturnValue(mockDecipher);
    (forge.util.decodeUtf8 as jest.Mock).mockReturnValue('plaintext');

    decryptAES_GCM('encrypted-base64', 'key-base64');

    // 验证 console.log 记录了诊断信息
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('钥匙长度')
    );
  });

  it('应该正确分割 Nonce、密文和 Tag', () => {
    const keyBytes = 'key32';
    const payloadBytes = 'nonce-12bytes' + 'cipher-data' + 'tag-16bytes';

    (forge.util.decode64 as jest.Mock)
      .mockReturnValueOnce(keyBytes)
      .mockReturnValueOnce(payloadBytes);

    const mockBuffer = {
      length: () => payloadBytes.length,
      getBytes: jest.fn()
        .mockReturnValueOnce('nonce-12bytes') // 前 12 字节
        .mockReturnValueOnce('cipher-data') // 中间数据
        .mockReturnValueOnce('tag-16bytes'), // 最后 16 字节
    };

    (forge.util.createBuffer as jest.Mock).mockReturnValue(mockBuffer);

    const mockDecipher = {
      start: jest.fn(),
      update: jest.fn(),
      finish: jest.fn().mockReturnValue(true),
      output: { getBytes: jest.fn().mockReturnValue('plaintext') },
    };

    (forge.cipher.createDecipher as jest.Mock).mockReturnValue(mockDecipher);
    (forge.util.decodeUtf8 as jest.Mock).mockReturnValue('plaintext');

    decryptAES_GCM('encrypted-base64', 'key-base64');

    // 验证 getBytes 被正确调用了三次
    expect(mockBuffer.getBytes).toHaveBeenCalledTimes(3);
  });
});
