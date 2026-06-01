import { useState } from 'react'

function Greetings({ onConfirm }) {
	const [date, setDate] = useState('')
	const [error, setError] = useState('')

	const handleChange = e => {
		const value = e.target.value
		const yearPart = value.split('-')[0]
		if (yearPart && yearPart.length > 4) return
		setDate(value)
		setError('')
	}

	const handleConfirm = () => {
		if (!date) {
			setError('Введите дату рождения')
			return
		}

		const parts = date.split('-')
		const year = parseInt(parts[0], 10)
		const currentYear = new Date().getFullYear()

		if (year < 1950 || year > currentYear) {
			setError('Введите корректный год (1950–' + currentYear + ')')
			return
		}

		onConfirm(year, date)
	}

	return (
		<div className='greetings'>
			<div className='greetings__inner'>
				<div
					className='greetings__date'
					onKeyDown={e => {
						if (e.key === 'Enter') handleConfirm()
					}}
				>
					<p className='greetings__date-text'>
						Введите дату своего рождения, <br />
						чтобы мы построили ваш таймлайн
					</p>
					<input
						type='date'
						className={'greetings__date-input' + (error ? ' input-error' : '')}
						value={date}
						onChange={handleChange}
						max={new Date().toISOString().split('T')[0]}
						min='1950-01-01'
					/>
					{error && <p className='greetings__error'>{error}</p>}
					<button className='greetings__date-btn' onClick={handleConfirm}>
						Подтвердить
					</button>
				</div>
			</div>
		</div>
	)
}

export default Greetings
