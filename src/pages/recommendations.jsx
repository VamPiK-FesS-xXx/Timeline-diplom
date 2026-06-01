import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import TimeLine, { MONTH_NAMES } from '../components/timeLine'
import Controls from '../components/controls'

const OMDB_KEY = '2561cd01'

const OMDB_TERMS = ['the', 'love', 'man', 'dark', 'world', 'night']

const NYT_KEY = '7lMZA1UhYRWLOuGI6k7scAYGwvh5OfoawbiBYGiUDhP7zX6d'

const VISIBLE_COUNT = 10
const STEP = VISIBLE_COUNT - 1
const CARDS_PER_PAGE = 3

const HOLIDAYS = [
	{ month: 0, day: 1 },
	{ month: 0, day: 7 },
	{ month: 1, day: 23 },
	{ month: 2, day: 8 },
	{ month: 4, day: 1 },
	{ month: 4, day: 9 },
	{ month: 5, day: 12 },
	{ month: 10, day: 4 },
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

const TABS = [
	{ key: 'movies', label: 'Кино' },
	{ key: 'music', label: 'Музыка' },
	{ key: 'news', label: 'Новости' },
]

// Возвращает URL изображения из массива multimedia NYT
function getNytImage(multimedia) {
	if (!Array.isArray(multimedia) || multimedia.length === 0) return null
	const preferred = [
		'Large',
		'mediumThreeByTwo440',
		'mediumThreeByTwo210',
		'thumbLarge',
		'Standard Thumbnail',
	]
	for (const fmt of preferred) {
		const m = multimedia.find(x => x.format === fmt && x.type === 'image')
		if (m?.url) return `https://static01.nyt.com/${m.url}`
	}
	const first = multimedia.find(x => x.type === 'image')
	return first?.url ? `https://static01.nyt.com/${first.url}` : null
}

// ── Перевод данных OMDb ───────────────────────────────────────
const GENRE_RU = {
	Action: 'Боевик',
	Adventure: 'Приключения',
	Animation: 'Анимация',
	Biography: 'Биография',
	Comedy: 'Комедия',
	Crime: 'Криминал',
	Documentary: 'Документальный',
	Drama: 'Драма',
	Family: 'Семейный',
	Fantasy: 'Фэнтези',
	'Film-Noir': 'Нуар',
	History: 'Исторический',
	Horror: 'Ужасы',
	Music: 'Музыкальный',
	Musical: 'Мюзикл',
	Mystery: 'Детектив',
	Romance: 'Романтика',
	'Sci-Fi': 'Фантастика',
	Short: 'Короткометражка',
	Sport: 'Спорт',
	Thriller: 'Триллер',
	War: 'Военный',
	Western: 'Вестерн',
}

function translateGenres(genreStr) {
	if (!genreStr || genreStr === 'N/A') return null
	return genreStr
		.split(', ')
		.map(g => GENRE_RU[g] ?? g)
		.join(', ')
}

function formatRuntime(rt) {
	if (!rt || rt === 'N/A') return null
	return rt.replace(' min', ' мин')
}

async function translatePlot(text) {
	if (!text || text === 'N/A') return null
	try {
		const { data } = await axios.get(
			'https://api.mymemory.translated.net/get',
			{ params: { q: text.slice(0, 500), langpair: 'en|ru' }, withCredentials: false },
		)
		const t = data.responseData?.translatedText
		return t && t !== text ? t : null
	} catch {
		return null
	}
}

// Заменяет размер в URL обложки iTunes (100x100bb → Nх Nbb)
function itunesArtwork(url, size = 500) {
	if (!url) return null
	return url.replace('100x100bb', `${size}x${size}bb`)
}

// Поисковый запрос iTunes по эпохе
function itunesTerm(year) {
	if (year < 1960) return '50s music'
	if (year < 1970) return '60s music'
	if (year < 1980) return '70s music'
	if (year < 1990) return '80s music'
	if (year < 2000) return '90s music'
	if (year < 2010) return '2000s music'
	if (year < 2020) return '2010s music'
	return '2020s music'
}

function getDaysInMonth(year, month) {
	return new Date(year, month + 1, 0).getDate()
}

const ArrowLeft = () => (
	<svg width='12' height='18' viewBox='0 0 13 23' fill='none'>
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
	<svg width='12' height='18' viewBox='0 0 13 23' fill='none'>
		<path
			d='M1.5 1.5L11.5 11.5L1.5 21.5'
			stroke='white'
			strokeWidth='3'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
)

// ── Кнопка закрытия (общая) ───────────────────────────────────
function CloseBtn({ onClick }) {
	return (
		<button className='hist-modal__close' onClick={onClick} title='Закрыть'>
			<svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
				<path
					d='M13.41 12l6.3-6.29a1 1 0 1 0-1.42-1.42L12 10.59 5.71 4.29a1 1 0 0 0-1.42 1.42L10.59 12l-6.3 6.29a1 1 0 1 0 1.42 1.42L12 13.41l6.29 6.3a1 1 0 0 0 1.42-1.42Z'
					fill='white'
				/>
			</svg>
		</button>
	)
}

// ── Скелетон-карточка при загрузке ────────────────────────────
function SkeletonCard() {
	return (
		<div
			className='memory__grid-item rec__skeleton'
			style={{ position: 'relative', overflow: 'hidden' }}
		>
			<div className='rec__skeleton-shine' />
		</div>
	)
}

// ── Карточка фильма (OMDb) ────────────────────────────────────
function MovieCard({ movie, titleRu, rating, onClick }) {
	const posterUrl = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null

	return (
		<div
			className={`memory__grid-item memory__grid-item--clickable${posterUrl ? ' memory__grid-item--has-img' : ''}`}
			style={{ position: 'relative', overflow: 'hidden' }}
			onClick={onClick}
		>
			{posterUrl && (
				<img src={posterUrl} alt='' className='memory__card-bg rec__card-img' />
			)}
			{posterUrl && <div className='rec__card-gradient' />}
			<div
				className='memory__grid-inner'
				style={{ position: 'relative', zIndex: 1 }}
			>
				<div className='memory__grid-info'>
					<div className='rec__movie-top'>
						{movie.Year && (
							<p className='memory__date-paragraph'>{movie.Year}</p>
						)}
						{rating && <span className='rec__movie-rating'>★ {rating}</span>}
					</div>
					<p className='memory__title rec__card-title'>
						{titleRu ?? movie.Title}
					</p>
				</div>
			</div>
		</div>
	)
}

// ── Модал просмотра фильма (OMDb + перевод, read-only) ────────
function MovieModal({ movie, onClose }) {
	const [details, setDetails] = useState(null)
	const [detailsLoading, setDetailsLoading] = useState(true)
	const [plotRu, setPlotRu] = useState(null)
	const [titleRu, setTitleRu] = useState(null)

	useEffect(() => {
		axios
			.get('https://www.omdbapi.com/', {
				params: { i: movie.imdbID, plot: 'full', apikey: OMDB_KEY },
				withCredentials: false,
			})
			.then(async ({ data }) => {
				if (data.Response !== 'True') return
				setDetails(data)
				if (data.Title) {
					const t = await translatePlot(data.Title)
					setTitleRu(t)
				}
				if (data.Plot && data.Plot !== 'N/A') {
					const ru = await translatePlot(data.Plot)
					setPlotRu(ru)
				}
			})
			.catch(() => setDetails(null))
			.finally(() => setDetailsLoading(false))
	}, [movie.imdbID])

	const d = details ?? movie
	const posterUrl = d.Poster && d.Poster !== 'N/A' ? d.Poster : null
	const imdbUrl = `https://www.imdb.com/title/${movie.imdbID}`
	const field = val => (val && val !== 'N/A' ? val : null)

	return (
		<div
			className='modal__memory-overlay'
			onClick={e => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className='hist-modal'>
				<div className='hist-modal__inner'>
					<CloseBtn onClick={onClose} />

					<div className='hist-modal__header'>
						<span className='hist-modal__badge hist-modal__badge--movie'>
							Кино
						</span>
						{field(d.Year) && (
							<span className='hist-modal__year'>{d.Year}</span>
						)}
						{field(details?.imdbRating) && (
							<span className='rec__rating-badge'>★ {details.imdbRating}</span>
						)}
					</div>

					{posterUrl && (
						<div className='hist-modal__img-wrap'>
							<img src={posterUrl} alt={d.Title} className='hist-modal__img' />
						</div>
					)}

					<h2 className='hist-modal__title'>{titleRu ?? d.Title}</h2>

					{detailsLoading && (
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								padding: '1em',
							}}
						>
							<div className='rec__loader' />
						</div>
					)}

					{!detailsLoading && details && (
						<>
							{translateGenres(details.Genre) && (
								<div className='hist-modal__section'>
									<h3 className='hist-modal__section-title'>Жанр</h3>
									<p className='hist-modal__text'>
										{translateGenres(details.Genre)}
									</p>
								</div>
							)}
							{formatRuntime(details.Runtime) && (
								<div className='hist-modal__section'>
									<h3 className='hist-modal__section-title'>Хронометраж</h3>
									<p className='hist-modal__text'>
										{formatRuntime(details.Runtime)}
									</p>
								</div>
							)}
							{field(details.Director) && (
								<div className='hist-modal__section'>
									<h3 className='hist-modal__section-title'>Режиссёр</h3>
									<p className='hist-modal__text'>{details.Director}</p>
								</div>
							)}
							{field(details.Actors) && (
								<div className='hist-modal__section'>
									<h3 className='hist-modal__section-title'>Актёры</h3>
									<p className='hist-modal__text'>{details.Actors}</p>
								</div>
							)}
							{(plotRu ?? field(details.Plot)) && (
								<div className='hist-modal__section'>
									<h3 className='hist-modal__section-title'>Описание</h3>
									<p className='hist-modal__text'>{plotRu ?? details.Plot}</p>
								</div>
							)}
						</>
					)}

					<a
						href={imdbUrl}
						target='_blank'
						rel='noopener noreferrer'
						className='hist-modal__wiki-btn'
					>
						<svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
							<path
								d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
							/>
							<path
								d='M15 3h6v6'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
							<path
								d='M10 14L21 3'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
							/>
						</svg>
						Открыть на IMDb
					</a>
				</div>
			</div>
		</div>
	)
}

