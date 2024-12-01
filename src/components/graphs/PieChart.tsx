import * as d3 from 'd3'
import { useRef, useEffect } from 'react'

export default function PieChart({incidents, data}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const d3Ref = useRef<SVGSVGElement | null>(null)

  //gets label and color for each incident
  const parsedData = incidents.map((incident) => {
    return {
      "label": data.Categories[data.Types[incident[1].typeID].categoryID].name,
      "color": data.Categories[data.Types[incident[1].typeID].categoryID].color
    }
  })
  let categories = Object.values(data.Categories).map((c)=>c.name) //we want in this format: ["drugs", "robbery"]
 
  let cleanData =[] //should end up having this format for the pie chart: [{label: "drugs", value: 10} , {}]


  let totalValue = 0;
  //creates cleanData
  categories.forEach(category => {
  let categoryEntries = parsedData.filter( c => c.label == category); 
  let value = 0;

  // for each category count how many incidents were in the category (Creating the value number)
  categoryEntries.forEach(c => {
      value++;
      totalValue++;
  });

  cleanData.push({label: category, value: value})
});

  useEffect(() => {
    function render() {
      if (d3Ref.current) {
        const svg = d3.select(d3Ref.current)
        // Clear previous contents
        svg.selectAll('*').remove()

        // Set dimensions
        const width = 400
        const height = 200
    
        svg.attr('preserveAspectRatio', 'xMinYMin meet').attr('viewBox', `0 0 ${width} ${height}`)

        const g = svg.append("g");
        g.append("g").attr("class", "slices");
        g.append("g").attr("class", "labels");
        g.append("g").attr("class", "lines");

        g.attr("transform", "translate(" + width / 4 + "," + height / 2 + ")");
          
          
        const radius = Math.min(width, height) / 2;

        const pie = d3
          .pie()
          .sort(null)
          .value(function(d) {
            return d.value;
          });

        //helper function for color
        //reduce() iterates over the Categories array and builds an object "acc" so that 
        //acc will be similar to a dictionary in the form: {"drugs": "black", "robbery": "white"}
        const labelColorMap = Object.values(data.Categories).reduce((acc, category) => {
          acc[category.name] = category.color; 
          return acc;
        }, {});
          
        const color = d3
          .scaleOrdinal()
          .domain(cleanData.map((d) => d.label))
          .range(cleanData.map((d) => labelColorMap[d.label]));
          
        const arc = d3
          .arc()
          .outerRadius(radius * 0.8)
          .innerRadius(radius * 0.4);
       
          
        /* ------- PIE SLICES -------*/
          
        const pieData = pie(cleanData);
          
        // Draw slices
        const slice = g
            .select('.slices')
            .selectAll('path.slice')
            .data(pieData);

        slice
          .enter()
          .append('path')
          .attr('class', 'slice')
          .style('fill', (d) => color(d.data.label))
          .attr('d', arc);

        
        slice.exit().remove();

        /* ------- LEGEND ------- */
        const legend = svg
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 200}, 20)`); // Position legend to the right of the pie chart

        const legendItems = legend
        .selectAll(".legend-item")
        .data(cleanData)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`); // Position each legend item

        // Add colored rectangles
        legendItems
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", (d) => color(d.label));

        // Add text labels
        legendItems
        .append("text")
        .attr("x", 18) // Position text next to rectangle
        .attr("y", 10) // Vertically align text with rectangle
        .text((d) => `${d.label} (${Math.floor((d.value / totalValue) * 100)}%)`)
        .style("font-size", "12px")
        .attr("fill", "#000");

      }
    }
    addEventListener('resize', render)
    render()
    return () => removeEventListener('resize', render)
  }, [incidents])

  return (
    <div ref={containerRef} className="relative aspect-[2/1] min-w-[300px] flex-grow overflow-hidden rounded-lg bg-neutral-100">
      <svg className="absolute inset-0" ref={d3Ref}></svg>
    </div>
  )
}
