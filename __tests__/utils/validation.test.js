import {
  validateEmail,
  getPasswordStrength,
  validateLoginForm,
  validateRegisterForm,
  getErrorMessage,
} from '../../utils/validation';

// Mock de t() que devuelve el texto directamente para que las aserciones sean legibles
const t = (key, options) => {
  if (key === 'password.missing' && options?.items) return `Faltan: ${options.items}`;
  const textos = {
    'validation.emailRequired':       'Ingresa tu correo',
    'validation.emailInvalid':        'Correo inválido',
    'validation.passwordRequired':    'Ingresa tu contraseña',
    'validation.confirmPasswordRequired': 'Confirma tu contraseña',
    'validation.passwordsDontMatch':  'Las contraseñas no coinciden',
    'validation.fullNameRequired':    'El nombre es requerido',
    'validation.fullNameMinLength':   'Mínimo 2 caracteres',
    'password.secure':                'Contraseña segura',
    'password.requirements.length':   '8+ caracteres',
    'password.requirements.uppercase':'mayúscula',
    'password.requirements.number':   'número',
    'password.requirements.special':  'carácter especial',
    'errors.loginFailed':             'Usuario o contraseña incorrectos',
    'errors.accountNotFound':         'Cuenta no encontrada',
    'errors.invalidData':             'Datos inválidos',
    'errors.serverError':             'Error del servidor',
    'errors.networkError':            'Error de conexión',
    'errors.connectionTimeout':       'Tiempo de conexión agotado',
    'errors.unknownError':            'Error desconocido',
  };
  return textos[key] ?? key;
};

// ─── validateEmail ────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  test('acepta un correo con formato estándar', () => {
    expect(validateEmail('usuario@ejemplo.com')).toBe(true);
  });

  test('acepta un correo institucional con subdominios', () => {
    expect(validateEmail('juan.perez@usco.edu.co')).toBe(true);
  });

  test('acepta un correo con alias (+)', () => {
    expect(validateEmail('test+alias@dominio.org')).toBe(true);
  });

  test('rechaza una cadena vacía', () => {
    expect(validateEmail('')).toBe(false);
  });

  test('rechaza un correo sin símbolo @', () => {
    expect(validateEmail('usuarioejemplo.com')).toBe(false);
  });

  test('rechaza un correo sin nombre de usuario antes del @', () => {
    expect(validateEmail('@ejemplo.com')).toBe(false);
  });

  test('rechaza un correo sin dominio después del @', () => {
    expect(validateEmail('usuario@')).toBe(false);
  });

  test('rechaza un correo sin punto en el dominio', () => {
    expect(validateEmail('usuario@dominiosinpunto')).toBe(false);
  });

  test('rechaza un correo con espacios', () => {
    expect(validateEmail('usuario @ejemplo.com')).toBe(false);
  });
});

// ─── getPasswordStrength ──────────────────────────────────────────────────────

describe('getPasswordStrength', () => {
  test('contraseña válida retorna isValid=true y score=4', () => {
    const result = getPasswordStrength('MiClave123!', t);
    expect(result.isValid).toBe(true);
    expect(result.score).toBe(4);
    expect(result.feedback).toHaveLength(0);
  });

  test('contraseña sin mayúscula tiene score=3 y feedback incluye "mayúscula"', () => {
    const result = getPasswordStrength('miclave123!', t);
    expect(result.isValid).toBe(false);
    expect(result.score).toBe(3);
    expect(result.feedback).toContain('mayúscula');
  });

  test('contraseña sin número tiene score=3 y feedback incluye "número"', () => {
    const result = getPasswordStrength('MiClaveABC!', t);
    expect(result.isValid).toBe(false);
    expect(result.score).toBe(3);
    expect(result.feedback).toContain('número');
  });

  test('contraseña sin carácter especial tiene score=3 y feedback incluye "carácter especial"', () => {
    const result = getPasswordStrength('MiClave1234', t);
    expect(result.isValid).toBe(false);
    expect(result.score).toBe(3);
    expect(result.feedback).toContain('carácter especial');
  });

  test('contraseña de menos de 8 caracteres tiene feedback con "8+ caracteres"', () => {
    const result = getPasswordStrength('Mi1!', t);
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('8+ caracteres');
  });

  test('contraseña vacía retorna score=0', () => {
    const result = getPasswordStrength('', t);
    expect(result.score).toBe(0);
    expect(result.isValid).toBe(false);
  });

  test('retorna requirements con los cuatro criterios evaluados individualmente', () => {
    const result = getPasswordStrength('MiClave123!', t);
    expect(result.requirements).toEqual({
      length: true,
      uppercase: true,
      number: true,
      special: true,
    });
  });

  test('el message dice "Contraseña segura" cuando isValid es true', () => {
    const result = getPasswordStrength('MiClave123!', t);
    expect(result.message).toBe('Contraseña segura');
  });

  test('el message lista los criterios faltantes cuando isValid es false', () => {
    const result = getPasswordStrength('miclave', t);
    expect(result.message).toContain('Faltan:');
  });
});

