import jwt, { SignOptions } from "jsonwebtoken";
import { StringValue } from "ms";

export interface JwtPayload {
  userId: string;
  email: string;
}

export class JwtUtils {
  static generateToken(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined");

    const expires: StringValue = (process.env.JWT_EXPIRE_IN || "7d") as StringValue;

    const options: SignOptions = { expiresIn: expires };

    return jwt.sign(payload, secret, options);
  }

  static verifyToken(token: string): JwtPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined");

    return jwt.verify(token, secret) as JwtPayload;
  }
}
