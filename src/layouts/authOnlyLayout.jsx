import HeaderLayout from './headerLayout'
import ModalAuth from '../pages/modalAuth.jsx'

function AuthOnlyLayout() {
	return (
		<div className='layout'>
			<HeaderLayout />
			<ModalAuth />
		</div>
	)
}

export default AuthOnlyLayout
