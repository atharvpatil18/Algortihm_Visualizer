import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Info, Network } from 'lucide-react';
import { bfs, dfs, dls, ids, bds, ucs, greedy, astar, Graph, Heuristics } from './algorithms';

const ALGORITHM_INFO = {
  BFS: { name: "Breadth-First Search", type: "Uninformed", complete: "Yes", optimal: "Yes", time: "O(b^d)", space: "O(b^{d+1})" },
  DFS: { name: "Depth-First Search", type: "Uninformed", complete: "No", optimal: "No", time: "O(b^m)", space: "O(bm)" },
  DLS: { name: "Depth-Limited Search", type: "Uninformed", complete: "No", optimal: "No", time: "O(b^l)", space: "O(bl)" },
  IDS: { name: "Iterative Deepening Search", type: "Uninformed", complete: "Yes", optimal: "Yes", time: "O(b^d)", space: "O(bd)" },
  BDS: { name: "Bidirectional Search", type: "Uninformed", complete: "Yes", optimal: "Yes", time: "O(b^{d/2})", space: "O(b^{d/2})" },
  UCS: { name: "Uniform Cost Search", type: "Uninformed", complete: "Yes", optimal: "Yes", time: "O(b^d)", space: "O(b^{d+1})" },
  Greedy: { name: "Greedy Best-First Search", type: "Informed", complete: "No", optimal: "No", time: "O(b^m)", space: "O(b^m)" },
  "A*": { name: "A* Search", type: "Informed", complete: "Yes", optimal: "Yes", time: "O(b^d)", space: "O(b^d)" }
};

type AlgorithmKey = keyof typeof ALGORITHM_INFO;

const formatComplexity = (text: string) => {
  return text.split('^').map((part, i) => {
    if (i === 0) return part;
    const match = part.match(/^({[^}]+}|[a-z0-9+-\/]+)(.*)/);
    if (match) {
      const supContent = match[1].replace(/[{}]/g, '');
      return <React.Fragment key={i}><sup>{supContent}</sup>{match[2]}</React.Fragment>;
    }
    return part;
  });
};

const DEFAULT_GRAPH = `S -> A:1, B:4
A -> C:2, D:5, G:12
B -> E:2
C -> F:2
D -> G:3
E -> G:7
F -> G:1`;

const DEFAULT_HEURISTICS = `S: 7
A: 6
B: 2
C: 4
D: 2
E: 1
F: 1
G: 0`;

function parseGraph(input: string) {
  const adj: Graph = {};
  const nodes = new Set<string>();
  const lines = input.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const [fromPart, toPart] = line.split('->').map(s => s.trim());
    if (!fromPart) continue;
    nodes.add(fromPart);
    if (!adj[fromPart]) adj[fromPart] = [];
    if (toPart) {
      const targets = toPart.split(',').map(s => s.trim());
      for (const target of targets) {
        const [to, costStr] = target.split(':').map(s => s.trim());
        const cost = costStr ? parseFloat(costStr) : 1;
        nodes.add(to);
        adj[fromPart].push({ to, cost });
        if (!adj[to]) adj[to] = [];
      }
    }
  }
  return { adj, nodes: Array.from(nodes) };
}

function parseHeuristics(input: string) {
  const h: Heuristics = {};
  const lines = input.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const [node, val] = line.split(':').map(s => s.trim());
    if (node && val) {
      h[node] = parseFloat(val);
    }
  }
  return h;
}

function computeLayout(graph: Graph, start: string, width: number, height: number) {
  const levels: Record<string, number> = {};
  const nodesByLevel: string[][] = [];
  const queue = [{ node: start, level: 0 }];
  const seen = new Set([start]);

  levels[start] = 0;
  nodesByLevel[0] = [start];

  while (queue.length > 0) {
    const { node, level } = queue.shift()!;
    for (const edge of (graph[node] || [])) {
      if (!seen.has(edge.to)) {
        seen.add(edge.to);
        levels[edge.to] = level + 1;
        if (!nodesByLevel[level + 1]) nodesByLevel[level + 1] = [];
        nodesByLevel[level + 1].push(edge.to);
        queue.push({ node: edge.to, level: level + 1 });
      }
    }
  }

  const allNodes = new Set<string>();
  for (const u in graph) {
    allNodes.add(u);
    for (const e of graph[u]) allNodes.add(e.to);
  }
  
  let maxLevel = nodesByLevel.length > 0 ? nodesByLevel.length - 1 : 0;
  for (const node of allNodes) {
    if (!seen.has(node)) {
      maxLevel++;
      nodesByLevel[maxLevel] = [node];
      levels[node] = maxLevel;
      seen.add(node);
    }
  }

  const positions: Record<string, { x: number, y: number }> = {};
  const levelHeight = height / (nodesByLevel.length + 1);

  nodesByLevel.forEach((nodes, level) => {
    const y = (level + 1) * levelHeight;
    const nodeWidth = width / (nodes.length + 1);
    nodes.forEach((node, idx) => {
      const x = (idx + 1) * nodeWidth;
      positions[node] = { x, y };
    });
  });

  return positions;
}

