import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import ViewMemory from './viewMemory'
import { MediaCard } from './MediaCard'

const API = '/api'
const UPLOADS = 'http://timeline-bd/backend/'

const MONTH_NAMES = [
	'Январь',
	'Февраль',
	'Март',
	'Апрель',
	'Май',
	'Июнь',
	'Июль',
	'Август',
	'Сентябрь',
	'Октябрь',
	'Ноябрь',
	'Декабрь',
]

const MONTH_NAMES_GEN = [
	'января',
	'февраля',
	'марта',
	'апреля',
	'мая',
	'июня',
	'июля',
	'августа',
	'сентября',
	'октября',
	'ноября',
	'декабря',
]

function getMonthName(dateStr) {
	const m = parseInt(dateStr?.split('-')[1] ?? '1', 10) - 1
	return MONTH_NAMES[m] ?? ''
}

function getDayLabel(dateStr) {
	const parts = dateStr?.split('-') ?? []
	const day = parseInt(parts[2] ?? '1', 10)
	const m = parseInt(parts[1] ?? '1', 10) - 1
	return `${day} ${MONTH_NAMES_GEN[m] ?? ''}`
}

const CARDS_PER_PAGE = 3

// ── Иконка сердца ────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
	<svg
		width='18'
		height='18'
		viewBox='0 0 24 24'
		fill={filled ? 'currentColor' : 'none'}
		stroke='currentColor'
		strokeWidth='2.2'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
	</svg>
)

// ── Карточка воспоминания со слайдшоу фотографий ────────────
function MemoryCard({ memory, onClick, dateLabel, isFavorite, onToggleFavorite }) {
	const images = useMemo(
		() =>
			memory.images?.length > 0
				? memory.images
				: memory.preview_image
					? [memory.preview_image]
					: [],
		[memory.images, memory.preview_image],
	)

	const videos = useMemo(() => memory.videos ?? [], [memory.videos])

	const handleFavoriteClick = e => {
		e.stopPropagation()
		onToggleFavorite?.(memory.id, isFavorite)
	}

	return (
		<MediaCard
			images={images}
			videos={videos}
			resetKey={memory.id}
			onClick={onClick}
		>
			{({ textDark, textStyle }) => (
				<div className='memory__grid-info'>
					<div className='memory__grid-info-top'>
						<p className='memory__date-paragraph' style={textStyle}>
							{dateLabel ?? getMonthName(memory.event_date)}
						</p>
						<button
							className={`memory__favorite-btn${isFavorite ? ' memory__favorite-btn--active' : ''}${textDark ? ' memory__favorite-btn--dark' : ''}`}
							onClick={handleFavoriteClick}
							title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
						>
							<HeartIcon filled={isFavorite} />
						</button>
					</div>
					<p className='memory__title' style={textStyle}>
						{memory.title}
					</p>
				</div>
			)}
		</MediaCard>
	)
}

// ── Карточка месяца (первый уровень) ────────────────────────
function MonthCard({ monthKey, memories, onClick }) {
	const allImages = useMemo(() => {
		const imgs = []
		memories.forEach(m => {
			if (m.images?.length > 0) imgs.push(...m.images)
			else if (m.preview_image) imgs.push(m.preview_image)
		})
		return imgs
	}, [memories])

	const allVideos = useMemo(() => {
		if (allImages.length > 0) return []
		const vids = []
		memories.forEach(m => {
			if (m.videos?.length > 0) vids.push(...m.videos)
		})
		return vids
	}, [memories, allImages])

	const monthName = MONTH_NAMES[parseInt(monthKey, 10) - 1] ?? ''

	return (
		<MediaCard images={allImages} videos={allVideos} onClick={onClick}>
			{({ textStyle }) => (
				<div className='memory__grid-info'>
					<p className='memory__date-paragraph' style={textStyle}>
						{monthName}
					</p>
					<p className='memory__title' style={textStyle}>
						{memories.length} {declMemories(memories.length)}
					</p>
				</div>
			)}
		</MediaCard>
	)
}

