// Lanuage: NodeJS
// Description: For Each node in ./blocks-ci/links/links.json,
// count the number of links to it

import fs from "fs";
import path from "path";
import { dirname } from "path";

const __filename = "./blocks-citation-graph.json";
const __dirname = dirname(__filename);
const inputJson = fs.readFileSync(
  path.join(__dirname, "./blocks-citation-graph.json"),
  "utf8"
);
const inputData = JSON.parse(inputJson);
const nodes = inputData.nodes;
const links = inputData.links;

const nodeLinks = nodes.map((node) => {
  const currentNodeLinks = links.filter((link) => {
    return link.target === node.id;
  });
  return {
    ...node,
    linkCount: currentNodeLinks.length,
    links: currentNodeLinks,
  };
});

const sortedNodeLinks = nodeLinks.sort((a, b) => {
  return b.linkCount - a.linkCount;
});

const outputJson = JSON.stringify(sortedNodeLinks, null, 2);
fs.writeFileSync(
  path.join(__dirname, "./blocks-citation-graph-degree-centrality.json"),
  outputJson
);
