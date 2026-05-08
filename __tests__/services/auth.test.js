/**
 * Pruebas del módulo services/auth.jsx.
 *
 * Verifica que cada función de persistencia lee, escribe y elimina
 * correctamente los datos de sesión en AsyncStorage. Se utiliza el
 * mock oficial del paquete, que provee una implementación en memoria
 * sincrónica compatible con Jest.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearSessionData,
  clearTokens,
  getEmpresaSeleccionada,
  getRefreshToken,
  getRolesByCompany,
  getToken,
  getUsername,
  saveEmpresaSeleccionada,
  saveRolesByCompany,
  saveTokens,
  saveUsername,
} from '../../services/auth';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Limpia el almacenamiento antes de cada prueba para evitar interferencias
beforeEach(async () => {
  await AsyncStorage.clear();
});

// ── Tokens ────────────────────────────────────────────────────────────────────

describe('saveTokens / getToken / getRefreshToken', () => {
  test('guarda el token de acceso y lo recupera correctamente', async () => {
    await saveTokens('mi-jwt-token');
    expect(await getToken()).toBe('mi-jwt-token');
  });

  test('guarda también el refresh token cuando se proporciona', async () => {
    await saveTokens('mi-jwt-token', 'mi-refresh-token');
    expect(await getRefreshToken()).toBe('mi-refresh-token');
  });

  test('no guarda refresh token cuando no se proporciona', async () => {
    await saveTokens('mi-jwt-token');
    expect(await getRefreshToken()).toBeNull();
  });

  test('getToken retorna null cuando no hay token guardado', async () => {
    expect(await getToken()).toBeNull();
  });
});

// ── clearTokens ───────────────────────────────────────────────────────────────

describe('clearTokens', () => {
  test('elimina el token de acceso y el refresh token', async () => {
    await saveTokens('mi-jwt-token', 'mi-refresh-token');
    await clearTokens();
    expect(await getToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });
});

// ── Username ──────────────────────────────────────────────────────────────────

describe('saveUsername / getUsername', () => {
  test('guarda y recupera el nombre de usuario correctamente', async () => {
    await saveUsername('usuario@usco.edu.co');
    expect(await getUsername()).toBe('usuario@usco.edu.co');
  });

  test('getUsername retorna null cuando no hay username guardado', async () => {
    expect(await getUsername()).toBeNull();
  });
});

// ── Empresa seleccionada ──────────────────────────────────────────────────────

describe('saveEmpresaSeleccionada / getEmpresaSeleccionada', () => {
  const contexto = {
    empresaId: 1,
    rolId: 2,
    empresaNombre: 'USCO',
    rolNombre: 'Administrador',
  };

  test('serializa el objeto a JSON al guardarlo', async () => {
    await saveEmpresaSeleccionada(contexto);
    const raw = await AsyncStorage.getItem('empresaSeleccionada');
    expect(JSON.parse(raw)).toEqual(contexto);
  });

  test('deserializa el JSON y retorna el objeto original', async () => {
    await saveEmpresaSeleccionada(contexto);
    expect(await getEmpresaSeleccionada()).toEqual(contexto);
  });

  test('retorna null cuando no hay datos guardados', async () => {
    expect(await getEmpresaSeleccionada()).toBeNull();
  });
});

// ── Roles por empresa ─────────────────────────────────────────────────────────

describe('saveRolesByCompany / getRolesByCompany', () => {
  const roles = [
    { empresaId: 1, rolId: 2, empresaNombre: 'USCO', rolNombre: 'Admin' },
    { empresaId: 3, rolId: 4, empresaNombre: 'Otra Empresa', rolNombre: 'Usuario' },
  ];

  test('guarda la lista de roles y la recupera correctamente', async () => {
    await saveRolesByCompany(roles);
    expect(await getRolesByCompany()).toEqual(roles);
  });

  test('retorna un array vacío cuando no hay roles guardados', async () => {
    expect(await getRolesByCompany()).toEqual([]);
  });
});

// ── clearSessionData ──────────────────────────────────────────────────────────

describe('clearSessionData', () => {
  test('elimina todas las claves de sesión en una sola operación', async () => {
    await saveTokens('mi-jwt-token', 'mi-refresh-token');
    await saveUsername('usuario@usco.edu.co');
    await saveEmpresaSeleccionada({ empresaId: 1, rolId: 2 });
    await saveRolesByCompany([{ empresaId: 1, rolId: 2 }]);

    await clearSessionData();

    expect(await getToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
    expect(await getUsername()).toBeNull();
    expect(await getEmpresaSeleccionada()).toBeNull();
    expect(await getRolesByCompany()).toEqual([]);
  });

  test('no falla cuando se llama sin datos guardados previamente', async () => {
    await expect(clearSessionData()).resolves.not.toThrow();
  });
});
