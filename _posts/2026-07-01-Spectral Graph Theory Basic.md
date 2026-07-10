---
title: Graph Sparsification
description: funfun
date: 2026-07-01
categories:
  - Personal
tags:
  - "#math"
pin: true
math: true
author: ch
---


**Reference** 

1. [Lectue ORIE 6334 Bridging Continuous Discrete Optimization](https://people.orie.cornell.edu/dpw/orie6334/)

2. [Daniel A. Spielman - Spectral Graph Theory ](https://www.cs.yale.edu/homes/spielman/561/syllabus.html)
   
3. [Youtube Algorithm Course - Graph Theory from a Google Engineer](https://www.youtube.com/watch?v=09_LlHjoEiY&t=9751s)

위 자료들을 보며 직관적으로 이해가 되지 않았던 부분들에 대한 수필 풀이를, 글로 다시 재가공한 포스팅입니다. 

---

## Indroduce

Every single lecture and resource on Spectral Graph Theory keeps harping on the need to have a rock-solid grasp of eigenvalues and eigenvectors. I mean, I vaguely remembered the concepts, but the rigorous definitions had long since slipped my mind. Currently grinding through them to get back up to speed - do yourself a favor and master these before you dive in

The diameter $D$ of a graph is minimum length you would have to be able to travel to guarantee  that you could go from any node in the graph to any other node. formally.

$$D = \underset{i,j \in V}{max} \ \text{"length of shortest path between } i\  \text{and} j\ \text{"}$$

A graph is said to be $d\text{-regular}$ if all fucknodes are of $\text{degree-}d$. where degree is defined as the number of edges incident on each vertex. The below graph has diameter 2 but is not $d\text{-regular}$ since some nodes are of degree 2 and some are of degree 3.

![a](</assets/post/f/1.png>)
Spectral Graph Theory
And professor intdoduce $d\text{-regular}$ graphs of diameter 2 with as many nodes as possible. By starting at any node $i$, the graph look like under graphs

![b](</assets/post/f/2.png>)

In this graph, there are no connections between adjacent nodes in the first layer since prof want to maximize the number of nodes in the graph. based on the diagram, such a graph would have $n=1+d+d(d-1)=d^2+1$ nodes.
