/**
 * Pruebas del LanguageContext.
 *
 * Verifica la carga inicial del idioma (desde AsyncStorage o del dispositivo),
 * el cambio de idioma con persistencia, el rechazo de códigos no soportados
 * y el comportamiento de la función de traducción t().
 *
 * Se utiliza un componente consumidor de prueba (LangConsumer) con testIDs
 * para interactuar con el contexto sin acceder a sus internos directamente.
 * Se espera con waitFor a que el LanguageProvider termine su carga asíncrona
 * antes de hacer aserciones.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-localization', () => ({
  locale: 'es-CO',
  getLocales: () => [{ languageCode: 'es' }],
}));

// Componente que consume el contexto y expone su estado mediante testIDs
const LangConsumer = () => {
  const { currentLanguage, t, changeLanguage, availableLanguages } = useLanguage();

  return (
    <>
      <Text testID="current-lang">{currentLanguage}</Text>
      <Text testID="translation">{t('auth.login')}</Text>
      <Text testID="fallback">{t('clave.que.no.existe')}</Text>
      <Text testID="available">{availableLanguages.map((l) => l.code).join(',')}</Text>
      <TouchableOpacity testID="btn-en" onPress={() => changeLanguage('en')} />
      <TouchableOpacity testID="btn-es" onPress={() => changeLanguage('es')} />
      <TouchableOpacity testID="btn-fr" onPress={() => changeLanguage('fr')} />
    </>
  );
};

const renderProvider = () =>
  render(
    <LanguageProvider>
      <LangConsumer />
    </LanguageProvider>
  );

// Limpia AsyncStorage antes de cada prueba
beforeEach(async () => { await AsyncStorage.clear(); });

// ── Carga inicial ─────────────────────────────────────────────────────────────

describe('carga inicial del idioma', () => {
  test('usa "es" por defecto cuando no hay idioma guardado en AsyncStorage', async () => {
    const { getByTestId } = renderProvider();
    await waitFor(() => expect(getByTestId('current-lang').props.children).toBe('es'));
  });

  test('recupera el idioma guardado previamente en AsyncStorage', async () => {
    await AsyncStorage.setItem('selected_language', 'en');
    const { getByTestId } = renderProvider();
    await waitFor(() => expect(getByTestId('current-lang').props.children).toBe('en'));
  });

  test('expone dos idiomas disponibles: "es" y "en"', async () => {
    const { getByTestId } = renderProvider();
    await waitFor(() => getByTestId('available'));
    const codes = getByTestId('available').props.children;
    expect(codes).toContain('es');
    expect(codes).toContain('en');
  });
});

// ── changeLanguage ────────────────────────────────────────────────────────────

describe('changeLanguage', () => {
  test('actualiza currentLanguage al cambiar a inglés', async () => {
    const { getByTestId } = renderProvider();
    await waitFor(() => getByTestId('btn-en'));

    await act(async () => { fireEvent.press(getByTestId('btn-en')); });

    await waitFor(() =>
      expect(getByTestId('current-lang').props.children).toBe('en')
    );
  });

  test('persiste el nuevo idioma en AsyncStorage', async () => {
    const { getByTestId } = renderProvider();
    await waitFor(() => getByTestId('btn-en'));

    await act(async () => { fireEvent.press(getByTestId('btn-en')); });

    await waitFor(async () => {
      const saved = await AsyncStorage.getItem('selected_language');
      expect(saved).toBe('en');
    });
  });

  test('ignora códigos de idioma no soportados y conserva el idioma actual', async () => {
    const { getByTestId } = renderProvider();
    await waitFor(() => getByTestId('btn-fr'));

    await act(async () => { fireEvent.press(getByTestId('btn-fr')); });

    // El idioma debe seguir siendo 'es' porque 'fr' no está soportado
    await waitFor(() =>
      expect(getByTestId('current-lang').props.children).toBe('es')
    );
  });
});

// ── Función t() ───────────────────────────────────────────────────────────────

describe('t() — función de traducción', () => {
  test('retorna una traducción real para una clave existente en español', async () => {
    const { getByTestId } = renderProvider();
    await waitFor(() => getByTestId('translation'));
    // auth.login en es.json = "Iniciar sesión"
    expect(getByTestId('translation').props.children).toBe('Iniciar sesión');
  });

  test('incluye la clave en el mensaje cuando no existe la traducción', async () => {
    const { getByTestId } = renderProvider();
    await waitFor(() => getByTestId('fallback'));
    // i18n-js devuelve "[missing "es.clave.que.no.existe" translation]" para claves inexistentes
    expect(getByTestId('fallback').props.children).toContain('clave.que.no.existe');
  });

  test('retorna la traducción en inglés tras cambiar el idioma', async () => {
    const { getByTestId } = renderProvider();
    await waitFor(() => getByTestId('btn-en'));

    await act(async () => { fireEvent.press(getByTestId('btn-en')); });

    // auth.login en en.json debe ser diferente al español
    await waitFor(() =>
      expect(getByTestId('translation').props.children).not.toBe('Iniciar sesión')
    );
  });
});
