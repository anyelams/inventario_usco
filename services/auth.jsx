// services/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
const TOKEN_KEY = "token";
const REFRESH_KEY = "refresh_token";
const USERNAME_KEY = "username";
const EMPRESA_KEY = "empresaSeleccionada";
const ROLES_KEY = "rolesByCompany";
const NOMBRE_KEY = "nombrePersona";

// ---------------------
// TOKENS
// ---------------------

/**
 * Guarda el access token y opcionalmente el refresh token en AsyncStorage.
 * @param {string} token - JWT de acceso
 * @param {string|null} refreshToken - JWT de refresco (opcional)
 */
export async function saveTokens(token, refreshToken = null) {
  const entries = [[TOKEN_KEY, token]];
  if (refreshToken) entries.push([REFRESH_KEY, refreshToken]);
  await AsyncStorage.multiSet(entries);
}

/**
 * Obtiene el access token almacenado.
 * @returns {Promise<string|null>}
 */
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/**
 * Obtiene el refresh token almacenado.
 * @returns {Promise<string|null>}
 */
export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}

/**
 * Elimina el access token y el refresh token de AsyncStorage.
 */
export async function clearTokens() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
}

// ---------------------
// USERNAME
// ---------------------

/**
 * Guarda el nombre de usuario en AsyncStorage.
 * @param {string} username
 */
export async function saveUsername(username) {
  await AsyncStorage.setItem(USERNAME_KEY, username);
}

/**
 * Obtiene el nombre de usuario almacenado.
 * @returns {Promise<string|null>}
 */
export async function getUsername() {
  return AsyncStorage.getItem(USERNAME_KEY);
}

// ---------------------
// EMPRESAS Y ROLES
// ---------------------

/**
 * Guarda el contexto de empresa seleccionada (empresaId, rolId, nombres, etc.).
 * @param {object} contexto - Objeto con los datos de la empresa activa
 */
export async function saveEmpresaSeleccionada(contexto) {
  await AsyncStorage.setItem(EMPRESA_KEY, JSON.stringify(contexto));
}

/**
 * Obtiene el contexto de empresa seleccionada.
 * @returns {Promise<object|null>}
 */
export async function getEmpresaSeleccionada() {
  const raw = await AsyncStorage.getItem(EMPRESA_KEY);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Guarda la lista de roles agrupados por empresa.
 * @param {Array} roles
 */
export async function saveRolesByCompany(roles) {
  await AsyncStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

/**
 * Obtiene la lista de roles por empresa.
 * @returns {Promise<Array>}
 */
export async function getRolesByCompany() {
  const raw = await AsyncStorage.getItem(ROLES_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Guarda el nombre completo de la persona autenticada.
 * @param {string} nombre
 */
export async function saveNombrePersona(nombre) {
  await AsyncStorage.setItem(NOMBRE_KEY, nombre);
}

/**
 * Obtiene el nombre completo de la persona autenticada.
 * @returns {Promise<string|null>}
 */
export async function getNombrePersona() {
  return AsyncStorage.getItem(NOMBRE_KEY);
}

/**
 * Elimina todos los datos de sesión de AsyncStorage.
 */
export async function clearSessionData() {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    REFRESH_KEY,
    USERNAME_KEY,
    EMPRESA_KEY,
    ROLES_KEY,
    NOMBRE_KEY,
  ]);
}
