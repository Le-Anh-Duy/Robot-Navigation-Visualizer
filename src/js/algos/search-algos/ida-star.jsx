import { sleep } from "../../../utils/utils";

function getNeighborsWithWeights(cell, rows, cols, adjacency, weights) {
    const neighbors = [];
    const walls = adjacency[cell];
    const directions = [
        { dr: -1, dc: 0, wall: 0 },
        { dr: 0, dc: 1, wall: 1 },
        { dr: 1, dc: 0, wall: 2 },
        { dr: 0, dc: -1, wall: 3 }
    ];
    for (let i = 0; i < directions.length; i++) {
        const { dr, dc, wall } = directions[i];
        if (!walls[wall]) {
            const r = Math.floor(cell / cols) + dr;
            const c = cell % cols + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const neighbor = r * cols + c;
                const weight = weights[neighbor];
                neighbors.push({ cell: neighbor, weight });
            }
        }
    }
    return neighbors;
}

function dijkstraWithSteps(start, rows, cols, adjacency, weights) {
    const dist = Array(rows * cols).fill(Infinity);
    const prev = Array(rows * cols).fill(null);
    dist[start] = 0;
    const visited = new Set();
    const pq = [[0, start]];
    const steps = [];

    while (pq.length > 0) {
        pq.sort((a, b) => b[0] - a[0]);
        const [cost, node] = pq.pop();
        if (visited.has(node)) continue;
        visited.add(node);

        steps.push({
            type: 'found',
            visited: new Set([...visited]),
            frontier: new Set(pq.map(x => x[1])),
            current: node,
            path: [],
            cost
        });

        const neighbors = getNeighborsWithWeights(node, rows, cols, adjacency, weights);
        for (const { cell: neighbor, weight } of neighbors) {
            const newCost = cost + weight;
            if (newCost < dist[neighbor]) {
                dist[neighbor] = newCost;
                prev[neighbor] = node;
                pq.push([newCost, neighbor]);
            }
        }
    }

    return { dist, prev, steps };
}

function reconstructPath(prev, from, to) {
    const path = [];
    let current = to;
    while (current !== null && current !== from) {
        path.push(current);
        current = prev[current];
    }
    if (current === from) path.push(from);
    return path.reverse();
}

function tspHeuristic(current, unvisited, distMap) {
    if (unvisited.length === 0) return 0;
    let minToUnvisited = Infinity;
    for (const u of unvisited) {
        minToUnvisited = Math.min(minToUnvisited, distMap[current][u]);
    }
    const parent = {};
    const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
    const union = (x, y) => {
        const px = find(x);
        const py = find(y);
        if (px !== py) parent[px] = py;
    };
    for (const u of unvisited) parent[u] = u;
    const edges = [];
    for (let i = 0; i < unvisited.length; i++) {
        for (let j = i + 1; j < unvisited.length; j++) {
            edges.push([distMap[unvisited[i]][unvisited[j]], unvisited[i], unvisited[j]]);
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

export default async function* idaTSP(boardData, delay = 200) {
    const { rows, cols, data } = boardData;
    const { robot: start, adjacency, dirts, weights } = data;
    const points = [start, ...dirts];
    const distMap = {};
    const prevMap = {};
    const allSteps = [];
    let finalPath = [];

    for (const p of points) {
        const { dist, prev, steps } = dijkstraWithSteps(p, rows, cols, adjacency, weights);
        distMap[p] = dist;
        prevMap[p] = prev;
        allSteps.push(...steps);
    }

    const allDirts = new Set(dirts);
    const visitedAll = (set) => set.size === allDirts.size;
    let threshold = tspHeuristic(start, [...dirts], distMap);
    let found = false;
    const totalVisited = new Set();

    while (!found && threshold < Infinity) {
        const stack = [[start, new Set(), [start], 0]];
        let nextThreshold = Infinity;

        while (stack.length > 0) {
            const [current, visited, sequence, g] = stack.pop();
            const remaining = [...dirts].filter(d => !visited.has(d));
            const h = tspHeuristic(current, remaining, distMap);
            const f = g + h;

            const frontier = new Set(stack.map(s => s[0]));
            allSteps.push({
                type: sequence.length === 1 ? 'start' : 'processing',
                visited: new Set([...totalVisited, ...visited]),
                frontier,
                current,
                path: sequence,
                cost: g,
                f_cost: f,
                threshold
            });

            totalVisited.add(current);

            if (f > threshold) {
                nextThreshold = Math.min(nextThreshold, f);
                continue;
            }

            if (visitedAll(visited)) {
                let fullPath = [];

                for (let i = 0; i < sequence.length - 1; i++) {
                    const from = sequence[i];
                    const to = sequence[i + 1];
                    const subPath = reconstructPath(prevMap[from], from, to);
                    fullPath.push(...(i === 0 ? subPath : subPath.slice(1)));
                }

                finalPath = fullPath;

                allSteps.push({
                    type: 'found',
                    visited: new Set([...totalVisited, ...visited]),
                    frontier: new Set(),
                    current: fullPath.at(-1),
                    path: fullPath,
                    cost: g
                });

                found = true;
                break;
            }

            for (const next of remaining) {
                const newVisited = new Set(visited);
                newVisited.add(next);
                const newSequence = [...sequence, next];
                const newG = g + distMap[current][next];

                let constructedPath = [];
                for (let i = 0; i < newSequence.length - 1; i++) {
                    const from = newSequence[i];
                    const to = newSequence[i + 1];
                    const segment = reconstructPath(prevMap[from], from, to);
                    constructedPath.push(...(i === 0 ? segment : segment.slice(1)));
                }

                allSteps.push({
                    type: 'processing',
                    visited: constructedPath,
                    frontier:[],
                    current: next,
                    path: [],
                    cost: newG
                });

                stack.push([next, newVisited, newSequence, newG]);
            }
        }
        if (found) break;
        threshold = nextThreshold;
    }

    // ✅ Từng bước cuối cùng: mô phỏng robot thật sự đi qua từng ô
    if (finalPath.length > 0) {
        for (let i = 0; i < finalPath.length; i++) {
            const stepPath = finalPath.slice(0, i + 1);
            allSteps.push({
                type: 'processing',
                visited: new Set(),
                frontier: new Set(),
                current: finalPath[i],
                path: stepPath,
                cost: i
            });
        }
    }

    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}
