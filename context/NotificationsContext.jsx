// context/NotificationsContext.jsx
import { createContext, useCallback, useContext, useState } from "react";

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((titulo, mensaje) => {
    const nueva = {
      id: Date.now(),
      titulo,
      mensaje,
      fecha: new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      estado: "no leida",
    };
    setNotifications((prev) => [nueva, ...prev]);
  }, []);

  const marcarComoLeida = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, estado: "leida" } : n)),
    );
  }, []);

  const marcarTodoComoLeido = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, estado: "leida" })));
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, addNotification, marcarComoLeida, marcarTodoComoLeido }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
