function TextGreetings() {
	return (
		<div className='success'>
			<div className='success__inner'>
				<p className='success__text'>Ваш таймлайн готов</p>
				<div className='success__arrow animated--arrow'>
					<svg
						width='74'
						height='152'
						viewBox='0 0 74 152'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'
					>
						<path
							d='M33.2843 150.536C35.2369 152.488 38.4027 152.488 40.3554 150.536L72.1752 118.716C74.1278 116.763 74.1278 113.597 72.1752 111.645C70.2225 109.692 67.0567 109.692 65.1041 111.645L36.8198 139.929L8.53555 111.645C6.58293 109.692 3.41711 109.692 1.46449 111.645C-0.488136 113.597 -0.488136 116.763 1.46449 118.716L33.2843 150.536ZM36.8198 0L31.8198 0L31.8198 147H36.8198H41.8198L41.8198 0L36.8198 0Z'
							fill='white'
						/>
					</svg>
				</div>
			</div>
		</div>
	)
}

export default TextGreetings
