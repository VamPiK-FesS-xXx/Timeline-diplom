import HeaderLayout from './headerLayout'
import UserPage from '../components/userpage.jsx'

function ProfileLayout() {
	return (
		<div className='layout'>
			<HeaderLayout />
			<main className='main'>
				<UserPage />
			</main>
		</div>
	)
}

export default ProfileLayout
