/**
 * components/LocationFilters.jsx
 * Grupo de pickers en cascada para filtrar por ubicación geográfica:
 * País → Departamento → Municipio → Sede → Bloque → Espacio → Almacén.
 * Cada nivel se habilita solo cuando el nivel anterior tiene una selección.
 */
import React from "react";
import CustomPicker from "./CustomPicker";

/**
 * Pickers en cascada para filtrar por ubicación geográfica.
 * Cada nivel se activa solo cuando el nivel superior tiene valor seleccionado.
 * @param {Object} props
 * @param {Object} props.selected - IDs actualmente seleccionados por nivel
 * @param {Object} props.locationData - Listas de opciones por nivel (paises, departamentos, etc.)
 * @param {Object} props.handlers - Funciones de cambio por nivel (handlePaisChange, etc.)
 */
const LocationFilters = ({ selected, locationData, handlers }) => {
  return (
    <>
      <CustomPicker
        label="País"
        items={locationData.paises}
        selectedValue={selected.paisId}
        onValueChange={handlers.handlePaisChange}
      />

      <CustomPicker
        label="Departamento"
        items={locationData.departamentos}
        selectedValue={selected.departamentoId}
        onValueChange={handlers.handleDepartamentoChange}
        enabled={selected.paisId !== null}
      />

      <CustomPicker
        label="Municipio"
        items={locationData.municipios}
        selectedValue={selected.municipioId}
        onValueChange={handlers.handleMunicipioChange}
        enabled={selected.departamentoId !== null}
      />

      <CustomPicker
        label="Sede"
        items={locationData.sedes}
        selectedValue={selected.sedeId}
        onValueChange={handlers.handleSedeChange}
        enabled={selected.municipioId !== null}
      />

      <CustomPicker
        label="Bloque"
        items={locationData.bloques}
        selectedValue={selected.bloqueId}
        onValueChange={handlers.handleBloqueChange}
        enabled={selected.sedeId !== null}
      />

      <CustomPicker
        label="Espacio"
        items={locationData.espacios}
        selectedValue={selected.espacioId}
        onValueChange={handlers.handleEspacioChange}
        enabled={selected.bloqueId !== null}
      />

      <CustomPicker
        label="Almacén"
        items={locationData.almacenes}
        selectedValue={selected.almacenId}
        onValueChange={handlers.handleAlmacenChange}
        enabled={selected.espacioId !== null}
      />
    </>
  );
};

export default LocationFilters;
