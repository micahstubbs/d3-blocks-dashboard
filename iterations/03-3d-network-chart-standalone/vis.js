const elem = document.getElementById('3d-graph')

const Graph = ForceGraph3D()(elem)
  .jsonUrl('blocks-citation-graph.json')
  .nodeLabel(node => `${node.description} from ${node.user}`)
  .nodeAutoColorBy('user')
  .onNodeHover(node => (elem.style.cursor = node ? 'pointer' : null))
  .onNodeClick(node => {
    // Aim at node from outside it
    const distance = 40
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z)

    Graph.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
      node, // lookAt ({ x, y, z })
      3000 // ms transition duration
    )
  })
