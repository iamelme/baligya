import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    return hashed;
  } catch (err) {
    return false;
  }
}
