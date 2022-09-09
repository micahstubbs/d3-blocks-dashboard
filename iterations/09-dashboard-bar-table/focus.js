function setDetailUrl(d) {
  console.log("setDetailUrl d", d);
  // the url of the current page
  const url = new URL(window.location.href);
  const secure = String(url).startsWith("https://");
  const blockUrlRaw = `http${secure ? "s" : ""}://bl.ockss.org/${
    d.user ? `${d.user}/` : ""
  }raw/${d.id}`;

  // show the visualization for the selected node
  // in the detail pane
  // in an iFrame
  window.detailUrl = blockUrlRaw;
}

window.renderFocus = async function (selectedBar) {
  console.log(`renderFocus selectedBar`, selectedBar);
  const elem = document.getElementById("table-scroll");

  const margins = {
    top: 21,
    right: 3,
    bottom: 0,
    left: 0,
  };

  if (elem) {
    const { width: parentWidth, height: parentHeight } =
      elem.parentElement.getBoundingClientRect();

    elem.style.height = `${parentHeight - margins.top - margins.bottom}px`;
    elem.style.width = `${parentWidth - margins.left - margins.right}px`;
  }

  // for the selectedBar
  // render a table
  // where each row in the table
  // is a link in the selectedBar.links array
  // and the table row values are the properties of the node
  // whose id is the link AND NOT the selectedBar.id

  // read in the data
  const data = await fetch(
    "./blocks-citation-graph-degree-centrality.json"
  ).then((res) => res.json());

  // TODO: make this resuable too
  // TODO: by making it a function parameter
  // custom column sort order
  const sortOrder = [
    "linkCount",
    "user",
    "description",
    "createdAt",
    "updatedAt",
    "id",
  ];

  const hiddenColumns = ["createdAt", "updatedAt", "id", "links"];
  const cols = Object.keys(selectedBar)
    .sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b))
    // remove the 'links' key
    // because we don't want to show it in the table
    .filter((d) => hiddenColumns.indexOf(d) === -1);
  // remove any existing table
  d3.select("#table-scroll").selectAll("table").remove();

  const table = d3
    .select("#table-scroll")
    .append("table")
    .attr("class", "table table-striped table-hover");

  const thead = table.append("thead");
  const tbody = table.append("tbody");

  // append the header row
  thead
    .append("tr")
    .selectAll("th")
    .data(cols || [])
    .enter()
    .append("th")
    .style("padding-left", "0.5rem")
    .style("padding-right", "0.5rem")
    .style("font-size", "14px")
    .text((d) => d);

  // create a row for each object in the data
  const rows = tbody
    .selectAll("tr")
    .data(() => {
      const currentLinks = data.find((d) => d.id === selectedBar.id).links;
      const neighborIds = currentLinks.map((link) => {
        if (link.source === selectedBar.id) {
          return link.target;
        }
        return link.source;
      });

      const neighbors = data.filter((d) => neighborIds.includes(d.id)) || [];
      console.log("neighbors", neighbors);
      return neighbors;
    })
    .enter()
    .append("tr")
    .on("click", (d) => {
      console.log("d from table click", d);
      setDetailUrl(d.target.parentElement.__data__);
    });

  // create a cell in each row for each column
  const cells = rows.selectAll("td").data((d) => {
    if (cols) {
      return cols.map((col) => {
        return { col: col, value: d[col] };
      });
    }
    return [];
  });

  cells
    .enter()
    .append("td")
    .style("font-size", "16px")
    .style("padding-left", "0.5rem")
    .style("padding-right", "0.5rem")
    .text((d) => {
      if (d.col === "user") {
        return d.value || "anonymous";
      }
      return d.value;
    });

  // set the table header row background color
  d3.select("#table-scroll")
    .select("table")
    .select("thead")
    .select("tr")
    .style("background-color", "rgb(55, 55, 55)");

  // alternate table row background color
  d3.selectAll("tr:nth-child(even)").style(
    "background-color",
    "rgb(55, 55, 55)"
  );

  // set the detailUrl to the first link
  setDetailUrl(selectedBar);
};

// TODO: make this concise, store in some state
// TODO: that is shared with context.js
const initialBar = {
  id: "b8a8fcb885b6840bfde5",
  user: "scresawn",
  createdAt: "2016-02-18T15:32:17Z",
  updatedAt: "2016-03-21T00:49:22Z",
  description: "genome browser",
  linkCount: 113,
};

// if initialBar is present after the context chart renders
// render focus chart once with initial node
setTimeout(() => {
  window.renderFocus(initialBar);
}, 150);

setTimeout(() => {
  setDetailUrl(initialBar);
}, 2150);

// listen for changes
Object.defineProperty(window, "selectedBar", {
  set: function (v) {
    // this is run every time selectedBar is assigned a value:
    // the value being assigned can be found in v
    window.renderFocus(v);
  },
});
