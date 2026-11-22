import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css' //Importa el CSS global
import App from './App.jsx' //monta App
import { I18nProvider } from './i18n.jsx'

//Punto de montaje de React y aplicacion de controles de desarrollo del framework.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
