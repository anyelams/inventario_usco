export const decodificarToken = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const tokenEsValido = (token) => {
  const claims = decodificarToken(token);
  if (!claims) return false;
  const ahora = Math.floor(Date.now() / 1000);
  return claims.exp > ahora;
};

export const getUserInitials = (nombre) => {
  if (!nombre) return 'U';
  const partes = nombre.trim().split(/\s+/);
  return partes.slice(0, 2).map((p) => p.charAt(0)).join('').toUpperCase();
};
