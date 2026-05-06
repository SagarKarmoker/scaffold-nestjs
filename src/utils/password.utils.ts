import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error hashing password:', error.message);
    }
    throw error;
  }
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error comparing passwords:', error.message);
    }
    throw error;
  }
}
