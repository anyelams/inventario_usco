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

export const getUserInitials = (userEmail) => {
  if (!userEmail) return 'U';
  const email = userEmail.toLowerCase();
  const partes = email.split('@')[0];
  if (partes.includes('.')) {
    return partes
      .split('.')
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase();
  }
  return partes.substring(0, 2).toUpperCase();
};
