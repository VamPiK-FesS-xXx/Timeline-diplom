import { NavLink } from 'react-router-dom'

function AuthNotice({ onClose }) {
  return (
    <div className='auth-notice'>
      <svg className='auth-notice__icon' width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='3' y='11' width='18' height='11' rx='2' stroke='white' strokeWidth='2' strokeLinejoin='round' />
        <path d='M7 11V7a5 5 0 0110 0v4' stroke='white' strokeWidth='2' strokeLinecap='round' />
      </svg>

      <p className='auth-notice__text'>
        Чтобы сохранить воспоминание, необходимо{' '}
        <NavLink to='/auth' className='auth-notice__link'>войти</NavLink>
        {' '}или{' '}
        <NavLink to='/register' className='auth-notice__link'>зарегистрироваться</NavLink>
      </p>

      <button className='auth-notice__close' onClick={onClose} aria-label='Закрыть'>
        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path d='M18 6L6 18M6 6l12 12' stroke='white' strokeWidth='2' strokeLinecap='round' />
        </svg>
      </button>
    </div>
  )
}

export default AuthNotice
