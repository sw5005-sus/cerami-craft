import { isTokenValid } from '../../utils/auth';

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn((token) => {
    if (token === 'valid-token') {
      return {
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
    }
    if (token === 'expired-token') {
      return {
        exp: Math.floor(Date.now() / 1000) - 60, // 1 min ago
      };
    }
    throw new Error('Invalid token');
  }),
}));

describe('Auth Utils - isTokenValid', () => {
  it('should return false for null token', () => {
    expect(isTokenValid(null)).toBe(false);
  });

  it('should return false for empty string token', () => {
    expect(isTokenValid('')).toBe(false);
  });

  it('should return true for valid token', () => {
    expect(isTokenValid('valid-token')).toBe(true);
  });

  it('should return false for expired token', () => {
    expect(isTokenValid('expired-token')).toBe(false);
  });
});
