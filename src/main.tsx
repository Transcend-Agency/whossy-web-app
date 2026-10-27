import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.scss'
import { BrowserRouter } from 'react-router-dom';
import {TourProvider} from "@reactour/tour"

// Firebase refuses phone sign-in's reCAPTCHA on the hostname "localhost"
// (auth/invalid-app-credential) but accepts 127.0.0.1, which is also on the
// project's authorized domains. Development only; the dev server listens on
// 127.0.0.1 (vite.config.ts).
const onLocalhost = import.meta.env.DEV && location.hostname === 'localhost'
if (onLocalhost) location.replace(location.href.replace('//localhost', '//127.0.0.1'))

if (!onLocalhost) ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
        <TourProvider steps={[]} >
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </TourProvider>
    </BrowserRouter>
  </React.StrictMode>,
)