// ── Карточка трека (iTunes) ───────────────────────────────────
function MusicCard({ track, onClick }) {
	const imgUrl = itunesArtwork(track.artworkUrl100, 500)

	return (
		<div
			className={`memory__grid-item memory__grid-item--clickable${imgUrl ? ' memory__grid-item--has-img' : ''}`}
			style={{ position: 'relative', overflow: 'hidden' }}
			onClick={onClick}
		>
			{imgUrl && (
				<img src={imgUrl} alt='' className='memory__card-bg rec__card-img' />
			)}
			{imgUrl && <div className='rec__card-gradient' />}
			<div
				className='memory__grid-inner'
				style={{ position: 'relative', zIndex: 1 }}
			>
				<div className='memory__grid-info'>
					<p className='memory__date-paragraph rec__music-artist'>
						{track.artistName}
					</p>
					<p className='memory__title rec__card-title'>{track.trackName}</p>
				</div>
			</div>
		</div>
	)
}

// ── Кастомный аудиоплеер ─────────────────────────────────────
function AudioPlayer({ src }) {
	const audioRef = useRef(null)
	const [playing, setPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)

	const toggle = () => {
		const a = audioRef.current
		if (!a) return
		playing ? a.pause() : a.play()
		setPlaying(p => !p)
	}

	const handleSeek = e => {
		const rect = e.currentTarget.getBoundingClientRect()
		const ratio = (e.clientX - rect.left) / rect.width
		const t = Math.max(0, Math.min(ratio * duration, duration))
		audioRef.current.currentTime = t
		setCurrentTime(t)
	}

	const fmt = s => {
		const m = Math.floor(s / 60)
		return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
	}

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	return (
		<div className='rec__player'>
			<audio
				ref={audioRef}
				src={src}
				onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
				onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
				onEnded={() => setPlaying(false)}
			/>

			<button
				className='rec__player-btn'
				onClick={toggle}
				title={playing ? 'Пауза' : 'Воспроизвести'}
			>
				{playing ? (
					<svg width='14' height='16' viewBox='0 0 14 16' fill='none'>
						<rect x='0' y='0' width='4' height='16' rx='1.5' fill='white' />
						<rect x='10' y='0' width='4' height='16' rx='1.5' fill='white' />
					</svg>
				) : (
					<svg width='14' height='16' viewBox='0 0 14 16' fill='none'>
						<path d='M0 0L14 8L0 16V0Z' fill='white' />
					</svg>
				)}
			</button>

			<div className='rec__player-bar' onClick={handleSeek}>
				<div className='rec__player-fill' style={{ width: `${progress}%` }} />
				<div className='rec__player-thumb' style={{ left: `${progress}%` }} />
			</div>

			<span className='rec__player-time'>
				{fmt(currentTime)} / {fmt(duration)}
			</span>
		</div>
	)
}

