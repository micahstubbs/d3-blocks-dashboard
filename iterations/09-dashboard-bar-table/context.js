// Language: javascript
// Path: iterations/09-dashboard-bar-table/context.js

// wrap everything in an async function called context
const renderContext = async () => {
  const elem = document.getElementById("bar-chart");

  const { width: parentWidth, height: parentHeight } =
    elem.parentElement.getBoundingClientRect();

  // read in the data using fetch from './blocks-citation-graph-degree-centrality.json'
  const data = await fetch(
    "./blocks-citation-graph-degree-centrality.json"
  ).then((res) => res.json());

  const filteredData = data.filter((d) => d.linkCount > 2);

  // set the height of elem to the parentHeight
  elem.style.height = `${parentHeight}px`;

  renderBarChart({
    data: filteredData,
    parentWidth,
    parentHeight,
    categoricalVariable: "id",
    numericVariable: "linkCount",
    labelVariable: "description",
  });
};

const renderBarChart = async ({
  data,
  parentWidth,
  parentHeight,
  categoricalVariable,
  numericVariable,
  labelVariable,
}) => {
  // set the dimensions and margins of the graph
  const margin = { top: 20, right: 30, bottom: 60, left: 160 };
  const magicNoScrollBar = 15
  const width = parentWidth - margin.left - margin.right - magicNoScrollBar;
  const height = parentHeight - margin.top - margin.bottom;

  // show all, allow scrolling
  const barHeight = 50;
  const chartHeight = data.length * barHeight;

  // append the svg object to the body of the page
  const svg = d3
    .select("#bar-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", chartHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const x = d3.scaleLinear().domain([0, data[0].linkCount]).range([0, width]);

  // Add bottom X axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x).ticks(width / 25))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Add a text label for the bottom X axis
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", `translate(-17, ${chartHeight + 16})`)
    .text("Links Count")
    .style("font-face", "sans-serif")
    .style("font-size", "16px")
    .style("fill", "white");

  // Add top X axis
  svg
    .append("g")
    .attr("transform", `translate(0, 0)`)
    .call(d3.axisTop(x).ticks(width / 25))
    .selectAll("text")
    .attr("transform", "translate(0,0)rotate(0)")
    .style("text-anchor", "middle");

  // Add a text label for the top X axis
  svg
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", `translate(-17, -3)`)
    .text("Links Count")
    .style("font-face", "sans-serif")
    .style("font-size", "16px")
    .style("fill", "white");

  // Y axis
  const y = d3
    .scaleBand()
    .range([0, chartHeight])
    .domain(data.map((d) => d[categoricalVariable]))
    .padding(0.1);

  // data.map((d) => d[labelVariable])
  const yAxis = d3.axisLeft(y).tickFormat((v) => {
    // TODO: make this resuable again
    // for convenience, we will deviate
    // from the resuable charts pattern briefly
    // to make very nice looking y axis tick labels
    const datum = data.find((d) => d[categoricalVariable] === v);
    const description = datum[labelVariable];
    const user = datum.user;
    return `${description || "untitled"} by ${user}`;
  });
  svg
    .append("g")
    .call(yAxis)
    .selectAll(".tick text")
    .call(wrap, margin.left - 20);

  //Bars
  svg
    .append("g")
    .selectAll("myRect")
    .data(data)
    .join("rect")
    .attr("x", x(0))
    .attr("y", (d) => y(d[categoricalVariable]))
    .attr("width", (d) => x(d[numericVariable]))
    .attr("height", y.bandwidth())
    .attr("fill", "steelblue")
    // handle on click
    .on("click", (d, i, _nodes) => {
      // the bar is clicked with no modifier keys
      console.log("clicked bar", d);
      onBarClick(d, "bar-chart");
    });

  // Bar values
  const titleColor = "white"; // title fill color when atop bar
  const titleAltColor = "white"; // title fill color when atop background

  svg
    .append("g")
    .attr("fill", titleColor)
    .attr("text-anchor", "end")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", (d) => x(d[numericVariable]))
    .attr("y", (d) => y(d[categoricalVariable]) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("dx", -4)
    .text((d) => d[numericVariable])
    .call((text) =>
      text
        .filter((d) => x(d[numericVariable]) - x(0) < 20) // short bars
        .attr("dx", +4)
        .attr("fill", titleAltColor)
        .attr("text-anchor", "start")
    );
};

//
// on bar click
//
const onBarClick = (event, elementId) => {
  const elem = document.getElementById(elementId);
  // the bar is click with no modifier keys
  console.log("clicked bar from context", event);
  const d = event.target.__data__;
  const contextBarClickEvent = new CustomEvent("context-bar-click", {
    detail: d,
  });
  elem.dispatchEvent(contextBarClickEvent);
  elem.addEventListener(
    "context-bar-click",
    (e) => {
      console.log("event from context bar click", e);
      window.selectedBar = e.detail;
    },
    false
  );
};

//
// wrap
//
function wrap(text, width) {
  text.each(function () {
    var text = d3.select(this),
      words = text
        .text()
        .split(/[\s-\/]/g)
        .reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy")),
      tspan = text
        .text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", y)
        .attr("dy", dy + "em")
        .attr("dx", -10 + "px");
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", `${(lineNumber += 1 * lineHeight + dy)}em`)
          .attr("dx", -10 + "px")
          .text(word);
      }
    }
  });
}

renderContext();
