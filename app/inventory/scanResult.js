/**
 * app/inventory/scanResult.js
 * Singleton de módulo para transferir el código escaneado desde la pantalla
 * de cámara hacia la pantalla de detalle de inventario. Se usa porque
 * navigation.navigate() crea instancias nuevas de pantalla; en su lugar,
 * la cámara escribe aquí y llama navigation.goBack(), y la pantalla de
 * detalle lee el valor en useFocusEffect al recuperar el foco.
 */

let _codigo = null;

/**
 * Almacena el código escaneado para que lo consuma la pantalla de detalle.
 * @param {string} codigo - Código de barras o QR detectado por la cámara.
 */
export const setScanResult = (codigo) => { _codigo = codigo; };

/**
 * Retorna el código almacenado, o null si no hay ninguno pendiente.
 * @returns {string|null} Código escaneado o null.
 */
export const getScanResult = () => _codigo;

/**
 * Limpia el código almacenado tras ser consumido por la pantalla de detalle.
 */
export const clearScanResult = () => { _codigo = null; };
