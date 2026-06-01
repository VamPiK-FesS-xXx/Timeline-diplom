import {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [authLoading, setAuthLoading] = useState(true)

	// Восстанавливаем сессию из HttpOnly cookie при загрузке страницы
	useEffect(() => {
		axios
			.get('/api/profile')
			.then(({ data }) => {
				if (data?.user) setUser(data.user)
			})
			.catch(() => {})
			.finally(() => setAuthLoading(false))
	}, [])

	const login = useCallback(userData => {
		setUser(userData)
	}, [])

	const logout = useCallback(async () => {
		try {
			await axios.post('/api/logout')
		} catch {}
		setUser(null)
	}, [])

	const updateUser = useCallback(patch => {
		setUser(prev => ({ ...prev, ...patch }))
	}, [])

	return (
		<AuthContext.Provider
			value={{ user, authLoading, login, logout, updateUser }}
		>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	return useContext(AuthContext)
}
