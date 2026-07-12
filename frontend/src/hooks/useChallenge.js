import { useState, useMemo, useCallback } from 'react'

const KEY = 'ieltsshokh_30day_v1'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null } catch { return null }
}

export function buildSchedule(topics) {
  const sched = []
  let ti = 0
  for (let day = 1; day <= 30; day++) {
    if (day % 5 === 0) {
      const last4 = sched.filter(s => !s.isReview).slice(-4)
      const pick = last4[Math.floor(Math.random() * last4.length)] || sched[sched.length - 1]
      sched.push({ topicId: pick.topicId, topicName: pick.topicName, topicNameUz: pick.topicNameUz, isReview: true })
    } else {
      const t = topics[ti % topics.length]
      sched.push({ topicId: t.id, topicName: t.name, topicNameUz: t.name_uz || '', isReview: false })
      ti++
    }
  }
  return sched
}

export function useChallenge() {
  const [data, setData] = useState(load)

  const persist = useCallback((d) => {
    if (d) localStorage.setItem(KEY, JSON.stringify(d))
    else localStorage.removeItem(KEY)
    setData(d)
  }, [])

  const currentDay = useMemo(() => {
    if (!data?.startDate) return null
    const diff = Math.floor((Date.now() - new Date(data.startDate)) / 86400000) + 1
    return Math.max(1, Math.min(diff, 30))
  }, [data?.startDate])

  const checkedDays = data?.checkedDays ?? []
  const todayChecked = currentDay ? checkedDays.includes(currentDay) : false

  const streak = useMemo(() => {
    if (!checkedDays.length || !currentDay) return 0
    let s = 0
    for (let d = currentDay; d >= 1; d--) {
      if (checkedDays.includes(d)) s++
      else break
    }
    return s
  }, [checkedDays, currentDay])

  return {
    isStarted: !!data,
    schedule: data?.schedule ?? [],
    checkedDays,
    currentDay,
    todayChecked,
    streak,
    totalCompleted: checkedDays.length,
    isFinished: currentDay === 30 && checkedDays.includes(30),
    start: (schedule) => persist({ startDate: new Date().toISOString().slice(0, 10), checkedDays: [], schedule }),
    checkIn: () => {
      if (!data || !currentDay || todayChecked) return
      persist({ ...data, checkedDays: [...checkedDays, currentDay] })
    },
    reset: () => persist(null),
  }
}
