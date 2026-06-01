import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = '/api'

function Authtorization() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [errors, setErrors] = useState({})
	const navigate = useNavigate()
	const { login } = useAuth()

	const validateEmail = value => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return re.test(value)
	}

	const handleEmailChange = e => {
		const value = e.target.value
		setEmail(value)
		if (errors.email) {
			if (value.trim() && validateEmail(value)) {
				setErrors(prev => ({ ...prev, email: undefined }))
			}
		}
	}

	const handlePasswordChange = e => {
		const value = e.target.value
		setPassword(value)
		if (errors.password) {
			if (value.length >= 6) {
				setErrors(prev => ({ ...prev, password: undefined }))
			}
		}
	}

	const validate = () => {
		const newErrors = {}

		if (!email.trim()) {
			newErrors.email = 'Введите почту'
		} else if (!validateEmail(email)) {
			newErrors.email = 'Некорректный формат почты'
		}

		if (!password) {
			newErrors.password = 'Введите пароль'
		} else if (password.length < 6) {
			newErrors.password = 'Пароль должен быть не менее 6 символов'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleLogin = async e => {
		e.preventDefault()
		if (!validate()) return

		try {
			const response = await axios.post(`${API}/login`, { email, password })
			login(response.data.user)
			navigate(response.data.user?.role === 'admin' ? '/admin' : '/')
		} catch (err) {
			const msg = err.response?.data?.error || 'Неверная почта или пароль'
			setErrors({ form: msg })
		}
	}

	return (
		<div className='auth modal-user'>
			<div className='auth__inner'>
				<h4 className='auth__title'>Авторизация</h4>
				<form className='auth__info' onSubmit={handleLogin}>
					<div className='auth__info-inner'>
						<label htmlFor='email' className='auth__info-name'>
							Введите почту
						</label>
						<input
							type='email'
							id='email'
							className={`auth__info-input${errors.email ? ' input-error' : ''}`}
							value={email}
							onChange={handleEmailChange}
						/>
						{errors.email && (
							<span className='auth__error'>{errors.email}</span>
						)}
					</div>
					<div className='auth__info-inner'>
						<label htmlFor='password' className='auth__info-name'>
							Введите пароль
						</label>
						<div className='auth__password-wrapper'>
							<input
								type={showPassword ? 'text' : 'password'}
								id='password'
								className={`auth__info-input${errors.password ? ' input-error' : ''}`}
								value={password}
								onChange={handlePasswordChange}
							/>
							<button
								type='button'
								className='auth__eye-btn'
								onClick={() => setShowPassword(!showPassword)}
								aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
							>
								{showPassword ? (
									<svg
										width='22'
										height='22'
										viewBox='0 0 24 24'
										fill='none'
										xmlns='http://www.w3.org/2000/svg'
									>
										<path
											d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24'
											stroke='white'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
										<line
											x1='1'
											y1='1'
											x2='23'
											y2='23'
											stroke='white'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								) : (
									<svg
										width='22'
										height='22'
										viewBox='0 0 24 24'
										fill='none'
										xmlns='http://www.w3.org/2000/svg'
									>
										<path
											d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z'
											stroke='white'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
										<circle
											cx='12'
											cy='12'
											r='3'
											stroke='white'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								)}
							</button>
						</div>
						{errors.password && (
							<span className='auth__error'>{errors.password}</span>
						)}
					</div>
					{errors.form && (
						<span className='auth__error auth__error--form'>{errors.form}</span>
					)}
					<button type='submit' className='auth__info-btn'>
						Войти
					</button>
					<NavLink to='/register' className='auth__info-redirect'>
						Зарегестрироваться
					</NavLink>
				</form>
			</div>
		</div>
	)
}

export default Authtorization
