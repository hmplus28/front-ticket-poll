window.global = window;
import React from "react"; // 👈 این خط لازمه
import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux";
import store from './store/store.js';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
