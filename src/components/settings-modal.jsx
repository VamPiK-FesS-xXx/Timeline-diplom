import { useState, useRef, useMemo, useEffect } from "react";

const UPLOADS = "http://timeline-bd/backend/";

const MONTH_NAMES_GEN = [
  "января", "февраля", "марта", "апреля",
  "мая", "июня", "июля", "августа",
  "сентября", "октября", "ноября", "декабря",
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d, 10)} ${MONTH_NAMES_GEN[parseInt(m, 10) - 1] ?? ""} ${y}`;
}

const PERIOD_FILTERS = [
  { key: "allTime",     label: "за все время" },
  { key: "currentYear", label: "текущий год" },
  { key: "lastMonth",   label: "последний месяц" },
  { key: "lastWeek",    label: "последняя неделя" },
];

const SORT_OPTIONS = [
  { key: "date-desc",  label: "новые → старые" },
  { key: "date-asc",   label: "старые → новые" },
  { key: "alpha-asc",  label: "А → Я" },
  { key: "alpha-desc", label: "Я → А" },
];

function isYearFilter(f)  { return typeof f === "string" && f.startsWith("year-"); }
function isRangeFilter(f) { return typeof f === "string" && f.startsWith("range-"); }

function SettingsModal({
  onClose,
  searchQuery = "",
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortOrder = "date-desc",
  onSortChange,
  onlyWithPhotos = false,
  onOnlyWithPhotosChange,
  onlyWithVideos = false,
  onOnlyWithVideosChange,
  birthYear,
  filteredMemories = [],
  onMemoryClick,
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const inputRef = useRef(null);

  const currentYear = new Date().getFullYear();

  // Список всех доступных лет (от текущего к году рождения)
  const years = useMemo(() => {
    if (!birthYear) return [];
    const arr = [];
    for (let y = currentYear; y >= birthYear; y--) arr.push(y);
    return arr;
  }, [birthYear, currentYear]);

  // Декодируем диапазон из activeFilter
  const rangeMatch = activeFilter?.match(/^range-(\d+)-(\d+)$/);
  const [localFrom, setLocalFrom] = useState(rangeMatch ? rangeMatch[1] : "");
  const [localTo,   setLocalTo]   = useState(rangeMatch ? rangeMatch[2] : "");

  // Синхронизируем локальные поля диапазона при сбросе фильтра снаружи
  useEffect(() => {
    const rm = activeFilter?.match(/^range-(\d+)-(\d+)$/);
    setLocalFrom(rm ? rm[1] : "");
    setLocalTo(rm ? rm[2] : "");
  }, [activeFilter]);

  const hasSearch = searchQuery.trim().length > 0;

  const activePeriodKey = !isYearFilter(activeFilter) && !isRangeFilter(activeFilter)
    ? activeFilter : null;

  const activeYear = isYearFilter(activeFilter)
    ? parseInt(activeFilter.replace("year-", ""), 10)
    : null;

  const activeFiltersCount = [
    activeFilter && activeFilter !== "allTime",
    sortOrder !== "date-desc",
    onlyWithPhotos,
    onlyWithVideos,
  ].filter(Boolean).length;

  const hasActiveFilters =
    (activeFilter && activeFilter !== "allTime") ||
    sortOrder !== "date-desc" ||
    onlyWithPhotos ||
    onlyWithVideos;

  // ── Обработчики ─────────────────────────────────────────────
  const handlePeriodClick = (key) =>
    onFilterChange?.(activePeriodKey === key ? null : key);

  const handleYearClick = (y) => {
    const key = `year-${y}`;
    onFilterChange?.(activeFilter === key ? null : key);
  };

  const handleApplyRange = () => {
    const from = parseInt(localFrom, 10);
    const to   = parseInt(localTo, 10);
    if (!localFrom || !localTo || isNaN(from) || isNaN(to)) return;
    const min = Math.min(from, to);
    const max = Math.max(from, to);
    onFilterChange?.(`range-${min}-${max}`);
  };

  const handleResetAll = () => {
    onFilterChange?.(null);
    onSortChange?.("date-desc");
    onOnlyWithPhotosChange?.(false);
    onOnlyWithVideosChange?.(false);
    setLocalFrom("");
    setLocalTo("");
  };

  const handleClearSearch = () => {
    onSearchChange?.("");
    inputRef.current?.focus();
  };

  // ── Рендер ──────────────────────────────────────────────────
  return (
    <div className="modal__settings-overlay" onClick={onClose}>
      <div className="modal__settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal__settings-wrapper">

          {/* ── Шапка ── */}
          <div className="modal__header-controls">
            <div className="header__main-controls">
              <button
                className={
                  "header__btn-control" +
                  (filtersOpen ? " header__btn-control--active" : "")
                }
                onClick={() => setFiltersOpen((p) => !p)}
              >
                фильтры
                {activeFiltersCount > 0 && (
                  <span className="header__filters-badge">{activeFiltersCount}</span>
                )}
                <span className="header__btn-arrow">{filtersOpen ? " ▴" : " ▾"}</span>
              </button>

              <div className="header__search">
                <input
                  ref={inputRef}
                  type="text"
                  className="header__search-input"
                  placeholder="поиск воспоминаний..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  autoFocus
                />
                {hasSearch ? (
                  <button className="header__search-btn" onClick={handleClearSearch} title="Очистить">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                ) : (
                  <button className="header__search-btn" tabIndex={-1}>
                    <svg width="24" height="24" viewBox="0 0 12 12" fill="none">
                      <path d="M11.8029 10.8565L9.53693 8.59723C10.268 7.66583 10.6647 6.51567 10.6632 5.33162C10.6632 4.27712 10.3505 3.24631 9.76469 2.36953C9.17885 1.49275 8.34616 0.809385 7.37194 0.405847C6.39771 0.00231009 5.3257 -0.103274 4.29147 0.102448C3.25724 0.308169 2.30724 0.815957 1.5616 1.5616C0.815957 2.30724 0.308169 3.25724 0.102448 4.29147C-0.103274 5.3257 0.00231009 6.39771 0.405847 7.37194C0.809385 8.34616 1.49275 9.17885 2.36953 9.76469C3.24631 10.3505 4.27712 10.6632 5.33162 10.6632C6.51567 10.6647 7.66583 10.268 8.59723 9.53693L10.8565 11.8029C10.9185 11.8653 10.9922 11.9149 11.0734 11.9487C11.1546 11.9826 11.2417 12 11.3297 12C11.4177 12 11.5048 11.9826 11.586 11.9487C11.6672 11.9149 11.7409 11.8653 11.8029 11.8029C11.8653 11.7409 11.9149 11.6672 11.9487 11.586C11.9826 11.5048 12 11.4177 12 11.3297C12 11.2417 11.9826 11.1546 11.9487 11.0734C11.9149 10.9922 11.8653 10.9185 11.8029 10.8565ZM1.33291 5.33162C1.33291 4.54075 1.56743 3.76764 2.00681 3.11005C2.44619 2.45247 3.07071 1.93994 3.80138 1.63729C4.53205 1.33464 5.33605 1.25545 6.11173 1.40974C6.8874 1.56403 7.5999 1.94487 8.15913 2.5041C8.71836 3.06333 9.0992 3.77583 9.25349 4.55151C9.40779 5.32718 9.3286 6.13119 9.02594 6.86186C8.72329 7.59253 8.21077 8.21704 7.55318 8.65642C6.8956 9.09581 6.12249 9.33033 5.33162 9.33033C4.27109 9.33033 3.25401 8.90904 2.5041 8.15913C1.7542 7.40923 1.33291 6.39214 1.33291 5.33162Z" fill="white"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <button className="header__btn-close btn-flex" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8.64341 6.99901L13.6552 1.99813C13.8747 1.77862 13.998 1.48091 13.998 1.17048C13.998 0.860046 13.8747 0.562331 13.6552 0.342824C13.4358 0.123318 13.1381 0 12.8277 0C12.5173 0 12.2196 0.123318 12.0002 0.342824L7 5.35536L1.99983 0.342824C1.78036 0.123318 1.48268 -2.31288e-09 1.1723 0C0.861913 2.31288e-09 0.56424 0.123318 0.344765 0.342824C0.125289 0.562331 0.00198911 0.860046 0.00198911 1.17048C0.00198911 1.48091 0.125289 1.77862 0.344765 1.99813L5.35659 6.99901L0.344765 11.9999C0.235521 12.1083 0.148811 12.2372 0.0896384 12.3792C0.0304655 12.5213 0 12.6736 0 12.8275C0 12.9814 0.0304655 13.1338 0.0896384 13.2758C0.148811 13.4179 0.235521 13.5468 0.344765 13.6552C0.453117 13.7644 0.582027 13.8512 0.724059 13.9103C0.866091 13.9695 1.01843 14 1.1723 14C1.32616 14 1.47851 13.9695 1.62054 13.9103C1.76257 13.8512 1.89148 13.7644 1.99983 13.6552L7 8.64265L12.0002 13.6552C12.1085 13.7644 12.2374 13.8512 12.3795 13.9103C12.5215 13.9695 12.6738 14 12.8277 14C12.9816 14 13.1339 13.9695 13.2759 13.9103C13.418 13.8512 13.5469 13.7644 13.6552 13.6552C13.7645 13.5468 13.8512 13.4179 13.9104 13.2758C13.9695 13.1338 14 12.9814 14 12.8275C14 12.6736 13.9695 12.5213 13.9104 12.3792C13.8512 12.2372 13.7645 12.1083 13.6552 11.9999L8.64341 6.99901Z" fill="white"/>
              </svg>
            </button>
          </div>

          {/* ── Панель фильтров ── */}
          {filtersOpen && (
            <div className="filters">

              {/* По периоду */}
              <div className="filters__section">
                <p className="filters__section-label">по периоду</p>
                <div className="filters__checkboxes">
                  {PERIOD_FILTERS.map((f) => (
                    <label key={f.key} className="filters__checkbox-label">
                      <input
                        type="checkbox"
                        className="filters__checkbox"
                        checked={activePeriodKey === f.key}
                        onChange={() => handlePeriodClick(f.key)}
                      />
                      <span className="filters__checkbox-custom" />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Конкретный год */}
              {years.length > 0 && (
                <div className="filters__section">
                  <p className="filters__section-label">конкретный год</p>
                  <div className="filters__years">
                    {years.map((y) => (
                      <button
                        key={y}
                        className={
                          "filters__year-chip" +
                          (activeYear === y ? " filters__year-chip--active" : "")
                        }
                        onClick={() => handleYearClick(y)}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Диапазон лет */}
              {years.length > 1 && (
                <div className="filters__section">
                  <p className="filters__section-label">диапазон лет</p>
                  <div className="filters__range-row">
                    <span className="filters__range-label">с</span>
                    <select
                      className={
                        "filters__range-select" +
                        (isRangeFilter(activeFilter) ? " filters__range-select--active" : "")
                      }
                      value={localFrom}
                      onChange={(e) => setLocalFrom(e.target.value)}
                    >
                      <option value="">год</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    <span className="filters__range-label">по</span>
                    <select
                      className={
                        "filters__range-select" +
                        (isRangeFilter(activeFilter) ? " filters__range-select--active" : "")
                      }
                      value={localTo}
                      onChange={(e) => setLocalTo(e.target.value)}
                    >
                      <option value="">год</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    <button
                      className={
                        "filters__range-apply" +
                        (!localFrom || !localTo ? " filters__range-apply--disabled" : "")
                      }
                      onClick={handleApplyRange}
                      disabled={!localFrom || !localTo}
                    >
                      применить
                    </button>

                    {isRangeFilter(activeFilter) && (
                      <button
                        className="filters__range-clear"
                        onClick={() => { onFilterChange?.(null); }}
                        title="Снять диапазон"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {isRangeFilter(activeFilter) && (
                    <p className="filters__range-hint">
                      Показаны года {activeFilter.match(/^range-(\d+)-(\d+)$/)?.[1]}
                      {" — "}
                      {activeFilter.match(/^range-(\d+)-(\d+)$/)?.[2]}
                    </p>
                  )}
                </div>
              )}

              {/* Сортировка */}
              <div className="filters__section">
                <p className="filters__section-label">сортировка</p>
                <div className="filters__sort-row">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.key}
                      className={
                        "filters__sort-chip" +
                        (sortOrder === s.key ? " filters__sort-chip--active" : "")
                      }
                      onClick={() => onSortChange?.(s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Только с фотографиями / только с видео */}
              <div className="filters__section">
                <label className="filters__checkbox-label">
                  <input
                    type="checkbox"
                    className="filters__checkbox"
                    checked={onlyWithPhotos}
                    onChange={() => onOnlyWithPhotosChange?.(!onlyWithPhotos)}
                  />
                  <span className="filters__checkbox-custom" />
                  только с фотографиями
                </label>
                <label className="filters__checkbox-label">
                  <input
                    type="checkbox"
                    className="filters__checkbox"
                    checked={onlyWithVideos}
                    onChange={() => onOnlyWithVideosChange?.(!onlyWithVideos)}
                  />
                  <span className="filters__checkbox-custom" />
                  только с видео
                </label>
              </div>

              {/* Сброс всех */}
              {hasActiveFilters && (
                <div className="filters__section filters__section--reset">
                  <button className="filters__reset-btn" onClick={handleResetAll}>
                    сбросить все фильтры
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Результаты поиска ── */}
          <div className="modal__body-controls">
            {hasSearch && (
              <div className="search-results">
                {filteredMemories.length === 0 ? (
                  <p className="search-results__empty">Воспоминания не найдены</p>
                ) : (
                  <>
                    <p className="search-results__count">
                      Найдено: {filteredMemories.length}
                    </p>
                    <div className="search-results__grid">
                      {filteredMemories.slice(0, 8).map((memory) => {
                        const imgPath =
                          memory.images?.[0] ?? memory.preview_image ?? null;
                        return (
                          <div
                            key={memory.id}
                            className="search-card"
                            onClick={() => { onMemoryClick?.(memory); onClose(); }}
                          >
                            <div className="search-card__img-wrap">
                              {imgPath ? (
                                <img
                                  src={`${UPLOADS}${imgPath}`}
                                  alt=""
                                  className="search-card__img"
                                />
                              ) : (
                                <div className="search-card__no-img">
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="1.5" strokeOpacity="0.35"/>
                                    <circle cx="8.5" cy="8.5" r="1.5" fill="white" fillOpacity="0.35"/>
                                    <path d="M3 16l5-5 4 4 3-3 6 6" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="search-card__info">
                              <p className="search-card__title">{memory.title}</p>
                              <p className="search-card__date">{formatDate(memory.event_date)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {filteredMemories.length > 8 && (
                      <p className="search-results__more">
                        и ещё {filteredMemories.length - 8}…
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
