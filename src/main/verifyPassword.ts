import bcrypt from "bcryptjs";

export default async function verifyPassword(hashed: string, password: string) {
  try {
    const verified = await bcrypt.compare(password, hashed);

    return verified;
  } catch (error) {
    return false;
  }
}
