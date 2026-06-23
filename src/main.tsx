import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.scss'
import { BrowserRouter } from 'react-router-dom';
import {TourProvider} from "@reactour/tour"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
        <TourProvider steps={[]} >
            <App />
        </TourProvider>
    </BrowserRouter>
  </React.StrictMode>,
)