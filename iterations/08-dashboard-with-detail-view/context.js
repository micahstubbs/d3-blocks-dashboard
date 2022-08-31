const config = {
  animateCameraOnClick: false,
};

const elem = document.getElementById("3d-graph");

const { width: parentWidth, height: parentHeight } =
  elem.parentElement.getBoundingClientRect();

// TODO: zoom the camera to the intial node
// TODO: defined currently in focus.js
// TODO: after the initial physics simulation

const Graph = ForceGraph3D()(elem)
  .width(parentWidth)
  .height(parentHeight)
  .jsonUrl("blocks-citation-graph.json")
  .nodeLabel((node) => `${node.description} from ${node.user}`)
  .nodeAutoColorBy("user")
  .onNodeHover((node) => (elem.style.cursor = node ? "pointer" : null))
  .onNodeClick((node, event) => {
    if (config.animateCameraOnClick) {
      // Aim at node from outside it
      const distance = 1000;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      Graph.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
        node, // lookAt ({ x, y, z })
        3000 // ms transition duration
      );
    }

    // if shift is held while the mouse is clicked
    // open the block in a new window
    if (event.shiftKey) {
      if (!node) return;
      window.open(
        `http://bl.ocks.org/${node.user ? `${node.user}/` : ""}${node.id}`,
        "_blank"
      );
    } else if (event.altKey) {
      // if the alt key is held while the mouse is clicked
      // open the gist in a new window
      if (!node) return;
      window.open(`https://gist.github.com/${node.user}/${node.id}`, "_blank");
    } else {
      // the node is click with no modifier keys
      console.log("clicked node from context", node);
      const contextNodeClickEvent = new CustomEvent("context-node-click", {
        detail: node,
      });
      elem.dispatchEvent(contextNodeClickEvent);
      elem.addEventListener(
        "context-node-click",
        (e) => {
          console.log("event from context node click", e);
          window.selectedNode = e.detail;
        },
        false
      );
    }
  });
