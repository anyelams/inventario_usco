// context/LanguageContext.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "../locales";

// Clave para guardar el idioma en AsyncStorage
const LANGUAGE_KEY = "selected_language";

// Crear contexto de idioma
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Estados del contexto
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [isLoading, setIsLoading] = useState(true);

  // Cargar idioma guardado al inicializar
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  /**
   * Detecta el idioma del dispositivo de forma segura
   * @returns {string} - Código de idioma ('en' o 'es')
   */
  const getDeviceLanguage = () => {
    try {
      const locale =
        Localization.locale ||
        Localization.getLocales()?.[0]?.languageCode ||
        "es";
      const language = locale.split("-")[0];
      return ["en", "es"].includes(language) ? language : "es";
    } catch (error) {
      console.warn("Error detecting device language:", error);
      return "es";
    }
  };

  /**
   * Carga el idioma guardado o detecta el del dispositivo
   * Se ejecuta al inicializar la aplicación
   */
  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      let targetLanguage = "es"; // Fallback por defecto

      if (savedLanguage && ["en", "es"].includes(savedLanguage)) {
        // Usar idioma guardado si es válido
        targetLanguage = savedLanguage;
      } else {
        // Detectar idioma del dispositivo si no hay guardado
        targetLanguage = getDeviceLanguage();
      }

      // Aplicar idioma seleccionado
      setCurrentLanguage(targetLanguage);
      i18n.locale = targetLanguage;
    } catch (error) {
      console.error("Error loading language:", error);
      // Fallback en caso de error
      setCurrentLanguage("es");
      i18n.locale = "es";
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cambia el idioma actual y lo guarda en AsyncStorage
   * @param {string} language - Código del idioma ('en' o 'es')
   */
  const changeLanguage = async (language) => {
    // Validar que el idioma sea soportado
    if (!["en", "es"].includes(language)) {
      console.warn("Invalid language:", language);
      return;
    }

    try {
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_KEY, language);

      // Actualizar estado y configuración de i18n
      setCurrentLanguage(language);
      i18n.locale = language;
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  /**
   * Función de traducción con manejo de errores
   * @param {string} key - Clave de traducción
   * @param {Object} options - Opciones adicionales para la traducción
   * @returns {string} - Texto traducido o la clave como fallback
   */
  const t = (key, options = {}) => {
    try {
      return i18n.t(key, options);
    } catch (error) {
      console.warn("Translation error for key:", key, error);
      return key; // Fallback a la clave si falla la traducción
    }
  };

  // Valores que se exponen a través del contexto
  const contextValue = {
    // Estado actual
    currentLanguage,
    isLoading,

    // Métodos
    changeLanguage,
    t,

    // Configuración
    availableLanguages: [
      { code: "es", name: "Español", flag: "🇪🇸" },
      { code: "en", name: "English", flag: "🇺🇸" },
    ],
  };

  // Mostrar loading mientras se carga el idioma inicial
  if (isLoading) {
    return null; // o un componente de loading
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook para usar el contexto de idioma
 * @returns {Object} - Contexto de idioma con métodos y estado
 * @throws {Error} - Si se usa fuera del LanguageProvider
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
