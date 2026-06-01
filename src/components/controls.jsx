function Controls({ onPrev, onNext, canPrev, canNext }) {
	return (
		<div className='controls'>
			<div className='controls__inner'>
				<div className='controls__flex'>
					<button
						className='controls__btn btn-flex'
						onClick={onNext}
						disabled={!canNext}
					>
						<svg
							width='35'
							height='27'
							viewBox='0 0 45 37'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path
								d='M0.732231 16.6421C-0.244076 17.6185 -0.244076 19.2014 0.732231 20.1777L16.6421 36.0876C17.6184 37.0639 19.2014 37.0639 20.1777 36.0876C21.154 35.1113 21.154 33.5284 20.1777 32.552L6.03553 18.4099L20.1777 4.26777C21.154 3.29146 21.154 1.70855 20.1777 0.73224C19.2014 -0.24407 17.6184 -0.24407 16.6421 0.73224L0.732231 16.6421ZM44.5 18.4099L44.5 15.9099L2.5 15.9099L2.5 18.4099L2.5 20.9099L44.5 20.9099L44.5 18.4099Z'
								fill='white'
								fillOpacity='0.75'
							/>
						</svg>
					</button>
					<button
						className='controls__btn btn-flex'
						onClick={onPrev}
						disabled={!canPrev}
					>
						<svg
							width='35'
							height='27'
							viewBox='0 0 45 37'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path
								d='M43.7678 20.1777C44.7441 19.2014 44.7441 17.6185 43.7678 16.6421L27.8579 0.732243C26.8816 -0.244068 25.2986 -0.244068 24.3223 0.732243C23.346 1.70855 23.346 3.29147 24.3223 4.26778L38.4645 18.4099L24.3223 32.552C23.346 33.5284 23.346 35.1113 24.3223 36.0876C25.2986 37.0639 26.8816 37.0639 27.8579 36.0876L43.7678 20.1777ZM0 18.4099V20.9099H42V18.4099V15.9099H0V18.4099Z'
								fill='white'
								fillOpacity='0.75'
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	)
}

export default Controls
