import * as d3 from 'd3'
import { useRef, useEffect } from 'react'
import { Incident } from '@/types'
import { calculateBounds } from '@/utils'

export default function DummyGraph({ incidents, bounds }: { incidents: [string, Incident][]; bounds: ReturnType<typeof calculateBounds> }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const d3Ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    function render() {
      if (d3Ref.current) {
        const svg = d3.select(d3Ref.current)
        // Clear previous contents
        svg.selectAll('*').remove()

        // Set dimensions
        const width = containerRef.current?.clientWidth || 300
        const height = containerRef.current?.clientHeight || 300
        const margin = { top: 20, right: 30, bottom: 30, left: 40 }

        svg.attr('width', width).attr('height', height)

        // Create scales
        const x = d3
          .scaleTime()
          .domain([new Date(bounds.minYear, 0, 1), new Date(bounds.maxYear + 1, 0, 1)])
          .range([margin.left, width - margin.right])
        const y = d3
          .scaleLinear()
          .domain([0, 7])
          .nice()
          .range([height - margin.bottom, margin.top])

        // Create axes
        const xTicks = width / 50
        const yTicks = height / 50
        svg
          .append('g')
          .attr('transform', `translate(0, ${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(xTicks))
        svg.append('g').attr('transform', `translate(${margin.left}, 0)`).call(d3.axisLeft(y).ticks(yTicks))

        // Create points
        svg
          .selectAll('.point')
          .data(incidents)
          .enter()
          .append('circle')
          .attr('class', 'point')
          .attr('cx', (d) => x(new Date(d[1].dateString)))
          .attr('cy', y(5))
          .attr('r', 5)
          .attr('fill', 'steelblue')
      }
    }
    addEventListener('resize', render)
    render()
    return () => removeEventListener('resize', render)
  }, [incidents])

  return (
    <div ref={containerRef} className="h-64 w-full rounded-lg bg-neutral-100">
      <svg ref={d3Ref}></svg>
    </div>
  )
}
