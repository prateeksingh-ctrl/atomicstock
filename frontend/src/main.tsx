import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // <-- IF THIS IS MISSING, STYLING FAILS
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)