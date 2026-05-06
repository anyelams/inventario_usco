// context/SessionContext.jsx
import axios from "axios";
import Constants from "expo-constants";
import { createContext, useContext, useEffect, useState } from "react";
import {
  clearSessionData,
  getEmpresaSeleccionada,
  getRolesByCompany,
  getToken,
  getUsername,
  saveEmpresaSeleccionada,
  saveRolesByCompany,
  saveTokens,
  saveUsername,
} from "../services/auth";

// Configuración de la API
const API_URL = Constants.expoConfig?.extra?.API_URL ?? "";
const API_URL_SWITCH_CONTEXT =
  Constants.expoConfig?.extra?.API_URL_SWITCH_CONTEXT ?? "/auth/switch-context";

// Crear contexto de sesión
const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  // Estados principales de la sesión
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [rolesByCompany, setRolesByCompany] = useState([]);
  const [token, setTokenState] = useState(null);
  const [username, setUsernameState] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  /**
   * Guarda una sesión completa con todos los datos necesarios
   * @param {Object} params - Parámetros de la sesión
   * @param {string} params.token - JWT token
   * @param {number} params.empresaId - ID de la empresa
   * @param {number} params.rolId - ID del rol
   * @param {string} params.empresaNombre - Nombre de la empresa
   * @param {string} params.rolNombre - Nombre del rol
   * @param {Array} params.rolesByCompany - Lista de roles por empresa
   * @param {string} params.refreshToken - Token de renovación (opcional)
   */
  const guardarSesionCompleta = async ({
    token,
    empresaId,
    rolId,
    empresaNombre,
    rolNombre,
    rolesByCompany,
    refreshToken = null,
  }) => {
    // Validar parámetros requeridos
    if (!token || !empresaId || !rolId) {
      throw new Error("Token, empresaId y rolId son requeridos");
    }

    // Guardar tokens en almacenamiento seguro
    await saveTokens(token, refreshToken);
    setTokenState(token);

    // Extraer y guardar email del token JWT
    const tokenData = decodificarToken(token);
    if (tokenData?.sub) {
      setUserEmail(tokenData.sub);
    }

    // Guardar username si existe
    if (username) {
      await saveUsername(username);
    }

    // Crear y guardar contexto de empresa/rol
    const contexto = {
      empresaId,
      rolId,
      empresaNombre: empresaNombre || "Sin nombre",
      rolNombre: rolNombre || "Sin rol",
    };
    await saveEmpresaSeleccionada(contexto);
    setEmpresaSeleccionada(contexto);

    // Guardar lista de roles disponibles
    const rolesValidos = rolesByCompany || [];
    await saveRolesByCompany(rolesValidos);
    setRolesByCompany(rolesValidos);
  };

  /**
   * Cambia el contexto actual (empresa/rol) del usuario
   * @param {number} empresaId - ID de la nueva empresa
   * @param {number} rolId - ID del nuevo rol
   * @param {boolean} rememberAsDefault - Si recordar como predeterminado
   * @returns {boolean} - true si el cambio fue exitoso
   */
  const cambiarContexto = async (
    empresaId,
    rolId,
    rememberAsDefault = true,
  ) => {
    try {
      // Realizar petición al servidor para cambiar contexto
      const response = await axios.post(
        `${API_URL}${API_URL_SWITCH_CONTEXT}`,
        { empresaId, rolId, rememberAsDefault },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const { token: newToken, refreshToken } = response.data;

      // Buscar información de la empresa/rol seleccionado
      const empresaInfo = rolesByCompany.find(
        (item) => item.empresaId === empresaId && item.rolId === rolId,
      );

      // Guardar nueva sesión con el nuevo token
      await guardarSesionCompleta({
        token: newToken,
        refreshToken,
        empresaId,
        rolId,
        empresaNombre: empresaInfo?.empresaNombre,
        rolNombre: empresaInfo?.rolNombre,
        rolesByCompany,
      });

      return true;
    } catch (error) {
      console.error("Error cambiando contexto:", error);
      if (error.response?.status === 403) {
        throw new Error("No tienes acceso a ese rol/empresa.");
      }
      throw new Error("Error al cambiar contexto. Intenta nuevamente.");
    }
  };

  /**
   * Carga la sesión guardada al inicializar la aplicación
   */
  useEffect(() => {
    const cargarSesion = async () => {
      try {
        // Recuperar datos guardados del almacenamiento
        const savedToken = await getToken();
        const savedUsername = await getUsername();
        const savedEmpresa = await getEmpresaSeleccionada();
        const savedRoles = await getRolesByCompany();

        // Restaurar token y extraer email
        if (savedToken) {
          setTokenState(savedToken);
          const tokenData = decodificarToken(savedToken);
          if (tokenData?.sub) {
            setUserEmail(tokenData.sub);
          }
        }

        // Restaurar otros datos de sesión
        if (savedUsername) setUsernameState(savedUsername);
        if (savedEmpresa) setEmpresaSeleccionada(savedEmpresa);
        if (savedRoles) setRolesByCompany(savedRoles);
      } catch (error) {
        console.error("Error cargando la sesión:", error);
      }
    };
    cargarSesion();
  }, []);

  /**
   * Cierra la sesión actual y limpia todos los datos
   */
  const cerrarSesion = async () => {
    try {
      await clearSessionData();
      setTokenState(null);
      setUsernameState(null);
      setUserEmail(null);
      setEmpresaSeleccionada(null);
      setRolesByCompany([]);

      // MODIFICADO: Pequeño delay antes de navegar
      setTimeout(() => {
        // La navegación la manejará el AppInitializer
      }, 100);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  /**
   * Verifica si el usuario tiene múltiples opciones de empresa/rol
   * @returns {boolean} - true si tiene más de una opción
   */
  const tieneMultiplesOpciones = () => rolesByCompany.length > 1;

  /**
   * Decodifica un JWT token y retorna su payload
   * @param {string} tokenParam - Token a decodificar (opcional, usa el actual si no se proporciona)
   * @returns {Object|null} - Payload del token o null si hay error
   */
  const decodificarToken = (tokenParam = null) => {
    const tokenADecodificar = tokenParam || token;
    if (!tokenADecodificar) return null;

    try {
      const payload = tokenADecodificar.split(".")[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error("Error decodificando token:", error);
      return null;
    }
  };

  /**
   * Verifica si el token actual es válido (no expirado)
   * @returns {boolean} - true si el token es válido
   */
  const tokenEsValido = () => {
    const claims = decodificarToken();
    if (!claims) return false;

    const ahora = Math.floor(Date.now() / 1000);
    return claims.exp > ahora;
  };

  /**
   * Genera iniciales del usuario basadas en su email
   * Ejemplos:
   * - juan.perez@empresa.com → "JP"
   * - carlos@empresa.com → "CA"
   * @returns {string} - Iniciales del usuario
   */
  const getUserInitials = () => {
    if (!userEmail) return "U";

    const email = userEmail.toLowerCase();
    const parts = email.split("@")[0]; // Solo la parte antes del @

    // Si tiene punto, usar primeras letras de cada parte
    if (parts.includes(".")) {
      const nameParts = parts.split(".");
      return nameParts
        .slice(0, 2) // Máximo 2 partes
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase();
    }

    // Si no tiene punto, usar las primeras 2 letras
    return parts.substring(0, 2).toUpperCase();
  };

  // Valores que se exponen a través del contexto
  const contextValue = {
    // Estados
    empresaSeleccionada,
    setEmpresaSeleccionada,
    rolesByCompany,
    setRolesByCompany,
    token,
    username,
    userEmail,
    setUsername: setUsernameState,

    // Métodos principales
    guardarSesionCompleta,
    cambiarContexto,
    cerrarSesion,

    // Utilidades
    tieneMultiplesOpciones,
    decodificarToken,
    tokenEsValido,
    getUserInitials,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

/**
 * Hook para usar el contexto de sesión
 * @returns {Object} - Contexto de sesión
 * @throws {Error} - Si se usa fuera del SessionProvider
 */
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession debe ser usado dentro de un SessionProvider");
  }
  return context;
};
