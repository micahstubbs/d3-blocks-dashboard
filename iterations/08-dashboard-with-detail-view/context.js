const config = {
  animateCameraOnClick: false,
};

const elem = document.getElementById("3d-graph");

const { width: parentWidth, height: parentHeight } =
  elem.parentElement.getBoundingClientRect();

function zoomCameraToNode(node) {
  // Aim at node from outside it
  const distance = 1000;
  const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
  Graph.cameraPosition(
    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
    node, // lookAt ({ x, y, z })
    3000 // ms transition duration
  );
  console.log("zoomed to node", node);
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

const intialNode = {
  id: "f849f374f21c490c5490d501636bdb77",
  user: "curran",
  createdAt: "2017-09-13T09:01:39Z",
  updatedAt: "2017-09-14T14:23:04Z",
  description: "Data Table Summary",
};

const Graph = ForceGraph3D()(elem)
  .width(parentWidth)
  .height(parentHeight)
  .jsonUrl("blocks-citation-graph.json")
  .nodeLabel((node) => `${node.description} from ${node.user}`)
  .nodeAutoColorBy("user")
  .onNodeHover((node) => (elem.style.cursor = node ? "pointer" : null))
  .onNodeClick((node) => {
    if (config.animateCameraOnClick) {
      zoomCameraToNode(node);
    }
  });
