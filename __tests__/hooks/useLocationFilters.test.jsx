/**
 * Pruebas del hook useLocationFilters.
 *
 * Verifica el estado inicial, la carga de datos por nivel geográfico,
 * la limpieza de selecciones dependientes y la autoselección cuando
 * un nivel tiene un único valor disponible.
 *
 * Se mockea `fetch` globalmente y `expo-constants` para controlar
 * las URLs de los endpoints sin depender del archivo .env.
 */

import { act, renderHook } from '@testing-library/react-native';
import useLocationFilters from '../../hooks/useLocationFilters';

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      API_URL_PAIS:         '/api/v1/pais',
      API_URL_DEPARTAMENTO: '/api/v1/departamento',
      API_URL_MUNICIPIO:    '/api/v1/municipio',
      API_URL_SEDE:         '/api/v1/sede',
      API_URL_BLOQUE:       '/api/v1/bloque',
      API_URL_ESPACIO:      '/api/v1/espacio',
      API_URL_ALMACEN:      '/api/v1/almacen',
    },
  },
}));

const TOKEN   = 'token-de-prueba';
const API_URL = 'http://api.test';

// Crea una respuesta fetch exitosa con los datos indicados
const ok = (data) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(data),
});

// ── Estado inicial ────────────────────────────────────────────────────────────

describe('estado inicial', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  test('todos los filtros seleccionados comienzan en null', () => {
    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    expect(result.current.selected).toEqual({
      paisId:         null,
      departamentoId: null,
      municipioId:    null,
      sedeId:         null,
      bloqueId:       null,
      espacioId:      null,
      almacenId:      null,
    });
  });

  test('todos los arrays de datos comienzan vacíos', () => {
    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    expect(result.current.locationData).toEqual({
      paises:        [],
      departamentos: [],
      municipios:    [],
      sedes:         [],
      bloques:       [],
      espacios:      [],
      almacenes:     [],
    });
  });
});

// ── loadInitialData ───────────────────────────────────────────────────────────

describe('loadInitialData', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  test('llama al endpoint de países con el token de autorización', async () => {
    global.fetch.mockResolvedValue(ok([]));
    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    await act(async () => { await result.current.loadInitialData(); });

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/api/v1/pais`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      })
    );
  });

  test('carga la lista de países en el estado', async () => {
    const paises = [
      { id: 1, nombre: 'Colombia' },
      { id: 2, nombre: 'Venezuela' },
    ];
    global.fetch.mockResolvedValue(ok(paises));
    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    await act(async () => { await result.current.loadInitialData(); });

    expect(result.current.locationData.paises).toEqual(paises);
  });

  test('normaliza correctamente una respuesta paginada con campo content', async () => {
    const paises = [{ id: 1, nombre: 'Colombia' }];
    global.fetch.mockResolvedValue(ok({ content: paises, totalElements: 1 }));
    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    await act(async () => { await result.current.loadInitialData(); });

    expect(result.current.locationData.paises).toEqual(paises);
  });
});

// ── handlePaisChange ──────────────────────────────────────────────────────────

describe('handlePaisChange', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(ok([]));
    jest.useFakeTimers();
  });

  afterEach(() => { jest.useRealTimers(); });

  test('actualiza paisId en el estado de selección', async () => {
    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    await act(async () => {
      await result.current.handlers.handlePaisChange(1);
    });

    expect(result.current.selected.paisId).toBe(1);
  });

  test('carga los departamentos del país seleccionado', async () => {
    const departamentos = [{ id: 10, nombre: 'Huila' }, { id: 11, nombre: 'Cundinamarca' }];
    global.fetch.mockResolvedValue(ok(departamentos));

    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    await act(async () => {
      await result.current.handlers.handlePaisChange(1);
    });

    expect(result.current.locationData.departamentos).toEqual(departamentos);
  });

  test('limpia las selecciones de todos los niveles inferiores al cambiar país', async () => {
    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    // Simular una selección previa en un nivel inferior
    act(() => { result.current.handlers.handleAlmacenChange(99); });

    await act(async () => {
      await result.current.handlers.handlePaisChange(2);
    });

    expect(result.current.selected.departamentoId).toBeNull();
    expect(result.current.selected.municipioId).toBeNull();
    expect(result.current.selected.sedeId).toBeNull();
    expect(result.current.selected.almacenId).toBeNull();
  });

  test('autoselecciona el único departamento disponible tras los 100ms', async () => {
    const unSoloDepartamento = [{ id: 10, nombre: 'Huila' }];
    global.fetch
      .mockResolvedValueOnce(ok(unSoloDepartamento)) // departamentos
      .mockResolvedValue(ok([]));                    // municipios y siguientes

    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    await act(async () => {
      await result.current.handlers.handlePaisChange(1);
    });

    // Avanzar el setTimeout de autoSelectIfSingle (100ms)
    act(() => { jest.advanceTimersByTime(150); });

    expect(result.current.selected.departamentoId).toBe(10);
  });

  test('no autoselecciona cuando hay más de un departamento disponible', async () => {
    const variosDeptos = [{ id: 10, nombre: 'Huila' }, { id: 11, nombre: 'Cundinamarca' }];
    global.fetch.mockResolvedValue(ok(variosDeptos));

    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    await act(async () => {
      await result.current.handlers.handlePaisChange(1);
    });

    act(() => { jest.advanceTimersByTime(150); });

    expect(result.current.selected.departamentoId).toBeNull();
  });
});

// ── reset ─────────────────────────────────────────────────────────────────────

describe('reset', () => {
  beforeEach(() => { global.fetch = jest.fn().mockResolvedValue(ok([])); });

  test('vuelve todos los estados a su valor inicial', async () => {
    const paises = [{ id: 1, nombre: 'Colombia' }];
    global.fetch.mockResolvedValue(ok(paises));

    const { result } = renderHook(() => useLocationFilters(TOKEN, API_URL));

    await act(async () => { await result.current.loadInitialData(); });
    act(() => { result.current.reset(); });

    expect(result.current.selected.paisId).toBeNull();
    expect(result.current.locationData.paises).toEqual([]);
  });
});