// ── SVG стрелки ──────────────────────────────────────────────
const ArrowLeft = () => (
	<svg
		width='12'
		height='18'
		viewBox='0 0 13 23'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
	>
		<path
			d='M11.5 21.5L1.5 11.5L11.5 1.5'
			stroke='white'
			strokeWidth='3'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
)
const ArrowRight = () => (
	<svg
		width='12'
		height='18'
		viewBox='0 0 13 23'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
	>
		<path
			d='M1.5 1.5L11.5 11.5L1.5 21.5'
			stroke='white'
			strokeWidth='3'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
)

// ── Блок одного года ─────────────────────────────────────────
function YearBlock({ year, memories, onCardClick, favoriteIds, onToggleFavorite }) {
	const [page, setPage] = useState(0)
	const [selectedMonth, setSelectedMonth] = useState(null)

	const byMonth = useMemo(() => {
		const groups = {}
		memories.forEach(m => {
			const mk = m.event_date?.split('-')[1]
			if (!mk) return
			if (!groups[mk]) groups[mk] = []
			groups[mk].push(m)
		})
		return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a))
	}, [memories])

	const items = selectedMonth
		? (byMonth.find(([mk]) => mk === selectedMonth)?.[1] ?? [])
		: byMonth

	const maxPage = Math.max(0, Math.ceil(items.length / CARDS_PER_PAGE) - 1)
	const visible = items.slice(
		page * CARDS_PER_PAGE,
		(page + 1) * CARDS_PER_PAGE,
	)
	const canPrev = page > 0
	const canNext = page < maxPage

	const handleMonthClick = mk => {
		setSelectedMonth(mk)
		setPage(0)
	}
	const handleBack = () => {
		setSelectedMonth(null)
		setPage(0)
	}

	const activeMonthName = selectedMonth
		? (MONTH_NAMES[parseInt(selectedMonth, 10) - 1] ?? '')
		: null

	return (
		<div className='user__info-memories'>
			<div className='user__info-date'>
				<div className='user__info-date-left'>
					<p className='user__info-paragraph'>
						{year} год
						{activeMonthName && (
							<span className='user__info-month-label'>
								{' '}
								— {activeMonthName}
							</span>
						)}
					</p>
					<p className='user__info-paragraph user__memories-count'>
						{memories.length} {declMemories(memories.length)}
					</p>
				</div>

				<button
					className={`user__info-back-btn${selectedMonth ? ' user__info-back-btn--active' : ''}`}
					onClick={handleBack}
					disabled={!selectedMonth}
					title='К месяцам'
				>
					<svg
						width='10'
						height='16'
						viewBox='0 0 13 23'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'
					>
						<path
							d='M11.5 21.5L1.5 11.5L11.5 1.5'
							stroke='white'
							strokeWidth='3'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
					</svg>
				</button>
			</div>

			<div className='user__info-inner'>
				<div className='memory__grid-nav'>
					<button
						className='btn-prev-cards'
						onClick={() => setPage(p => p - 1)}
						disabled={!canPrev}
						title='Назад'
					>
						<ArrowLeft />
					</button>

					<div className='memory__grid-list'>
						{selectedMonth
							? visible.map(memory => (
									<MemoryCard
										key={memory.id}
										memory={memory}
										dateLabel={getDayLabel(memory.event_date)}
										onClick={() => onCardClick?.(memory)}
										isFavorite={favoriteIds.has(memory.id)}
										onToggleFavorite={onToggleFavorite}
									/>
								))
							: visible.map(([mk, mems]) => (
									<MonthCard
										key={mk}
										monthKey={mk}
										memories={mems}
										onClick={() => handleMonthClick(mk)}
									/>
								))}
					</div>

					<button
						className='btn-next-cards'
						onClick={() => setPage(p => p + 1)}
						disabled={!canNext}
						title='Вперёд'
					>
						<ArrowRight />
					</button>
				</div>

				{maxPage > 0 && (
					<div className='memory__dots'>
						{Array.from({ length: maxPage + 1 }).map((_, i) => (
							<button
								key={i}
								className={`memory__dot${i === page ? ' memory__dot--active' : ''}`}
								onClick={() => setPage(i)}
								title={`Страница ${i + 1}`}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

function declMemories(n) {
	const mod10 = n % 10
	const mod100 = n % 100
	if (mod100 >= 11 && mod100 <= 14) return 'воспоминаний'
	if (mod10 === 1) return 'воспоминание'
	if (mod10 >= 2 && mod10 <= 4) return 'воспоминания'
	return 'воспоминаний'
}

// ── Всплывающее уведомление ──────────────────────────────────
function MemoryNotice({ type, children }) {
	return createPortal(
		<div className={`memory-notification memory-notification--${type}`}>
			<span className='memory-notification__icon'>
				{type === 'delete' ? (
					<svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
						<path d='M1 1L11 11M11 1L1 11' stroke='white' strokeWidth='2' strokeLinecap='round' />
					</svg>
				) : (
					<svg width='13' height='10' viewBox='0 0 13 10' fill='none'>
						<path d='M1.5 5L5 8.5L11.5 1.5' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
					</svg>
				)}
			</span>
			{children}
		</div>,
		document.body,
	)
}

// ── Основной компонент ───────────────────────────────────────
function UserPage() {
	const { user, updateUser } = useAuth()
	const fileInputRef = useRef(null)
	const nameInputRef = useRef(null)

	// --- аватар ---
	const [uploading, setUploading] = useState(false)
	const [uploadError, setUploadError] = useState('')

	// --- никнейм ---
	const [editingName, setEditingName] = useState(false)
	const [nameValue, setNameValue] = useState('')
	const [nameError, setNameError] = useState('')
	const [nameSaving, setNameSaving] = useState(false)

	// --- воспоминания ---
	const [memories, setMemories] = useState([])
	const [memoriesLoading, setMemoriesLoading] = useState(true)
	const [selectedMemory, setSelectedMemory] = useState(null)
	const [showUpdateNotification, setShowUpdateNotification] = useState(false)
	const [showDeleteNotification, setShowDeleteNotification] = useState(false)

	// --- избранное ---
	const [favoriteIds, setFavoriteIds] = useState(new Set())
	const [activeTab, setActiveTab] = useState('all') // 'all' | 'favorites'

	// ── Загрузка воспоминаний ────────────────────────────────
	useEffect(() => {
		Promise.all([
			axios.get(`${API}/memories.php`),
			axios.get(`${API}/favorites.php`),
		])
			.then(([memoriesRes, favRes]) => {
				setMemories(memoriesRes.data.memories ?? [])
				setFavoriteIds(new Set(favRes.data.favorite_ids ?? []))
			})
			.catch(() => {
				setMemories([])
				setFavoriteIds(new Set())
			})
			.finally(() => setMemoriesLoading(false))
	}, [])

	// ── Переключение избранного ──────────────────────────────
	const toggleFavorite = useCallback(async (memoryId, currentlyFavorite) => {
		// Оптимистичное обновление
		setFavoriteIds(prev => {
			const next = new Set(prev)
			if (currentlyFavorite) next.delete(memoryId)
			else next.add(memoryId)
			return next
		})

		try {
			if (currentlyFavorite) {
				await axios.delete(`${API}/favorites.php?memory_id=${memoryId}`)
			} else {
				await axios.post(`${API}/favorites.php`, { memory_id: memoryId })
			}
		} catch {
			// Откат при ошибке
			setFavoriteIds(prev => {
				const next = new Set(prev)
				if (currentlyFavorite) next.add(memoryId)
				else next.delete(memoryId)
				return next
			})
		}
	}, [])

	// ── Группировка воспоминаний по годам ────────────────────
	const memoriesByYear = useMemo(() => {
		const source =
			activeTab === 'favorites'
				? memories.filter(m => favoriteIds.has(m.id))
				: memories
		const groups = {}
		source.forEach(m => {
			const year = m.event_date?.split('-')[0]
			if (!year) return
			if (!groups[year]) groups[year] = []
			groups[year].push(m)
		})
		return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a))
	}, [memories, favoriteIds, activeTab])

	// ── Никнейм ──────────────────────────────────────────────
	useEffect(() => {
		if (editingName) {
			setNameValue(user?.username || '')
			setNameError('')
			setTimeout(() => nameInputRef.current?.focus(), 0)
		}
	}, [editingName])

	const handleNameSave = async () => {
		const trimmed = nameValue.trim()
		if (trimmed === user?.username) {
			setEditingName(false)
			return
		}
		if (trimmed.length < 3 || trimmed.length > 30) {
			setNameError('Никнейм должен быть от 3 до 30 символов')
			return
		}
		setNameSaving(true)
		setNameError('')
		try {
			await axios.put(`${API}/profile`, { username: trimmed })
			updateUser({ username: trimmed })
			setEditingName(false)
		} catch (err) {
			setNameError(err.response?.data?.error || 'Ошибка сохранения')
		} finally {
			setNameSaving(false)
		}
	}

	const handleNameKeyDown = e => {
		if (e.key === 'Enter') handleNameSave()
		if (e.key === 'Escape') setEditingName(false)
	}

	// ── Аватар ───────────────────────────────────────────────
	const avatarUrl = user?.avatar_path ? `${UPLOADS}${user.avatar_path}` : null
	const firstLetter = user?.username?.charAt(0).toUpperCase() || '?'

	const handleFileChange = async e => {
		const file = e.target.files[0]
		if (!file) return
		setUploadError('')
		setUploading(true)
		const fd = new FormData()
		fd.append('avatar', file)
		try {
			const { data } = await axios.post(`${API}/upload-avatar`, fd)
			updateUser({ avatar_path: data.avatar_path })
		} catch (err) {
			setUploadError(err.response?.data?.error || 'Ошибка загрузки')
		} finally {
			setUploading(false)
			e.target.value = ''
		}
	}

	// ── Коллбэки модала просмотра ────────────────────────────
	const handleMemoryDeleted = useCallback(id => {
		setMemories(prev => prev.filter(m => m.id !== id))
		setFavoriteIds(prev => {
			const next = new Set(prev)
			next.delete(id)
			return next
		})
		setSelectedMemory(null)
		setShowDeleteNotification(true)
		setTimeout(() => setShowDeleteNotification(false), 3000)
	}, [])

	const handleMemoryUpdated = useCallback(() => {
		axios
			.get(`${API}/memories.php`)
			.then(({ data }) => setMemories(data.memories ?? []))
			.catch(() => {})
		setShowUpdateNotification(true)
		setTimeout(() => setShowUpdateNotification(false), 3000)
	}, [])

	const favoritesCount = favoriteIds.size

	// ── Рендер ───────────────────────────────────────────────
	return (
		<>
			<section className='user'>
				<div className='user__inner'>
					<div className='user__info'>
						{/* ── Аватар + имя ── */}
						<div className='user__info-me'>
							<div
								className='user__info-avatar'
								onClick={() => fileInputRef.current?.click()}
							>
								{avatarUrl ? (
									<img
										src={avatarUrl}
										alt='avatar'
										className='user__avatar-img'
									/>
								) : (
									<div className='user__avatar-letter'>{firstLetter}</div>
								)}
								<div className='user__avatar-overlay'>
									<button className='user__avatar-overlay-btn'>
										{uploading ? 'Загрузка...' : 'Редактировать'}
									</button>
								</div>
								<input
									ref={fileInputRef}
									type='file'
									accept='image/jpeg,image/png,image/gif,image/webp'
									className='user__avatar-input'
									onChange={handleFileChange}
								/>
							</div>

							{uploadError && (
								<p className='user__upload-error'>{uploadError}</p>
							)}

							<div className='user__info-text'>
								<div className='user__info-edit'>
									{editingName ? (
										<div className='user__name-edit'>
											<input
												ref={nameInputRef}
												className={`user__name-input${nameError ? ' input-error' : ''}`}
												value={nameValue}
												onChange={e => setNameValue(e.target.value)}
												onKeyDown={handleNameKeyDown}
												maxLength={30}
												disabled={nameSaving}
											/>
											<button
												className='user__info-btn btn-edit'
												onClick={handleNameSave}
												disabled={nameSaving}
											>
												{nameSaving ? 'Сохранение...' : 'Сохранить'}
											</button>
											<button
												className='user__info-btn btn-cancel'
												onClick={() => setEditingName(false)}
												disabled={nameSaving}
											>
												Отмена
											</button>
											{nameError && (
												<span className='user__name-error'>{nameError}</span>
											)}
										</div>
									) : (
										<>
											<p className='user__info-name'>{user?.username || '—'}</p>
											<button
												className='user__info-btn btn-edit'
												onClick={() => setEditingName(true)}
											>
												Редактировать
											</button>
										</>
									)}
								</div>
								<p className='user__info-statistics'>
									всего воспоминаний: {memoriesLoading ? '…' : memories.length}
								</p>
							</div>
						</div>

						{/* ── Навигация табов ── */}
						<div className='user__tabs'>
							<button
								className={`user__tab${activeTab === 'all' ? ' user__tab--active' : ''}`}
								onClick={() => setActiveTab('all')}
							>
								Все воспоминания
								<span className='user__tab-count'>{memoriesLoading ? '…' : memories.length}</span>
							</button>
							<button
								className={`user__tab${activeTab === 'favorites' ? ' user__tab--active' : ''}`}
								onClick={() => setActiveTab('favorites')}
							>
								Избранное
								<span className='user__tab-count'>{memoriesLoading ? '…' : favoritesCount}</span>
							</button>
						</div>

						{/* ── Воспоминания ── */}

						{memoriesLoading && (
							<div className='user__info-memories'>
								<p className='user__no-memories'>Загрузка...</p>
							</div>
						)}

						{!memoriesLoading && activeTab === 'all' && memories.length === 0 && (
							<div className='user__info-memories'>
								<p className='user__no-memories'>У вас пока нет воспоминаний</p>
							</div>
						)}

						{!memoriesLoading && activeTab === 'favorites' && favoritesCount === 0 && (
							<div className='user__info-memories'>
								<p className='user__no-memories'>В избранном пока пусто</p>
							</div>
						)}

						{!memoriesLoading &&
							memoriesByYear.map(([year, yearMems]) => (
								<YearBlock
									key={`${activeTab}-${year}`}
									year={year}
									memories={yearMems}
									onCardClick={setSelectedMemory}
									favoriteIds={favoriteIds}
									onToggleFavorite={toggleFavorite}
								/>
							))}
					</div>
				</div>
			</section>

			{selectedMemory &&
				createPortal(
					<ViewMemory
						memory={selectedMemory}
						onClose={() => setSelectedMemory(null)}
						onDeleted={handleMemoryDeleted}
						onUpdated={handleMemoryUpdated}
					/>,
					document.body,
				)}

			{showUpdateNotification && (
				<MemoryNotice type='update'>Воспоминание успешно изменено</MemoryNotice>
			)}

			{showDeleteNotification && (
				<MemoryNotice type='delete'>Воспоминание удалено</MemoryNotice>
			)}
		</>
	)
}

export default UserPage