// ─── validateLoginForm ────────────────────────────────────────────────────────

describe('validateLoginForm', () => {
  test('retorna isValid=true con correo y contraseña válidos', () => {
    const { isValid, errors } = validateLoginForm(
      { email: 'user@test.com', password: 'secreto' }, t
    );
    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  test('retorna error cuando el correo está vacío', () => {
    const { isValid, errors } = validateLoginForm(
      { email: '', password: 'secreto' }, t
    );
    expect(isValid).toBe(false);
    expect(errors.email).toBe('Ingresa tu correo');
  });

  test('retorna error cuando el correo tiene formato inválido', () => {
    const { isValid, errors } = validateLoginForm(
      { email: 'noesuncorreo', password: 'secreto' }, t
    );
    expect(isValid).toBe(false);
    expect(errors.email).toBe('Correo inválido');
  });

  test('retorna error cuando la contraseña está vacía', () => {
    const { isValid, errors } = validateLoginForm(
      { email: 'user@test.com', password: '' }, t
    );
    expect(isValid).toBe(false);
    expect(errors.password).toBe('Ingresa tu contraseña');
  });

  test('puede tener errores en ambos campos al mismo tiempo', () => {
    const { isValid, errors } = validateLoginForm(
      { email: '', password: '' }, t
    );
    expect(isValid).toBe(false);
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });
});

// ─── validateRegisterForm ─────────────────────────────────────────────────────

describe('validateRegisterForm', () => {
  test('retorna isValid=true con correo y contraseña fuerte válidos', () => {
    const { isValid, errors } = validateRegisterForm(
      { email: 'user@test.com', password: 'MiClave123!' }, t
    );
    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  test('retorna error cuando la contraseña no cumple los criterios de fortaleza', () => {
    const { isValid, errors } = validateRegisterForm(
      { email: 'user@test.com', password: 'debil' }, t
    );
    expect(isValid).toBe(false);
    expect(errors.password).toBeDefined();
  });

  test('retorna error cuando confirmPassword no coincide con password', () => {
    const { isValid, errors } = validateRegisterForm(
      { email: 'user@test.com', password: 'MiClave123!', confirmPassword: 'Diferente1!' }, t
    );
    expect(isValid).toBe(false);
    expect(errors.confirmPassword).toBe('Las contraseñas no coinciden');
  });

  test('retorna passwordStrength con el resultado de evaluación', () => {
    const { passwordStrength } = validateRegisterForm(
      { email: 'user@test.com', password: 'MiClave123!' }, t
    );
    expect(passwordStrength).toBeDefined();
    expect(passwordStrength.isValid).toBe(true);
  });
});

// ─── getErrorMessage ──────────────────────────────────────────────────────────

describe('getErrorMessage', () => {
  test('HTTP 401 retorna mensaje de credenciales incorrectas', () => {
    const error = { response: { status: 401 } };
    expect(getErrorMessage(error, t)).toBe('Usuario o contraseña incorrectos');
  });

  test('HTTP 404 retorna mensaje de cuenta no encontrada', () => {
    const error = { response: { status: 404 } };
    expect(getErrorMessage(error, t)).toBe('Cuenta no encontrada');
  });

  test('HTTP 400 retorna mensaje de datos inválidos', () => {
    const error = { response: { status: 400 } };
    expect(getErrorMessage(error, t)).toBe('Datos inválidos');
  });

  test('HTTP 500 retorna mensaje de error del servidor', () => {
    const error = { response: { status: 500 } };
    expect(getErrorMessage(error, t)).toBe('Error del servidor');
  });

  test('HTTP 503 también retorna mensaje de error del servidor', () => {
    const error = { response: { status: 503 } };
    expect(getErrorMessage(error, t)).toBe('Error del servidor');
  });

  test('error de red retorna mensaje de conexión', () => {
    const error = { message: 'Network Error' };
    expect(getErrorMessage(error, t)).toBe('Error de conexión');
  });

  test('error de timeout retorna mensaje de tiempo agotado', () => {
    const error = { message: 'timeout exceeded' };
    expect(getErrorMessage(error, t)).toBe('Tiempo de conexión agotado');
  });

  test('usa el mensaje del servidor cuando está en response.data.message', () => {
    const error = {
      response: { status: 422, data: { message: 'Email ya registrado en el sistema' } },
    };
    expect(getErrorMessage(error, t)).toBe('Email ya registrado en el sistema');
  });

  test('usa la clave por defecto para errores no reconocidos', () => {
    const error = { message: 'algo raro' };
    expect(getErrorMessage(error, t, 'errors.unknownError')).toBe('Error desconocido');
  });
});
