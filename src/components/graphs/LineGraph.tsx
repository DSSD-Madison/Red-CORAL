import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { Incident } from '@/types'
import { calculateBounds } from '@/utils'

export default function LineGraph({ incidents, bounds }: { incidents: [string, Incident][]; bounds: ReturnType<typeof calculateBounds> }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const d3Ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    function render() {
      if (d3Ref.current) {
        const svg = d3.select(d3Ref.current)

        svg.selectAll('*').remove()

        const width = 400
        const height = 200
        const margin = { top: 20, right: 30, bottom: 30, left: 40 }

        svg.attr('preserveAspectRatio', 'xMinYMin meet').attr('viewBox', `0 0 ${width} ${height}`)

        const groupedData = Array.from(
          d3.group(incidents, (d) => new Date(d[1].dateString).getFullYear()),
          ([year, incidents]) => ({
            year: new Date(year, 0, 1),
            count: incidents.length,
          })
        ).sort((a, b) => a.year.getTime() - b.year.getTime())

        //Create scales
        const x = d3
          .scaleTime()
          .domain([new Date(bounds.minYear, 0, 1), new Date(bounds.maxYear + 1, 0, 1)])
          .range([margin.left, width - margin.right])

        const y = d3
          .scaleLinear()
          .domain([0, d3.max(groupedData, (d) => d.count) || 0])
          .nice()
          .range([height - margin.bottom, margin.top])

        const line = d3
          .line<(typeof groupedData)[0]>()
          .x((d) => x(d.year))
          .y((d) => y(d.count))
          .curve(d3.curveMonotoneX)

        svg
          .append('text')
          .attr('x', width / 2)
          .attr('y', margin.top / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging')
          .style('font-size', '16px')
          .text('Incidents Over Time')

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
          .attr('cx', (d) => x(d.year))
          .attr('cy', (d) => y(d.count))
          .attr('r', 4)
          .attr('fill', 'steelblue')
      }
    }

    addEventListener('resize', render)
    render()
    return () => removeEventListener('resize', render)
  }, [incidents, bounds])

  return (
    <div ref={containerRef} className="relative aspect-[2/1] min-w-[300px] flex-grow overflow-hidden rounded-lg bg-neutral-100">
      <svg className="absolute inset-0" ref={d3Ref}></svg>
    </div>
  )
}
