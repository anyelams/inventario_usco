/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * @param {string} token - JWT en formato estándar (header.payload.signature)
 * @returns {object|null} Payload decodificado, o null si el token es inválido
 */
export const decodificarToken = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

/**
 * Verifica si un JWT no ha expirado comparando el claim `exp` con la hora actual.
 * @param {string} token - JWT a verificar
 * @returns {boolean} true si el token es válido y no ha expirado
 */
export const tokenEsValido = (token) => {
  const claims = decodificarToken(token);
  if (!claims) return false;
  const ahora = Math.floor(Date.now() / 1000);
  return claims.exp > ahora;
};

/**
 * Genera las iniciales a partir de un nombre completo (máximo 2 letras).
 * @param {string} nombre - Nombre completo o email del usuario
 * @returns {string} Iniciales en mayúscula, o 'U' si no hay nombre
 */
export const getUserInitials = (nombre) => {
  if (!nombre) return 'U';
  const partes = nombre.trim().split(/\s+/);
  return partes.slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();
};
