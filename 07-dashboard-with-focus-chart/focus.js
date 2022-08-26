const canvas = document.querySelector("#focus-canvas-container > canvas");
const context = canvas.getContext("2d");

//
// config
//
const nodeRadius = 22;

// TODO use mutation observer or some other more
// TODO elegant way to wait until CSS layout is complete
setTimeout(() => {
  render(canvas, context);
}, 50);

function render(canvas, context) {
  const { width, height } =
    canvas.parentElement.parentElement.parentElement.getBoundingClientRect();
  console.log("width", width);
  console.log("height", height);
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);

  const searchRadius = 30;

  const color = d3.scaleOrdinal().range(d3.schemeCategory20);

  // Create the simulation with a small forceX and Y towards the center
  var simulation = d3
    .forceSimulation()
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX(0).strength(0.003))
    .force("y", d3.forceY(0).strength(0.003));

  //
  // load static graph data from a file
  //
  d3.json("blocks-citation-graph.json", (error, response) => {
    if (error) {
      console.error(error);
    }
    parseResponse(response);
  });

  //
  // cache images
  //
  const imageCache = {};

  //
  // parse the response from neo4j
  //
  function parseResponse(responseData) {
    console.log("responseData from parseResponse", responseData);
    //
    // Build hashes
    //
    const globalGraph = responseData;

    const globalNodesHash = {};
    const globalLinksHash = {};

    // do this somewhere else, once per page load
    globalGraph.nodes.forEach((node) => {
      globalNodesHash[node.id] = node;
    });
    globalGraph.links.forEach((link) => {
      if (!globalLinksHash[link.source]) globalLinksHash[link.source] = [];
      if (!globalLinksHash[link.target]) globalLinksHash[link.target] = [];
      globalLinksHash[link.source].push(link);
      globalLinksHash[link.target].push(link);
    });

    // hard code in this example
    // to be passed dynamically by the
    // user interaction with the context chart
    // in the dashboard
    const selectedNode = {
      id: "4062045",
      user: "mbostock",
      createdAt: "2012-11-12T21:31:44Z",
      updatedAt: "2017-11-27T10:50:58Z",
      description: "Force-Directed Graph",
    };

    // {
    //   id: "3cc1a2a289dddbd64688",
    //   user: "curran",
    //   createdAt: "2015-09-06T00:53:52Z",
    //   updatedAt: "2015-09-12T21:20:28Z",
    //   description: "Fundamental Visualizations",
    // };

    const neighborhood = {
      nodes: [],
      links: [],
      neighborhoodRoots: {},
      nodesHash: {},
    };

    function buildNeighborhood(currentNode, degree) {
      //
      // Build the neighborhood of the currentNode
      //
      const currentFirstNeighborNodes = [];

      // the selected node itself
      neighborhood.nodes.push(currentNode);
      neighborhood.nodesHash[currentNode.id] = true;
      neighborhood.neighborhoodRoots[currentNode.id] = true;

      // add all first degree links that touch the selected node
      neighborhood.links = [
        ...neighborhood.links,
        ...globalLinksHash[currentNode.id],
      ];

      // add the node that is not the selected node to the
      // neighborhood node list
      neighborhood.links.forEach((link) => {
        if (link.source !== currentNode.id) {
          if (
            globalNodesHash[link.source] &&
            !neighborhood.nodesHash[link.source]
          ) {
            neighborhood.nodes.push(globalNodesHash[link.source]);
            currentFirstNeighborNodes.push(globalNodesHash[link.source]);
            neighborhood.nodesHash[link.source] = true;
          }
        } else if (link.target !== currentNode.id) {
          if (
            globalNodesHash[link.target] &&
            !neighborhood.nodesHash[link.target]
          ) {
            neighborhood.nodes.push(globalNodesHash[link.target]);
            currentFirstNeighborNodes.push(globalNodesHash[link.target]);
            neighborhood.nodesHash[link.target] = true;
          }
        }
      });

      // build neighbordhoods for each of
      // the current neighborhood's new nodes
      currentFirstNeighborNodes.forEach((node) => {
        // If we haven't already build a neighborhood
        // for this particular node
        if (!neighborhood.neighborhoodRoots[node.id]) {
          if (degree > 0) {
            // recurse and build a new neighorhood with
            // this node at its center
            buildNeighborhood(node, degree - 1);
          }
        }
      });
    }

    buildNeighborhood(selectedNode, 2);

    // prune any links with undefined sources or targets
    for (let i = neighborhood.links.length - 1; i > -1; i -= 1) {
      if (!neighborhood.links[i].source || !neighborhood.links[i].target) {
        neighborhood.links.splice(i);
      }
    }

    const graph = neighborhood;
    console.log("neighborhood", neighborhood);

    // call the drawGraph function
    // to plot the graph
    drawGraph(graph);
  }

  //
  // visualize the graph
  //
  function drawGraph(graph) {
    console.log("graph from drawGraph", graph);
    cacheImages(graph, imageCache);

    // clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    //
    // detect communities with jsLouvain
    //
    const nodeData = graph.nodes.map(function (d) {
      return d.id;
    });
    const linkData = graph.links.map(function (d) {
      return { source: d.source, target: d.target, weight: d.weight };
    });

    const community = jLouvain().nodes(nodeData).edges(linkData);
    const result = community();

    const nodeIndexHash = {};
    graph.nodes.forEach(function (node, i) {
      node.group = result[node.id];
      nodeIndexHash[node.id] = i;
    });

    //
    //
    //
    const users = d3
      .nest()
      .key((d) => d.user)
      .entries(graph.nodes)
      .sort((a, b) => b.values.length - a.values.length);

    color.domain(users.map((d) => d.key));

    //
    // process links data to use simple node array index ids
    // for source and target values
    // to satisfy the assumption of the forceInABox layout
    //
    graph.links.forEach((link) => {
      if (typeof link.source === "string" && typeof link.target === "string") {
        // record the gistId
        link.sourceGistId = link.source;
        link.targetGistId = link.target;

        // now use the node index
        link.source = nodeIndexHash[link.source];
        link.target = nodeIndexHash[link.target];
      }
    });

    console.log("graph", graph);

    //
    // Instantiate the forceInABox force
    //
    const groupingForce = forceInABox()
      .strength(0.001) // Strength to foci
      .template("force") // Either treemap or force
      .groupBy("group") // Node attribute to group
      .links(graph.links) // The graph links. Must be called after setting the grouping attribute
      .size([width, height]); // Size of the chart

    // Add your forceInABox to the simulation
    simulation
      .nodes(graph.nodes)
      .force("group", groupingForce)
      .force(
        "link",
        d3
          .forceLink(graph.links)
          .distance(50)
          .strength(groupingForce.getLinkStrength) // default link force will try to join nodes in the same group stronger than if they are in different groups
      )
      .on("tick", ticked);

    // simulation.force('link').links(graph.links);

    d3.select(canvas)
      .on("mousemove", mousemoved)
      .on("click", clicked)
      .call(
        d3
          .drag()
          .container(canvas)
          .subject(dragsubject)
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    function ticked() {
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(width / 2, height / 2);

      context.beginPath();
      graph.links.forEach(drawLink);
      context.strokeStyle = "#aaa";
      context.stroke();

      users.forEach((user) => {
        context.beginPath();
        user.values.forEach(drawNode);
        context.fillStyle = color(user.key);
        context.fill();
      });

      context.restore();
    }

    function dragsubject() {
      return simulation.find(
        d3.event.x - width / 2,
        d3.event.y - height / 2,
        searchRadius
      );
    }

    function mousemoved() {
      //
      // disable mouse move links for now
      //
      const a = this.parentNode;
      const m = d3.mouse(this);
      const d = simulation.find(
        m[0] - width / 2,
        m[1] - height / 2,
        searchRadius
      );
      if (!d) return a.removeAttribute("href");
      a.removeAttribute("title");
      a.setAttribute(
        "href",
        `http://bl.ocks.org/${d.user ? `${d.user}/` : ""}${d.id}`
      );
      a.setAttribute(
        "title",
        `${d.id}${d.user ? ` by ${d.user}` : ""}${
          d.description ? `\n${d.description}` : ""
        }`
      );
    }

    function clicked() {
      const m = d3.mouse(this);
      const d = simulation.find(
        m[0] - width / 2,
        m[1] - height / 2,
        searchRadius
      );
      const blockUrl = `http://bl.ocks.org/${d.user ? `${d.user}/` : ""}${
        d.id
      }`;
      window.open(blockUrl);
    }
  }

  function dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
  }

  function dragged() {
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
  }

  function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
  }

  // a small function to ensure that
  // nodes stay inside the canvas
  function boundScalar(p, axis) {
    let halfEdge = 0;
    if (axis === "x") {
      halfEdge = width / 2 - nodeRadius;
    } else if (axis === "y") {
      halfEdge = height / 2 - nodeRadius;
    }
    const minP = Math.min(p[axis], halfEdge);
    return Math.max(-halfEdge, minP);
  }

  function drawLink(d) {
    context.moveTo(boundScalar(d.source, "x"), boundScalar(d.source, "y"));
    context.lineTo(boundScalar(d.target, "x"), boundScalar(d.target, "y"));
  }

  function drawNode(d) {
    // old solid color nodes
    // context.moveTo(d.x + 3, d.y);
    // context.arc(d.x, d.y, 3, 0, 2 * Math.PI);

    const image = imageCache[d.id];
    const iconWidth = 92;
    const iconHeight = 48;

    // draw border to check intution
    // context.strokeStyle = "darkgray";
    // context.strokeRect(-width / 2, -height / 2, width - 2, height - 2);

    const minX = Math.min(d.x, width - nodeRadius);
    // const nX = Math.max(-width / 2 + nodeRadius, minX);

    const minY = Math.min(d.y, height - 2 * nodeRadius);
    // const nY = Math.max(-height / 2 - nodeRadius, minY);

    const nX = boundScalar(d, "x");
    const nY = boundScalar(d, "y");

    // log out coodrinates of nodes that travel outside
    // the canvas bounds
    if (d.x !== nX || d.y !== nY) {
      console.log("d.x", d.x);
      console.log("d.y", d.y);
      console.log("nX", nX);
      console.log("nY", nY);
      console.log("------------");
    }

    // draw images with a circular clip mask
    // so that rectangular thumbnail images become
    // round node icons
    if (typeof image !== "undefined" && image.height > 0) {
      context.save();
      context.beginPath();
      context.arc(nX, nY, nodeRadius, 0, Math.PI * 2, true);
      context.closePath();
      context.clip();

      context.drawImage(
        image,
        0,
        0,
        230,
        120,
        nX - iconWidth / 2,
        nY - iconHeight / 2,
        iconWidth,
        iconHeight
      );

      context.beginPath();
      context.arc(0, 0, 2, 0, Math.PI * 2, true);
      context.clip();
      context.closePath();
      context.restore();
    } else {
      // gray from the blockbuilder search results page
      context.fillStyle = "#EEEEEE";
      context.beginPath();
      context.arc(nX, nY, nodeRadius, 0, Math.PI * 2, true);
      context.closePath();
      context.fill();

      // teal from blockbuilder search results page
      context.fillStyle = "#66B5B4";
      context.font = "20px Georgia";
      context.fillText("?", nX - 5, nY + 8);
    }
  }

  function cacheImages(graph, imageCache) {
    graph.nodes.forEach((d) => {
      const image = new Image();

      image.src = `https://bl.ocks.org/${d.user ? `${d.user}/` : ""}raw/${
        d.id
      }/thumbnail.png`;
      // image.onload = function() {
      //   imageCache[d.id] = image;
      // };
      imageCache[d.id] = image;
    });
  }
}
