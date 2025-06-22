import { sleep } from "../../../utils/utils";

// TSP heuristic = nearest + MST
function tspHeuristic(current, unvisited, distMap) {
    if (unvisited.length === 0) return 0;

    let minToUnvisited = Math.min(...unvisited.map(u => distMap[current][u]));

    const parent = {};
    const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
    const union = (x, y) => {
        const px = find(x), py = find(y);
        if (px !== py) parent[px] = py;
    };

    for (const u of unvisited) parent[u] = u;
    const edges = [];

    for (let i = 0; i < unvisited.length; i++) {
        for (let j = i + 1; j < unvisited.length; j++) {
            const u = unvisited[i], v = unvisited[j];
            edges.push([distMap[u][v], u, v]);
        }
    }

    edges.sort((a, b) => a[0] - b[0]);

    let mstCost = 0;
    for (const [w, u, v] of edges) {
        if (find(u) !== find(v)) {
            mstCost += w;
            union(u, v);
        }
    }

    return minToUnvisited + mstCost;
}

function getNeighbors(cell, rows, cols, adjacency) {
    const neighbors = [];
    const walls = adjacency[cell];

    if (!walls[0] && cell >= cols) neighbors.push(cell - cols);     // top
    if (!walls[1] && (cell + 1) % cols !== 0) neighbors.push(cell + 1); // right
    if (!walls[2] && cell < (rows - 1) * cols) neighbors.push(cell + cols); // bottom
    if (!walls[3] && cell % cols !== 0) neighbors.push(cell - 1);     // left

    return neighbors;
}

export default async function* beamSearch(boardData, delay = 200, beamWidth = 3) {
    const { rows, cols, data } = boardData;
    const { robot: start, adjacency, dirts, weights } = data;
    const dirtsSet = new Set(dirts);
    const totalDirts = dirtsSet.size;

    const visited = new Set();
    const visitedStates = new Set();

    // Precompute distances between all important points using Dijkstra
    const points = [start, ...dirts];
    const distMap = {};
    for (const p of points) {
        const dist = Array(rows * cols).fill(Infinity);
        dist[p] = 0;
        const pq = [[0, p]];
        while (pq.length > 0) {
            pq.sort((a, b) => b[0] - a[0]);
            const [cost, node] = pq.pop();
            const neighbors = getNeighbors(node, rows, cols, adjacency);
            for (const next of neighbors) {
                const moveCost = weights[next];
                const newCost = cost + moveCost;
                if (newCost < dist[next]) {
                    dist[next] = newCost;
                    pq.push([newCost, next]);
                }
            }
        }
        distMap[p] = dist;
    }

    yield {
        type: 'start',
        visited: new Set(),
        frontier: new Set([start]),
        current: start,
        path: [],
        cost: 0
    };

    let frontier = [[0, 0, start, [start], new Set(dirtsSet.has(start) ? [start] : [])]];

    while (frontier.length > 0) {
        const newFrontier = [];

        for (const [f, g, current, path, cleaned] of frontier) {
            const key = `${current}-${[...cleaned].sort((a, b) => a - b).join(',')}`;
            if (visitedStates.has(key)) continue;
            visitedStates.add(key);
            visited.add(current);

            yield {
                type: 'processing',
                visited: new Set(visited),
                frontier: new Set(frontier.map(x => x[2])),
                current,
                path,
                cost: g
            };

            if (cleaned.size === totalDirts) {
                yield {
                    type: 'found',
                    visited: new Set(visited),
                    frontier: new Set(),
                    current,
                    path,
                    cost: g
                };
                return;
            }

            const unvisited = dirts.filter(d => !cleaned.has(d));
            const neighbors = getNeighbors(current, rows, cols, adjacency);
            for (const neighbor of neighbors) {
                const moveCost = weights[neighbor];
                const newCleaned = new Set(cleaned);
                if (dirtsSet.has(neighbor)) newCleaned.add(neighbor);

                const newPath = [...path, neighbor];
                const newG = g + moveCost;
                const unvisitedAfter = dirts.filter(d => !newCleaned.has(d));
                const h = tspHeuristic(neighbor, unvisitedAfter, distMap);
                const newF = newG + h;

                newFrontier.push([newF, newG, neighbor, newPath, newCleaned]);
            }
        }

        newFrontier.sort((a, b) => a[0] - b[0]);
        frontier = newFrontier.slice(0, beamWidth);

        await sleep(delay);
    }

    yield {
        type: 'found',
        visited: new Set(visited),
        frontier: new Set(),
        current: null,
        path: [],
        cost: -1
    };
}
