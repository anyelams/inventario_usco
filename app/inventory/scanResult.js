let _codigo = null;

export const setScanResult = (codigo) => { _codigo = codigo; };
export const getScanResult = () => _codigo;
export const clearScanResult = () => { _codigo = null; };
