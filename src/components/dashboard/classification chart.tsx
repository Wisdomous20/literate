"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts"

const data = [
  { name: "Independent", value: 45, color: "#6666FF" },
  { name: "Instructional", value: 30, color: "#54A4FF" },
  { name: "Frustration", value: 25, color: "#00306E" },
]

const assessmentTypes = [
  "Oral Reading Test",
  "Reading Fluency Test",
  "Reading Comprehension Test",
]

export function ClassificationChart() {
  const [selectedType, setSelectedType] = useState(assessmentTypes[0])

  return (
    <div className="rounded-2xl bg-card p-6 shadow-lg">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Classification Distribution
          </h3>
          <p className="text-sm text-muted-foreground">SY 2026-2027</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">Assessment Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {assessmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={60}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4F4FF" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#00306E", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#00306E", fontSize: 12 }}
              domain={[0, 60]}
              ticks={[0, 15, 30, 45, 60]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex justify-center gap-6">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
