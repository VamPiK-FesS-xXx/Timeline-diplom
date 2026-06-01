import { useState, useEffect } from 'react'

const API = '/api'
const UPLOADS = 'http://timeline-bd/backend/'

export const isGifPath = path =>
	typeof path === 'string' && path.toLowerCase().endsWith('.gif')

export function getImageBrightness(filePath) {
	const proxyUrl = `${API}/image-proxy.php?path=${encodeURIComponent(filePath)}`

	return new Promise(resolve => {
		const img = new Image()
		img.crossOrigin = 'anonymous'
		img.onload = () => {
			try {
				const SIZE = 48
				const canvas = document.createElement('canvas')
				canvas.width = SIZE
				canvas.height = SIZE
				const ctx = canvas.getContext('2d')
				ctx.drawImage(img, 0, 0, SIZE, SIZE)
				const { data } = ctx.getImageData(0, 0, SIZE, SIZE)
				let sum = 0
				for (let i = 0; i < data.length; i += 4) {
					sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
				}
				resolve(sum / (SIZE * SIZE))
			} catch {
				resolve(0)
			}
		}
		img.onerror = () => resolve(0)
		img.src = proxyUrl
	})
}

// Общая логика слайдшоу/яркости/видео для карточек
function useCardMedia(images, videos, resetKey) {
	const hasPhotos = images.length > 0
	const hasVideos = !hasPhotos && videos.length > 0

	const [idx, setIdx] = useState(0)
	const [vidIdx, setVidIdx] = useState(0)
	const [textDark, setTextDark] = useState(false)

	useEffect(() => {
		if (resetKey === undefined) return
		setIdx(0)
		setVidIdx(0)
	}, [resetKey])

	useEffect(() => {
		if (!hasPhotos || images.length <= 1) return
		const timer = setInterval(() => {
			setIdx(prev => (prev + 1) % images.length)
		}, 4000)
		return () => clearInterval(timer)
	}, [images, hasPhotos])

	useEffect(() => {
		if (!hasPhotos) {
			setTextDark(false)
			return
		}
		const filePath = images[idx]
		if (!filePath) {
			setTextDark(false)
			return
		}
		let cancelled = false
		getImageBrightness(filePath).then(brightness => {
			if (!cancelled) setTextDark(brightness > 168)
		})
		return () => {
			cancelled = true
		}
	}, [images, idx, hasPhotos])

	const handleVideoEnded = () => {
		if (videos.length > 1) {
			setVidIdx(prev => (prev + 1) % videos.length)
		}
	}

	return { hasPhotos, hasVideos, idx, vidIdx, textDark, handleVideoEnded }
}

// Карточка с медиа-фоном; внутреннее содержимое передаётся как render-prop
export function MediaCard({ images, videos, resetKey, onClick, children }) {
	const { hasPhotos, hasVideos, idx, vidIdx, textDark, handleVideoEnded } =
		useCardMedia(images, videos, resetKey)

	const currentImg = hasPhotos ? (images[idx] ?? null) : null
	const currentIsGif = currentImg ? isGifPath(currentImg) : false
	const textStyle = textDark ? { color: '#111' } : {}
	const hasMedia = currentImg || hasVideos

	return (
		<div
			className={`memory__grid-item memory__grid-item--clickable${hasMedia ? ' memory__grid-item--has-img' : ''}`}
			style={{ position: 'relative', overflow: 'hidden' }}
			onClick={onClick}
		>
			{hasPhotos && currentImg && (
				<img
					key={currentImg}
					src={`${UPLOADS}${currentImg}`}
					className='memory__card-bg'
					alt=''
				/>
			)}
			{hasVideos && (
				<video
					key={vidIdx}
					src={`${UPLOADS}${videos[vidIdx]}`}
					className='memory__card-bg'
					muted
					autoPlay
					playsInline
					loop={videos.length === 1}
					onEnded={handleVideoEnded}
				/>
			)}
			{currentIsGif && <span className='gif-badge'>GIF</span>}

			<div
				className='memory__grid-inner'
				style={{ position: 'relative', zIndex: 1 }}
			>
				{children({ textDark, textStyle })}
			</div>

			{hasPhotos && images.length > 1 && (
				<div className='memory__card-dots'>
					{images.map((_, i) => (
						<span
							key={i}
							className={`memory__card-dot${i === idx ? ' memory__card-dot--active' : ''}`}
							style={
								i === idx
									? { backgroundColor: textDark ? '#111' : '#fff' }
									: {
											backgroundColor: textDark
												? 'rgba(0,0,0,0.3)'
												: 'rgba(255,255,255,0.45)',
										}
							}
						/>
					))}
				</div>
			)}
		</div>
	)
}
