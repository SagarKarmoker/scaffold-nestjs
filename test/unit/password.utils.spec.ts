import { hashPassword, comparePasswords } from 'src/common/utils/password.utils';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const hashed = await hashPassword('testPassword123');
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe('testPassword123');
      expect(typeof hashed).toBe('string');
    });

    it('should produce different hashes for same password', async () => {
      const hash1 = await hashPassword('samePassword');
      const hash2 = await hashPassword('samePassword');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      const result = await comparePasswords(password, hashed);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const hashed = await hashPassword('correctPassword');
      const result = await comparePasswords('wrongPassword', hashed);
      expect(result).toBe(false);
    });
  });
});
