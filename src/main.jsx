import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import FinaleRegistrationPage from './components/FinaleRegistrationPage.jsx'

const params = new URLSearchParams(
  window.location.search
);

const showFinaleRegistration =
  params.get('finale-aanmelden') === '1';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {showFinaleRegistration
      ? <FinaleRegistrationPage />
      : <App />}
  </StrictMode>,
)
