import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom'
import { StationsProvider } from './context/StationsContext'
import './index.css';
import 'leaflet/dist/leaflet.css';
import App from './App.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <StationsProvider>
  <BrowserRouter>
    <App />
  </BrowserRouter>
  </StationsProvider>
);
