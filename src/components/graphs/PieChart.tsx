import * as d3 from 'd3'
import { useRef, useEffect } from 'react'

export default function PieChart({incidents, data}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const d3Ref = useRef<SVGSVGElement | null>(null)


  const parsedData = incidents.map((incident) => {
    return {
      "label": data.Categories[data.Types[incident[1].typeID].categoryID].name
    }
  }
  )

  
  let cleanData =[] //should end up having this format: [{label: "drugs", value: 10} , {}]

  let categories = Object.values(data.Categories).map((c)=>c.name) //we want in this format: ["drugs", "robbery"]
  

categories.forEach(category => {
  let categoryEntries = parsedData.filter( c => c.label == category); 
  let value = 0;

  // for each category count how many incidents were in the category
  categoryEntries.forEach(c => {
      value++;
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
       
        const radius = Math.min(width, height) / 2;

        const pie = d3
          .pie()
          .sort(null)
          .value(function(d) {
            return d.value;
          });

          const color = d3
  .scaleOrdinal()
  .domain(incidents.map((d) => d.label))
  .range(
    incidents.map((cleanData) => {

      //TODO: replace with color within category
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      return color;
    })
  );

  const arc = d3
  .arc()
  .outerRadius(radius * 0.8)
  .innerRadius(radius * 0.4);

const outerArc = d3
  .arc()
  .innerRadius(radius * 0.9)
  .outerRadius(radius * 0.9);

g.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

const key = function(d) {
  return d.cleanData.label;
};

///console.log(incidents);
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

        // Exit old elements
        slice.exit().remove();

         /* ------- TEXT LABELS -------*/

         function midAngle(d) {
          return d.startAngle + (d.endAngle - d.startAngle) / 2;
        }

         var text = g.select(".labels").selectAll("text")
         .data(pie(cleanData));
       
         text.enter()
         .append("text")
         .attr("dy", ".35em")
         .text(function(d) {
           return d.data.label; // Use the label from cleanData
         })
         .attr("transform", function(d) {
           const pos = outerArc.centroid(d); // Calculate position
           return `translate(${pos})`;
         })
         .style("text-anchor", function(d) {
           return midAngle(d) < Math.PI ? "start" : "end"; // Align text based on the angle
         });
       
       
        

text.exit()
		.remove();
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
