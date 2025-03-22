import React, { useEffect, useRef, useState } from 'react'
import { MarkerFilters } from 'types'
import RangeSlider from 'react-range-slider-input'
import 'react-range-slider-input/dist/style.css'
import { useDB } from '@/context/DBContext'
import { LucideCalendar, LucideRotateCcw } from 'lucide-react'
import * as d3 from 'd3'

interface YearControlProps {
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
}

const YearControl: React.FC<YearControlProps> = ({ filters, setFilters }) => {
  const { db } = useDB()
  const [isDropdownVisible, setDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { minYear, maxYear } = db.filterBounds

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownVisible(false)
    }
  }

  useEffect(() => {
    document.addEventListener('pointerdown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [])

  const handleResetRange = () => {
    setFilters((filters) => ({
      ...filters,
      startYear: null,
      endYear: null,
    }))
  }

  const handleRangeUpdate = (lower: number, upper: number) => {
    setFilters((filters) => ({
      ...filters,
      startYear: lower,
      endYear: upper,
    }))
  }

  const renderLineGraph = () => {
    const svg = d3.select('#lineGraph')
    svg.selectAll('*').remove()

    const width = 800
    const height = 100
    const margin = { top: 5, right: 0, bottom: 5, left: 40 }

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    const incidents = Object.entries(db.Incidents)
    const groupedData = Array.from(
      d3.group(incidents, (d) => {
        const date = new Date(d[1].dateString)
        return `${date.getFullYear()}-T${Math.floor(date.getMonth() / 3) + 1}`
      }),
      ([key, incidents]) => ({
        key,
        date: parseDateKey(key, 'quarter'),
        count: incidents.length,
      })
    ).sort((a, b) => a.date.getTime() - b.date.getTime())

    const x = d3
      .scaleTime()
      .domain(d3.extent(groupedData, (d) => d.date) as [Date, Date])
      .range([margin.left, width - margin.right])

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(groupedData, (d) => d.count) || 0])
      .nice()
      .range([height - margin.bottom, margin.top])
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(groupedData, (d) => d.count) || 0])
      .range([height - margin.bottom, margin.top])
    const yTicks = height / 50
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(yTicks)
      .tickSize(-width + margin.left + margin.right)
      .tickPadding(5)
    svg.append('g').attr('transform', `translate(${margin.left}, 0)`).call(yAxis)
    const line = d3
      .line<(typeof groupedData)[0]>()
      .x((d) => x(d.date))
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX)
    svg.append('path').datum(groupedData).attr('fill', 'none').attr('stroke', 'steelblue').attr('stroke-width', 1.5).attr('d', line)
  }

  useEffect(() => {
    if (isDropdownVisible) {
      renderLineGraph()
    }
  }, [isDropdownVisible, db.Incidents])

  return (
    <div className="leaflet-bar relative w-fit rounded">
      <a
        className="leaflet-control-zoom-in rounded"
        title={'Filtrar por año'}
        role="button"
        onClick={(e) => {
          setDropdownVisible(!isDropdownVisible)
          e.preventDefault()
        }}
      >
        <LucideCalendar className="h-5 w-5" strokeWidth={1} />
      </a>
      {isDropdownVisible && (
        <div
          ref={dropdownRef}
          className="leaflet-bar absolute -bottom-0.5 left-10 box-content w-[70vw] rounded bg-tint-02/80 shadow-lg backdrop-blur-sm"
        >
          <label className="block pl-4 pt-4 text-xl font-semibold" htmlFor="year">
            Año
          </label>
          <div className="flex items-end gap-4 p-2">
            <span className="mb-1 text-xl italic">{filters.startYear || minYear}</span>
            <div className="flex flex-shrink flex-col items-center justify-end gap-2">
              <svg id="lineGraph" height="100" width="800" className="mx-auto"></svg>
              <RangeSlider
                min={minYear}
                max={maxYear}
                value={[filters.startYear || minYear, filters.endYear || maxYear]}
                onInput={(e) => handleRangeUpdate(e[0], e[1])}
                className="my-4 w-[760px] self-end"
              />
            </div>
            <span className="mb-1 text-xl italic">{filters.endYear || maxYear}</span>
            <button
              className="rounded border-2 border-tint-01 bg-white px-2 py-1 text-lg hover:bg-tint-02 active:bg-tint-01"
              onClick={handleResetRange}
            >
              <LucideRotateCcw className="h-5 w-5" strokeWidth={1} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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

export default YearControl