// ── Модал просмотра трека iTunes (read-only + preview) ────────
function MusicModal({ track, onClose }) {
	const imgUrl = itunesArtwork(track.artworkUrl100, 600)

	return (
		<div
			className='modal__memory-overlay'
			onClick={e => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className='hist-modal'>
				<div className='hist-modal__inner'>
					<CloseBtn onClick={onClose} />

					<div className='hist-modal__header'>
						<span className='hist-modal__badge hist-modal__badge--music'>
							Музыка
						</span>
					</div>

					{imgUrl && (
						<div className='hist-modal__img-wrap rec__music-artwork-wrap'>
							<img
								src={imgUrl}
								alt={track.trackName}
								className='hist-modal__img rec__music-artwork'
							/>
						</div>
					)}

					<h2 className='hist-modal__title'>{track.trackName}</h2>

					<div className='hist-modal__section'>
						<h3 className='hist-modal__section-title'>Исполнитель</h3>
						<p className='hist-modal__text'>{track.artistName}</p>
					</div>

					{track.collectionName && (
						<div className='hist-modal__section'>
							<h3 className='hist-modal__section-title'>Альбом</h3>
							<p className='hist-modal__text'>{track.collectionName}</p>
						</div>
					)}

					{track.previewUrl && (
						<div className='hist-modal__section'>
							<h3 className='hist-modal__section-title'>
								Предпросмотр (30 сек)
							</h3>
							<AudioPlayer src={track.previewUrl} />
						</div>
					)}

					{track.trackViewUrl && (
						<a
							href={track.trackViewUrl}
							target='_blank'
							rel='noopener noreferrer'
							className='hist-modal__wiki-btn'
						>
							<svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
								<path
									d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
								/>
								<path
									d='M15 3h6v6'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
								<path
									d='M10 14L21 3'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
								/>
							</svg>
							Открыть в Apple Music
						</a>
					)}
				</div>
			</div>
		</div>
	)
}

// ── Карточка новости (NYT) ────────────────────────────────────
function NewsCard({ article, titleRu, onClick }) {
	const imgUrl = getNytImage(article.multimedia)
	const title = article.headline?.main ?? ''
	const section = article.section_name

	return (
		<div
			className={`memory__grid-item memory__grid-item--clickable${imgUrl ? ' memory__grid-item--has-img' : ''}`}
			style={{ position: 'relative', overflow: 'hidden' }}
			onClick={onClick}
		>
			{imgUrl && (
				<img src={imgUrl} alt='' className='memory__card-bg rec__card-img' />
			)}
			{imgUrl && <div className='rec__card-gradient' />}
			<div
				className='memory__grid-inner'
				style={{ position: 'relative', zIndex: 1 }}
			>
				<div className='memory__grid-info'>
					{section && (
						<p className='memory__date-paragraph rec__news-section'>
							{section}
						</p>
					)}
					<p className='memory__title rec__card-title'>{titleRu ?? title}</p>
				</div>
			</div>
		</div>
	)
}

// ── Модал просмотра новости (NYT + перевод) ──────────────────
function NewsModal({ article, onClose }) {
	const [titleRu, setTitleRu] = useState(null)
	const [abstractRu, setAbstractRu] = useState(null)

	const title = article.headline?.main ?? ''
	const abstract = article.abstract || article.snippet || ''
	const imgUrl = getNytImage(article.multimedia)
	const nytUrl = article.web_url

	useEffect(() => {
		if (title) translatePlot(title).then(t => setTitleRu(t))
		if (abstract) translatePlot(abstract).then(t => setAbstractRu(t))
	}, [title, abstract])

	return (
		<div
			className='modal__memory-overlay'
			onClick={e => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div className='hist-modal'>
				<div className='hist-modal__inner'>
					<CloseBtn onClick={onClose} />

					<div className='hist-modal__header'>
						<span className='hist-modal__badge hist-modal__badge--news'>
							Новости
						</span>
						{article.section_name && (
							<span className='hist-modal__year'>{article.section_name}</span>
						)}
					</div>

					{imgUrl && (
						<div className='hist-modal__img-wrap'>
							<img src={imgUrl} alt={title} className='hist-modal__img' />
						</div>
					)}

					<h2 className='hist-modal__title'>{titleRu ?? title}</h2>

					{(abstractRu ?? abstract) && (
						<div className='hist-modal__section'>
							<h3 className='hist-modal__section-title'>Краткое содержание</h3>
							<p className='hist-modal__text'>{abstractRu ?? abstract}</p>
						</div>
					)}

					{article.byline?.original && (
						<div className='hist-modal__section'>
							<h3 className='hist-modal__section-title'>Автор</h3>
							<p className='hist-modal__text'>{article.byline.original}</p>
						</div>
					)}

					{nytUrl && (
						<a
							href={nytUrl}
							target='_blank'
							rel='noopener noreferrer'
							className='hist-modal__wiki-btn'
						>
							<svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
								<path
									d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
								/>
								<path
									d='M15 3h6v6'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
								<path
									d='M10 14L21 3'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
								/>
							</svg>
							Читать на NYT
						</a>
					)}
				</div>
			</div>
		</div>
	)
}

// ── Панель «Что было в этот день» ────────────────────────────
function DayPanel({ dayItem }) {
	const dayNum = parseInt(dayItem.key.split('-')[3], 10)
	const monthIndex = parseInt(dayItem.key.split('-')[2], 10)
	const year = parseInt(dayItem.key.split('-')[1], 10)

	const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
	const dateLabel = `${dayNum} ${MONTH_NAMES_GEN[monthIndex]} ${year}`

	// ── Состояние фильмов ─────────────────────────────────────
	const [movies, setMovies] = useState([])
	const [moviesLoading, setMoviesLoading] = useState(false)
	const [moviesError, setMoviesError] = useState('')
	const [movieTitlesRu, setMovieTitlesRu] = useState({})
	const [movieRatings, setMovieRatings] = useState({})

	// ── Состояние музыки ──────────────────────────────────────
	const [music, setMusic] = useState([])
	const [musicLoading, setMusicLoading] = useState(false)

	// ── Состояние новостей ───────────────────────────────────
	const [news, setNews] = useState([])
	const [newsLoading, setNewsLoading] = useState(false)
	const [newsError, setNewsError] = useState('')
	const [newsTitlesRu, setNewsTitlesRu] = useState({})

	// ── UI-состояние ──────────────────────────────────────────
	const [activeTab, setActiveTab] = useState('movies')
	const [page, setPage] = useState(0)
	const [movieModal, setMovieModal] = useState(null)
	const [musicModal, setMusicModal] = useState(null)
	const [newsModal, setNewsModal] = useState(null)

	// ── Загрузка фильмов (OMDb, несколько запросов параллельно) ─
	useEffect(() => {
		setMovies([])
		setMoviesError('')
		setMoviesLoading(true)

		Promise.allSettled(
			OMDB_TERMS.map(term =>
				axios.get('https://www.omdbapi.com/', {
					params: { s: term, type: 'movie', y: year, apikey: OMDB_KEY },
					withCredentials: false,
				}),
			),
		)
			.then(results => {
				const seen = new Set()
				const list = []
				for (const r of results) {
					if (r.status === 'fulfilled' && r.value.data.Response === 'True') {
						for (const m of r.value.data.Search ?? []) {
							if (!seen.has(m.imdbID)) {
								seen.add(m.imdbID)
								list.push(m)
							}
						}
					}
				}
				if (list.length === 0) {
					setMoviesError('Нет данных о фильмах за этот год')
				} else {
					setMovies(list.slice(0, 12))
				}
			})
			.catch(() =>
				setMoviesError('Не удалось загрузить фильмы. Попробуйте позже.'),
			)
			.finally(() => setMoviesLoading(false))
	}, [year])

	// ── Перевод названий фильмов ──────────────────────────────
	useEffect(() => {
		if (movies.length === 0) return
		setMovieTitlesRu({})
		Promise.all(
			movies.map(m => translatePlot(m.Title).then(t => [m.imdbID, t])),
		).then(entries => {
			setMovieTitlesRu(Object.fromEntries(entries.filter(([, t]) => t)))
		})
	}, [movies])

	// ── Загрузка рейтингов фильмов (OMDb по imdbID) ───────────
	useEffect(() => {
		if (movies.length === 0) return
		setMovieRatings({})
		Promise.all(
			movies.map(m =>
				axios
					.get('https://www.omdbapi.com/', {
						params: { i: m.imdbID, apikey: OMDB_KEY },
						withCredentials: false,
					})
					.then(({ data }) => [
						m.imdbID,
						data.imdbRating && data.imdbRating !== 'N/A'
							? data.imdbRating
							: null,
					])
					.catch(() => [m.imdbID, null]),
			),
		).then(entries => {
			setMovieRatings(Object.fromEntries(entries.filter(([, r]) => r)))
		})
	}, [movies])

	useEffect(() => {
		setMusic([])
		setMusicLoading(true)

		axios
			.get('https://itunes.apple.com/search', {
				params: {
					term: itunesTerm(year),
					entity: 'song',
					limit: 12,
					country: 'US',
				},
				withCredentials: false,
			})
			.then(({ data }) => setMusic(data.results ?? []))
			.catch(() => setMusic([]))
			.finally(() => setMusicLoading(false))
	}, [year])

	useEffect(() => {
		setNews([])
		setNewsError('')
		setNewsLoading(true)

		axios
			.get(`/nyt/svc/archive/v1/${year}/${monthIndex + 1}.json`, {
				params: { 'api-key': NYT_KEY },
			})
			.then(({ data }) => {
				const docs = data.response?.docs ?? []
				const dayDocs = docs
					.filter(doc => doc.pub_date?.startsWith(dateStr))
					.slice(0, 12)
				if (dayDocs.length === 0) {
					setNewsError('Новостей за этот день не найдено')
				} else {
					setNews(dayDocs)
				}
			})
			.catch(() => setNewsError('Не удалось загрузить новости'))
			.finally(() => setNewsLoading(false))
	}, [dateStr, year, monthIndex])

	// ── Перевод заголовков новостей ───────────────────────────
	useEffect(() => {
		if (news.length === 0) return
		setNewsTitlesRu({})
		Promise.all(
			news.map(a =>
				translatePlot(a.headline?.main ?? '').then(t => [a._id, t]),
			),
		).then(entries => {
			setNewsTitlesRu(Object.fromEntries(entries.filter(([, t]) => t)))
		})
	}, [news])

	// ── Текущий набор карточек ────────────────────────────────
	const currentCards =
		activeTab === 'movies' ? movies : activeTab === 'music' ? music : news
	const loading =
		activeTab === 'movies'
			? moviesLoading
			: activeTab === 'music'
				? musicLoading
				: newsLoading
	const error =
		activeTab === 'movies' ? moviesError : activeTab === 'news' ? newsError : ''

	const maxPage = Math.max(
		0,
		Math.ceil(currentCards.length / CARDS_PER_PAGE) - 1,
	)
	const visible = currentCards.slice(
		page * CARDS_PER_PAGE,
		(page + 1) * CARDS_PER_PAGE,
	)

	const handleTabChange = key => {
		setActiveTab(key)
		setPage(0)
	}

	const tabCounts = {
		movies: movies.length,
		music: music.length,
		news: news.length,
	}

	return (
		<div className='rec__events'>
			{/* Заголовок */}
			<div className='rec__events-header'>
				<p className='rec__events-date'>{dateLabel}</p>
				<p className='rec__events-subtitle'>Что было в этот день</p>
			</div>

			{/* Вкладки */}
			<div className='rec__tabs'>
				{TABS.map(tab => (
					<button
						key={tab.key}
						className={`rec__tab${activeTab === tab.key ? ' rec__tab--active' : ''}`}
						onClick={() => handleTabChange(tab.key)}
					>
						{tab.label}
						{tabCounts[tab.key] > 0 && (
							<span className='rec__tab-count'>{tabCounts[tab.key]}</span>
						)}
					</button>
				))}
			</div>

			{/* Карточки (Кино / Музыка / Новости) */}
			{
				<>
					{loading && (
						<div className='memory__grid-nav'>
							<button className='btn-prev-cards' disabled>
								<ArrowLeft />
							</button>
							<div className='memory__grid-list'>
								<SkeletonCard />
								<SkeletonCard />
								<SkeletonCard />
							</div>
							<button className='btn-next-cards' disabled>
								<ArrowRight />
							</button>
						</div>
					)}

					{!loading && error && (
						<div className='rec__status'>
							<p className='rec__status-text rec__status-text--error'>
								{error}
							</p>
						</div>
					)}

					{!loading && !error && currentCards.length === 0 && (
						<div className='rec__status'>
							<p className='rec__status-text'>Нет данных для этого раздела</p>
						</div>
					)}

					{!loading && currentCards.length > 0 && (
						<>
							<div className='memory__grid-nav'>
								<button
									className='btn-prev-cards'
									onClick={() => setPage(p => p - 1)}
									disabled={page === 0}
								>
									<ArrowLeft />
								</button>

								<div className='memory__grid-list'>
									{activeTab === 'movies'
										? visible.map((movie, i) => (
												<MovieCard
													key={movie.imdbID ?? i}
													movie={movie}
													titleRu={movieTitlesRu[movie.imdbID]}
													rating={movieRatings[movie.imdbID]}
													onClick={() => setMovieModal(movie)}
												/>
											))
										: activeTab === 'music'
											? visible.map((track, i) => (
													<MusicCard
														key={track.trackId ?? i}
														track={track}
														onClick={() => setMusicModal(track)}
													/>
												))
											: visible.map((article, i) => (
													<NewsCard
														key={article._id ?? i}
														article={article}
														titleRu={newsTitlesRu[article._id]}
														onClick={() => setNewsModal(article)}
													/>
												))}
								</div>

								<button
									className='btn-next-cards'
									onClick={() => setPage(p => p + 1)}
									disabled={page >= maxPage}
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
										/>
									))}
								</div>
							)}
						</>
					)}
				</>
			}

			{/* Модалы */}
			{movieModal &&
				createPortal(
					<MovieModal movie={movieModal} onClose={() => setMovieModal(null)} />,
					document.body,
				)}
			{musicModal &&
				createPortal(
					<MusicModal track={musicModal} onClose={() => setMusicModal(null)} />,
					document.body,
				)}
			{newsModal &&
				createPortal(
					<NewsModal article={newsModal} onClose={() => setNewsModal(null)} />,
					document.body,
				)}
		</div>
	)
}

