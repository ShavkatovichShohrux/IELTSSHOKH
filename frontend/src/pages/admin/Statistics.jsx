import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Download, ChevronUp, ChevronDown } from 'lucide-react'
import { api } from '../../api/client'

const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2']

const bandColor = b => {
  if (b >= 8) return 'text-green-600 dark:text-green-400'
  if (b >= 7) return 'text-green-500'
  if (b >= 6) return 'text-yellow-500'
  if (b >= 5) return 'text-orange-500'
  return 'text-red-500'
}

function SortHeader({ label, col, sort, onSort }) {
  const active = sort.col === col
  return (
    <th className="text-right px-4 py-3 font-semibold cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      onClick={() => onSort(col)}>
      <span className="flex items-center justify-end gap-1">
        {label}
        <span className="inline-flex flex-col">
          <ChevronUp size={10} className={active && sort.dir === 'asc' ? 'text-brand' : 'text-gray-300 dark:text-gray-600'} />
          <ChevronDown size={10} className={active && sort.dir === 'desc' ? 'text-brand' : 'text-gray-300 dark:text-gray-600'} />
        </span>
      </span>
    </th>
  )
}

function exportCSV(data) {
  const headers = ['Test', 'Tur', 'Urinishlar', "O'rt. Ball", "O'rt. Band"]
  const rows = data.map(t => [
    `"${t.test_title.replace(/"/g, '""')}"`,
    t.test_type,
    t.attempts,
    t.avg_score,
    t.avg_band_score.toFixed(2),
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'statistika.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function Statistics() {
  const [sort, setSort] = useState({ col: 'attempts', dir: 'desc' })

  const { data: stats } = useQuery({
    queryKey: ['globalStats'],
    queryFn: async () => (await api.globalStats()).data,
  })
  const { data: testStats = [] } = useQuery({
    queryKey: ['testStats'],
    queryFn: async () => (await api.testStats()).data,
  })

  const onSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }))

  const sorted = [...testStats].sort((a, b) => {
    const va = a[sort.col] ?? 0, vb = b[sort.col] ?? 0
    return sort.dir === 'desc' ? vb - va : va - vb
  })

  const pieData = stats ? [
    { name: 'Listening', value: stats.listening_tests },
    { name: 'Reading', value: stats.reading_tests },
  ] : []

  const barData = testStats.slice(0, 10).map(t => ({
    name: t.test_title.length > 16 ? t.test_title.substring(0, 16) + '…' : t.test_title,
    Urinishlar: t.attempts,
  }))

  // Band score distribution from testStats avg (approximate)
  const bandBuckets = { '4-': 0, '5.0': 0, '5.5': 0, '6.0': 0, '6.5': 0, '7.0': 0, '7.5': 0, '8.0+': 0 }
  testStats.forEach(t => {
    const b = t.avg_band_score
    if (b < 5)       bandBuckets['4-']++
    else if (b < 5.5) bandBuckets['5.0']++
    else if (b < 6)   bandBuckets['5.5']++
    else if (b < 6.5) bandBuckets['6.0']++
    else if (b < 7)   bandBuckets['6.5']++
    else if (b < 7.5) bandBuckets['7.0']++
    else if (b < 8)   bandBuckets['7.5']++
    else              bandBuckets['8.0+']++
  })
  const bandData = Object.entries(bandBuckets).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Statistika</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">To'liq tahlil</p>
        </div>
        {testStats.length > 0 && (
          <button onClick={() => exportCSV(testStats)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
            <Download size={15} />CSV yuklash
          </button>
        )}
      </div>

      {/* Top row: Pie + Summary */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Test turlari taqsimoti</h2>
          {pieData.every(d => d.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Ma'lumot yo'q</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#f9fafb', fontSize: 13 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Asosiy ko'rsatkichlar</h2>
          {[
            { label: 'Jami foydalanuvchilar', value: stats?.total_users ?? '—', color: 'text-blue-500' },
            { label: 'Jami testlar', value: stats?.total_tests ?? '—', color: 'text-green-500' },
            { label: 'Jami urinishlar', value: stats?.total_results ?? '—', color: 'text-purple-500' },
            { label: "O'rtacha Band Score", value: stats?.avg_band_score ? `${stats.avg_band_score.toFixed(2)} / 9.0` : '—', color: 'text-brand' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">{row.label}</span>
              <span className={`font-black text-lg ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      {barData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Attempts bar */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Top 10 — urinishlar soni</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
                <Bar dataKey="Urinishlar" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Band distribution */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Band score taqsimoti (testlar bo'yicha)</h2>
            {bandData.every(d => d.value === 0) ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Ma'lumot yo'q</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bandData} margin={{ top: 5, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} />
                  <Bar dataKey="value" name="Testlar" radius={[4, 4, 0, 0]}>
                    {bandData.map((d, i) => {
                      const fills = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#10b981','#0ea5e9','#6366f1']
                      return <Cell key={i} fill={fills[i] || '#dc2626'} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Sortable table */}
      {testStats.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Testlar tahlili</h2>
            <p className="text-xs text-gray-400">Ustun sarlavhasiga bosib saralang</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Test</th>
                  <th className="text-left px-4 py-3 font-semibold">Tur</th>
                  <SortHeader label="Urinishlar" col="attempts"       sort={sort} onSort={onSort} />
                  <SortHeader label="O'rt. Ball"  col="avg_score"      sort={sort} onSort={onSort} />
                  <SortHeader label="O'rt. Band"  col="avg_band_score" sort={sort} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sorted.map(t => (
                  <tr key={t.test_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs">{t.test_title}</td>
                    <td className="px-4 py-3">
                      <span className={t.test_type === 'listening' ? 'badge-listening' : 'badge-reading'}>{t.test_type}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{t.attempts}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">{t.avg_score ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold text-sm ${bandColor(t.avg_band_score)}`}>
                        {t.avg_band_score?.toFixed(1) ?? '—'}
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
  )
}
