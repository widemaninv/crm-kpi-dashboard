'use client'

import { useEffect, useState, useCallback } from 'react'
import { ALL_STAGES } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DashboardData {
  hotZoneStages: Record<string, number>
  propertyStages: Record<string, number>
  avgDaysPerStage: Record<string, number>
  expectedCapital: number
  activeDealValue: number
  totalLotsSold: number
  totalLotProceeds: number
  totals: { hotZones: number; properties: number }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/dashboard?period=${period}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [period])

  useEffect(() => { load() }, [load])

  const funnelData = ALL_STAGES.map(s => {
    const count = s.entity === 'hot_zone'
      ? (data?.hotZoneStages[s.key] ?? 0)
      : (data?.propertyStages[s.key] ?? 0)
    return { name: `${s.stageNum}. ${s.label}`, count, stage: s.key }
  })

  const maxCount = Math.max(...funnelData.map(d => d.count), 1)

  const getColor = (idx: number, count: number, prevCount: number) => {
    if (idx === 0 || prevCount === 0) return '#6366f1'
    const rate = count / prevCount
    if (rate >= 0.5) return '#22c55e'
    if (rate >= 0.2) return '#eab308'
    return '#ef4444'
  }

  const fmt = (n: number) => n >= 1000000
    ? `$${(n / 1000000).toFixed(1)}M`
    : n >= 1000
    ? `$${(n / 1000).toFixed(0)}K`
    : `$${n.toFixed(0)}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">KPI Funnel Dashboard</h1>
        <div className="flex gap-2">
          {(['all', 'monthly', 'weekly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${period === p ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Hot Zones" value={data?.totals.hotZones ?? 0} />
        <StatCard label="Total Properties" value={data?.totals.properties ?? 0} />
        <StatCard label="Expected Capital" value={fmt(data?.expectedCapital ?? 0)} />
        <StatCard label="Active Deal Value" value={fmt(data?.activeDealValue ?? 0)} />
        <StatCard label="Lots Sold" value={data?.totalLotsSold ?? 0} />
        <StatCard label="Lot Proceeds" value={fmt(data?.totalLotProceeds ?? 0)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">20-Stage Acquisition Funnel</h2>
          <div className="space-y-1.5">
            {funnelData.map((d, i) => {
              const prevCount = i > 0 ? funnelData[i - 1].count : d.count
              const rate = i > 0 && prevCount > 0 ? (d.count / prevCount * 100).toFixed(0) : null
              const barWidth = maxCount > 0 ? Math.max((d.count / maxCount) * 100, 2) : 2
              const color = getColor(i, d.count, prevCount)
              const avgDays = data?.avgDaysPerStage[d.stage]
              return (
                <div key={d.stage} className="flex items-center gap-3 text-sm">
                  <div className="w-52 text-right text-gray-500 text-xs truncate">{d.name}</div>
                  <div className="flex-1 relative h-6 bg-gray-100 rounded">
                    <div
                      className="h-full rounded transition-all"
                      style={{ width: `${barWidth}%`, backgroundColor: color }}
                    />
                    <span className="absolute inset-0 flex items-center pl-2 text-xs font-medium text-gray-700">
                      {d.count}
                    </span>
                  </div>
                  {rate !== null && (
                    <div className={`w-12 text-xs font-medium ${+rate >= 50 ? 'text-green-600' : +rate >= 20 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {rate}%
                    </div>
                  )}
                  {avgDays !== undefined && (
                    <div className="w-16 text-xs text-gray-400">{avgDays}d avg</div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"/> ≥50% retention</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block"/> 20–50%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"/> &lt;20%</span>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  )
}