// ── Основной компонент страницы ───────────────────────────────
function Recommendations() {
	const currentYear = new Date().getFullYear()

	const birthYear = useMemo(() => {
		const saved = sessionStorage.getItem('birthYear')
		return saved ? parseInt(saved, 10) : 1900
	}, [])

	const [page, setPage] = useState(0)
	const [selectedYear, setSelectedYear] = useState(null)
	const [selectedMonth, setSelectedMonth] = useState(null)
	const [selectedDay, setSelectedDay] = useState(null)

	// ── Элементы таймлайна ────────────────────────────────────
	const items = useMemo(() => {
		const startYear = birthYear

		if (selectedYear !== null && selectedMonth !== null) {
			const result = []
			for (let y = startYear; y < selectedYear; y++)
				result.push({ type: 'year', value: y, label: String(y), key: 'y-' + y })
			for (let m = 0; m < selectedMonth; m++)
				result.push({
					type: 'month',
					value: m,
					label: MONTH_NAMES[m],
					key: 'm-' + selectedYear + '-' + m,
				})
			const daysCount = getDaysInMonth(selectedYear, selectedMonth)
			const mm = String(selectedMonth + 1).padStart(2, '0')
			for (let d = 1; d <= daysCount; d++) {
				const dd = String(d).padStart(2, '0')
				const isHoliday = HOLIDAYS.some(
					h => h.month === selectedMonth && h.day === d,
				)
				result.push({
					type: 'day',
					value: d,
					label: dd + '.' + mm,
					key: 'd-' + selectedYear + '-' + selectedMonth + '-' + d,
					isHoliday,
				})
			}
			return result
		}

		if (selectedYear !== null) {
			const result = []
			for (let y = startYear; y < selectedYear; y++)
				result.push({ type: 'year', value: y, label: String(y), key: 'y-' + y })
			MONTH_NAMES.forEach((name, i) =>
				result.push({
					type: 'month',
					value: i,
					label: name,
					key: 'm-' + selectedYear + '-' + i,
				}),
			)
			return result
		}

		const result = []
		for (let y = startYear; y <= currentYear; y++)
			result.push({ type: 'year', value: y, label: String(y), key: 'y-' + y })
		return result
	}, [birthYear, selectedYear, selectedMonth, currentYear])

	const maxPage = Math.max(Math.ceil((items.length - VISIBLE_COUNT) / STEP), 0)

	const handleYearClick = year => {
		setSelectedYear(year)
		setSelectedMonth(null)
		setSelectedDay(null)
		setPage(0)
	}
	const handleMonthClick = month => {
		setSelectedMonth(month)
		setSelectedDay(null)
		setPage(0)
	}
	const handleDayClick = useCallback(item => {
		setSelectedDay(prev => (prev?.key === item.key ? null : item))
	}, [])

	const handleBack = () => {
		if (selectedMonth !== null) {
			setSelectedMonth(null)
			setSelectedDay(null)
			setPage(0)
		} else if (selectedYear !== null) {
			setSelectedYear(null)
			setPage(0)
		}
	}

	const canGoBack = selectedYear !== null

	const levelLabel = useMemo(() => {
		if (selectedYear !== null && selectedMonth !== null)
			return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
		if (selectedYear !== null) return `${selectedYear} год`
		return `${birthYear} — ${currentYear}`
	}, [birthYear, selectedYear, selectedMonth, currentYear])

	return (
		<>
			<div className='statistic__inner'>
				<p className='statistic__text'>
					Что было в этот день&nbsp;·&nbsp;
					<span className='rec__level-label'>{levelLabel}</span>
				</p>
			</div>

			<TimeLine
				birthYear={birthYear}
				page={page}
				step={STEP}
				visibleCount={VISIBLE_COUNT}
				selectedYear={selectedYear}
				selectedMonth={selectedMonth}
				onYearClick={handleYearClick}
				onMonthClick={handleMonthClick}
				onDayClick={handleDayClick}
				selectedDayKey={selectedDay?.key}
				items={items}
				memories={[]}
			/>

			<Controls
				onPrev={
					canGoBack && page === 0
						? handleBack
						: () => setPage(p => Math.max(p - 1, 0))
				}
				onNext={() => setPage(p => Math.min(p + 1, maxPage))}
				canPrev={canGoBack ? true : page > 0}
				canNext={page < maxPage}
			/>

			{!selectedDay && selectedMonth !== null && (
				<div className='rec__hint'>
					<p className='rec__hint-text'>
						Выберите день на таймлайне, чтобы увидеть события
					</p>
				</div>
			)}

			{selectedDay && <DayPanel key={selectedDay.key} dayItem={selectedDay} />}
		</>
	)
}

export default Recommendations
