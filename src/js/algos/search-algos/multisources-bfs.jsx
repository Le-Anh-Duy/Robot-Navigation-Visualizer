import { sleep } from "../../../utils/utils";

/**
 * Hàm BFS đơn giản từ 1 điểm tới toàn bộ lưới, trả về khoảng cách.
 */
function bfsDistances(start, rows, cols, adjacency, weights) {
    const dist = Array(rows * cols).fill(Infinity);
    const visited = new Set();
    const queue = [[start, 0]];

    dist[start] = 0;

    while (queue.length > 0) {
        const [current, d] = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);

        const walls = adjacency[current];
        const directions = [
            { dr: -1, dc: 0, wall: 0 },
            { dr: 0, dc: 1, wall: 1 },
            { dr: 1, dc: 0, wall: 2 },
            { dr: 0, dc: -1, wall: 3 }
        ];

        for (const { dr, dc, wall } of directions) {
            if (!walls[wall]) {
                const r = Math.floor(current / cols) + dr;
                const c = current % cols + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const neighbor = r * cols + c;
                    const cost = weights[neighbor];
                    if (d + cost < dist[neighbor]) {
                        dist[neighbor] = d + cost;
                        queue.push([neighbor, d + cost]);
                    }
                }
            }
        }
    }

    return dist;
}

/**
 * TSP Backtracking trên tập các điểm [start, dirt1, dirt2, ...]
 */
function tspBacktrack(distMap, points, currentIdx, visitedSet, currentCost, pathSoFar, best) {
    if (visitedSet.size === points.length) {
        if (currentCost < best.cost) {
            best.cost = currentCost;
            best.path = [...pathSoFar];
        }
        return;
    }

    for (let i = 1; i < points.length; i++) {
        if (!visitedSet.has(i)) {
            visitedSet.add(i);
            pathSoFar.push(i);
            const nextCost = currentCost + distMap[points[currentIdx]][points[i]];
            if (nextCost < best.cost) {
                tspBacktrack(distMap, points, i, visitedSet, nextCost, pathSoFar, best);
            }
            pathSoFar.pop();
            visitedSet.delete(i);
        }
    }
}

/**
 * Multiple BFS + Backtrack để tìm thứ tự đi qua các điểm bẩn tối ưu.
 */
export default async function* multiBfsBacktrack(boardData, delay = 200) {
    const { rows, cols, data } = boardData;
    const { robot: start, dirts, adjacency, weights } = data;
    const allPoints = [start, ...dirts];
    const pointIndices = allPoints; // map: index => cell

    const distMap = {};
    for (const p of allPoints) {
        distMap[p] = bfsDistances(p, rows, cols, adjacency, weights);
    }

    // yield start step
    yield {
        type: 'start',
        visited: new Set(),
        frontier: new Set([start]),
        current: start,
        path: [],
        cost: 0
    };

    await sleep(delay);

    // TSP backtrack từ start (index 0)
    const best = { cost: Infinity, path: [] };
    tspBacktrack(distMap, allPoints, 0, new Set([0]), 0, [0], best);

    // reconstruct full path in the grid
    const fullPath = [];
    let totalCost = 0;
    for (let i = 0; i < best.path.length - 1; i++) {
        const from = allPoints[best.path[i]];
        const to = allPoints[best.path[i + 1]];

        // reconstruct actual path step-by-step (BFS-based)
        const prev = Array(rows * cols).fill(null);
        const queue = [from];
        const visited = new Set([from]);

        while (queue.length > 0) {
            const current = queue.shift();
            if (current === to) break;

            const neighbors = [];
            const walls = adjacency[current];
            const directions = [
                { dr: -1, dc: 0, wall: 0 },
                { dr: 0, dc: 1, wall: 1 },
                { dr: 1, dc: 0, wall: 2 },
                { dr: 0, dc: -1, wall: 3 }
            ];

            for (const { dr, dc, wall } of directions) {
                if (!walls[wall]) {
                    const r = Math.floor(current / cols) + dr;
                    const c = current % cols + dc;
                    if (r >= 0 && r < rows && c >= 0 && c < cols) {
                        const neighbor = r * cols + c;
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            prev[neighbor] = current;
                            queue.push(neighbor);
                        }
                    }
                }
            }
        }

        // build path
        const subPath = [];
        let curr = to;
        while (curr !== null && curr !== from) {
            subPath.push(curr);
            curr = prev[curr];
        }
        subPath.push(from);
        subPath.reverse();

        for (const step of subPath.slice(i === 0 ? 0 : 1)) {
            fullPath.push(step);
            totalCost += weights[step];

            yield {
                type: 'processing',
                visited: new Set(fullPath),
                frontier: new Set(),
                current: step,
                path: [...fullPath],
                cost: totalCost
            };
            await sleep(delay);
        }
    }

    yield {
        type: 'found',
        visited: new Set(fullPath),
        frontier: new Set(),
        current: fullPath.at(-1),
        path: fullPath,
        cost: totalCost
    };
}
