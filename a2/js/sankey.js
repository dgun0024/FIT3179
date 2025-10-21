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

  // Year levels → Total
  yearData.forEach(d => {
    const total = +d.Suspension_Incidents;
    links.push({
      source: getNodeIndex(d.Year_Level),
      target: getNodeIndex("Total Suspensions"),
      value: total,
      type: "YearLevel"
    });
  });

  // Total → Reasons
  reasons2013.forEach(d => {
    links.push({
      source: getNodeIndex("Total Suspensions"),
      target: getNodeIndex(d.Reason),
      value: d.Value,
      type: "Reason"
    });
  });

  const containerWidth = document.getElementById('chart').offsetWidth;
  const width = Math.min(containerWidth, 1100);
  const height = 600;

  const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("background", "transparent")
    .style("max-width", "100%");

  const sankey = d3.sankey()
    .nodeWidth(120)
    .nodePadding(20)
    .extent([[50, 50], [width - 50, height - 50]]);

  const { nodes: sankeyNodes, links: sankeyLinks } = sankey({
    nodes: nodes.map(d => Object.assign({}, d)),
    links: links.map(d => Object.assign({}, d))
  });

  // Find highest reason
  const highestReason = reasons2013.reduce((max, curr) => 
    curr.Value > max.Value ? curr : max
  );

  // Tooltip div
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px 10px")
    .style("background", "rgba(255,255,255,0.95)")
    .style("border", "1px solid #d6d3d1")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("color", "#292524")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Colors
  const nodeColor = "#d6d3d1"; 
  const textColor = "#292524";

  sankeyNodes.forEach(d => d.color = nodeColor);
  sankeyLinks.forEach(d => {
    d.linkColor = d.source.name === "Total Suspensions" ? "#332288" : "#0e93a1ff";
  });

  // Draw links
  svg.append("g")
    .selectAll("path")
    .data(sankeyLinks)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("fill", "none")
    .attr("stroke", d => d.linkColor)
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("stroke-opacity", 0.7)
    .on("mousemove", function (event, d) {
      let htmlContent = "";
      if (d.type === "YearLevel") {
        htmlContent = `
          <strong>Year Level:</strong> ${d.source.name}<br/>
          <strong>Suspensions:</strong> ${d.value.toLocaleString()}
        `;
      } else if (d.type === "Reason") {
        htmlContent = `
          <strong>Reason:</strong> ${d.target.name}<br/>
          <strong>Suspensions:</strong> ${d.value.toLocaleString()}
        `;
      }
      tooltip.html(htmlContent)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`)
        .transition()
        .duration(150)
        .style("opacity", 1);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(200).style("opacity", 0);
    });

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
    .attr("stroke", "#78716c");

  // Node labels
  node.append("text")
    .attr("x", d => (d.x0 + d.x1) / 2)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", textColor)
    .style("font-size", "10px")
    .style("font-weight", "500")
    .text(d => d.name);

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .attr("font-weight", "700")
    .attr("fill", "#292524");

  // Top centered annotation - Total suspensions
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 200)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "700")
    .attr("fill", "#000000")
    .text(`${total2013.toLocaleString()} suspensions in 2013`);
  });