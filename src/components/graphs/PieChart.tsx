import { useDB } from '@/context/DBContext'
import { Incident } from '@/types'
import { typeIDtoCategory } from '@/utils'
import * as d3 from 'd3'
import { useRef, useEffect } from 'react'

export default function PieChart({ incidents }: { incidents: [string, Incident][] }) {
  const { db } = useDB()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const d3Ref = useRef<SVGSVGElement | null>(null)

  //gets label and color for each incident
  const parsedData = incidents.map((incident) => {
    const category = typeIDtoCategory(db, incident[1].typeID)
    return {
      label: category.name,
      color: category.color,
    }
  })
  let categories = Object.values(db.Categories).map((c) => c.name) //we want in this format: ["drugs", "robbery"]

  type Category = { label: string; value: number }
  let cleanData: Category[] = [] //should end up having this format for the pie chart: [{label: "drugs", value: 10} , {}]

  let totalValue = 0
  //creates cleanData
  categories.forEach((category) => {
    let categoryEntries = parsedData.filter((c) => c.label == category)
    let value = 0

    // for each category count how many incidents were in the category (Creating the value number)
    categoryEntries.forEach(() => {
      value++
      totalValue++
    })

    cleanData.push({ label: category, value: value })
  })
  cleanData = cleanData.filter((d) => d.value > 0).sort((a, b) => d3.descending(a.value, b.value))

  const labelColorMap = Object.values(db.Categories).reduce(
    (acc, category) => {
      acc[category.name] = category.color
      return acc
    },
    {} as Record<string, string>
  )

  const d3ColorScale = d3
    .scaleOrdinal<string>()
    .domain(cleanData.map((d) => d.label))
    .range(cleanData.map((d) => labelColorMap[d.label] || '#CCCCCC'))

  useEffect(() => {
    function render() {
      if (d3Ref.current) {
        const svg = d3.select(d3Ref.current)
        // Clear previous contents
        svg.selectAll('*').remove()

        // Set dimensions
        const width = 200
        const height = 200

        const g = svg.append('g')
        g.append('g').attr('class', 'slices')

        // Center the pie chart in the new SVG dimensions
        g.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

        const radius = Math.min(width, height) / 2

        const pie = d3
          .pie<Category>()
          .sort(null)
          .value(function (d) {
            return d.value
          })

        const arc = d3
          .arc()
          .outerRadius(radius * 0.8)
          .innerRadius(radius * 0.4)

        /* ------- PIE SLICES -------*/

        const pieData = pie(cleanData)

        // Draw slices
        const slice = g.select('.slices').selectAll('path.slice').data(pieData)

        slice
          .enter()
          .append('path')
          .attr('class', 'slice')
          .style('fill', (d) => d3ColorScale(d.data.label) as string)
          .attr('d', arc as any)

        slice.exit().remove()
      }
    }
    render()
  }, [incidents, cleanData, d3ColorScale, db]) // Added cleanData, d3ColorScale, db to dependencies

  return (
    <div ref={containerRef} className="relative flex max-h-72 min-w-[270px] flex-1 flex-col rounded-lg bg-neutral-100">
      <h2 className="ml-2 mt-2">Categorías de incidentes</h2>
      <div className="mt-2 flex h-full">
        <svg width="200" height="200" className="flex-shrink" ref={d3Ref}></svg>
        {cleanData.length > 0 && totalValue > 0 && (
          <div className="h-full min-w-max flex-grow overflow-y-auto px-2">
            <ul className="text-xs">
              {cleanData.map((d) => (
                <li key={d.label} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center">
                    <span
                      style={{
                        backgroundColor: labelColorMap[d.label] || '#CCCCCC',
                        width: '10px',
                        height: '10px',
                        display: 'inline-block',
                        marginRight: '6px',
                        borderRadius: '2px',
                        flexShrink: 0,
                      }}
                    ></span>
                    <span className="truncate" title={d.label}>
                      {d.label}
                    </span>
                  </div>
                  <span className="ml-2 flex-shrink-0">{`${Math.floor((d.value / totalValue) * 100)}%`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
