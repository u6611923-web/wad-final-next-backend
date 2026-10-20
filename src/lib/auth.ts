
import jwt, { JwtPayload } from "jsonwebtoken";

export type UserRole = "Student" | "Teacher";

export interface AuthPayload extends JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

export function generateToken(
  userId: string,
  email: string,
  role: UserRole
): string {
  return jwt.sign(
    { userId, email, role },
    getSecret(),
    { expiresIn: "7d" }
  );
}

export function verifyToken(
  token: string
): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      typeof decoded.email !== "string" ||
      !["Student", "Teacher"].includes(decoded.role)
    ) {
      return null;
    }

    return decoded as AuthPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(
  authorization: string | null
): string | null {
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  return match ? match[1] : null;
}

export const verifyJWT = verifyToken;