import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import CustomInput from '../../components/CustomInput';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('CustomInput', () => {
  test('renderiza la etiqueta cuando se proporciona label', () => {
    const { getByText } = render(
      <CustomInput label="Correo electrónico" value="" onChangeText={() => {}} />
    );
    expect(getByText('Correo electrónico')).toBeTruthy();
  });

  test('no renderiza etiqueta cuando label no se proporciona', () => {
    const { queryByText } = render(
      <CustomInput placeholder="Escribe aquí" value="" onChangeText={() => {}} />
    );
    expect(queryByText('Escribe aquí')).toBeNull();
  });

  test('muestra el mensaje de error cuando se proporciona error', () => {
    const { getByText } = render(
      <CustomInput value="" onChangeText={() => {}} error="Campo requerido" />
    );
    expect(getByText('Campo requerido')).toBeTruthy();
  });

  test('no muestra mensaje de error cuando error no se proporciona', () => {
    const { queryByText } = render(
      <CustomInput value="" onChangeText={() => {}} />
    );
    expect(queryByText('Campo requerido')).toBeNull();
  });

  test('llama a onChangeText cuando el usuario escribe', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <CustomInput placeholder="Escribe algo" value="" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText('Escribe algo'), 'hola mundo');
    expect(onChangeText).toHaveBeenCalledWith('hola mundo');
  });

  test('el TextInput oculta el texto cuando secureTextEntry es true', () => {
    const { getByPlaceholderText } = render(
      <CustomInput
        placeholder="Contraseña"
        value="secreto"
        onChangeText={() => {}}
        secureTextEntry
      />
    );
    expect(getByPlaceholderText('Contraseña').props.secureTextEntry).toBe(true);
  });

  test('el toggle muestra el texto oculto al presionarse', () => {
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(
      <CustomInput
        placeholder="Contraseña"
        value="secreto"
        onChangeText={() => {}}
        secureTextEntry
        showPasswordToggle
      />
    );

    expect(getByPlaceholderText('Contraseña').props.secureTextEntry).toBe(true);

    const [toggleButton] = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(toggleButton);

    expect(getByPlaceholderText('Contraseña').props.secureTextEntry).toBe(false);
  });
});
