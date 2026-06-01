import { useState, useRef, useEffect } from "react";

const UPLOADS = "http://timeline-bd/backend/";

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель",
  "Май", "Июнь", "Июль", "Август",
  "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const BLANK_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const isGif = (path) =>
  typeof path === "string" && path.toLowerCase().endsWith(".gif");

// GIF: при paused подменяем src на прозрачный пиксель — анимация останавливается
function TimelineImage({ src, className, paused }) {
  const imgRef = useRef(null);
  const gif = isGif(src);

  useEffect(() => {
    if (!gif) return;
    const img = imgRef.current;
    if (!img) return;
    img.src = paused ? BLANK_GIF : src;
  }, [paused, src, gif]);

  return (
    <img ref={imgRef} src={src} alt="" className={className} />
  );
}

// Видео: IntersectionObserver управляет воспроизведением,
// при нескольких видео переключает их по очереди после окончания каждого
function TimelineVideo({ srcs, className, paused }) {
  const videoRef  = useRef(null);
  const inViewRef = useRef(false);
  const pausedRef = useRef(paused);
  const [idx, setIdx] = useState(0);

  const src   = srcs[idx] ?? srcs[0];
  const loops = srcs.length === 1;

  // Синхронизируем ref и реагируем на смену paused
  useEffect(() => {
    pausedRef.current = paused;
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
    } else if (inViewRef.current) {
      video.play().catch(() => {});
    }
  }, [paused]);

  // При смене индекса перезагружаем видео и запускаем если видно
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    if (inViewRef.current && !pausedRef.current) {
      video.play().catch(() => {});
    }
  }, [idx]);

  // IntersectionObserver: играть только если виден И не paused
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !pausedRef.current) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const handleEnded = () => {
    if (!loops) setIdx(i => (i + 1) % srcs.length);
  };

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop={loops}
      playsInline
      preload="none"
      className={className}
      onEnded={handleEnded}
    />
  );
}

function getItemMemories(item, memories) {
  if (!memories || memories.length === 0) return [];
  return memories.filter((m) => {
    if (!m.event_date) return false;
    const parts = m.event_date.split("-");
    const mYear  = parseInt(parts[0], 10);
    const mMonth = parseInt(parts[1], 10) - 1;
    const mDay   = parseInt(parts[2], 10);
    if (item.type === "year") return mYear === item.value;
    if (item.type === "month") {
      const keyParts = item.key.split("-");
      return mYear === parseInt(keyParts[1], 10) && mMonth === item.value;
    }
    if (item.type === "day") {
      const keyParts = item.key.split("-");
      return (
        mYear  === parseInt(keyParts[1], 10) &&
        mMonth === parseInt(keyParts[2], 10) &&
        mDay   === item.value
      );
    }
    return false;
  });
}

function TimeLine({
  birthYear,
  page,
  step,
  visibleCount,
  selectedYear,
  selectedMonth,
  onYearClick,
  onMonthClick,
  onAddMemory,
  onDayClick,
  selectedDayKey,
  items,
  memories = [],
  onMemoryCardClick,
  paused = false,
}) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const leaveTimerRef = useRef(null);

  const totalItems = items.length;
  let endIndex = totalItems - page * step;
  if (endIndex > totalItems) endIndex = totalItems;
  let startIndex = endIndex - visibleCount;
  if (startIndex < 0) startIndex = 0;

  const visibleItems = items.slice(startIndex, endIndex);

  const handleEnter = (key) => {
    clearTimeout(leaveTimerRef.current);
    setHoveredKey(key);
  };

  const handleLeave = () => {
    leaveTimerRef.current = setTimeout(() => setHoveredKey(null), 180);
  };

  const handleItemClick = (item) => {
    if (item.type === "year") onYearClick(item.value);
    else if (item.type === "month") onMonthClick && onMonthClick(item.value);
    else if (item.type === "day") onDayClick && onDayClick(item);
  };

  const handleAddClick = (e, item) => {
    e.stopPropagation();
    onAddMemory && onAddMemory(item);
  };

  return (
    <div className="timeline">
      <div className="timeline__inner">
        <div className="timeline__component grid--container">
          <div className="timeline__component-interactive">
            <div className="timeline__component-line"></div>
            <div className="timeline__component-memroies">
              <ul className="timeline__component-list">
                {visibleItems.map((item) => (
                  <li
                    key={item.key}
                    className={
                      "timeline__component-item" +
                      (item.type !== "day" || onDayClick ? " timeline__component-item--clickable" : "") +
                      (item.isHoliday  ? " timeline__component-item--holiday"  : "") +
                      (item.isBirthday ? " timeline__component-item--birthday" : "") +
                      (selectedDayKey === item.key ? " timeline__component-item--selected" : "")
                    }
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => handleEnter(item.key)}
                    onMouseLeave={handleLeave}
                  >
                    <p className="timeline__component-text">{item.label}</p>
                    <div className="timeline__item-dot dot--ico">
                      <svg
                        width="45"
                        height="45"
                        viewBox="0 0 45 45"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="svg-hover"
                      >
                        <circle
                          cx="22.5"
                          cy="22.5"
                          r="22.5"
                          transform="matrix(1 0 0 -1 0 45)"
                          fill="#D9D9D9"
                          fillOpacity="0.35"
                        />
                      </svg>

                      {item.type === "day" && onAddMemory && (
                        <button
                          className={
                            "timeline__add-btn" +
                            (hoveredKey === item.key ? " timeline__add-btn--visible" : "")
                          }
                          onClick={(e) => handleAddClick(e, item)}
                          onMouseEnter={() => handleEnter(item.key)}
                          onMouseLeave={handleLeave}
                          title="Добавить воспоминание"
                        >
                          <svg
                            width="26"
                            height="26"
                            viewBox="0 0 26 26"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="13" cy="13" r="13" fill="#D9D9D9" fillOpacity="0.45" />
                            <path
                              d="M13 7V19M7 13H19"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {(() => {
                      const mems = getItemMemories(item, memories);
                      if (mems.length === 0) return null;
                      const first = mems[0];
                      const monthIdx = parseInt(first.event_date?.split("-")[1] ?? "1", 10) - 1;
                      const monthName = MONTH_NAMES[monthIdx] ?? "";
                      const imgPath = first.images?.[0] ?? first.preview_image ?? null;
                      const videos  = !imgPath && first.videos?.length > 0 ? first.videos : null;
                      return (
                        <div
                          className={
                            "timeline__memory-card" +
                            (item.type === "day" ? " timeline__memory-card--day" : "")
                          }
                          onClick={(e) => { e.stopPropagation(); onMemoryCardClick?.(first); }}
                        >
                          {imgPath ? (
                            <div className="timeline__memory-card__img-wrap">
                              <TimelineImage
                                src={`${UPLOADS}${imgPath}`}
                                className="timeline__memory-card__img"
                                paused={paused}
                              />
                            </div>
                          ) : videos ? (
                            <div className="timeline__memory-card__img-wrap timeline__memory-card__img-wrap--video">
                              <TimelineVideo
                                srcs={videos.map(v => `${UPLOADS}${v}`)}
                                className="timeline__memory-card__img"
                                paused={paused}
                              />
                            </div>
                          ) : null}
                          <div className="timeline__memory-card__text">
                            <span className="timeline__memory-card__month">{monthName}</span>
                            <span className="timeline__memory-card__title">{first.title}</span>
                            {mems.length > 1 && (
                              <span className="timeline__memory-card__more">+{mems.length - 1}</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { MONTH_NAMES };
export default TimeLine;
