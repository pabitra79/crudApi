import bcrypt from 'bcrypt';

export class PasswordUtils {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(
    enteredPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(enteredPassword, hashedPassword);
  }
}