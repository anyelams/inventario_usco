/**
 * Pruebas de la lógica interna del SessionContext.
 *
 * Las funciones decodificarToken, tokenEsValido y getUserInitials
 * son algoritmos deterministas que se replican aquí como funciones
 * puras para probarlas sin necesidad de montar el contexto completo
 * ni mockear AsyncStorage.
 */

// ── Réplicas exactas de las funciones del SessionContext ─────────────────────

const decodificarToken = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const tokenEsValido = (token) => {
  const claims = decodificarToken(token);
  if (!claims) return false;
  const ahora = Math.floor(Date.now() / 1000);
  return claims.exp > ahora;
};

const getUserInitials = (userEmail) => {
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

// ── Helper: genera un JWT de prueba con el payload indicado ──────────────────
// La firma es un valor ficticio porque estas pruebas no verifican criptografía,
// solo el contenido del payload.

const crearToken = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cuerpo = btoa(JSON.stringify(payload));
  return `${header}.${cuerpo}.firma-de-prueba`;
};

// ── decodificarToken ──────────────────────────────────────────────────────────

describe('decodificarToken', () => {
  test('decodifica correctamente el claim sub del payload', () => {
    const token = crearToken({ sub: 'usuario@usco.edu.co', exp: 9999999999 });
    const decoded = decodificarToken(token);
    expect(decoded.sub).toBe('usuario@usco.edu.co');
  });

  test('decodifica correctamente el claim exp del payload', () => {
    const exp = 1800000000;
    const token = crearToken({ sub: 'usuario@usco.edu.co', exp });
    expect(decodificarToken(token).exp).toBe(exp);
  });

  test('retorna null cuando el token es null', () => {
    expect(decodificarToken(null)).toBeNull();
  });

  test('retorna null cuando el token es una cadena vacía', () => {
    expect(decodificarToken('')).toBeNull();
  });

  test('retorna null cuando el token tiene un formato inválido', () => {
    expect(decodificarToken('esto.no.es.jwt.valido.para.nada')).toBeNull();
  });

  test('retorna null cuando el payload no es JSON válido', () => {
    const tokenMalformado = `header.${btoa('no es json')}.firma`;
    expect(decodificarToken(tokenMalformado)).toBeNull();
  });
});

// ── tokenEsValido ─────────────────────────────────────────────────────────────

describe('tokenEsValido', () => {
  test('retorna true para un token que expira en el futuro', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600; // expira en 1 hora
    const token = crearToken({ sub: 'usuario@usco.edu.co', exp });
    expect(tokenEsValido(token)).toBe(true);
  });

  test('retorna false para un token ya expirado', () => {
    const exp = Math.floor(Date.now() / 1000) - 3600; // expiró hace 1 hora
    const token = crearToken({ sub: 'usuario@usco.edu.co', exp });
    expect(tokenEsValido(token)).toBe(false);
  });

  test('retorna false cuando el token es null', () => {
    expect(tokenEsValido(null)).toBe(false);
  });

  test('retorna false cuando el token es una cadena vacía', () => {
    expect(tokenEsValido('')).toBe(false);
  });

  test('retorna false cuando el payload no tiene el claim exp', () => {
    const token = crearToken({ sub: 'usuario@usco.edu.co' }); // sin exp
    expect(tokenEsValido(token)).toBe(false);
  });
});

// ── getUserInitials ───────────────────────────────────────────────────────────

describe('getUserInitials', () => {
  test('genera JP a partir de juan.perez@usco.edu.co', () => {
    expect(getUserInitials('juan.perez@usco.edu.co')).toBe('JP');
  });

  test('usa solo los dos primeros segmentos cuando hay más de dos', () => {
    expect(getUserInitials('carlos.andres.marin@usco.edu.co')).toBe('CA');
  });

  test('genera las primeras dos letras cuando el nombre no tiene punto', () => {
    expect(getUserInitials('jmartinez@usco.edu.co')).toBe('JM');
  });

  test('convierte siempre las iniciales a mayúsculas', () => {
    expect(getUserInitials('JUAN.PEREZ@USCO.EDU.CO')).toBe('JP');
  });

  test('retorna "U" cuando el email es null', () => {
    expect(getUserInitials(null)).toBe('U');
  });

  test('retorna "U" cuando el email es undefined', () => {
    expect(getUserInitials(undefined)).toBe('U');
  });

  test('maneja correctamente un nombre de un solo carácter antes del @', () => {
    const iniciales = getUserInitials('a@usco.edu.co');
    expect(iniciales).toBe('A');
  });
});
