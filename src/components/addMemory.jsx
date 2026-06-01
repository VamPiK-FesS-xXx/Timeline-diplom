import { useState, useRef } from 'react'
import axios from 'axios'

const API = '/api'

function getEventDate(item) {
  if (!item) return ''
  if (item.type === 'year') return `${item.value}-01-01`
  if (item.type === 'month') {
    const [, year, month] = item.key.split('-')
    const mm = String(parseInt(month, 10) + 1).padStart(2, '0')
    return `${year}-${mm}-01`
  }
  if (item.type === 'day') {
    const parts = item.key.split('-')
    const year = parts[1]
    const mm   = String(parseInt(parts[2], 10) + 1).padStart(2, '0')
    const dd   = String(parts[3]).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }
  return ''
}

const isGif = file =>
  file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
const MAX_VIDEOS = 3

const FONT_FAMILIES = [
  { label: 'Inter',           value: '"Inter 28pt", sans-serif' },
  { label: 'Arial',           value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia',         value: 'Georgia, serif' },
  { label: 'Courier New',     value: '"Courier New", monospace' },
  { label: 'Verdana',         value: 'Verdana, sans-serif' },
]

const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']

// SVG-иконки кнопок форматирования
const ALIGN_BTNS = [
  {
    title: 'По левому краю', cmd: 'justifyLeft',
    svg: <svg width='26' height='27' viewBox='0 0 26 27' fill='none'><path d='M17.3333 17.7829H0V20.7467H17.3333V17.7829ZM17.3333 5.92763H0V8.89145H17.3333V5.92763ZM0 14.8191H26V11.8553H0V14.8191ZM0 26.6744H26V23.7105H0V26.6744ZM0 0V2.96382H26V0H0Z' fill='white' /></svg>,
  },
  {
    title: 'По центру', cmd: 'justifyCenter',
    svg: <svg width='26' height='27' viewBox='0 0 26 27' fill='none'><path d='M5.77778 17.7829V20.7467H20.2222V17.7829H5.77778ZM0 26.6744H26V23.7105H0V26.6744ZM0 14.8191H26V11.8553H0V14.8191ZM5.77778 5.92763V8.89145H20.2222V5.92763H5.77778ZM0 0V2.96382H26V0H0Z' fill='white' /></svg>,
  },
  {
    title: 'По правому краю', cmd: 'justifyRight',
    svg: <svg width='26' height='27' viewBox='0 0 26 27' fill='none'><path d='M8.66667 8.89145L26 8.89145L26 5.92764L8.66667 5.92764L8.66667 8.89145ZM8.66667 20.7467L26 20.7467L26 17.7829L8.66667 17.7829L8.66667 20.7467ZM26 11.8553L1.77236e-06 11.8553L1.51326e-06 14.8191L26 14.8191L26 11.8553ZM26 4.76837e-06L2.80878e-06 2.49538e-06L2.54968e-06 2.96382L26 2.96382L26 4.76837e-06ZM26 26.6744L26 23.7105L7.35942e-07 23.7105L4.76837e-07 26.6744L26 26.6744Z' fill='white' /></svg>,
  },
  {
    title: 'По ширине', cmd: 'justifyFull',
    svg: <svg width='26' height='27' viewBox='0 0 26 27' fill='none'><path d='M0 26.6744H26V23.7105H0V26.6744ZM0 7.40954V19.2648L5.77778 13.3372L0 7.40954ZM11.5556 20.7467H26V17.7829H11.5556V20.7467ZM0 0V2.96382H26V0H0ZM11.5556 8.89145H26V5.92763H11.5556V8.89145ZM11.5556 14.8191H26V11.8553H11.5556V14.8191Z' fill='white' /></svg>,
  },
]

const FORMAT_BTNS = [
  {
    title: 'Отступ', cmd: 'indent',
    svg: <svg width='26' height='27' viewBox='0 0 26 27' fill='none'><path d='M26 3.8147e-06L2.33195e-06 1.54171e-06L2.07284e-06 2.96382L26 2.96382L26 3.8147e-06ZM26 19.2648L26 7.40955L20.2222 13.3372L26 19.2648ZM14.4444 5.92764L1.81374e-06 5.92764L1.55463e-06 8.89145L14.4444 8.89145L14.4444 5.92764ZM26 26.6744L26 23.7105L2.59105e-07 23.7105L0 26.6744L26 26.6744ZM14.4444 17.7829L7.77315e-07 17.7829L5.1821e-07 20.7467L14.4444 20.7467L14.4444 17.7829ZM14.4444 11.8553L1.29553e-06 11.8553L1.03642e-06 14.8191L14.4444 14.8191L14.4444 11.8553Z' fill='white' /></svg>,
  },
  {
    title: 'Жирный', cmd: 'bold',
    svg: <svg width='21' height='27' viewBox='0 0 21 27' fill='none'><path d='M16.8 12.9371C18.6851 11.651 20.0233 9.57419 20.0233 7.62124C20.0233 3.32477 16.6144 0 12.2093 0H0V26.6744H13.7526C17.8451 26.6744 21 23.4353 21 19.4532C21 16.5572 19.3102 14.0898 16.8 12.9371ZM5.86047 4.76328H11.7209C13.3423 4.76328 14.6512 6.03984 14.6512 7.62124C14.6512 9.20265 13.3423 10.4792 11.7209 10.4792H5.86047V4.76328ZM12.6977 21.9111H5.86047V16.1951H12.6977C14.3191 16.1951 15.6279 17.4717 15.6279 19.0531C15.6279 20.6345 14.3191 21.9111 12.6977 21.9111Z' fill='white' /></svg>,
  },
  {
    title: 'Зачёркнутый', cmd: 'strikeThrough',
    svg: <svg width='26' height='21' viewBox='0 0 26 21' fill='none'><path d='M10.1111 20.5187H15.8889V16.415H10.1111V20.5187ZM2.88889 0V4.10375H10.1111V8.20749H15.8889V4.10375H23.1111V0H2.88889ZM0 13.6792H26V10.9433H0V13.6792Z' fill='white' /></svg>,
  },
  {
    title: 'Подчёркнутый', cmd: 'underline',
    svg: <svg width='31' height='27' viewBox='0 0 31 27' fill='none'><path d='M0 22H31V27H0V22Z' fill='white' fillOpacity='0.36' /><path d='M14.1923 0L7 18H9.94231L11.4135 14.1429H19.5865L21.0577 18H24L16.8077 0H14.1923ZM12.3942 11.5714L15.5 3.42643L18.6058 11.5714H12.3942Z' fill='white' /></svg>,
  },
  {
    title: 'Маркированный список', cmd: 'insertUnorderedList',
    svg: <svg width='35' height='21' viewBox='0 0 35 21' fill='none'><path d='M8.75532 3.50591H33.2504C34.3001 3.50591 35 2.80614 35 1.7565C35 0.706852 34.3001 0.00708835 33.2504 0.00708835H8.75532C7.70553 0.00708835 7.00567 0.706852 7.00567 1.7565C7.00567 2.80614 7.70553 3.50591 8.75532 3.50591ZM33.2504 8.75413H8.75532C7.70553 8.75413 7.00567 9.4539 7.00567 10.5035C7.00567 11.5532 7.70553 12.253 8.75532 12.253H33.2504C34.3001 12.253 35 11.5532 35 10.5035C35 9.4539 34.3001 8.75413 33.2504 8.75413ZM33.2504 17.5012H8.75532C7.70553 17.5012 7.00567 18.2009 7.00567 19.2506C7.00567 20.3002 7.70553 21 8.75532 21H33.2504C34.3001 21 35 20.3002 35 19.2506C35 18.2009 34.3001 17.5012 33.2504 17.5012ZM2.98149 0.531911C2.80652 0.356971 2.63156 0.182029 2.45659 0.182029C1.75674 -0.167853 1.05688 0.00708866 0.531983 0.531911C0.357018 0.706852 0.182054 0.881793 0.182054 1.05673C0.00708924 1.58156 0.00708924 1.93144 0.182054 2.45626C0.357018 2.6312 0.357018 2.80614 0.531983 2.98108C0.706948 3.15602 0.881912 3.33097 1.05688 3.33097C1.23184 3.50591 1.58177 3.50591 1.75673 3.50591C2.28163 3.50591 2.63156 3.33097 2.98149 2.98108C3.15645 2.80614 3.33142 2.6312 3.33142 2.45626C3.50638 1.93144 3.50638 1.58156 3.33142 1.05673C3.33142 0.881793 3.15645 0.706852 2.98149 0.531911ZM2.98149 9.27896C2.45659 8.75413 1.75673 8.57919 1.05688 8.92908C0.881912 9.10402 0.706948 9.10402 0.531983 9.27896C0.357018 9.4539 0.182054 9.62884 0.182054 9.80378C0.00708924 10.1537 0.00708924 10.6785 0.182054 11.2033C0.357018 11.3782 0.357018 11.5532 0.531983 11.7281C0.706948 11.9031 0.881912 12.078 1.05688 12.078C1.23184 12.253 1.58177 12.253 1.75673 12.253C1.9317 12.253 2.28163 12.253 2.45659 12.078C2.63156 11.9031 2.80652 11.9031 2.98149 11.7281C3.15645 11.5532 3.33142 11.3782 3.33142 11.2033C3.50638 10.8534 3.50638 10.3286 3.33142 9.80378C3.33142 9.62884 3.15645 9.4539 2.98149 9.27896ZM2.98149 18.026C2.80652 17.8511 2.63156 17.6761 2.45659 17.6761C2.10666 17.5012 1.58177 17.5012 1.05688 17.6761C0.881912 17.6761 0.706948 17.8511 0.531983 18.026C0.357018 18.2009 0.182054 18.3759 0.182054 18.5508C-0.167875 19.2506 0.00708932 19.9504 0.531983 20.4752C0.706948 20.6501 0.881912 20.8251 1.05688 20.8251C1.23184 21 1.58177 21 1.75673 21C1.9317 21 2.28163 21 2.45659 20.8251C2.63156 20.6501 2.80652 20.6501 2.98149 20.4752C3.50638 19.9504 3.68135 19.2506 3.33142 18.5508C3.33142 18.3759 3.15645 18.2009 2.98149 18.026Z' fill='white' /></svg>,
  },
]

function AdddMemory({ onClose, item, onSuccess }) {
  const [title,   setTitle]   = useState('')
  const [photos,  setPhotos]  = useState([])
  const [videos,  setVideos]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [highlightColor, setHighlightColor] = useState('#ffff00')
  const [fontFamily,     setFontFamily]     = useState(() => localStorage.getItem('editor-last-font') || '')
  const [fontSize,       setFontSize]       = useState(() => localStorage.getItem('editor-last-size') || '')

  const editorRef     = useRef(null)
  const fileInputRef  = useRef(null)
  const videoInputRef = useRef(null)
  const savedRangeRef = useRef(null)

  // ── Сохранить / восстановить выделение ───────────────────────
  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel?.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }

  const restoreSelection = () => {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    }
  }

  // ── Базовые команды форматирования ───────────────────────────
  const execFormat = (cmd) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, null)
  }

  // ── Обёртка выделения в <span> с нужным стилем ───────────────
  const wrapSelectionWithStyle = (styleProp, styleVal) => {
    restoreSelection()
    const sel = window.getSelection()
    if (!sel?.rangeCount) return
    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    span.style[styleProp] = styleVal

    if (range.collapsed) {
      // Нет выделения: вставляем span с пустым текстовым узлом в позицию курсора.
      // Браузер будет вставлять печатаемые символы внутрь этого span.
      const textNode = document.createTextNode('')
      span.appendChild(textNode)
      range.insertNode(span)
      const newRange = document.createRange()
      newRange.setStart(textNode, 0)
      newRange.collapse(true)
      sel.removeAllRanges()
      sel.addRange(newRange)
    } else {
      try {
        range.surroundContents(span)
      } catch {
        const frag = range.extractContents()
        span.appendChild(frag)
        range.insertNode(span)
      }
      sel.removeAllRanges()
      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      sel.addRange(newRange)
    }
  }

  // ── Шрифт ─────────────────────────────────────────────────────
  const applyFontFamily = (e) => {
    const val = e.target.value
    setFontFamily(val)
    if (!val) return
    localStorage.setItem('editor-last-font', val)
    wrapSelectionWithStyle('fontFamily', val)
  }

  // ── Размер ────────────────────────────────────────────────────
  const applyFontSize = (e) => {
    const val = e.target.value
    setFontSize(val)
    if (!val) return
    localStorage.setItem('editor-last-size', val)
    wrapSelectionWithStyle('fontSize', val)
  }

  // ── Заливка ───────────────────────────────────────────────────
  const applyHighlight = (color) => {
    setHighlightColor(color)
    restoreSelection()
    // hiliteColor — инлайн (Chrome/Firefox), backColor — блочный fallback
    if (!document.execCommand('hiliteColor', false, color)) {
      document.execCommand('backColor', false, color)
    }
  }

  // ── Фото ─────────────────────────────────────────────────────
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  const handleFileChange = (e) => {
    const files  = Array.from(e.target.files)
    const canAdd = 5 - photos.length
    const toAdd  = files.slice(0, canAdd).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos(prev => [...prev, ...toAdd])
    e.target.value = ''
  }

  const removePhoto = (idx) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── Видео ─────────────────────────────────────────────────────
  const handleVideoChange = (e) => {
    const files  = Array.from(e.target.files).filter(f => ALLOWED_VIDEO_TYPES.includes(f.type))
    const canAdd = MAX_VIDEOS - videos.length
    const toAdd  = files.slice(0, canAdd).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setVideos(prev => [...prev, ...toAdd])
    e.target.value = ''
  }

  const removeVideo = (idx) => {
    setVideos(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── Отправка ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('')
    if (!title.trim()) { setError('Введите название воспоминания'); return }

    const content = editorRef.current?.innerHTML?.trim() ?? ''
    if (!content || content === '<br>') {
      setError('Введите текст воспоминания'); return
    }

    const fd = new FormData()
    fd.append('title',      title.trim())
    fd.append('content',    content)
    fd.append('event_date', getEventDate(item))
    photos.forEach(p => fd.append('images[]', p.file))
    videos.forEach(v => fd.append('videos[]', v.file))

    try {
      setLoading(true)
      const { data } = await axios.post(`${API}/memories.php`, fd)
      if (data.upload_warnings?.length) {
        setError('Воспоминание сохранено, но некоторые файлы не загрузились: ' + data.upload_warnings.join('; '))
        return
      }
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сервера. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='modal__memory-overlay' onClick={handleOverlayClick}>
      <div className='modal__memory'>
        <div className='modal__memory-inner inner'>
          <div className='modal__memory-wrapper'>

            <h2 className='modal__memory-title'>Добавление воспоминания</h2>
            {item && (
              <p className='modal__memory-date'>
                {item.type === 'year'  && `Год: ${item.label}`}
                {item.type === 'month' && `Месяц: ${item.label}`}
                {item.type === 'day'   && `Дата: ${item.label}`}
              </p>
            )}

            <button className='modal__memory-btn btn-close' onClick={onClose}>
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                <path d='M13.4099 12L19.7099 5.71C19.8982 5.5217 20.004 5.2663 20.004 5C20.004 4.7337 19.8982 4.47831 19.7099 4.29C19.5216 4.1017 19.2662 3.99591 18.9999 3.99591C18.7336 3.99591 18.4782 4.1017 18.2899 4.29L11.9999 10.59L5.70994 4.29C5.52164 4.1017 5.26624 3.99591 4.99994 3.99591C4.73364 3.99591 4.47824 4.1017 4.28994 4.29C4.10164 4.47831 3.99585 4.7337 3.99585 5C3.99585 5.2663 4.10164 5.5217 4.28994 5.71L10.5899 12L4.28994 18.29C4.10164 18.477 3.99585 18.733 3.99585 19C3.99585 19.267 4.10164 19.523 4.28994 19.71C4.4782 19.897 4.73364 20.003 4.99994 20.003C5.26624 20.003 5.52164 19.897 5.70994 19.71L11.9999 13.41L18.2899 19.71C18.4782 19.897 18.7336 20.003 18.9999 20.003C19.2662 20.003 19.5216 19.897 19.7099 19.71C19.8982 19.523 20.004 19.267 20.004 19C20.004 18.733 19.8982 18.477 19.7099 18.29L13.4099 12Z' fill='white' />
              </svg>
            </button>

            {/* ── Название ── */}
            <div className='modal__memory-history'>
              <div className='modal__memory-short'>
                <label className='modal__memory-name'>Напишите название воспоминания</label>
                <input
                  type='text'
                  className='modal__memory-input'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder='Название...'
                />
              </div>
            </div>

            {/* ── Фотографии ── */}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <div
              className={`modal__memory-select${photos.length > 0 ? ' modal__memory-select--filled' : ''}`}
              onClick={() => photos.length === 0 && fileInputRef.current?.click()}
            >
              {photos.length === 0 ? (
                <>
                  <svg width='38' height='38' viewBox='0 0 24 24' fill='none'>
                    <path d='M12 5v14M5 12h14' stroke='white' strokeWidth='2' strokeLinecap='round' />
                  </svg>
                  <p className='modal__memory-paragraph'>
                    Нажмите, чтобы добавить фотографии<br />(от 1 до 5 штук)
                  </p>
                </>
              ) : (
                <div className='modal__memory-photos-grid'>
                  {photos.map((p, i) => (
                    <div key={i} className='modal__memory-photo-item'>
                      <img src={p.preview} alt={`фото ${i + 1}`} />
                      {isGif(p.file) && <span className='gif-badge'>GIF</span>}
                      <button
                        className='modal__memory-photo-remove'
                        onClick={e => { e.stopPropagation(); removePhoto(i) }}
                        title='Удалить фото'
                      >×</button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <div
                      className='modal__memory-photo-add'
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                      title='Добавить ещё фото'
                    >
                      <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                        <path d='M12 5v14M5 12h14' stroke='white' strokeWidth='2' strokeLinecap='round' />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Видео ── */}
            <input
              ref={videoInputRef}
              type='file'
              accept='video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo'
              multiple
              style={{ display: 'none' }}
              onChange={handleVideoChange}
            />

            <div
              className={`modal__memory-select modal__memory-select--video${videos.length > 0 ? ' modal__memory-select--filled' : ''}`}
              onClick={() => videos.length === 0 && videoInputRef.current?.click()}
            >
              {videos.length === 0 ? (
                <>
                  <svg width='38' height='38' viewBox='0 0 24 24' fill='none'>
                    <path d='M15 10l4.553-2.275A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.898L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z' stroke='white' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                  </svg>
                  <p className='modal__memory-paragraph'>
                    Нажмите, чтобы добавить видео<br />(до {MAX_VIDEOS} файлов, MP4/WebM/MOV)
                  </p>
                </>
              ) : (
                <div className='modal__memory-videos-grid'>
                  {videos.map((v, i) => (
                    <div key={i} className='modal__memory-video-item'>
                      <video src={v.preview} controls preload='metadata' />
                      <button
                        className='modal__memory-photo-remove'
                        onClick={e => { e.stopPropagation(); removeVideo(i) }}
                        title='Удалить видео'
                      >×</button>
                    </div>
                  ))}
                  {videos.length < MAX_VIDEOS && (
                    <div
                      className='modal__memory-photo-add'
                      onClick={e => { e.stopPropagation(); videoInputRef.current?.click() }}
                      title='Добавить ещё видео'
                    >
                      <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                        <path d='M12 5v14M5 12h14' stroke='white' strokeWidth='2' strokeLinecap='round' />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Панель форматирования + редактор ── */}
            <div className='modal__memory-info'>
              <div className='modal__memory-format'>

                {/* ── Ряд 1: выравнивание ── */}
                {ALIGN_BTNS.map(({ title, cmd, svg }) => (
                  <button
                    key={cmd}
                    className='modal__memory-btn btn-modal'
                    title={title}
                    onMouseDown={e => { e.preventDefault(); execFormat(cmd) }}
                  >
                    {svg}
                  </button>
                ))}

                <span className='modal__memory-format-vsep' />

                {/* ── Ряд 1: остальные кнопки ── */}
                {FORMAT_BTNS.map(({ title, cmd, svg }) => (
                  <button
                    key={cmd}
                    className='modal__memory-btn btn-modal'
                    title={title}
                    onMouseDown={e => { e.preventDefault(); execFormat(cmd) }}
                  >
                    {svg}
                  </button>
                ))}

                {/* ── Разделитель рядов ── */}
                <div className='modal__memory-format-break' />

                {/* ── Ряд 2: шрифт, размер, заливка ── */}
                <select
                  className='modal__memory-format-select'
                  value={fontFamily}
                  onMouseDown={saveSelection}
                  onChange={applyFontFamily}
                  title='Шрифт'
                >
                  <option value=''>Шрифт</option>
                  {FONT_FAMILIES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                <select
                  className='modal__memory-format-select modal__memory-format-select--size'
                  value={fontSize}
                  onMouseDown={saveSelection}
                  onChange={applyFontSize}
                  title='Размер шрифта'
                >
                  <option value=''>Размер</option>
                  {FONT_SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <label
                  className='modal__memory-format-color'
                  title='Цвет заливки текста'
                  onMouseDown={saveSelection}
                >
                  <span
                    className='modal__memory-format-color-dot'
                    style={{ background: highlightColor }}
                  />
                  <span>Заливка</span>
                  <input
                    type='color'
                    className='modal__memory-format-color-input'
                    value={highlightColor}
                    onChange={e => applyHighlight(e.target.value)}
                  />
                </label>

              </div>

              <div className='modal__memory-text'>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className='modal__memory-editor'
                  data-placeholder='Напишите своё воспоминание здесь...'
                />
              </div>
            </div>

            {error && <p className='modal__memory-error'>{error}</p>}

            <button
              className='modal__memory-btn btn-submit'
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Добавить'}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

export default AdddMemory
