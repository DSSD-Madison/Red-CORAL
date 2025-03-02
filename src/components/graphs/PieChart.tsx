import { useDB } from '@/context/DBContext'
import { Incident } from '@/types'
import * as d3 from 'd3'
import { useRef, useEffect } from 'react'

export default function PieChart({ incidents }: { incidents: [string, Incident][] }) {
  const { db } = useDB()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const d3Ref = useRef<SVGSVGElement | null>(null)

  //gets label and color for each incident
  const parsedData = incidents.map((incident) => {
    return {
      label: db.Categories[db.Types[incident[1].typeID].categoryID].name,
      color: db.Categories[db.Types[incident[1].typeID].categoryID].color,
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

  useEffect(() => {
    function render() {
      if (d3Ref.current) {
        const svg = d3.select(d3Ref.current)
        // Clear previous contents
        svg.selectAll('*').remove()

        // Set dimensions
        const width = 400
        const height = 200

        svg.attr('viewBox', `0 0 ${width} ${height}`)

        const g = svg.append('g')
        g.append('g').attr('class', 'slices')
        g.append('g').attr('class', 'labels')
        g.append('g').attr('class', 'lines')

        g.attr('transform', 'translate(' + width / 4 + ',' + height / 2 + ')')

        const radius = Math.min(width, height) / 2

        const pie = d3
          .pie<Category>()
          .sort(null)
          .value(function (d) {
            return d.value
          })

        //helper function for color
        //reduce() iterates over the Categories array and builds an object "acc" so that
        //acc will be similar to a dictionary in the form: {"drugs": "black", "robbery": "white"}
        const labelColorMap = Object.values(db.Categories).reduce(
          (acc, category) => {
            acc[category.name] = category.color
            return acc
          },
          {} as Record<string, string>
        )

        const color = d3
          .scaleOrdinal()
          .domain(cleanData.map((d) => d.label))
          .range(cleanData.map((d) => labelColorMap[d.label]))

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
          .style('fill', (d) => color(d.data.label) as string)
          .attr('d', arc as any)

        slice.exit().remove()

        /* ------- LEGEND ------- */
        const legend = svg
          .append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${width - 200}, 20)`) // Position legend to the right of the pie chart

        const legendItems = legend
          .selectAll('.legend-item')
          .data(cleanData)
          .enter()
          .append('g')
          .attr('transform', (_, i) => `translate(0, ${i * 20})`) // Position each legend item

        // Add colored rectangles
        legendItems
          .append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', (d) => color(d.label) as string)

        // Add text labels
        legendItems
          .append('text')
          .attr('x', 18) // Position text next to rectangle
          .attr('y', 10) // Vertically align text with rectangle
          .text((d) => `${d.label} (${Math.floor((d.value / totalValue) * 100)}%)`)
          .style('font-size', '12px')
          .attr('fill', '#000')
      }
    }
    addEventListener('resize', render)
    render()
    return () => removeEventListener('resize', render)
  }, [incidents])

  return (
    <div ref={containerRef} className="relative min-w-[270px] flex-1 rounded-lg bg-neutral-100">
      <h2 className="ml-2 mt-2">Categorías de incidentes</h2>
      <svg width="400" className="aspect-[2] w-full" ref={d3Ref}></svg>
    </div>
  )
}
