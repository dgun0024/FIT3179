Promise.all([
  d3.csv("data/year_levels.csv"),
  d3.csv("data/total_incidents.csv"),
  d3.csv("data/suspension_reasons.csv")
]).then(([yearData, totalData, reasonData]) => {
  yearData = yearData.filter(d => d.Reporting_Year === "2013");
  const total2013 = +totalData.find(d => d.Type === "2 - Suspension incidents")["2013"];
  const reasons2013 = reasonData.map(d => ({
    Reason: d.Reason,
    Value: +d["2013"]
  }));

  const nodes = [];
  const links = [];

  function getNodeIndex(name) {
    let node = nodes.find(n => n.name === name);
    if (!node) {
      nodes.push({ name });
      node = nodes[nodes.length - 1];
    }
    return nodes.indexOf(node);
  }

  // Year levels → total
  yearData.forEach(d => {
    const total = +d.Suspension_Incidents;
    links.push({
      source: getNodeIndex(d.Year_Level),
      target: getNodeIndex("Total Suspensions"),
      value: total
    });
  });

  // Total → reasons
  reasons2013.forEach(d => {
    links.push({
      source: getNodeIndex("Total Suspensions"),
      target: getNodeIndex(d.Reason),
      value: d.Value
    });
  });

  const width = 1400, height = 700;

  const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#fdfaf5");

  const sankey = d3.sankey()
    .nodeWidth(150) 
    .nodePadding(20)
    .extent([[50, 50], [width - 50, height - 50]]);

  const { nodes: sankeyNodes, links: sankeyLinks } = sankey({
    nodes: nodes.map(d => Object.assign({}, d)),
    links: links.map(d => Object.assign({}, d))
  });

  // Assign grey color to all nodes
  const nodeColor = "#999999";
  sankeyNodes.forEach(d => {
    d.color = nodeColor;
  });

  // Assign colors to links based on whether they come from Total Suspensions
  sankeyLinks.forEach(d => {
    if (d.source.name === "Total Suspensions") {
      d.linkColor = "#a7c8f2"; 
    } else {
      d.linkColor = "#82c7b9"; 
    }
  });

  // Draw links with solid color
  svg.append("g")
    .selectAll("path")
    .data(sankeyLinks)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("fill", "none")
    .attr("stroke", d => d.linkColor)
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("stroke-opacity", 1)
    .append("title")
    .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`);

  // Draw nodes
  const node = svg.append("g")
    .selectAll("g")
    .data(sankeyNodes)
    .join("g");

  node.append("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", sankey.nodeWidth())
    .attr("fill", d => d.color)
    .attr("rx", 3)
    .attr("ry", 3)
    .attr("stroke", "#ccc");

  // Center text inside the nodes
  node.append("text")
    .attr("x", d => (d.x0 + d.x1) / 2)  
    .attr("y", d => (d.y1 + d.y0) / 2) 
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "#fff")  
    .style("font-size", "11px")
    .style("font-weight", "500")
    .text(d => d.name);

  // Centered title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 35)
    .attr("text-anchor", "middle")
    .attr("font-size", "22px")
    .attr("font-weight", "600")
    .attr("fill", "#333")
    .text("2013 School Suspension Flow");
});