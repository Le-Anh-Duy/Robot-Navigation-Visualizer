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

// Kết hợp heuristic
function hybridHeuristic(current, unvisited, distMap) {
    const h1 = tspHeuristic(current, unvisited, distMap);
    const h2 = unvisited.length;
    return h1 + h2 * 0.5;
}


function getNeighbors(cell, rows, cols, adjacency, weights) {
    const neighbors = [];
    const walls = adjacency[cell];

    const directions = [
        { dr: -1, dc: 0, wall: 0 }, // top
        { dr: 0, dc: 1, wall: 1 },  // right
        { dr: 1, dc: 0, wall: 2 },  // bottom
        { dr: 0, dc: -1, wall: 3 }  // left
    ];

    for (const { dr, dc, wall } of directions) {
        if (!walls[wall]) {
            const r = Math.floor(cell / cols) + dr;
            const c = cell % cols + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const neighbor = r * cols + c;
                neighbors.push({ cell: neighbor, cost: weights[neighbor] });
            }
        }
    }

    return neighbors;
}

// Dijkstra tiền xử lý
function dijkstra(start, rows, cols, adjacency, weights) {
    const dist = Array(rows * cols).fill(Infinity);
    dist[start] = 0;
    const pq = [[0, start]];

    while (pq.length > 0) {
        pq.sort((a, b) => b[0] - a[0]);
        const [d, u] = pq.pop();

        for (const { cell: v, cost } of getNeighbors(u, rows, cols, adjacency, weights)) {
            const newDist = d + cost;
            if (newDist < dist[v]) {
                dist[v] = newDist;
                pq.push([newDist, v]);
            }
        }
    }

    return dist;
}

export default async function* aStar(boardData, delay = 200) {
    const { rows, cols, data } = boardData;
    const { robot: start, adjacency, dirts, weights } = data;
    const dirtsSet = new Set(dirts);
    const totalDirts = dirtsSet.size;

    const points = [start, ...dirts];
    const distMap = {};

    for (const p of points) {
        distMap[p] = dijkstra(p, rows, cols, adjacency, weights);
    }

    const visited = new Set();
    const openSet = [[0, 0, start, [start], new Set(dirtsSet.has(start) ? [start] : [])]];
    const visitedStates = new Set();

    yield {
        type: 'start',
        visited: new Set(),
        frontier: new Set([start]),
        current: start,
        path: [],
        cost: 0
    };

    while (openSet.length > 0) {
        openSet.sort((a, b) => a[0] - b[0]); // sort by f = g + h
        const [f, g, current, path, cleaned] = openSet.shift();

        const key = `${current}-${[...cleaned].sort((a, b) => a - b).join(',')}`;
        if (visitedStates.has(key)) continue;
        visitedStates.add(key);
        visited.add(current);

        yield {
            type: 'processing',
            visited: new Set(visited),
            frontier: new Set(openSet.map(x => x[2])),
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
        const h = hybridHeuristic(current, unvisited, distMap);

        for (const { cell: neighbor, cost: moveCost } of getNeighbors(current, rows, cols, adjacency, weights)) {
            const newCleaned = new Set(cleaned);
            if (dirtsSet.has(neighbor)) newCleaned.add(neighbor);

            const newPath = [...path, neighbor];
            const newG = g + moveCost;
            const newF = newG + hybridHeuristic(neighbor, dirts.filter(d => !newCleaned.has(d)), distMap);

            openSet.push([newF, newG, neighbor, newPath, newCleaned]);
        }

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
