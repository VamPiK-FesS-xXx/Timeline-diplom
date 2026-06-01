import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './styles/style.css'

axios.defaults.withCredentials = true

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
