export type Graph = Record<string, { to: string, cost: number }[]>;
export type Heuristics = Record<string, number>;

function reconstructPath(cameFrom: Record<string, string | null>, current: string) {
  if (!(current in cameFrom)) return [];
  const path = [current];
  while (cameFrom[current] !== null) {
    current = cameFrom[current]!;
    path.unshift(current);
  }
  return path;
}

export function bfs(graph: Graph, start: string, goal: string) {
  const visited: string[] = [];
  const queue = [start];
  const cameFrom: Record<string, string | null> = { [start]: null };
  const seen = new Set([start]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    visited.push(current);
    if (current === goal) break;

    for (const edge of (graph[current] || [])) {
      if (!seen.has(edge.to)) {
        seen.add(edge.to);
        cameFrom[edge.to] = current;
        queue.push(edge.to);
      }
    }
  }
  return { visited, path: reconstructPath(cameFrom, goal) };
}

export function dfs(graph: Graph, start: string, goal: string) {
  const visited: string[] = [];
  const stack = [start];
  const cameFrom: Record<string, string | null> = { [start]: null };
  const seen = new Set([start]);

  while (stack.length > 0) {
    const current = stack.pop()!;
    visited.push(current);
    if (current === goal) break;

    const neighbors = graph[current] || [];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const edge = neighbors[i];
      if (!seen.has(edge.to)) {
        seen.add(edge.to);
        cameFrom[edge.to] = current;
        stack.push(edge.to);
      }
    }
  }
  return { visited, path: reconstructPath(cameFrom, goal) };
}

export function dls(graph: Graph, start: string, goal: string, limit: number = 3) {
  const visited: string[] = [];
  const cameFrom: Record<string, string | null> = { [start]: null };
  let found = false;

  function recurse(node: string, depth: number) {
    visited.push(node);
    if (node === goal) {
      found = true;
      return true;
    }
    if (depth >= limit) return false;

    for (const edge of (graph[node] || [])) {
      if (!cameFrom[edge.to]) {
        cameFrom[edge.to] = node;
        if (recurse(edge.to, depth + 1)) return true;
        if (found) return true;
        delete cameFrom[edge.to];
      }
    }
    return false;
  }

  recurse(start, 0);
  return { visited, path: found ? reconstructPath(cameFrom, goal) : [] };
}

export function ids(graph: Graph, start: string, goal: string) {
  const visited: string[] = [];
  let path: string[] = [];

  for (let limit = 0; limit < 20; limit++) {
    const cameFrom: Record<string, string | null> = { [start]: null };
    let found = false;

    function recurse(node: string, depth: number) {
      visited.push(node);
      if (node === goal) {
        found = true;
        return true;
      }
      if (depth >= limit) return false;

      for (const edge of (graph[node] || [])) {
        if (!cameFrom[edge.to]) {
          cameFrom[edge.to] = node;
          if (recurse(edge.to, depth + 1)) return true;
          if (found) return true;
          delete cameFrom[edge.to];
        }
      }
      return false;
    }

    if (recurse(start, 0)) {
      path = reconstructPath(cameFrom, goal);
      break;
    }
  }
  return { visited, path };
}

export function bds(graph: Graph, start: string, goal: string) {
  const revGraph: Graph = {};
  for (const u in graph) {
    if (!revGraph[u]) revGraph[u] = [];
    for (const edge of graph[u]) {
      if (!revGraph[edge.to]) revGraph[edge.to] = [];
      revGraph[edge.to].push({ to: u, cost: edge.cost });
    }
  }

  const visited: string[] = [];
  const qF = [start];
  const qB = [goal];
  const cameFromF: Record<string, string | null> = { [start]: null };
  const cameFromB: Record<string, string | null> = { [goal]: null };
  const seenF = new Set([start]);
  const seenB = new Set([goal]);

  let intersect: string | null = null;

  if (start === goal) return { visited: [start], path: [start] };

  while (qF.length > 0 && qB.length > 0) {
    const currF = qF.shift()!;
    visited.push(currF);
    if (seenB.has(currF)) { intersect = currF; break; }

    for (const edge of (graph[currF] || [])) {
      if (!seenF.has(edge.to)) {
        seenF.add(edge.to);
        cameFromF[edge.to] = currF;
        qF.push(edge.to);
      }
    }

    if (intersect) break;

    const currB = qB.shift()!;
    visited.push(currB);
    if (seenF.has(currB)) { intersect = currB; break; }

    for (const edge of (revGraph[currB] || [])) {
      if (!seenB.has(edge.to)) {
        seenB.add(edge.to);
        cameFromB[edge.to] = currB;
        qB.push(edge.to);
      }
    }
  }

  let path: string[] = [];
  if (intersect) {
    const pathF = reconstructPath(cameFromF, intersect);
    const pathB = reconstructPath(cameFromB, intersect).reverse().slice(1);
    path = [...pathF, ...pathB];
  }
  return { visited, path };
}

export function ucs(graph: Graph, start: string, goal: string) {
  const visited: string[] = [];
  const pq = [{ node: start, cost: 0 }];
  const cameFrom: Record<string, string | null> = { [start]: null };
  const costSoFar: Record<string, number> = { [start]: 0 };

  while (pq.length > 0) {
    pq.sort((a, b) => a.cost - b.cost);
    const { node: current } = pq.shift()!;
    visited.push(current);

    if (current === goal) break;

    for (const edge of (graph[current] || [])) {
      const newCost = costSoFar[current] + edge.cost;
      if (!(edge.to in costSoFar) || newCost < costSoFar[edge.to]) {
        costSoFar[edge.to] = newCost;
        cameFrom[edge.to] = current;
        pq.push({ node: edge.to, cost: newCost });
      }
    }
  }
  return { visited, path: reconstructPath(cameFrom, goal) };
}

export function greedy(graph: Graph, heuristics: Heuristics, start: string, goal: string) {
  const visited: string[] = [];
  const pq = [{ node: start, h: heuristics[start] || 0 }];
  const cameFrom: Record<string, string | null> = { [start]: null };
  const seen = new Set([start]);

  while (pq.length > 0) {
    pq.sort((a, b) => a.h - b.h);
    const { node: current } = pq.shift()!;
    visited.push(current);

    if (current === goal) break;

    for (const edge of (graph[current] || [])) {
      if (!seen.has(edge.to)) {
        seen.add(edge.to);
        cameFrom[edge.to] = current;
        pq.push({ node: edge.to, h: heuristics[edge.to] || 0 });
      }
    }
  }
  return { visited, path: reconstructPath(cameFrom, goal) };
}

export function astar(graph: Graph, heuristics: Heuristics, start: string, goal: string) {
  const visited: string[] = [];
  const pq = [{ node: start, f: heuristics[start] || 0 }];
  const cameFrom: Record<string, string | null> = { [start]: null };
  const costSoFar: Record<string, number> = { [start]: 0 };

  while (pq.length > 0) {
    pq.sort((a, b) => a.f - b.f);
    const { node: current } = pq.shift()!;
    visited.push(current);

    if (current === goal) break;

    for (const edge of (graph[current] || [])) {
      const newCost = costSoFar[current] + edge.cost;
      if (!(edge.to in costSoFar) || newCost < costSoFar[edge.to]) {
        costSoFar[edge.to] = newCost;
        cameFrom[edge.to] = current;
        const priority = newCost + (heuristics[edge.to] || 0);
        pq.push({ node: edge.to, f: priority });
      }
    }
  }
  return { visited, path: reconstructPath(cameFrom, goal) };
}
