'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

type DataPoint = {
  label: string  // formatted date for X axis
  score: number
}

interface Props {
  data: DataPoint[]
}

export default function ScoreTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#5B7FA6' }}
          tickLine={false}
          axisLine={{ stroke: '#e8edf2' }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#5B7FA6' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip
          formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Score']}
          contentStyle={{
            borderRadius: '10px',
            border: '1px solid #e8edf2',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '13px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          labelStyle={{ color: '#252850', fontWeight: 600 }}
          itemStyle={{ color: '#2D8FBF' }}
        />
        <ReferenceLine
          y={80}
          stroke="#2DA870"
          strokeDasharray="5 4"
          label={{
            value: 'Target',
            position: 'insideTopRight',
            fontSize: 11,
            fill: '#2DA870',
            fontWeight: 600,
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#2D8FBF"
          strokeWidth={2.5}
          dot={{ fill: '#2D8FBF', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#2D8FBF', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
