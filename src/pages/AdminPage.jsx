import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import {
  API, UPLOADS, ADMIN_VIDEO_TYPES, ADMIN_MAX_VIDEOS,
  authHeaders, formatDate,
  useRichEditor, RichEditorToolbar, useNewFiles, useAdminList,
} from '../components/adminShared'

const Ico = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Heart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Memories: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Warn: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Back: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Image: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Video: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="15" height="10" rx="2"/>
      <polyline points="17 9 22 5 22 19 17 15"/>
    </svg>
  ),
}

// ──────────────────────────────────────────────
// Утилиты
// ──────────────────────────────────────────────

function Avatar({ src, name, size = 36 }) {
  const letter = (name || '?').charAt(0).toUpperCase()
  if (src) {
    return <img src={`${UPLOADS}${src}`} alt="" className="admin__table-avatar" style={{ width: size, height: size }} />
  }
  return (
    <div className="admin__table-avatar-letter" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {letter}
    </div>
  )
}

// ──────────────────────────────────────────────
// Уведомления
// ──────────────────────────────────────────────

function AdminToast({ toast }) {
  if (!toast) return null
  const isDelete = toast.type === 'delete'
  const isUpdate = toast.type === 'update'
  const cls = `memory-notification${isDelete ? ' memory-notification--delete' : isUpdate ? ' memory-notification--update' : ''}`
  return createPortal(
    <div key={toast.id} className={cls}>
      <span className="memory-notification__icon">
        {isDelete ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
            <path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {toast.text}
    </div>,
    document.body,
  )
}

// ──────────────────────────────────────────────
// Диалог подтверждения удаления
// ──────────────────────────────────────────────

function ConfirmDialog({ title, message, confirmLabel, confirmClass = 'confirm-dialog__btn--danger', onConfirm, onCancel, loading, fullscreen = false }) {
  return (
    <div className={`confirm-dialog${fullscreen ? ' confirm-dialog--fullscreen' : ''}`} onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="confirm-dialog__box">
        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__text">{message}</p>
        <div className="confirm-dialog__actions">
          <button
            className={`confirm-dialog__btn ${confirmClass}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Подождите...' : confirmLabel}
          </button>
          <button
            className="confirm-dialog__btn confirm-dialog__btn--secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Диалог несохранённых изменений
// ──────────────────────────────────────────────

function UnsavedChangesDialog({ message, onSave, onDiscard }) {
  return (
    <div className="confirm-dialog confirm-dialog--fullscreen" onClick={e => { if (e.target === e.currentTarget) onDiscard() }}>
      <div className="confirm-dialog__box">
        <h3 className="confirm-dialog__title">Несохранённые изменения</h3>
        <p className="confirm-dialog__text">{message}</p>
        <div className="confirm-dialog__actions">
          <button className="confirm-dialog__btn confirm-dialog__btn--primary" onClick={onSave}>
            Сохранить изменения
          </button>
          <button className="confirm-dialog__btn confirm-dialog__btn--secondary" onClick={onDiscard}>
            Оставить без изменений
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Пагинация
// ──────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="admin__pagination">
      <button className="admin__page-btn" onClick={() => onChange(page - 1)} disabled={page <= 1}>‹</button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        let p
        if (totalPages <= 7) p = i + 1
        else if (page <= 4) p = i + 1
        else if (page >= totalPages - 3) p = totalPages - 6 + i
        else p = page - 3 + i
        return (
          <button
            key={p}
            className={`admin__page-btn${page === p ? ' admin__page-btn--active' : ''}`}
            onClick={() => onChange(p)}
          >{p}</button>
        )
      })}
      <button className="admin__page-btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>›</button>
    </div>
  )
}

// ══════════════════════════════════════════════
// ТАБ: ДАШБОРД
// ══════════════════════════════════════════════

function DashboardTab() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  const load = useCallback(() => {
    setLoading(true)
    axios.get(`${API}/admin/stats`, { headers: authHeaders() })
      .then(r => { setData(r.data); setError('') })
      .catch(e => setError(e.response?.data?.error || 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="admin__loading">Загрузка статистики...</div>
  if (error)   return <div className="admin__error">{error}</div>

  const s = data.stats

  const cards = [
    {
      icon: <Ico.Users />,
      value: s.total_users,
      label: 'Всего пользователей',
      change: s.new_users_today > 0 ? `+${s.new_users_today} сегодня` : 'нет новых сегодня',
      up: s.new_users_today > 0,
    },
    {
      icon: <Ico.Memories />,
      value: s.total_memories,
      label: 'Всего воспоминаний',
      change: s.new_memories_today > 0 ? `+${s.new_memories_today} сегодня` : 'нет новых сегодня',
      up: s.new_memories_today > 0,
    },
    {
      icon: <Ico.Image />,
      value: s.total_images,
      label: 'Всего фотографий',
      change: `за неделю +${s.new_memories_week} записей`,
      up: s.new_memories_week > 0,
    },
    {
      icon: <Ico.Video />,
      value: s.total_videos,
      label: 'Всего видео',
      change: s.total_videos > 0 ? `в ${s.total_memories} воспоминаниях` : 'нет видео',
      up: s.total_videos > 0,
    },
    {
      icon: <Ico.Heart />,
      value: s.total_favorites,
      label: 'Всего в избранном',
      change: s.new_favorites_today > 0 ? `+${s.new_favorites_today} сегодня` : 'нет новых сегодня',
      up: s.new_favorites_today > 0,
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      value: s.new_users_week,
      label: 'Пользователей за неделю',
      change: `за месяц +${s.new_users_month}`,
      up: s.new_users_month > 0,
    },
  ]

  return (
    <>
      <div className="admin__header">
        <h1 className="admin__title">Дашборд</h1>
        <p className="admin__subtitle">Статистика сайта TimeLine</p>
      </div>

      {/* Карточки */}
      <div className="admin__stats-grid">
        {cards.map(c => (
          <div key={c.label} className="admin__stat-card">
            <div className="admin__stat-icon">{c.icon}</div>
            <span className="admin__stat-value">{Number(c.value).toLocaleString('ru-RU')}</span>
            <span className="admin__stat-label">{c.label}</span>
            <span className={`admin__stat-change admin__stat-change--${c.up ? 'up' : 'neutral'}`}>{c.change}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25em' }}>

        {/* Последние регистрации */}
        {data.recent_users?.length > 0 && (
          <div className="admin__section">
            <div className="admin__section-header">
              <span className="admin__section-title">Последние регистрации</span>
            </div>
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead><tr><th>Пользователь</th><th>Роль</th><th>Дата</th></tr></thead>
                <tbody>
                  {data.recent_users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="admin__table-user">
                          <Avatar src={u.avatar_path} name={u.username} />
                          <div>
                            <div className="admin__table-name">{u.username}</div>
                            <div className="admin__table-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin__badge admin__badge--${u.role === 'admin' ? 'admin' : 'user'}`}>
                          {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                        </span>
                      </td>
                      <td style={{ opacity: 0.7 }}>{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Топ по воспоминаниям */}
        {data.top_users?.length > 0 && (
          <div className="admin__section">
            <div className="admin__section-header">
              <span className="admin__section-title">Топ по воспоминаниям</span>
            </div>
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead><tr><th>Пользователь</th><th style={{ textAlign: 'center' }}>Записей</th></tr></thead>
                <tbody>
                  {data.top_users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="admin__table-user">
                          <Avatar src={u.avatar_path} name={u.username} />
                          <div>
                            <div className="admin__table-name">{u.username}</div>
                            <div className="admin__table-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                        {u.memories_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Последние воспоминания */}
        {data.recent_memories?.length > 0 && (
          <div className="admin__section" style={{ gridColumn: '1 / -1' }}>
            <div className="admin__section-header">
              <span className="admin__section-title">Последние воспоминания</span>
            </div>
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead><tr><th>Название</th><th>Автор</th><th>Дата события</th><th>Добавлено</th></tr></thead>
                <tbody>
                  {data.recent_memories.map(m => (
                    <tr key={m.id}>
                      <td className="admin__table-name">{m.title || '—'}</td>
                      <td style={{ opacity: 0.8 }}>{m.username}</td>
                      <td style={{ opacity: 0.7 }}>{formatDate(m.event_date)}</td>
                      <td style={{ opacity: 0.7 }}>{formatDate(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Топ избранных воспоминаний */}
        {data.top_favorited?.length > 0 && (
          <div className="admin__section" style={{ gridColumn: '1 / -1' }}>
            <div className="admin__section-header">
              <span className="admin__section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
                <Ico.Heart /> Топ воспоминаний в избранном
              </span>
            </div>
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>Воспоминание</th>
                    <th>Автор</th>
                    <th style={{ textAlign: 'center' }}>В избранном</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_favorited.map(m => (
                    <tr key={m.id}>
                      <td className="admin__table-name">{m.title || '—'}</td>
                      <td style={{ opacity: 0.8 }}>{m.username}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="admin__favorites-badge">
                          <Ico.Heart />
                          {m.favorites_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

// ══════════════════════════════════════════════
// Модалка: редактирование пользователя
// ══════════════════════════════════════════════

function EditUserModal({ user, onClose, onSaved }) {
  const [username,         setUsername]         = useState(user.username || '')
  const [email,            setEmail]            = useState(user.email    || '')
  const [role,             setRole]             = useState(user.role     || 'user')
  const [error,            setError]            = useState('')
  const [saving,           setSaving]           = useState(false)
  const [showSaveConfirm,  setShowSaveConfirm]  = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)

  const hasChanges = () =>
    username.trim() !== user.username ||
    email.trim()    !== user.email    ||
    role            !== user.role

  const handleClose = () => {
    if (hasChanges()) setShowUnsavedModal(true)
    else onClose()
  }

  const validate = () => {
    if (username.trim().length < 3) { setError('Никнейм не менее 3 символов'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Некорректный email'); return false }
    return true
  }

  const handleSave = async () => {
    setShowSaveConfirm(false)
    setSaving(true); setError('')
    try {
      await axios.put(
        `${API}/admin/users?id=${user.id}`,
        { username: username.trim(), email: email.trim(), role },
        { headers: authHeaders() }
      )
      onSaved({ ...user, username: username.trim(), email: email.trim(), role })
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка сохранения')
    } finally { setSaving(false) }
  }

  return (
    <div className="admin-modal" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="admin-modal__box">
        <div className="admin-modal__header">
          <span className="admin-modal__title">Редактировать пользователя</span>
          <button className="admin-modal__close" onClick={handleClose}><Ico.Close /></button>
        </div>
        <div className="admin-modal__body">
          <div className="admin-modal__field">
            <label className="admin-modal__label">Никнейм</label>
            <input className="admin-modal__input" value={username} onChange={e => setUsername(e.target.value)} maxLength={30} />
          </div>
          <div className="admin-modal__field">
            <label className="admin-modal__label">Email</label>
            <input className="admin-modal__input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="admin-modal__field">
            <label className="admin-modal__label">Роль</label>
            <select className="admin-modal__select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          {error && <span className="admin-modal__error">{error}</span>}
        </div>
        <div className="admin-modal__footer">
          <button className="admin-modal__cancel-btn" onClick={handleClose}>Отмена</button>
          <button className="admin-modal__save-btn" onClick={() => { if (validate()) setShowSaveConfirm(true) }} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {showSaveConfirm && (
        <ConfirmDialog
          fullscreen
          title="Сохранить изменения?"
          message="Данные пользователя будут обновлены."
          confirmLabel="Сохранить"
          confirmClass="confirm-dialog__btn--primary"
          onConfirm={handleSave}
          onCancel={() => setShowSaveConfirm(false)}
          loading={saving}
        />
      )}

      {showUnsavedModal && (
        <UnsavedChangesDialog
          message="Вы изменили данные пользователя, но не сохранили. Что сделать с изменениями?"
          onSave={() => { setShowUnsavedModal(false); if (validate()) setShowSaveConfirm(true) }}
          onDiscard={() => { setShowUnsavedModal(false); onClose() }}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════
// Модалка: создание пользователя
// ══════════════════════════════════════════════

function CreateUserModal({ onClose, onCreated }) {
  const [username,  setUsername]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [role,      setRole]      = useState('user')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const handleSave = async () => {
    if (username.trim().length < 3) return setError('Никнейм не менее 3 символов')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Некорректный email')
    if (password.length < 6) return setError('Пароль не менее 6 символов')
    setSaving(true); setError('')
    try {
      const res = await axios.post(
        `${API}/admin/users`,
        { username: username.trim(), email: email.trim(), password, birth_date: birthDate || null, role },
        { headers: authHeaders() }
      )
      onCreated(res.data)
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка создания')
    } finally { setSaving(false) }
  }

  return (
    <div className="admin-modal" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="admin-modal__box">
        <div className="admin-modal__header">
          <span className="admin-modal__title">Новый пользователь</span>
          <button className="admin-modal__close" onClick={onClose}><Ico.Close /></button>
        </div>
        <div className="admin-modal__body">
          <div className="admin-modal__field">
            <label className="admin-modal__label">Никнейм</label>
            <input className="admin-modal__input" value={username} onChange={e => setUsername(e.target.value)} maxLength={30} />
          </div>
          <div className="admin-modal__field">
            <label className="admin-modal__label">Email</label>
            <input className="admin-modal__input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="admin-modal__field">
            <label className="admin-modal__label">Пароль</label>
            <input className="admin-modal__input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="admin-modal__field">
            <label className="admin-modal__label">Дата рождения (необязательно)</label>
            <input className="admin-modal__input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div className="admin-modal__field">
            <label className="admin-modal__label">Роль</label>
            <select className="admin-modal__select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          {error && <span className="admin-modal__error">{error}</span>}
        </div>
        <div className="admin-modal__footer">
          <button className="admin-modal__cancel-btn" onClick={onClose}>Отмена</button>
          <button className="admin-modal__save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// ТАБ: ПОЛЬЗОВАТЕЛИ
// ══════════════════════════════════════════════

function UsersTab() {
  const {
    items: users, setItems: setUsers, total, totalPages, page,
    search, inputSearch, loading, error,
    confirmDelete, setConfirmDelete, deleting,
    createOpen, setCreateOpen, toast, showToast,
    load, handleSearchChange, handlePageChange, handleDelete,
  } = useAdminList('users', 'users')

  const [editUser, setEditUser] = useState(null)

  const handleSaved = (updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    showToast('update', 'Данные пользователя обновлены')
  }

  return (
    <>
      <AdminToast toast={toast} />
      <div className="admin__header">
        <h1 className="admin__title">Пользователи</h1>
        <p className="admin__subtitle">Всего в базе: {total}</p>
      </div>

      <div className="admin__section">
        <div className="admin__section-header">
          <span className="admin__section-title">Все аккаунты</span>
          <div className="admin__section-controls">
            <div className="admin__search">
              <Ico.Search />
              <input
                className="admin__search-input"
                placeholder="Поиск по имени или email..."
                value={inputSearch}
                onChange={handleSearchChange}
              />
            </div>
            <button
              className="admin__action-btn"
              title="Обновить"
              onClick={() => load(page, search)}
              style={{ width: 36, height: 36, borderRadius: '50%' }}
            >
              <Ico.Refresh />
            </button>
            <button
              className="admin__action-btn admin__action-btn--primary"
              style={{ width: 'auto', height: 36 }}
              onClick={() => setCreateOpen(true)}
            >
              <Ico.Plus /> Добавить
            </button>
          </div>
        </div>

        {error && <div className="admin__error">{error}</div>}

        {loading ? (
          <div className="admin__loading">Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="admin__empty">Пользователи не найдены</div>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th style={{ textAlign: 'center' }}>Записей</th>
                  <th style={{ textAlign: 'center' }}>Избранных</th>
                  <th>Регистрация</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ opacity: 0.45 }}>#{u.id}</td>
                    <td>
                      <div className="admin__table-user">
                        <Avatar src={u.avatar_path} name={u.username} />
                        <div>
                          <div className="admin__table-name">{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="admin__table-email">{u.email}</td>
                    <td>
                      <span className={`admin__badge admin__badge--${u.role === 'admin' ? 'admin' : 'user'}`}>
                        {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{u.memories_count ?? 0}</td>
                    <td style={{ textAlign: 'center' }}>
                      {(u.favorites_count ?? 0) > 0
                        ? <span className="admin__favorites-badge"><Ico.Heart />{u.favorites_count}</span>
                        : <span style={{ opacity: 0.35 }}>—</span>
                      }
                    </td>
                    <td style={{ opacity: 0.7 }}>{formatDate(u.created_at)}</td>
                    <td>
                      <div className="admin__actions">
                        <button className="admin__action-btn" title="Редактировать" onClick={() => setEditUser(u)}>
                          <Ico.Edit />
                        </button>
                        <button className="admin__action-btn admin__action-btn--danger" title="Удалить" onClick={() => setConfirmDelete(u)}>
                          <Ico.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
      </div>

      {editUser && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={handleSaved} />
      )}
      {createOpen && (
        <CreateUserModal onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); load(1, search); showToast('success', 'Пользователь создан') }} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          fullscreen
          title="Удалить пользователя?"
          message={`Аккаунт «${confirmDelete.username}» и все его воспоминания с фото будут удалены навсегда.`}
          confirmLabel="Удалить"
          onConfirm={() => handleDelete('Пользователь удалён')}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </>
  )
}

// ══════════════════════════════════════════════
// Модалка: редактирование воспоминания
// ══════════════════════════════════════════════

function EditMemoryModal({ memory, onClose, onSaved }) {
  const [title,            setTitle]            = useState(memory.title || '')
  const [eventDate,        setEventDate]        = useState(memory.event_date ? memory.event_date.slice(0, 10) : '')
  const [images,           setImages]           = useState([])
  const [removeIds,        setRemoveIds]        = useState([])
  const [videos,           setVideos]           = useState([])
  const [removeVideoIds,   setRemoveVideoIds]   = useState([])
  const [loadingImages,    setLoadingImages]    = useState(true)
  const [initialContent,   setInitialContent]   = useState(null)
  const [error,            setError]            = useState('')
  const [saving,           setSaving]           = useState(false)
  const [showSaveConfirm,  setShowSaveConfirm]  = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)

  const editor    = useRichEditor()
  const editorRef = editor.editorRef
  const imgFiles  = useNewFiles(5)
  const vidFiles  = useNewFiles(ADMIN_MAX_VIDEOS, ADMIN_VIDEO_TYPES)

  const fileInputRef  = useRef(null)
  const videoInputRef = useRef(null)

  useEffect(() => {
    axios.get(`${API}/admin/memories?id=${memory.id}`, { headers: authHeaders() })
      .then(r => {
        const m = r.data.memory
        if (!m) return
        setImages(m.images || [])
        setVideos(m.videos || [])
        setTitle(m.title || '')
        setEventDate(m.event_date ? m.event_date.slice(0, 10) : '')
        setInitialContent(m.content || '')
      })
      .catch(() => {})
      .finally(() => setLoadingImages(false))
  }, [memory.id])

  // Вставляем HTML в редактор после загрузки
  useEffect(() => {
    if (initialContent !== null && editorRef.current) {
      editorRef.current.innerHTML = initialContent
    }
  }, [initialContent])

  // ── Фотографии ───────────────────────────────────────────────
  const toggleRemove = (imgId) => {
    setRemoveIds(prev => prev.includes(imgId) ? prev.filter(id => id !== imgId) : [...prev, imgId])
  }

  const keptCount      = images.filter(img => !removeIds.includes(img.id)).length
  const totalCount     = keptCount + imgFiles.files.length
  const canAddMore     = totalCount < 5
  const keptVideoCount = videos.filter(v => !removeVideoIds.includes(v.id)).length
  const totalVideoCount = keptVideoCount + vidFiles.files.length
  const canAddMoreVideo = totalVideoCount < ADMIN_MAX_VIDEOS

  const toggleRemoveVideo = (vidId) => {
    setRemoveVideoIds(prev => prev.includes(vidId) ? prev.filter(id => id !== vidId) : [...prev, vidId])
  }

  const hasChanges = () => {
    if (title.trim() !== (memory.title || '')) return true
    if (eventDate !== (memory.event_date ? memory.event_date.slice(0, 10) : '')) return true
    if (removeIds.length > 0 || imgFiles.files.length > 0) return true
    if (removeVideoIds.length > 0 || vidFiles.files.length > 0) return true
    if (editorRef.current && initialContent !== null && editorRef.current.innerHTML !== initialContent) return true
    return false
  }

  const handleClose = () => {
    if (hasChanges()) setShowUnsavedModal(true)
    else onClose()
  }

  const handleSave = async () => {
    if (!title.trim()) return setError('Заголовок не может быть пустым')
    const content = editorRef.current?.innerHTML?.trim() ?? ''
    if (!content || content === '<br>') return setError('Введите текст воспоминания')
    setShowSaveConfirm(true)
  }

  const doSave = async () => {
    setShowSaveConfirm(false)
    const content = editorRef.current?.innerHTML?.trim() ?? ''
    setSaving(true); setError('')
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('content', content)
      if (eventDate) fd.append('event_date', eventDate)
      removeIds.forEach(id => fd.append('remove_image_ids[]', id))
      imgFiles.files.forEach(f => fd.append('images[]', f))
      removeVideoIds.forEach(id => fd.append('remove_video_ids[]', id))
      vidFiles.files.forEach(f => fd.append('videos[]', f))

      await axios.post(
        `${API}/admin/memories?id=${memory.id}&_method=PUT`,
        fd,
        { headers: { ...authHeaders() } }
      )
      onSaved({ ...memory, title: title.trim(), content, event_date: eventDate })
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка сохранения')
    } finally { setSaving(false) }
  }

  return (
    <div className="admin-modal" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="admin-modal__box" style={{ maxWidth: 700 }}>
        <div className="admin-modal__header">
          <span className="admin-modal__title">Редактировать воспоминание</span>
          <button className="admin-modal__close" onClick={handleClose}><Ico.Close /></button>
        </div>
        <div className="admin-modal__body">

          <div className="admin-modal__field">
            <label className="admin-modal__label">Заголовок</label>
            <input className="admin-modal__input" value={title} onChange={e => setTitle(e.target.value)} maxLength={255} />
          </div>

          <div className="admin-modal__field">
            <label className="admin-modal__label">Дата события</label>
            <input className="admin-modal__input" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
          </div>

          {/* ── Редактор текста с форматированием ── */}
          <div className="admin-modal__field">
            <label className="admin-modal__label">Текст</label>
            <div className="admin-modal__editor-wrap">
              <RichEditorToolbar editor={editor} />

              {/* Редактор */}
              {loadingImages ? (
                <div className="admin-modal__editor-loading">Загрузка...</div>
              ) : (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="admin-modal__editor"
                  data-placeholder="Текст воспоминания..."
                />
              )}
            </div>
          </div>

          {/* ── Фотографии ── */}
          <div className="admin-modal__field">
            <label className="admin-modal__label">Фотографии ({totalCount}/5)</label>
            <div className="admin-modal__images">
              {images.map(img => (
                <div key={img.id}
                  className={`admin-modal__img-item${removeIds.includes(img.id) ? ' admin-modal__img-item--removed' : ''}`}>
                  <img src={`${UPLOADS}${img.file_path}`} alt="" />
                  <button className="admin-modal__img-del" onClick={() => toggleRemove(img.id)} type="button"
                    title={removeIds.includes(img.id) ? 'Отменить удаление' : 'Удалить фото'}>
                    {removeIds.includes(img.id) ? '↩' : '×'}
                  </button>
                </div>
              ))}
              {imgFiles.previews.map((url, i) => (
                <div key={`new-${i}`} className="admin-modal__img-item admin-modal__img-item--new">
                  <img src={url} alt="" />
                  <button className="admin-modal__img-del" onClick={() => imgFiles.remove(i)} type="button" title="Убрать">×</button>
                </div>
              ))}
              {canAddMore && (
                <button className="admin-modal__img-add" onClick={() => fileInputRef.current?.click()} type="button">
                  <Ico.Image /><span>Добавить</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple
              style={{ display: 'none' }} onChange={e => imgFiles.add(e, keptCount)} />
          </div>

          {/* ── Видео ── */}
          <div className="admin-modal__field">
            <label className="admin-modal__label">Видео ({totalVideoCount}/{ADMIN_MAX_VIDEOS})</label>
            <div className="admin-modal__videos">
              {videos.map(vid => (
                <div key={vid.id}
                  className={`admin-modal__vid-item${removeVideoIds.includes(vid.id) ? ' admin-modal__vid-item--removed' : ''}`}>
                  <video src={`${UPLOADS}${vid.file_path}`} controls preload="metadata" />
                  <button className="admin-modal__img-del" onClick={() => toggleRemoveVideo(vid.id)} type="button"
                    title={removeVideoIds.includes(vid.id) ? 'Отменить удаление' : 'Удалить видео'}>
                    {removeVideoIds.includes(vid.id) ? '↩' : '×'}
                  </button>
                </div>
              ))}
              {vidFiles.previews.map((url, i) => (
                <div key={`nv-${i}`} className="admin-modal__vid-item admin-modal__vid-item--new">
                  <video src={url} controls preload="metadata" />
                  <button className="admin-modal__img-del" onClick={() => vidFiles.remove(i)} type="button" title="Убрать">×</button>
                </div>
              ))}
              {canAddMoreVideo && (
                <button className="admin-modal__vid-add" onClick={() => videoInputRef.current?.click()} type="button">
                  <Ico.Image /><span>Добавить видео</span>
                </button>
              )}
            </div>
            <input ref={videoInputRef} type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
              multiple style={{ display: 'none' }} onChange={e => vidFiles.add(e, keptVideoCount)} />
          </div>

          {error && <span className="admin-modal__error">{error}</span>}
        </div>
        <div className="admin-modal__footer">
          <button className="admin-modal__cancel-btn" onClick={handleClose}>Отмена</button>
          <button className="admin-modal__save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {showSaveConfirm && (
        <ConfirmDialog
          fullscreen
          title="Сохранить изменения?"
          message="Воспоминание будет обновлено с новым содержимым."
          confirmLabel="Сохранить"
          confirmClass="confirm-dialog__btn--primary"
          onConfirm={doSave}
          onCancel={() => setShowSaveConfirm(false)}
          loading={saving}
        />
      )}

      {showUnsavedModal && (
        <UnsavedChangesDialog
          message="Вы изменили воспоминание, но не сохранили. Что сделать с изменениями?"
          onSave={() => { setShowUnsavedModal(false); handleSave() }}
          onDiscard={() => { setShowUnsavedModal(false); onClose() }}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════
// Модалка: создание воспоминания
// ══════════════════════════════════════════════

function CreateMemoryModal({ onClose, onCreated }) {
  const [userQuery,        setUserQuery]        = useState('')
  const [userOptions,      setUserOptions]      = useState([])
  const [selUser,          setSelUser]          = useState(null)
  const [showDrop,         setShowDrop]         = useState(false)
  const [title,            setTitle]            = useState('')
  const [eventDate,        setEventDate]        = useState('')
  const [error,            setError]            = useState('')
  const [saving,           setSaving]           = useState(false)

  const editor    = useRichEditor()
  const editorRef = editor.editorRef
  const imgFiles  = useNewFiles(5)
  const vidFiles  = useNewFiles(ADMIN_MAX_VIDEOS, ADMIN_VIDEO_TYPES)

  const fileInputRef       = useRef(null)
  const videoInputRef      = useRef(null)
  const userSearchTimer    = useRef(null)

  // ── Поиск пользователей ──────────────────────────────────────
  const searchUsers = (q) => {
    if (!q.trim()) { setUserOptions([]); setShowDrop(false); return }
    axios.get(`${API}/admin/users`, { params: { search: q, limit: 10, page: 1 }, headers: authHeaders() })
      .then(r => { setUserOptions(r.data.users || []); setShowDrop(true) })
      .catch(() => {})
  }

  const handleUserQueryChange = (e) => {
    const val = e.target.value
    setUserQuery(val)
    setSelUser(null)
    clearTimeout(userSearchTimer.current)
    userSearchTimer.current = setTimeout(() => searchUsers(val), 300)
  }

  const selectUser = (u) => {
    setSelUser(u)
    setUserQuery(`${u.username} (${u.email})`)
    setUserOptions([])
    setShowDrop(false)
  }

  // ── Сохранение ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!selUser)           return setError('Выберите пользователя')
    if (!title.trim())      return setError('Заголовок не может быть пустым')
    const content = editorRef.current?.innerHTML?.trim() ?? ''
    if (!content || content === '<br>') return setError('Введите текст воспоминания')
    if (!eventDate)         return setError('Укажите дату события')
    setSaving(true); setError('')
    try {
      const fd = new FormData()
      fd.append('user_id',    selUser.id)
      fd.append('title',      title.trim())
      fd.append('content',    content)
      fd.append('event_date', eventDate)
      imgFiles.files.forEach(f => fd.append('images[]', f))
      vidFiles.files.forEach(f => fd.append('videos[]', f))
      const res = await axios.post(`${API}/admin/memories`, fd, { headers: authHeaders() })
      onCreated(res.data)
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка создания')
    } finally { setSaving(false) }
  }

  return (
    <div className="admin-modal" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="admin-modal__box" style={{ maxWidth: 700 }}>
        <div className="admin-modal__header">
          <span className="admin-modal__title">Новое воспоминание</span>
          <button className="admin-modal__close" onClick={onClose}><Ico.Close /></button>
        </div>
        <div className="admin-modal__body">

          {/* Выбор пользователя */}
          <div className="admin-modal__field" style={{ position: 'relative' }}>
            <label className="admin-modal__label">Пользователь</label>
            <input
              className="admin-modal__input"
              placeholder="Начните вводить имя или email..."
              value={userQuery}
              onChange={handleUserQueryChange}
              onFocus={() => userOptions.length > 0 && setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              autoComplete="off"
            />
            {showDrop && userOptions.length > 0 && (
              <div className="admin-modal__user-drop">
                {userOptions.map(u => (
                  <div key={u.id} className="admin-modal__user-option" onMouseDown={() => selectUser(u)}>
                    <span className="admin-modal__user-option-name">{u.username}</span>
                    <span className="admin-modal__user-option-email">{u.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-modal__field">
            <label className="admin-modal__label">Заголовок</label>
            <input className="admin-modal__input" value={title} onChange={e => setTitle(e.target.value)} maxLength={255} />
          </div>

          <div className="admin-modal__field">
            <label className="admin-modal__label">Дата события</label>
            <input className="admin-modal__input" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
          </div>

          {/* Редактор текста */}
          <div className="admin-modal__field">
            <label className="admin-modal__label">Текст</label>
            <div className="admin-modal__editor-wrap">
              <RichEditorToolbar editor={editor} />
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="admin-modal__editor"
                data-placeholder="Текст воспоминания..."
              />
            </div>
          </div>

          {/* Фотографии */}
          <div className="admin-modal__field">
            <label className="admin-modal__label">Фотографии ({imgFiles.files.length}/5)</label>
            <div className="admin-modal__images">
              {imgFiles.previews.map((url, i) => (
                <div key={i} className="admin-modal__img-item admin-modal__img-item--new">
                  <img src={url} alt="" />
                  <button className="admin-modal__img-del" onClick={() => imgFiles.remove(i)} type="button" title="Убрать">×</button>
                </div>
              ))}
              {imgFiles.files.length < 5 && (
                <button className="admin-modal__img-add" onClick={() => fileInputRef.current?.click()} type="button">
                  <Ico.Image /><span>Добавить</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple
              style={{ display: 'none' }} onChange={e => imgFiles.add(e)} />
          </div>

          {/* Видео */}
          <div className="admin-modal__field">
            <label className="admin-modal__label">Видео ({vidFiles.files.length}/{ADMIN_MAX_VIDEOS})</label>
            <div className="admin-modal__videos">
              {vidFiles.previews.map((url, i) => (
                <div key={i} className="admin-modal__vid-item admin-modal__vid-item--new">
                  <video src={url} controls preload="metadata" />
                  <button className="admin-modal__img-del" onClick={() => vidFiles.remove(i)} type="button" title="Убрать">×</button>
                </div>
              ))}
              {vidFiles.files.length < ADMIN_MAX_VIDEOS && (
                <button className="admin-modal__vid-add" onClick={() => videoInputRef.current?.click()} type="button">
                  <Ico.Image /><span>Добавить видео</span>
                </button>
              )}
            </div>
            <input ref={videoInputRef} type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
              multiple style={{ display: 'none' }} onChange={e => vidFiles.add(e)} />
          </div>

          {error && <span className="admin-modal__error">{error}</span>}
        </div>
        <div className="admin-modal__footer">
          <button className="admin-modal__cancel-btn" onClick={onClose}>Отмена</button>
          <button className="admin-modal__save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// ТАБ: ВОСПОМИНАНИЯ
// ══════════════════════════════════════════════

function MemoriesTab() {
  const {
    items: memories, setItems: setMemories, total, totalPages, page,
    search, inputSearch, loading, error,
    confirmDelete, setConfirmDelete, deleting,
    createOpen, setCreateOpen, toast, showToast,
    load, handleSearchChange, handlePageChange, handleDelete,
  } = useAdminList('memories', 'memories')

  const [editMemory, setEditMemory] = useState(null)

  const handleSaved = (updated) => {
    setMemories(prev => prev.map(m => m.id === updated.id ? updated : m))
    showToast('update', 'Воспоминание обновлено')
  }

  return (
    <>
      <AdminToast toast={toast} />
      <div className="admin__header">
        <h1 className="admin__title">Воспоминания</h1>
        <p className="admin__subtitle">Всего записей: {total}</p>
      </div>

      <div className="admin__section">
        <div className="admin__section-header">
          <span className="admin__section-title">Все воспоминания</span>
          <div className="admin__section-controls">
            <div className="admin__search">
              <Ico.Search />
              <input
                className="admin__search-input"
                placeholder="Поиск по названию или тексту..."
                value={inputSearch}
                onChange={handleSearchChange}
              />
            </div>
            <button
              className="admin__action-btn"
              title="Обновить"
              onClick={() => load(page, search)}
              style={{ width: 36, height: 36, borderRadius: '50%' }}
            >
              <Ico.Refresh />
            </button>
            <button
              className="admin__action-btn admin__action-btn--primary"
              style={{ width: 'auto', height: 36 }}
              onClick={() => setCreateOpen(true)}
            >
              <Ico.Plus /> Добавить
            </button>
          </div>
        </div>

        {error && <div className="admin__error">{error}</div>}

        {loading ? (
          <div className="admin__loading">Загрузка...</div>
        ) : memories.length === 0 ? (
          <div className="admin__empty">Воспоминания не найдены</div>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Заголовок</th>
                  <th>Пользователь</th>
                  <th>Дата события</th>
                  <th>Добавлено</th>
                  <th style={{ textAlign: 'center' }}>В избранном</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {memories.map(m => (
                  <tr key={m.id}>
                    <td style={{ opacity: 0.45 }}>#{m.id}</td>
                    <td>
                      <div className="admin__table-name">{m.title || '—'}</div>
                      {m.content && (
                        <div style={{ fontSize: '0.78rem', opacity: 0.5, marginTop: '0.2em', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.content}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="admin__table-user">
                        <Avatar src={m.avatar_path} name={m.username} size={28} />
                        <span style={{ opacity: 0.85 }}>{m.username}</span>
                      </div>
                    </td>
                    <td style={{ opacity: 0.7 }}>{formatDate(m.event_date)}</td>
                    <td style={{ opacity: 0.7 }}>{formatDate(m.created_at)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {(m.favorites_count ?? 0) > 0
                        ? <span className="admin__favorites-badge"><Ico.Heart />{m.favorites_count}</span>
                        : <span style={{ opacity: 0.35 }}>—</span>
                      }
                    </td>
                    <td>
                      <div className="admin__actions">
                        <button className="admin__action-btn" title="Редактировать" onClick={() => setEditMemory(m)}>
                          <Ico.Edit />
                        </button>
                        <button className="admin__action-btn admin__action-btn--danger" title="Удалить" onClick={() => setConfirmDelete(m)}>
                          <Ico.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
      </div>

      {editMemory && (
        <EditMemoryModal memory={editMemory} onClose={() => setEditMemory(null)} onSaved={handleSaved} />
      )}
      {createOpen && (
        <CreateMemoryModal onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); load(1, search); showToast('success', 'Воспоминание создано') }} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          fullscreen
          title="Удалить воспоминание?"
          message={`«${confirmDelete.title || 'Без названия'}» и все его фотографии будут удалены навсегда.`}
          confirmLabel="Удалить"
          onConfirm={() => handleDelete('Воспоминание удалено')}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </>
  )
}

// ══════════════════════════════════════════════
// Главный компонент
// ══════════════════════════════════════════════

const TABS = [
  { key: 'dashboard', label: 'Дашборд',      Icon: Ico.Dashboard },
  { key: 'users',     label: 'Пользователи', Icon: Ico.Users     },
  { key: 'memories',  label: 'Воспоминания', Icon: Ico.Memories  },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { user, logout }          = useAuth()
  const navigate                  = useNavigate()

  return (
    <div className="admin">
      {/* ── Сайдбар ── */}
      <aside className="admin__sidebar">
        <div className="admin__logo">
          TimeLine
          <span className="admin__logo-sub">Панель управления</span>
        </div>

        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`admin__nav-btn${activeTab === key ? ' admin__nav-btn--active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon />{label}
          </button>
        ))}

        <div className="admin__nav-spacer" />

        <button className="admin__nav-btn" onClick={() => navigate('/')}>
          <Ico.Back />На сайт
        </button>
        <button className="admin__logout-btn" onClick={() => { logout(); navigate('/auth') }}>
          <Ico.Logout />{user?.username}
        </button>
      </aside>

      {/* ── Контент ── */}
      <main className="admin__content">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users'     && <UsersTab />}
        {activeTab === 'memories'  && <MemoriesTab />}
      </main>
    </div>
  )
}
