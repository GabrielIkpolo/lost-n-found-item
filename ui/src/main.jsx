import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import axios from 'axios'
import './index.css'

// imported our global css so we can use it everywhere
import './assets/css/color.css';

// Import the Redux Provider and the store
import { Provider } from 'react-redux';
import { store } from './store'; // Assuming store.js is in src/ directory

// axios.defaults.baseURL = import.meta.env.VITE_REACT_APP_API_BASE_URL

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Wrap the App component with the Redux Provider */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)