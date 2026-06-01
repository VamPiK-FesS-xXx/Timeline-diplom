import { useState } from 'react'

function enlargeThumb(url, targetWidth = 600) {
	if (!url) return null
	return url.replace(/\/\d+px-/, `/${targetWidth}px-`)
}

const TYPE_META = {
	selected: { label: 'Избранное',  mod: 'selected' },
	events:   { label: 'Событие',    mod: 'events'   },
	births:   { label: 'Рождение',   mod: 'births'   },
	deaths:   { label: 'Смерть',     mod: 'deaths'   },
	holidays: { label: 'Праздник',   mod: 'holidays' },
}

function ViewHistoricalEvent({ event, type, onClose }) {
	const meta      = TYPE_META[type] ?? TYPE_META.events
	const firstPage = event.pages?.[0]
	const original  = firstPage?.thumbnail?.source ?? null
	const title     = firstPage?.title ?? ''
	const desc      = firstPage?.description ?? ''
	const wikiUrl   = firstPage?.content_urls?.desktop?.page ?? null
	const related   = event.pages?.slice(1) ?? []

	// fallback-цепочка: увеличенный → оригинал → скрыть
	const [imgSrc,     setImgSrc]     = useState(enlargeThumb(original) || original)
	const [imgVisible, setImgVisible] = useState(!!original)

	const handleImgError = () => {
		if (imgSrc !== original && original) {
			setImgSrc(original)
		} else {
			setImgVisible(false)
		}
	}

	const handleOverlayClick = (e) => {
		if (e.target === e.currentTarget) onClose()
	}

	return (
		<div className='modal__memory-overlay' onClick={handleOverlayClick}>
			<div className='hist-modal'>
				<div className='hist-modal__inner'>

					{/* ── Кнопка закрытия ── */}
					<button className='hist-modal__close' onClick={onClose} title='Закрыть'>
						<svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
							<path
								d='M13.4099 12L19.7099 5.71C19.8982 5.5217 20.004 5.2663 20.004 5C20.004 4.7337 19.8982 4.47831 19.7099 4.29C19.5216 4.1017 19.2662 3.99591 18.9999 3.99591C18.7336 3.99591 18.4782 4.1017 18.2899 4.29L11.9999 10.59L5.70994 4.29C5.52164 4.1017 5.26624 3.99591 4.99994 3.99591C4.73364 3.99591 4.47824 4.1017 4.28994 4.29C4.10164 4.47831 3.99585 4.7337 3.99585 5C3.99585 5.2663 4.10164 5.5217 4.28994 5.71L10.5899 12L4.28994 18.29C4.10164 18.477 3.99585 18.733 3.99585 19C3.99585 19.267 4.10164 19.523 4.28994 19.71C4.4782 19.897 4.73364 20.003 4.99994 20.003C5.26624 20.003 5.52164 19.897 5.70994 19.71L11.9999 13.41L18.2899 19.71C18.4782 19.897 18.7336 20.003 18.9999 20.003C19.2662 20.003 19.5216 19.897 19.7099 19.71C19.8982 19.523 20.004 19.267 20.004 19C20.004 18.733 19.8982 18.477 19.7099 18.29L13.4099 12Z'
								fill='white'
							/>
						</svg>
					</button>

					{/* ── Шапка: бейдж + год ── */}
					<div className='hist-modal__header'>
						<span className={`hist-modal__badge hist-modal__badge--${meta.mod}`}>
							{meta.label}
						</span>
						{event.year != null && (
							<span className='hist-modal__year'>{event.year} год</span>
						)}
					</div>

					{/* ── Изображение ── */}
					{imgVisible && imgSrc && (
						<div className='hist-modal__img-wrap'>
							<img
								src={imgSrc}
								alt={title}
								className='hist-modal__img'
								onError={handleImgError}
								referrerPolicy='no-referrer'
							/>
						</div>
					)}

					{/* ── Заголовок ── */}
					{title && <h2 className='hist-modal__title'>{title}</h2>}

					{/* ── Краткое описание из Вики ── */}
					{desc && <p className='hist-modal__desc'>{desc}</p>}

					{/* ── Текст события ── */}
					<div className='hist-modal__section'>
						<h3 className='hist-modal__section-title'>Описание</h3>
						<p className='hist-modal__text'>{event.text}</p>
					</div>

					{/* ── Связанные статьи ── */}
					{related.length > 0 && (
						<div className='hist-modal__section'>
							<h3 className='hist-modal__section-title'>Связанные статьи</h3>
							<div className='hist-modal__related'>
								{related.map((p, i) => (
									<a
										key={i}
										href={p.content_urls?.desktop?.page}
										target='_blank'
										rel='noopener noreferrer'
										className='hist-modal__related-item'
									>
										{p.thumbnail?.source && (
											<img
												src={p.thumbnail.source}
												alt=''
												className='hist-modal__related-thumb'
											/>
										)}
										<div className='hist-modal__related-info'>
											<p className='hist-modal__related-title'>{p.title}</p>
											{p.description && (
												<p className='hist-modal__related-desc'>{p.description}</p>
											)}
										</div>
										<svg className='hist-modal__related-arrow' width='14' height='14' viewBox='0 0 24 24' fill='none'>
											<path d='M7 17L17 7M17 7H7M17 7V17' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
										</svg>
									</a>
								))}
							</div>
						</div>
					)}

					{/* ── Кнопка Википедии ── */}
					{wikiUrl && (
						<a
							href={wikiUrl}
							target='_blank'
							rel='noopener noreferrer'
							className='hist-modal__wiki-btn'
						>
							<svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
								<path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
								<path d='M15 3h6v6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
								<path d='M10 14L21 3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
							</svg>
							Читать в Википедии
						</a>
					)}

				</div>
			</div>
		</div>
	)
}

export default ViewHistoricalEvent
