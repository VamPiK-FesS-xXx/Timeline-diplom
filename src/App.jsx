import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import MainLayout from './layouts/mainLayout'
import AuthOnlyLayout from './layouts/authOnlyLayout'
import RegistrationOnlyLayout from './layouts/registrationOnlyLayout'
import ProfileLayout from './layouts/profileLayout'
import AdminLayout from './layouts/adminLayout'
import RecommendationsLayout from './layouts/recommendationsLayout'

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<MainLayout />} />
					<Route path='/recommendations' element={<RecommendationsLayout />} />
					<Route path='/auth' element={<AuthOnlyLayout />} />
					<Route path='/register' element={<RegistrationOnlyLayout />} />
					<Route path='/profile' element={<ProfileLayout />} />
					<Route path='/admin' element={<AdminLayout />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	)
}

export default App
