import { useRef, useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function HeaderLayout() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()

	const firstLetter = user?.username?.charAt(0).toUpperCase() || null
	const avatarUrl   = user?.avatar_path
		? `http://timeline-bd/backend/${user.avatar_path}`
		: null

	const [isOpen, setIsOpen] = useState(false)
	const wrapRef = useRef(null)

	// Закрываем дропдаун при клике вне него
	useEffect(() => {
		const handleOutside = (e) => {
			if (wrapRef.current && !wrapRef.current.contains(e.target)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleOutside)
		return () => document.removeEventListener('mousedown', handleOutside)
	}, [])

	const handleLogout = () => {
		logout()
		setIsOpen(false)
		navigate('/')
	}

	return (
		<>
			<header className='header'>
				<div className='header__inner'>
					<NavLink to='/' className='header__logo'>
						<img
							src='../../src/img/logo.svg'
							alt=''
							className='logo__img logo'
						/>
					</NavLink>

					<nav className='header__menu'>
						<ul className='header__menu-list'>
							<li className='header__menu-item'>
								<NavLink
									to='/recommendations'
									className={({ isActive }) =>
										'header__menu-link' + (isActive ? ' is-current' : '')
									}
								>
									Рекомендации
								</NavLink>
							</li>
							<li className='header__menu-item'>
								<NavLink
									to='/'
									end
									className={({ isActive }) =>
										'header__menu-link' + (isActive ? ' is-current' : '')
									}
								>
									Мой таймлайн
								</NavLink>
							</li>
						</ul>
					</nav>

					{/* ── Аватарка + выпадающее меню ── */}
					<div className='header__avatar-wrap' ref={wrapRef}>
						<button
							className={`header__avatar-trigger${isOpen ? ' header__avatar-trigger--open' : ''}`}
							onClick={() => setIsOpen(prev => !prev)}
							aria-label='Меню пользователя'
						>
							{/* Аватарка */}
							{avatarUrl ? (
								<img
									src={avatarUrl}
									alt='avatar'
									className='header__avatar-img'
								/>
							) : firstLetter ? (
								<div className='header__avatar-letter'>{firstLetter}</div>
							) : (
								<div className='header__avatar-placeholder'>
									<svg width='60' height='60' viewBox='0 0 60 60' fill='none'>
										<rect width='60' height='60' rx='30' fill='#D9D9D9' />
									</svg>
								</div>
							)}

							{/* Стрелка */}
							<span className={`header__avatar-arrow${isOpen ? ' header__avatar-arrow--open' : ''}`}>
								<svg width='10' height='6' viewBox='0 0 10 6' fill='none'>
									<path
										d='M1 1L5 5L9 1'
										stroke='white'
										strokeWidth='1.8'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								</svg>
							</span>
						</button>

						{/* Дропдаун */}
						{isOpen && (
							<div className='header__dropdown'>
								{user ? (
									<>
										<NavLink
											to='/profile'
											className='header__dropdown-item'
											onClick={() => setIsOpen(false)}
										>
											<svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
												<circle cx='12' cy='8' r='4' stroke='currentColor' strokeWidth='1.8' />
												<path d='M4 20c0-4 3.6-7 8-7s8 3 8 7' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
											</svg>
											Профиль
										</NavLink>
										<div className='header__dropdown-divider' />
										<button
											className='header__dropdown-item header__dropdown-item--danger'
											onClick={handleLogout}
										>
											<svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
												<path d='M15 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H15' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
												<path d='M10 17L15 12L10 7' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
												<path d='M15 12H3' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
											</svg>
											Выход
										</button>
									</>
								) : (
									<>
										<NavLink
											to='/auth'
											className='header__dropdown-item'
											onClick={() => setIsOpen(false)}
										>
											<svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
												<path d='M15 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H15' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
												<path d='M10 12H21M18 9L21 12L18 15' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
											</svg>
											Войти
										</NavLink>
										<NavLink
											to='/register'
											className='header__dropdown-item'
											onClick={() => setIsOpen(false)}
										>
											<svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
												<circle cx='12' cy='8' r='4' stroke='currentColor' strokeWidth='1.8' />
												<path d='M4 20c0-4 3.6-7 8-7s8 3 8 7' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
												<path d='M19 3v6M16 6h6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
											</svg>
											Регистрация
										</NavLink>
									</>
								)}
							</div>
						)}
					</div>

					<input
						type='checkbox'
						name='burgerToggle'
						id='burgerToggle'
						className='header__toggle'
					/>
					<label htmlFor='burgerToggle' className='header__burger-icon'>
						<span className='header__burger-line'></span>
					</label>
					<nav className='header__burger-menu'>
						<ul className='header__burger-list'>
							<li className='header__menu-item'>
								<NavLink to='/recommendations' className='header__menu-link'>
									Рекомендации
								</NavLink>
							</li>
							<li className='header__menu-item'>
								<NavLink to='/' end className='header__menu-link'>
									Мой таймлайн
								</NavLink>
							</li>
						</ul>
					</nav>
				</div>
			</header>
		</>
	)
}

export default HeaderLayout
