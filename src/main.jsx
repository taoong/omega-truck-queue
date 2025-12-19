import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TruckQueueApp from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TruckQueueApp />
  </StrictMode>,
)
