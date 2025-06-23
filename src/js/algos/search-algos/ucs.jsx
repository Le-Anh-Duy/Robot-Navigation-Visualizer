import { sleep } from "../../../utils/utils";



function getNeighbors(cell, rows, cols, adjacency, weights) {
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
                neighbors.push({ cell: neighbor, cost: weight });
            }
        }
    }

    return neighbors;
}

export default async function* ucsAlgo(boardData, delay = 200) {
    const { rows, cols, data } = boardData;
    const { robot: start, adjacency, dirts, weights } = data;

    const dirtsToClean = new Set(dirts);
    const totalDirts = dirtsToClean.size;

    const allSteps = [];

    // Priority Queue: [totalCost, currentCell, path, cleanedDirts]
    const pq = [[0, start, [start], new Set(dirtsToClean.has(start) ? [start] : [])]];
    const visitedStates = new Set();

    const startKey = `${start}-${[...pq[0][3]].sort((a, b) => a - b).join(',')}`;
    visitedStates.add(startKey);

    allSteps.push({
        type: 'start',
        visited: new Set(),
        frontier: new Set([start]),
        current: start,
        path: [],
        cost: 0
    });

    const processed = new Set();

    while (pq.length > 0) {
        // Sort PQ để đảm bảo lấy phần tử chi phí nhỏ nhất
        pq.sort((a, b) => a[0] - b[0]);
        const [cost, current, path, cleaned] = pq.shift();

        processed.add(current);
        allSteps.push({
            type: 'processing',
            visited: new Set(processed),
            frontier: new Set(pq.map(x => x[1])),
            current,
            path,
            cost
        });

        if (cleaned.size === totalDirts) {
            allSteps.push({
                type: 'found',
                visited: new Set(processed),
                frontier: new Set(),
                current,
                path,
                cost
            });
            break;
        }

        const neighbors = getNeighbors(current, rows, cols, adjacency, weights);
        for (const { cell: neighbor, cost: moveCost } of neighbors) {
            const newPath = [...path, neighbor];
            const newCleaned = new Set(cleaned);
            if (dirtsToClean.has(neighbor)) {
                newCleaned.add(neighbor);
            }

            const key = `${neighbor}-${[...newCleaned].sort((a, b) => a - b).join(',')}`;
            if (!visitedStates.has(key)) {
                visitedStates.add(key);
                pq.push([cost + moveCost, neighbor, newPath, newCleaned]);
            }
        }
    }

    // Nếu không tìm thấy
    if (allSteps[allSteps.length - 1]?.type !== 'found') {
        allSteps.push({
            type: 'found',
            visited: new Set(processed),
            frontier: new Set(),
            current: null,
            path: [],
            cost: -1,
            message: 'No path found to clean all dirts.'
        });
    }

    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}
