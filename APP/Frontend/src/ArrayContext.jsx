import { createContext, useContext, useState } from "react";

// Creamos el contexto
const ArrayContext = createContext();

// Hook para usar el contexto fácil
export function useArray() {
  return useContext(ArrayContext);
}

// Proveedor del contexto
export function ArrayProvider({ children }) {
  const [array, setArray] = useState([]);

  return (
    <ArrayContext.Provider value={{ array, setArray }}>
      {children}
    </ArrayContext.Provider>
  );
}
