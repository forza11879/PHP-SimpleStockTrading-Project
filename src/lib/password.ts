import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

/**
 * Password checking. Passwords are only ever checked as bcrypt hashes; the
 * legacy plain-text DB dump passwords were migrated to hashes in the seeds,
 * so no plain comparison path remains.
 */
export function verifyPassword(plain: string, stored: string): boolean {
  return bcrypt.compareSync(plain, stored);
}

export function isValidPassword(pass: string): string | true {
  if (pass.length < 6) return "Password too short, must be 6 characters or longer";
  if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(pass)) return "Password must contain at least one digit";
  return true;
}

export function generateRandomString(length = 10): string {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}