import { logout } from "../api/Cardapi";

// Maneja el cierre de sesion desde el boton visible en la interfaz.
function SessionHandler({ onLoggedOut, onError }) {
  // Solicita el cierre de sesion y comunica el resultado al componente padre.
  async function handleLogout() {
    try {
      await logout();
      onLoggedOut();
    } catch (err) {
      onError(err.message);
    }
  }

  return <button type="button" onClick={handleLogout}>Cerrar sesión</button>;
}

export default SessionHandler;
