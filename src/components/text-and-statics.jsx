import { useState, useEffect } from 'react'
import axios from 'axios'

const API = '/api'

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель",
  "Май", "Июнь", "Июль", "Август",
  "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
]

function pluralMemories(n) {
  if (n % 100 >= 11 && n % 100 <= 19) return `${n} воспоминаний`
  const r = n % 10
  if (r === 1) return `${n} воспоминание`
  if (r >= 2 && r <= 4) return `${n} воспоминания`
  return `${n} воспоминаний`
}

function TextAndStatics({ selectedYear, selectedMonth }) {
  const [periodCount, setPeriodCount] = useState(null)

  useEffect(() => {
    const params = selectedYear ? { year: selectedYear } : {}

    axios
      .get(`${API}/memories.php`, { params })
      .then(({ data }) => {
        setPeriodCount((data.memories ?? []).length)
      })
      .catch(() => {})
  }, [selectedYear])

  let label
  if (!selectedYear) {
    label = "Сейчас не выбран год"
  } else if (selectedMonth !== null && selectedMonth !== undefined) {
    label = "Сейчас выбран: " + selectedYear + " год месяц " + MONTH_NAMES[selectedMonth]
  } else {
    label = "Сейчас выбран: " + selectedYear + " год"
  }

  return (
    <div className="statistic">
      <div className="statistic__inner">
        <p className="statistic__text">{label}</p>
        <p className="statistic__text">
          Всего воспоминаний за этот период: {periodCount !== null ? pluralMemories(periodCount) : 0}
        </p>
      </div>
    </div>
  )
}

export default TextAndStatics
