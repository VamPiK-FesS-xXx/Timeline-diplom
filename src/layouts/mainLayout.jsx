import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import HeaderLayout from './headerLayout'
import Greetings from '../components/greetings.jsx'
import TextGreetings from '../components/textGreetings.jsx'
import TextAndStatics from '../components/text-and-statics.jsx'
import TimeLine, { MONTH_NAMES } from '../components/timeLine.jsx'
import Controls from '../components/controls.jsx'
import Settings from '../components/settings.jsx'
import SettingsModal from '../components/settings-modal.jsx'
import AdddMemory from '../components/addMemory.jsx'
import AuthNotice from '../components/authNotice.jsx'
import ViewMemory from '../components/viewMemory.jsx'
import { useAuth } from '../context/AuthContext'

const API = '/api'

const VISIBLE_COUNT = 10
const STEP = VISIBLE_COUNT - 1

// Российские государственные праздники: { month: 0-based, day }
const HOLIDAYS = [
	{ month: 0,  day: 1  }, // Новый год
	{ month: 0,  day: 2  }, // Новогодние каникулы
	{ month: 0,  day: 7  }, // Рождество
	{ month: 1,  day: 23 }, // День защитника Отечества
	{ month: 2,  day: 8  }, // Международный женский день
	{ month: 4,  day: 1  }, // Праздник весны и труда
	{ month: 4,  day: 9  }, // День Победы
	{ month: 5,  day: 12 }, // День России
	{ month: 10, day: 4  }, // День народного единства
]

function getDaysInMonth(year, month) {
	return new Date(year, month + 1, 0).getDate()
}

