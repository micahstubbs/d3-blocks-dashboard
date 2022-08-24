This iteration add an interaction that opens the block represented by a node when you click on that node

In this iteration, we load json data from a static file.  This json data is produced by the REST API of a neo4j graph database that contains the d3 example README citation graph, in response to a query that we post to it. 

This query finds all blocks that have the string `map` somewhere in the description (gist title)
show those blocks and all blocks that they have a 1st degree link-in-the-README citation relationship with

```
MATCH(n)-[:LINKS_TO]-(m)
WHERE n.description =~  '.*map.*'
RETURN n, m
```

the cool thing about this is the related nodes may not have `map` anywhere in the description, but we can still use some known graph of d3 example relationships (in this case README citations) to infer that they are relevant to a map keyword search

a fork of the block [d3 example graph search - user query](https://bl.ocks.org/micahstubbs/8a3779fc211b45ef9744100d1307f0fa) from [@micahstubbs](https://twitter.com/micahstubbs)

**see also**

the parent project for blockbuilder graph search ui prototypes  
[https://github.com/micahstubbs/bbgs-ui-prototypes](https://github.com/micahstubbs/bbgs-ui-prototypes)

the blockbuilder graph search neo4j graph database source data & config backend project 
[https://github.com/micahstubbs/blockbuilder-graph-search-index](https://github.com/micahstubbs/blockbuilder-graph-search-index)
