import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-me';

/**
 * Signe un token JWT pour l'utilisateur
 */
export function signToken(payload: object, expiresIn: string = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as '24h' });
}

/**
 * Vérifie la validité d'un token JWT
 */
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Décode un token JWT sans vérifier la signature
 */
export function decodeToken(token: string) {
  return jwt.decode(token);
}
