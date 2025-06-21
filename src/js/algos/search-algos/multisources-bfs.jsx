import { sleep } from "../../../utils/utils";

function getNeighbors(cell, rows, cols, adjacency) {
    const neighbors = [];
    const walls = adjacency[cell]; // [top, right, bottom, left]

    if (!walls[0] && cell >= cols) neighbors.push(cell - cols);
    if (!walls[1] && (cell + 1) % cols !== 0) neighbors.push(cell + 1);
    if (!walls[2] && cell < (rows - 1) * cols) neighbors.push(cell + cols);
    if (!walls[3] && cell % cols !== 0) neighbors.push(cell - 1);

    return neighbors;
}

export default async function* multiSourceBFS(boardData, delay = 200) {
    const allSteps = [];
    const { rows, cols, data } = boardData;
    const { robot: startNode, adjacency, dirts } = data;

    const totalDirts = dirts.length;

    if (totalDirts === 0) {
        allSteps.push({
            type: 'found',
            visited: new Set([startNode]),
            frontier: new Set(),
            current: startNode,
            path: [startNode],
            cost: 0,
        });
    } else {
        const queue = [];
        const visitedStates = new Set();

        // Mỗi trạng thái: [vị trí hiện tại, đường đi, tập hợp ô bẩn đã đi qua]
        const initialState = [startNode, [startNode], new Set()];
        queue.push(initialState);

        const initialKey = `${startNode}-`;
        visitedStates.add(initialKey);

        allSteps.push({
            type: 'start',
            visited: new Set(),
            frontier: new Set([startNode]),
            current: startNode,
            path: [],
            cost: 0,
        });

        const dirtsSet = new Set(dirts);
        const processedCells = new Set();
        let solutionFound = false;

        while (queue.length > 0) {
            const [current, path, visitedDirts] = queue.shift();
            processedCells.add(current);

            const frontierSet = new Set(queue.map(item => item[0]));
            allSteps.push({
                type: 'processing',
                visited: new Set(processedCells),
                frontier: frontierSet,
                current,
                path,
                cost: path.length - 1,
            });

            const newVisitedDirts = new Set(visitedDirts);
            if (dirtsSet.has(current)) {
                newVisitedDirts.add(current);
            }

            if (newVisitedDirts.size === totalDirts) {
                allSteps.push({
                    type: 'found',
                    visited: new Set(processedCells),
                    frontier: frontierSet,
                    current,
                    path,
                    cost: path.length - 1,
                });
                solutionFound = true;
                break;
            }

            const neighbors = getNeighbors(current, rows, cols, adjacency);
            for (const neighbor of neighbors) {
                const newPath = [...path, neighbor];
                const updatedDirts = new Set(newVisitedDirts);
                if (dirtsSet.has(neighbor)) updatedDirts.add(neighbor);

                const dirtsKey = [...updatedDirts].sort((a, b) => a - b).join(',');
                const stateKey = `${neighbor}-${dirtsKey}`;

                if (!visitedStates.has(stateKey)) {
                    visitedStates.add(stateKey);
                    queue.push([neighbor, newPath, updatedDirts]);
                }
            }
        }

        if (!solutionFound) {
            allSteps.push({
                type: 'not_found',
                visited: new Set(processedCells),
                frontier: new Set(),
                current: null,
                path: [],
                cost: -1,
                message: 'No path found to clean all dirts.',
            });
        }
    }

    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}
