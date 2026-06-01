import HeaderLayout from './headerLayout'
import Recommendations from '../pages/recommendations'

function RecommendationsLayout() {
	return (
		<div className='layout'>
			<HeaderLayout />
			<main className='main'>
				<Recommendations />
			</main>
		</div>
	)
}

export default RecommendationsLayout
