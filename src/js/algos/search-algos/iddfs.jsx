import { sleep } from "../../../utils/utils";

function getNeighbors(cell, rows, cols, adjacency) {
    const neighbors = [];
    const walls = adjacency[cell];

    if (!walls[0]) neighbors.push(cell - cols); // top
    if (!walls[1] && (cell + 1) % cols !== 0) neighbors.push(cell + 1); // right
    if (!walls[2]) neighbors.push(cell + cols); // bottom
    if (!walls[3] && cell % cols !== 0) neighbors.push(cell - 1); // left

    return neighbors;
}

async function* dls(boardData, start, limit, dirtsSet, allSteps, delay) {
    const { rows, cols, data } = boardData;
    const { adjacency } = data;

    const stack = [[start, [start], new Set(dirtsSet.has(start) ? [start] : []), 0]];
    const visitedStates = new Set();
    const visited = new Set();

    while (stack.length > 0) {
        const [current, path, cleaned, depth] = stack.pop();

        const key = `${current}-${[...cleaned].sort((a, b) => a - b).join(',')}`;
        if (visitedStates.has(key)) continue;
        visitedStates.add(key);
        visited.add(current);

        allSteps.push({
            type: depth === 0 ? "start" : "processing",
            visited: new Set(visited),
            frontier: new Set(stack.map(s => s[0])),
            current,
            path,
            cost: path.length - 1,
        });

        if (cleaned.size === dirtsSet.size) {
            allSteps.push({
                type: "found",
                visited: new Set(visited),
                frontier: new Set(),
                current,
                path,
                cost: path.length - 1,
            });
            return true;
        }

        if (depth < limit) {
            const neighbors = getNeighbors(current, rows, cols, adjacency).reverse();
            for (const neighbor of neighbors) {
                const newPath = [...path, neighbor];
                const newCleaned = new Set(cleaned);
                if (dirtsSet.has(neighbor)) newCleaned.add(neighbor);

                stack.push([neighbor, newPath, newCleaned, depth + 1]);
            }
        }

        await sleep(delay);
    }

    return false;
}

export default async function* iddfs(boardData, delay = 200, maxDepth = 50) {
    const { data } = boardData;
    const { robot: start, dirts } = data;

    const dirtsSet = new Set(dirts);
    const allSteps = [];

    for (let depth = 0; depth <= maxDepth; depth++) {
        const found = await dls(boardData, start, depth, dirtsSet, allSteps, delay);
        if (found) break;
    }

    if (allSteps.length === 0 || allSteps[allSteps.length - 1].type !== "found") {
        allSteps.push({
            type: "found",
            visited: new Set(),
            frontier: new Set(),
            current: null,
            path: [],
            cost: -1,
        });
    }

    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}
