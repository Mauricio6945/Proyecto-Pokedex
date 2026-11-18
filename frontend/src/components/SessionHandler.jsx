import { logout } from "../api/Cardapi";
import { useI18n } from "../i18n";

// Maneja el cierre de sesion desde el boton visible en la interfaz.
function SessionHandler({ onLoggedOut, onError }) {
  const { t, translateError } = useI18n();
  // Solicita el cierre de sesion y comunica el resultado al componente padre.
  async function handleLogout() {
    try {
      await logout();
      onLoggedOut();
    } catch (err) {
      onError(translateError(err.message));
    }
  }

  return <button type="button" onClick={handleLogout}>{t("logout")}</button>;
}

export default SessionHandler;
