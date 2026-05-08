import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomButton from '../../components/CustomButton';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('CustomButton', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renderiza el texto del botón', () => {
    const { getByText } = render(<CustomButton text="Aceptar" />);
    expect(getByText('Aceptar')).toBeTruthy();
  });

  test('llama a onPress al presionar el botón', () => {
    const onPress = jest.fn();
    const { getByText } = render(<CustomButton text="Guardar" onPress={onPress} />);
    fireEvent.press(getByText('Guardar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('no llama a onPress cuando el botón está deshabilitado', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <CustomButton text="Bloqueado" onPress={onPress} disabled />
    );
    fireEvent.press(getByText('Bloqueado'));
    expect(onPress).not.toHaveBeenCalled();
  });

  test('navega a la ruta indicada cuando no se proporciona onPress', () => {
    const { getByText } = render(<CustomButton text="Ir a inicio" route="Home" />);
    fireEvent.press(getByText('Ir a inicio'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  test('onPress tiene prioridad sobre route al presionar', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <CustomButton text="Acción" onPress={onPress} route="Home" />
    );
    fireEvent.press(getByText('Acción'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('no navega cuando el botón está deshabilitado y solo tiene route', () => {
    const { getByText } = render(
      <CustomButton text="Ruta bloqueada" route="Home" disabled />
    );
    fireEvent.press(getByText('Ruta bloqueada'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
