import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { Incident } from '@/types'
import { calculateBounds } from '@/utils'

export default function LineGraph({ incidents, bounds }: { incidents: [string, Incident][]; bounds: ReturnType<typeof calculateBounds> }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const d3Ref = useRef<SVGSVGElement | null>(null)
  const [groupBy, setGroupBy] = useState<'year' | 'quarter' | 'month' | 'week' | 'day'>('year')

  useEffect(() => {
    function render() {
      if (d3Ref.current) {
        const svg = d3.select(d3Ref.current)

        svg.selectAll('*').remove()

        const width = 400
        const height = 200
        const margin = { top: 5, right: 30, bottom: 30, left: 40 }

        svg.attr('viewBox', `0 0 ${width} ${height}`)

        // Modify the grouping logic based on groupBy
        const groupedData = Array.from(
          d3.group(incidents, (d) => {
            const date = new Date(d[1].dateString)
            switch (groupBy) {
              case 'year':
                return date.getFullYear()
              case 'quarter':
                return `${date.getFullYear()}-T${Math.floor(date.getMonth() / 3) + 1}`
              case 'month':
                return `${date.getFullYear()}-${date.getMonth() + 1}`
              case 'week':
                return d3.timeFormat('%Y-%W')(date)
              case 'day':
                return date.toISOString().split('T')[0]
            }
          }),
          ([key, incidents]) => ({
            key,
            date: parseDateKey(key as string, groupBy),
            count: incidents.length,
          })
        ).sort((a, b) => a.date.getTime() - b.date.getTime())

        //Create scales
        const x = d3
          .scaleTime()
          .domain(d3.extent(groupedData, (d) => d.date) as [Date, Date])
          .range([margin.left, width - margin.right])

        const y = d3
          .scaleLinear()
          .domain([0, d3.max(groupedData, (d) => d.count) || 0])
          .nice()
          .range([height - margin.bottom, margin.top])

        const line = d3
          .line<(typeof groupedData)[0]>()
          .x((d) => x(d.date))
          .y((d) => y(d.count))
          .curve(d3.curveMonotoneX)

        //Create axes
        const xTicks = width / 100
        const yTicks = height / 50

        svg
          .append('g')
          .attr('transform', `translate(0, ${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(xTicks))

        svg.append('g').attr('transform', `translate(${margin.left}, 0)`).call(d3.axisLeft(y).ticks(yTicks))
        svg.append('path').datum(groupedData).attr('fill', 'none').attr('stroke', 'steelblue').attr('stroke-width', 1.5).attr('d', line)

        svg
          .selectAll('.dot')
          .data(groupedData)
          .join('circle')
          .attr('class', 'dot')
          .attr('cx', (d) => x(d.date))
          .attr('cy', (d) => y(d.count))
          .attr('r', 4)
          .attr('fill', 'steelblue')
      }
    }

    addEventListener('resize', render)
    render()
    return () => removeEventListener('resize', render)
  }, [incidents, bounds, groupBy])

  return (
    <div ref={containerRef} className="relative min-w-[250px] flex-1 rounded-lg bg-neutral-100">
      <div className="flex items-center justify-between p-2">
        <h2>Incidentes a lo largo del tiempo</h2>
        <select value={groupBy} className="rounded-full border border-black bg-transparent px-2" onChange={(e) => setGroupBy(e.target.value as any)}>
          <option value="year">Año</option>
          <option value="quarter">Trimestre</option>
          <option value="month">Mes</option>
          <option value="week">Semana</option>
          <option value="day">Día</option>
        </select>
      </div>
      <svg width="400" className="aspect-[2] w-full" ref={d3Ref}></svg>
    </div>
  )
}

// Add helper function to parse date keys
function parseDateKey(key: string, groupBy: string): Date {
  switch (groupBy) {
    case 'year':
      return new Date(Number(key), 0, 1)
    case 'quarter':
      const [yearQ, q] = key.split('-T')
      return new Date(Number(yearQ), (Number(q) - 1) * 3, 1)
    case 'month':
      const [yearM, month] = key.split('-')
      return new Date(Number(yearM), Number(month) - 1, 1)
    case 'week':
      return d3.timeParse('%Y-%W')(key) || new Date()
    case 'day':
      return new Date(key)
    default:
      return new Date()
  }
}