const Layout = () => {
	const { user } = useAuth()

	const [birthYear, setBirthYear] = useState(() => {
		const saved = sessionStorage.getItem('birthYear')
		return saved ? parseInt(saved, 10) : null
	})

	// Полная дата рождения (YYYY-MM-DD) — для подсветки дня рождения
	const [birthDate, setBirthDate] = useState(() => sessionStorage.getItem('birthDate'))

	const birthMonthDay = useMemo(() => {
		if (!birthDate) return null
		const parts = birthDate.split('-')
		return { month: parseInt(parts[1], 10) - 1, day: parseInt(parts[2], 10) }
	}, [birthDate])

	// Пропускаем анимацию TextGreetings если пользователь уже авторизован
	// или уже вводил дату рождения ранее (есть в localStorage)
	const skipAnimation = birthYear !== null || user !== null
	const [showTimeline, setShowTimeline] = useState(skipAnimation)
	const [greetingPhase, setGreetingPhase] = useState(skipAnimation ? 'hidden' : 'visible')
	const [page, setPage] = useState(0)
	const [selectedYear, setSelectedYear] = useState(null)
	const [selectedMonth, setSelectedMonth] = useState(null)
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [memoryItem, setMemoryItem] = useState(null)
	const [showAuthNotice, setShowAuthNotice] = useState(false)
	const [memories, setMemories] = useState([])
	const [selectedMemory, setSelectedMemory] = useState(null)
	const [showNotification,       setShowNotification]       = useState(false)
	const [showUpdateNotification, setShowUpdateNotification] = useState(false)
	const [showDeleteNotification, setShowDeleteNotification] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [activeFilter, setActiveFilter] = useState(null)
	const [sortOrder, setSortOrder] = useState('date-desc')
	const [onlyWithPhotos, setOnlyWithPhotos] = useState(false)
	const [onlyWithVideos, setOnlyWithVideos] = useState(false)

	// ── Сброс при выходе пользователя ───────────────────────────
	const prevUserRef = useRef(user)
	useEffect(() => {
		const wasLoggedIn = prevUserRef.current !== null
		const isLoggedOut = user === null
		if (wasLoggedIn && isLoggedOut) {
			sessionStorage.removeItem('birthYear')
			sessionStorage.removeItem('birthDate')
			setBirthYear(null)
			setBirthDate(null)
			setShowTimeline(false)
			setGreetingPhase('visible')
			setPage(0)
			setSelectedYear(null)
			setSelectedMonth(null)
			setMemories([])
		}
		prevUserRef.current = user
	}, [user])

	const fetchMemories = useCallback(() => {
		axios
			.get(`${API}/memories.php`)
			.then(({ data }) => setMemories(data.memories ?? []))
			.catch(() => setMemories([]))
	}, [])

	useEffect(() => {
		if (!user) { setMemories([]); return }
		fetchMemories()
	}, [user, fetchMemories])

	const handleMemoryDeleted = useCallback((id) => {
		setMemories(prev => prev.filter(m => m.id !== id))
		setSelectedMemory(null)
		setShowDeleteNotification(true)
		setTimeout(() => setShowDeleteNotification(false), 3000)
	}, [])

	const handleMemoryUpdated = useCallback(() => {
		fetchMemories()
		setShowUpdateNotification(true)
		setTimeout(() => setShowUpdateNotification(false), 3000)
	}, [fetchMemories])

	const handleMemorySuccess = useCallback(() => {
		fetchMemories()
		setShowNotification(true)
		setTimeout(() => setShowNotification(false), 3000)
	}, [fetchMemories])

	const currentYear = new Date().getFullYear()

	const items = useMemo(() => {
		if (!birthYear) return []

		// ── Определяем диапазон видимых лет по активному фильтру ──
		let minYear = birthYear
		let maxYear = currentYear

		if (typeof activeFilter === 'string') {
			if (activeFilter.startsWith('year-')) {
				const y = parseInt(activeFilter.replace('year-', ''), 10)
				if (!isNaN(y)) { minYear = y; maxYear = y }
			} else if (activeFilter.startsWith('range-')) {
				const rm = activeFilter.match(/^range-(\d+)-(\d+)$/)
				if (rm) {
					minYear = parseInt(rm[1], 10)
					maxYear = parseInt(rm[2], 10)
				}
			} else if (activeFilter === 'currentYear') {
				minYear = currentYear; maxYear = currentYear
			} else if (activeFilter === 'lastMonth' || activeFilter === 'lastWeek') {
				// Оба фильтра работают внутри текущего года
				minYear = currentYear; maxYear = currentYear
			}
		}

		minYear = Math.max(minYear, birthYear)
		maxYear = Math.min(maxYear, currentYear)
		if (minYear > maxYear) maxYear = minYear

		// Вспомогательная функция: уровень 1 (только годы диапазона)
		const yearLevelItems = () => {
			const r = []
			for (let y = minYear; y <= maxYear; y++)
				r.push({ type: 'year', value: y, label: String(y), key: 'y-' + y })
			return r
		}

		// ── Уровень 3: дни выбранного месяца ─────────────────────
		if (selectedYear !== null && selectedMonth !== null) {
			if (selectedYear < minYear || selectedYear > maxYear) return yearLevelItems()

			const result = []
			for (let y = minYear; y < selectedYear; y++)
				result.push({ type: 'year', value: y, label: String(y), key: 'y-' + y })

			for (let m = 0; m < selectedMonth; m++)
				result.push({ type: 'month', value: m, label: MONTH_NAMES[m], key: 'm-' + selectedYear + '-' + m })

			const daysCount = getDaysInMonth(selectedYear, selectedMonth)
			const mm = String(selectedMonth + 1).padStart(2, '0')

			// Для «последней недели» показываем только последние 7 дней текущего месяца
			let dayStart = 1
			let dayEnd = daysCount
			if (activeFilter === 'lastWeek') {
				const now = new Date()
				if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) {
					dayEnd = now.getDate()
					dayStart = Math.max(1, dayEnd - 6)
				}
			}

			for (let d = dayStart; d <= dayEnd; d++) {
				const dd = String(d).padStart(2, '0')
				const isHoliday = HOLIDAYS.some(h => h.month === selectedMonth && h.day === d)
				const isBirthday = birthMonthDay !== null
					&& birthMonthDay.month === selectedMonth
					&& birthMonthDay.day === d
				result.push({
					type: 'day', value: d, label: dd + '.' + mm,
					key: 'd-' + selectedYear + '-' + selectedMonth + '-' + d,
					isHoliday, isBirthday,
				})
			}
			return result
		}

		// ── Уровень 2: месяцы выбранного года ────────────────────
		if (selectedYear !== null) {
			if (selectedYear < minYear || selectedYear > maxYear) return yearLevelItems()

			const result = []
			for (let y = minYear; y < selectedYear; y++)
				result.push({ type: 'year', value: y, label: String(y), key: 'y-' + y })

			MONTH_NAMES.forEach((name, i) =>
				result.push({ type: 'month', value: i, label: name, key: 'm-' + selectedYear + '-' + i })
			)
			return result
		}

		// ── Уровень 1: годы ───────────────────────────────────────
		return yearLevelItems()
	}, [birthYear, selectedYear, selectedMonth, currentYear, birthMonthDay, activeFilter, memories])

	const filteredMemories = useMemo(() => {
		let result = [...memories]

		// Фильтр по периоду / конкретному году
		const now = new Date()
		if (typeof activeFilter === 'string' && activeFilter.startsWith('year-')) {
			const year = activeFilter.replace('year-', '')
			result = result.filter(m => m.event_date?.startsWith(year))
		} else if (activeFilter === 'currentYear') {
			const year = String(now.getFullYear())
			result = result.filter(m => m.event_date?.startsWith(year))
		} else if (activeFilter === 'lastWeek') {
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
			result = result.filter(m => m.event_date && new Date(m.event_date) >= weekAgo)
		} else if (activeFilter === 'lastMonth') {
			const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
			result = result.filter(m => m.event_date && new Date(m.event_date) >= monthAgo)
		}
		// null / 'allTime' — без ограничений по дате

		// Только с медиа (фото или видео)
		if (onlyWithPhotos) {
			result = result.filter(m => (m.images?.length > 0) || m.preview_image || (m.videos?.length > 0))
		}

		// Только с видео
		if (onlyWithVideos) {
			result = result.filter(m => m.videos?.length > 0)
		}

		// Поиск по заголовку
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim()
			result = result.filter(m => m.title?.toLowerCase().includes(q))
		}

		// Сортировка
		if (sortOrder === 'date-desc') {
			result.sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
		} else if (sortOrder === 'date-asc') {
			result.sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
		} else if (sortOrder === 'alpha-asc') {
			result.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ru'))
		} else if (sortOrder === 'alpha-desc') {
			result.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'ru'))
		}

		return result
	}, [memories, activeFilter, onlyWithPhotos, onlyWithVideos, searchQuery, sortOrder])

	const maxPage = Math.max(Math.ceil((items.length - VISIBLE_COUNT) / STEP), 0)

	// При смене фильтра обновляем навигацию таймлайна
	useEffect(() => {
		const now = new Date()
		if (activeFilter === 'lastMonth' || activeFilter === 'lastWeek') {
			// Автоматически открываем текущий год + текущий месяц (уровень дней)
			setSelectedYear(now.getFullYear())
			setSelectedMonth(now.getMonth())
			setPage(0)
		} else {
			setSelectedYear(null)
			setSelectedMonth(null)
			setPage(0)
		}
	}, [activeFilter])

	// Синхронизируем birth_date из профиля (после логина / при загрузке страницы)
	// Дата приходит из профиля — приветствие не проигрываем, сразу показываем статистику
	useEffect(() => {
		if (user?.birth_date) {
			const parts = user.birth_date.split('-')
			const year = parseInt(parts[0], 10)
			if (!isNaN(year)) {
				setBirthYear(year)
				setBirthDate(user.birth_date)
				setShowTimeline(true)
				setGreetingPhase('hidden')
			}
		}
	}, [user])

	useEffect(() => {
		if (birthYear && !showTimeline) {
			const timer = setTimeout(() => setShowTimeline(true), 2000)
			return () => clearTimeout(timer)
		}
	}, [birthYear, showTimeline])

	useEffect(() => {
		if (showTimeline && greetingPhase === 'visible') {
			const timer = setTimeout(() => setGreetingPhase('fading'), 2000)
			return () => clearTimeout(timer)
		}
	}, [showTimeline, greetingPhase])

	useEffect(() => {
		if (greetingPhase === 'fading') {
			const timer = setTimeout(() => setGreetingPhase('hidden'), 2000)
			return () => clearTimeout(timer)
		}
	}, [greetingPhase])

	const handlePrev = () => {
		setPage(prev => Math.max(prev - 1, 0))
	}

	const handleNext = () => {
		setPage(prev => Math.min(prev + 1, maxPage))
	}

	const handleYearClick = (year) => {
		setSelectedYear(year)
		setSelectedMonth(null)
		setPage(0)
	}

	const handleMonthClick = (monthIndex) => {
		setSelectedMonth(monthIndex)
		setPage(0)
	}

	const handleBack = () => {
		if (selectedMonth !== null) {
			// Из дней → обратно к месяцам
			setSelectedMonth(null)
			setPage(0)
		} else if (selectedYear !== null) {
			// Из месяцев → обратно к годам
			setSelectedYear(null)
			setPage(0)
		}
	}

	const canGoBack = selectedYear !== null || selectedMonth !== null

	const handleConfirmBirthYear = (year, fullDate) => {
		sessionStorage.setItem('birthYear', year)
		if (fullDate) {
			sessionStorage.setItem('birthDate', fullDate)
			setBirthDate(fullDate)
		}
		setBirthYear(year)
	}

	return (
		<>
		<div className='layout'>
			<HeaderLayout />
			<main className='main'>
				{!birthYear ? (
					<Greetings onConfirm={handleConfirmBirthYear} />
				) : (
					<>
						{greetingPhase === 'visible' && (
							<TextGreetings />
						)}
						{greetingPhase === 'fading' && (
							<div className='success--fadeout'>
								<TextGreetings />
							</div>
						)}
						{greetingPhase === 'hidden' && (
							<div className='statistic-appear'>
								<TextAndStatics
									selectedYear={selectedYear}
									selectedMonth={selectedMonth}
									memoriesCount={0}
								/>
							</div>
						)}
						{showTimeline && (
							<div className={greetingPhase === 'visible' ? 'timeline-appear' : ''}>
								<TimeLine
									birthYear={birthYear}
									page={page}
									step={STEP}
									visibleCount={VISIBLE_COUNT}
									selectedYear={selectedYear}
									selectedMonth={selectedMonth}
									onYearClick={handleYearClick}
									onMonthClick={handleMonthClick}
									onAddMemory={(item) => {
									if (!user) {
										setShowAuthNotice(true)
									} else {
										setShowAuthNotice(false)
										setMemoryItem(item)
									}
								}}
									items={items}
									memories={filteredMemories}
									onMemoryCardClick={setSelectedMemory}
									paused={!!selectedMemory}
								/>
								<Controls
									onPrev={canGoBack && page === 0 ? handleBack : handlePrev}
									onNext={handleNext}
									canPrev={canGoBack ? true : page > 0}
									canNext={page < maxPage}
								/>
								{showAuthNotice && (
									<AuthNotice onClose={() => setShowAuthNotice(false)} />
								)}
							</div>
						)}
					</>
				)}
				<Settings onClick={() => setIsSettingsOpen(true)} />
				{isSettingsOpen && (
					<SettingsModal
						onClose={() => setIsSettingsOpen(false)}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
						sortOrder={sortOrder}
						onSortChange={setSortOrder}
						onlyWithPhotos={onlyWithPhotos}
						onOnlyWithPhotosChange={setOnlyWithPhotos}
						onlyWithVideos={onlyWithVideos}
						onOnlyWithVideosChange={setOnlyWithVideos}
						birthYear={birthYear}
						filteredMemories={filteredMemories}
						onMemoryClick={setSelectedMemory}
					/>
				)}
				{memoryItem && (
					<AdddMemory
						item={memoryItem}
						onClose={() => setMemoryItem(null)}
						onSuccess={handleMemorySuccess}
					/>
				)}
			</main>
		</div>
		{selectedMemory && createPortal(
			<ViewMemory
				memory={selectedMemory}
				onClose={() => setSelectedMemory(null)}
				onDeleted={handleMemoryDeleted}
				onUpdated={handleMemoryUpdated}
			/>,
			document.body,
		)}
		{showNotification && createPortal(
			<div className='memory-notification'>
				<span className='memory-notification__icon'>
					<svg width='13' height='10' viewBox='0 0 13 10' fill='none'>
						<path d='M1.5 5L5 8.5L11.5 1.5' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
				</span>
				Воспоминание успешно добавлено
			</div>,
			document.body,
		)}
		{showUpdateNotification && createPortal(
			<div className='memory-notification memory-notification--update'>
				<span className='memory-notification__icon'>
					<svg width='13' height='10' viewBox='0 0 13 10' fill='none'>
						<path d='M1.5 5L5 8.5L11.5 1.5' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
				</span>
				Воспоминание успешно изменено
			</div>,
			document.body,
		)}
		{showDeleteNotification && createPortal(
			<div className='memory-notification memory-notification--delete'>
				<span className='memory-notification__icon'>
					<svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
						<path d='M1 1L11 11M11 1L1 11' stroke='white' strokeWidth='2' strokeLinecap='round' />
					</svg>
				</span>
				Воспоминание удалено
			</div>,
			document.body,
		)}
		</>
	)
}

export default Layout
