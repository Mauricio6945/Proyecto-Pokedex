import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

// Punto de montaje de React y aplicacion de controles de desarrollo del framework.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
