<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Algorithm Visualizer

**An interactive web application to visualize classic graph search algorithms step by step.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Overview

Algorithm Visualizer is an educational tool that brings graph search algorithms to life. Watch how BFS explores level by level, how A\* uses heuristics to find the optimal path, or how DFS dives deep before backtracking — all animated on an interactive graph canvas.

Define your own graph, set start and goal nodes, pick an algorithm, and hit **Play** to see it unfold in real time.

---

## Features

- 🎯 **8 Search Algorithms** — both uninformed and informed strategies
- 🖊️ **Custom Graph Input** — define any directed, weighted graph as plain text
- 📐 **Heuristic Editor** — set per-node heuristic values for informed searches
- 🎬 **Step-by-step Animation** — nodes highlight as they are visited; the final path is shown in amber
- 📊 **Algorithm Info Panel** — instant summary of completeness, optimality, and time/space complexity
- ⚡ **Fast Dev Workflow** — powered by Vite with Hot Module Replacement

---

## Algorithms

### Uninformed Search

| Algorithm | Complete | Optimal | Time | Space |
|-----------|----------|---------|------|-------|
| **BFS** — Breadth-First Search | ✅ | ✅ | O(b^d) | O(b^(d+1)) |
| **DFS** — Depth-First Search | ❌ | ❌ | O(b^m) | O(bm) |
| **DLS** — Depth-Limited Search | ❌ | ❌ | O(b^l) | O(bl) |
| **IDS** — Iterative Deepening Search | ✅ | ✅ | O(b^d) | O(bd) |
| **BDS** — Bidirectional Search | ✅ | ✅ | O(b^(d/2)) | O(b^(d/2)) |
| **UCS** — Uniform Cost Search | ✅ | ✅ | O(b^d) | O(b^(d+1)) |

### Informed Search (Heuristic-based)

| Algorithm | Complete | Optimal | Time | Space |
|-----------|----------|---------|------|-------|
| **Greedy Best-First Search** | ❌ | ❌ | O(b^m) | O(b^m) |
| **A\* Search** | ✅ | ✅ | O(b^d) | O(b^d) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 |
| Language | TypeScript 5.8 |
| Build Tool | Vite 6.2 |
| Styling | Tailwind CSS 4 |
| Animation | Motion 12 |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or later recommended)

### Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at **http://localhost:3000**.

### Build for Production

```bash
npm run build
```

The optimized output will be in the `dist/` directory. Use `npm run preview` to serve it locally.

---

## Usage

1. **Select an Algorithm** — choose from the dropdown in the top-left panel.
2. **Edit the Graph** — define edges in the text area using the format:
   ```
   S -> A:1, B:4
   A -> C:2, D:5, G:12
   B -> E:2
   ```
   Each line is `Node -> Neighbour:Cost, ...`
3. **Set Heuristics** *(informed algorithms only)* — enter per-node heuristic values:
   ```
   S: 7
   A: 6
   B: 2
   G: 0
   ```
4. **Set Start / Goal Nodes** — type the node labels in the input fields.
5. **Press Play** — watch the algorithm animate through the graph. Visited nodes turn indigo; the shortest path turns amber.
6. **Press Reset** — clear the animation and try a different algorithm or graph.

---

## Project Structure

```
Algortihm_Visualizer/
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── src/
    ├── main.tsx         # React entry point
    ├── App.tsx          # Main UI component
    ├── algorithms.ts    # All algorithm implementations
    └── index.css        # Global styles and animations
```

---

## License

This project is open source. Feel free to fork, extend, and learn from it.
