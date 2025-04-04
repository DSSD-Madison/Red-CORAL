import React, { useEffect, useRef, useState } from 'react'
import { MarkerFilters } from 'types'
import * as d3 from 'd3'
import { useDB } from '@/context/DBContext'
import { LucideCalendar, LucidePlay, LucideRotateCcw, LucideSquare } from 'lucide-react'

interface YearControlProps {
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
  setDisplayType: React.Dispatch<React.SetStateAction<'single' | 'group' | 'groupPie'>>
}

const YearControl: React.FC<YearControlProps> = ({ filters, setFilters, setDisplayType }) => {
  const { db } = useDB()
  const [isDropdownVisible, setDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const d3Ref = useRef<SVGSVGElement | null>(null)
  const { minYear, maxYear } = db.filterBounds
  const { startDate: date1, endDate: date2 } = filters

  const [isPlaying, setIsPlaying] = useState(false)
  const animationRef = useRef<number | null>(null)

  const updateSlider = (value: number) => {
    setDisplayType('single')
    const year = Math.floor(value / 12) + minYear
    const month = value % 12
    const startDate = new Date(year, month, 1)
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 3)) // 3 months later
    setFilters((filters) => ({ ...filters, startDate, endDate }))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    function render() {
      if (d3Ref.current) {
        const svg = d3.select(d3Ref.current)

        svg.selectAll('*').remove()

        const width = 600
        const height = 100
        const margin = { top: 5, right: 30, bottom: 30, left: 40 }

        svg.attr('viewBox', `0 0 ${width} ${height}`)

        const incidents = Object.entries(db.Incidents)
        const groupedData = Array.from(
          d3.group(incidents, (d) => {
            const date = new Date(d[1].dateString)
            return `${date.getFullYear()}-${date.getMonth() + 1}`
          }),
          ([key, incidents]) => {
            const [yearM, month] = key.split('-')
            const date = new Date(Number(yearM), Number(month) - 1, 1)
            return {
              key,
              date,
              count: incidents.length,
            }
          }
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

        const yTicks = height / 50

        svg
          .append('g')
          .attr('transform', `translate(0, ${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(d3.timeYear))

        svg.append('g').attr('transform', `translate(${margin.left}, 0)`).call(d3.axisLeft(y).ticks(yTicks))

        svg
          .selectAll('.bar')
          .data(groupedData)
          .join('rect')
          .attr('class', 'bar')
          .attr('x', (d) => x(d.date))
          .attr('y', (d) => y(d.count))
          .attr('width', (d) => x(d3.timeMonth.offset(d.date, 1)) - x(d.date) - 1)
          .attr('height', (d) => height - margin.bottom - y(d.count))
          .attr('fill', '#3b82f6')
          .attr('opacity', 0.75)
      }
    }
    render()
  })

  const handleResetRange = () => {
    setFilters((filters) => ({
      ...filters,
      startDate: null,
      endDate: null,
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSlider(parseInt(e.target.value))
  }

  const handlePlay = () => {
    if (isPlaying) {
      clearInterval(animationRef.current!)
      animationRef.current = null
      setIsPlaying(false)
    } else {
      updateSlider(0)
      setIsPlaying(true)
      let currentValue = 0
      animationRef.current = window.setInterval(() => {
        currentValue++
        if (currentValue > sliderMax) {
          clearInterval(animationRef.current!)
          animationRef.current = null
          setIsPlaying(false)
        } else {
          updateSlider(currentValue)
        }
      }, 150)
    }
  }

  const handleYearChange = (i: number) => {
    setDisplayType('single')
    const startDate = new Date(i, 0, 1)
    const endDate = new Date(i, 11, 31)
    if (date1 && !date2) {
      if (date1 > endDate) {
        setFilters((filters) => ({
          ...filters,
          endDate: new Date(date1.getUTCFullYear(), 11, 31),
          startDate,
        }))
      } else {
        setFilters((filters) => ({
          ...filters,
          endDate,
        }))
      }
    } else if (date1 && date2) {
      if (date1.getUTCFullYear() === i && date2.getUTCFullYear() === i) {
        setFilters((filters) => ({
          ...filters,
          startDate: null,
          endDate: null,
        }))
      } else {
        setFilters((filters) => ({
          ...filters,
          endDate: null,
          startDate,
        }))
      }
    } else if (!date1 && !date2) setFilters((filters) => ({ ...filters, startDate }))
  }

  const yearButtons = []
  for (let i = minYear; i <= maxYear; i++) {
    const date1Year = date1?.getUTCFullYear() || 0
    const date2Year = date2?.getUTCFullYear() || 0
    const additionalStyles =
      i == date1Year && i == date2Year
        ? 'rounded-md bg-blue-500 px-3 text-white'
        : i == date1Year && date2Year === 0
          ? 'rounded-l-md bg-gray-500 px-3 text-white animate-pulse'
          : i == date1Year
            ? 'rounded-l-md bg-blue-500 px-3 text-white'
            : i == date2Year
              ? 'rounded-r-md bg-blue-500 px-3 text-white'
              : date1Year < i && i < date2Year
                ? 'bg-blue-300 px-3'
                : 'mx-1 rounded-md bg-white hover:bg-gray-200 outline-1 outline outline-gray-300'
    yearButtons.push(
      <button
        key={i}
        onClick={() => {
          handleYearChange(i)
        }}
        className={`p-1 px-2 text-sm ${additionalStyles}`}
      >
        {i}
      </button>
    )
  }
  const sliderMax = (maxYear - minYear + 1) * 12 - 1
  const sliderDisplayValue = date1 ? (date1.getUTCFullYear() - minYear) * 12 + date1.getUTCMonth() : 0
  const endDisplayValue = date2 ? (date2.getUTCFullYear() - minYear) * 12 + date2.getUTCMonth() + (date2.getDate() > 15 ? 1 : 0) : sliderMax
  const sliderOffset = (sliderDisplayValue / sliderMax) * (600 - 70)
  const sliderWidth = ((endDisplayValue - sliderDisplayValue) / sliderMax) * (600 - 70)
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
          className="leaflet-bar absolute -bottom-0.5 left-10 box-content w-max rounded bg-tint-02/80 shadow-lg backdrop-blur-sm"
        >
          <label className="block pl-4 pt-4 text-xl font-semibold" htmlFor="year">
            Fecha
          </label>
          <div className="flex flex-row flex-wrap p-2">{yearButtons}</div>
          <div className="flex items-center gap-4 p-2">
            <div className="relative h-[100px] w-[600px]">
              <svg width="600" height="100" className="absolute left-0 top-0 h-full w-full object-cover" ref={d3Ref}></svg>
              <input
                type="range"
                min={0}
                max={sliderMax}
                step={1}
                className="absolute left-[40px] right-[30px] top-0 h-full cursor-pointer opacity-0"
                value={sliderDisplayValue}
                onChange={handleInputChange}
              />
              <div
                style={{ transform: `translateX(${sliderOffset}px)` }}
                className="pointer-events-none absolute bottom-[30px] left-[40px] top-0 border border-black"
              />
              <div
                style={{ transform: `translateX(${sliderOffset + sliderWidth / 2}px) scaleX(${sliderWidth})` }}
                className="pointer-events-none absolute bottom-[30px] left-[40px] top-0 w-[1px] bg-black/20"
              />
            </div>
            <button
              className="mb-1 rounded border-2 border-tint-01 bg-white px-2 py-1 text-lg hover:bg-tint-02 active:bg-tint-01"
              onClick={handleResetRange}
            >
              <LucideRotateCcw className="h-5 w-5" strokeWidth={1} />
            </button>
            <button
              className="mb-1 ml-2 rounded border-2 border-tint-01 bg-white px-2 py-1 text-lg hover:bg-tint-02 active:bg-tint-01"
              onClick={handlePlay}
            >
              {isPlaying ? <LucideSquare /> : <LucidePlay />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default YearControl