export default function App() {
  const [graphInput, setGraphInput] = useState(DEFAULT_GRAPH);
  const [heuristicsInput, setHeuristicsInput] = useState(DEFAULT_HEURISTICS);
  const [startNode, setStartNode] = useState('S');
  const [goalNode, setGoalNode] = useState('G');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmKey>('BFS');
  
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
  const [pathNodes, setPathNodes] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const animationRef = useRef<{ interval?: number, pathInterval?: number }>({});

  const clearAnimation = () => {
    if (animationRef.current.interval) clearInterval(animationRef.current.interval);
    if (animationRef.current.pathInterval) clearInterval(animationRef.current.pathInterval);
    setVisitedNodes([]);
    setPathNodes([]);
    setIsRunning(false);
  };

  useEffect(() => {
    return () => clearAnimation();
  }, []);

  const visualize = () => {
    if (isRunning) return;
    clearAnimation();
    setIsRunning(true);
    
    const { adj } = parseGraph(graphInput);
    const h = parseHeuristics(heuristicsInput);
    
    let result = { visited: [] as string[], path: [] as string[] };
    
    try {
      switch (selectedAlgorithm) {
        case 'BFS': result = bfs(adj, startNode, goalNode); break;
        case 'DFS': result = dfs(adj, startNode, goalNode); break;
        case 'DLS': result = dls(adj, startNode, goalNode, 3); break;
        case 'IDS': result = ids(adj, startNode, goalNode); break;
        case 'BDS': result = bds(adj, startNode, goalNode); break;
        case 'UCS': result = ucs(adj, startNode, goalNode); break;
        case 'Greedy': result = greedy(adj, h, startNode, goalNode); break;
        case 'A*': result = astar(adj, h, startNode, goalNode); break;
      }
    } catch (e) {
      console.error(e);
      setIsRunning(false);
      return;
    }
    
    let i = 0;
    animationRef.current.interval = window.setInterval(() => {
      if (i < result.visited.length) {
        setVisitedNodes(prev => [...prev, result.visited[i]]);
        i++;
      } else {
        clearInterval(animationRef.current.interval);
        let j = 0;
        animationRef.current.pathInterval = window.setInterval(() => {
          if (j < result.path.length) {
            setPathNodes(prev => [...prev, result.path[j]]);
            j++;
          } else {
            clearInterval(animationRef.current.pathInterval);
            setIsRunning(false);
          }
        }, 200);
      }
    }, 500);
  };

  const { adj, nodes } = parseGraph(graphInput);
  const h = parseHeuristics(heuristicsInput);
  const layout = computeLayout(adj, startNode, 800, 600);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Network size={20} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Tree Search Visualizer</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedAlgorithm}
            onChange={(e) => {
              setSelectedAlgorithm(e.target.value as AlgorithmKey);
              clearAnimation();
            }}
            disabled={isRunning}
            className="bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none font-medium"
          >
            {Object.keys(ALGORITHM_INFO).map(algo => (
              <option key={algo} value={algo}>{ALGORITHM_INFO[algo as AlgorithmKey].name}</option>
            ))}
          </select>
          
          <button 
            onClick={visualize} 
            disabled={isRunning}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Play size={18} />
            Visualize {selectedAlgorithm}
          </button>
          
          <button 
            onClick={clearAnimation} 
            disabled={isRunning}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col xl:flex-row p-6 gap-6 max-w-[1600px] mx-auto w-full">
        <div className="w-full xl:w-[350px] flex flex-col gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h3 className="font-semibold text-slate-800">Graph Definition</h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Edges (Node -&gt; Target:Cost)</label>
              <textarea 
                value={graphInput}
                onChange={(e) => { setGraphInput(e.target.value); clearAnimation(); }}
                disabled={isRunning}
                className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Heuristics (Node: Value)</label>
              <textarea 
                value={heuristicsInput}
                onChange={(e) => { setHeuristicsInput(e.target.value); clearAnimation(); }}
                disabled={isRunning}
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Node</label>
                <input 
                  type="text" 
                  value={startNode}
                  onChange={(e) => { setStartNode(e.target.value); clearAnimation(); }}
                  disabled={isRunning}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goal Node</label>
                <input 
                  type="text" 
                  value={goalNode}
                  onChange={(e) => { setGoalNode(e.target.value); clearAnimation(); }}
                  disabled={isRunning}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            <div className="bg-slate-800 px-5 py-4 flex items-center gap-3">
              <Info className="text-blue-400" size={20} />
              <h2 className="text-white font-semibold tracking-tight">Algorithm Details</h2>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{ALGORITHM_INFO[selectedAlgorithm].name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {ALGORITHM_INFO[selectedAlgorithm].type} Search
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Complete</div>
                  <div className={`font-medium ${ALGORITHM_INFO[selectedAlgorithm].complete === 'Yes' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {ALGORITHM_INFO[selectedAlgorithm].complete}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Optimal</div>
                  <div className={`font-medium ${ALGORITHM_INFO[selectedAlgorithm].optimal === 'Yes' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {ALGORITHM_INFO[selectedAlgorithm].optimal}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Time</div>
                  <div className="font-mono text-sm text-slate-700 font-medium">
                    {formatComplexity(ALGORITHM_INFO[selectedAlgorithm].time)}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Space</div>
                  <div className="font-mono text-sm text-slate-700 font-medium">
                    {formatComplexity(ALGORITHM_INFO[selectedAlgorithm].space)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[500px] relative">
            <div className="flex items-center gap-6 text-sm text-slate-600 font-medium mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white"></div> Unvisited
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-500 bg-indigo-100"></div> Visited
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-amber-500 bg-amber-400"></div> Path
              </div>
              <div className="ml-auto flex items-center gap-2 text-slate-500">
                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">h=val</span> Heuristic
              </div>
            </div>
            
            <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden relative">
              <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
                <marker id="arrowhead-path" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                </marker>
              </defs>
              
              {/* Edges */}
              {Object.entries(adj).map(([u, edges]) => 
                edges.map((edge, idx) => {
                  const v = edge.to;
                  if (!layout[u] || !layout[v]) return null;
                  
                  const isPath = pathNodes.includes(u) && pathNodes.includes(v) && 
                                 Math.abs(pathNodes.indexOf(u) - pathNodes.indexOf(v)) === 1;
                  
                  const midX = (layout[u].x + layout[v].x) / 2;
                  const midY = (layout[u].y + layout[v].y) / 2;
                  
                  return (
                    <g key={`edge-${u}-${v}-${idx}`}>
                      <line 
                        x1={layout[u].x} 
                        y1={layout[u].y} 
                        x2={layout[v].x} 
                        y2={layout[v].y} 
                        stroke={isPath ? "#f59e0b" : "#cbd5e1"} 
                        strokeWidth={isPath ? 3 : 2}
                        markerEnd={isPath ? "url(#arrowhead-path)" : "url(#arrowhead)"}
                        className="transition-all duration-300"
                      />
                      <rect x={midX - 10} y={midY - 10} width="20" height="20" fill="#f8fafc" rx="4" />
                      <text x={midX} y={midY} textAnchor="middle" dominantBaseline="central" className="text-xs font-mono fill-slate-500">
                        {edge.cost}
                      </text>
                    </g>
                  );
                })
              )}
              
              {/* Nodes */}
              {nodes.map(node => {
                if (!layout[node]) return null;
                const isVisited = visitedNodes.includes(node);
                const visitedIndex = visitedNodes.indexOf(node);
                const isPath = pathNodes.includes(node);
                const isStart = node === startNode;
                const isGoal = node === goalNode;
                
                let fillColor = "#ffffff";
                let strokeColor = "#cbd5e1";
                
                if (isPath) {
                  fillColor = "#fbbf24"; // amber-400
                  strokeColor = "#f59e0b"; // amber-500
                } else if (isVisited) {
                  fillColor = "#e0e7ff"; // indigo-100
                  strokeColor = "#6366f1"; // indigo-500
                } else if (isStart) {
                  strokeColor = "#10b981"; // emerald-500
                  fillColor = "#d1fae5"; // emerald-100
                } else if (isGoal) {
                  strokeColor = "#f43f5e"; // rose-500
                  fillColor = "#ffe4e6"; // rose-100
                }
                
                return (
                  <g 
                    key={`node-${node}`} 
                    className="transition-all duration-500 cursor-pointer"
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle 
                      cx={layout[node].x} 
                      cy={layout[node].y} 
                      r="18" 
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth="3"
                      className="transition-all duration-500"
                    />
                    <text 
                      x={layout[node].x} 
                      y={layout[node].y} 
                      textAnchor="middle" 
                      dominantBaseline="central" 
                      className="font-bold fill-slate-700"
                    >
                      {node}
                    </text>
                    {h[node] !== undefined && (
                      <text 
                        x={layout[node].x} 
                        y={layout[node].y - 28} 
                        textAnchor="middle" 
                        className="text-xs font-mono fill-slate-500"
                      >
                        h={h[node]}
                      </text>
                    )}
                    {isVisited && (
                      <g transform={`translate(${layout[node].x + 14}, ${layout[node].y - 14})`}>
                        <circle r="9" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
                        <text textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold fill-white">
                          {visitedIndex + 1}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hovered Node Details Overlay */}
            {hoveredNode && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur p-4 rounded-xl border border-slate-200 shadow-lg w-64 pointer-events-none z-10 transition-opacity">
                <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
                  <span>Node: {hoveredNode}</span>
                  {visitedNodes.includes(hoveredNode) && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                      Step {visitedNodes.indexOf(hoveredNode) + 1}
                    </span>
                  )}
                </h4>
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Heuristic (h):</span> 
                    <span className="font-mono font-medium bg-slate-100 px-1.5 py-0.5 rounded">{h[hoveredNode] ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status:</span> 
                    <span className="font-medium">
                      {pathNodes.includes(hoveredNode) ? <span className="text-amber-600">In Path</span> : 
                       visitedNodes.includes(hoveredNode) ? <span className="text-indigo-600">Visited</span> : 
                       <span className="text-slate-500">Unvisited</span>}
                    </span>
                  </div>
                  <div className="mt-3 text-slate-500 text-xs uppercase font-semibold tracking-wider">Outgoing Edges:</div>
                  {adj[hoveredNode]?.length > 0 ? (
                    <ul className="mt-1 flex flex-col gap-1.5">
                      {adj[hoveredNode].map(e => (
                        <li key={e.to} className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">
                          <span className="text-slate-700">To <strong className="text-slate-900">{e.to}</strong></span>
                          <span className="font-mono text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">cost: {e.cost}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-slate-400 italic text-xs mt-1 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">No outgoing edges</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Algorithm Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Algorithm</th>
                  <th className="px-5 py-3.5 font-semibold">Type</th>
                  <th className="px-5 py-3.5 font-semibold">Complete</th>
                  <th className="px-5 py-3.5 font-semibold">Optimal</th>
                  <th className="px-5 py-3.5 font-semibold">Time Complexity</th>
                  <th className="px-5 py-3.5 font-semibold">Space Complexity</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ALGORITHM_INFO).map(([key, info]) => (
                  <tr key={key} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${selectedAlgorithm === key ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : ''}`}>
                    <td className="px-5 py-3 font-medium text-slate-900">{info.name} ({key})</td>
                    <td className="px-5 py-3">{info.type}</td>
                    <td className={`px-5 py-3 font-medium ${info.complete === 'Yes' ? 'text-emerald-600' : 'text-rose-600'}`}>{info.complete}</td>
                    <td className={`px-5 py-3 font-medium ${info.optimal === 'Yes' ? 'text-emerald-600' : 'text-rose-600'}`}>{info.optimal}</td>
                    <td className="px-5 py-3 font-mono text-xs">{formatComplexity(info.time)}</td>
                    <td className="px-5 py-3 font-mono text-xs">{formatComplexity(info.space)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-xs text-slate-500 flex gap-6">
            <div><span className="font-mono text-slate-700 font-medium">b</span> = branching factor</div>
            <div><span className="font-mono text-slate-700 font-medium">d</span> = depth of shallowest goal</div>
            <div><span className="font-mono text-slate-700 font-medium">m</span> = max depth of search tree</div>
            <div><span className="font-mono text-slate-700 font-medium">l</span> = depth limit of search</div>
          </div>
        </div>
      </div>
    </main>
    </div>
  );
}
