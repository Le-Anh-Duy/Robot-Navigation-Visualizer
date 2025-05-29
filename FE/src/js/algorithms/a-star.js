import { PriorityQueue } from './utils.js';
import { getNeighbors } from './utils.js';
import { sleep } from './utils.js';

export     async function* aStar(mazeData, heuristicFnName, animationDelay) {
        const { rows, cols, adj, startCell, endCell } = mazeData;

        const heuristic = (cellA, cellB) => {
            const rA = Math.floor(cellA / cols), cA = cellA % cols;
            const rB = Math.floor(cellB / cols), cB = cellB % cols;
            if (heuristicFnName === 'manhattan') return Math.abs(rA - rB) + Math.abs(cA - cB);
            if (heuristicFnName === 'euclidean') return Math.sqrt(Math.pow(rA - rB, 2) + Math.pow(cA - cB, 2));
            return 0;
        };

        const openSet = new PriorityQueue((a, b) => a.fScore < b.fScore);
        openSet.push({ cell: startCell, fScore: heuristic(startCell, endCell), gScore: 0 });
        
        const cameFrom = new Map();
        const gScore = new Map();
        gScore.set(startCell, 0);

        const visitedForDrawing = new Set(); // Cells that have been popped from openSet (closed set)
        const frontierForDrawing = new Set([startCell]); // Cells currently in openSet

        yield { type: 'start', visited: new Set(visitedForDrawing), frontier: new Set(frontierForDrawing), current: -1, path: [] };
        await sleep(animationDelay);

        while (!openSet.isEmpty()) {
            const currentItem = openSet.pop();
            const currentCell = currentItem.cell;

            visitedForDrawing.add(currentCell);
            frontierForDrawing.delete(currentCell); // Moved from open to closed

            yield { type: 'processing', visited: new Set(visitedForDrawing), frontier: new Set(frontierForDrawing), current: currentCell, path: [] };
            await sleep(animationDelay);

            if (currentCell === endCell) {
                const path = [];
                let temp = endCell;
                while (cameFrom.has(temp)) {
                    path.push(temp);
                    temp = cameFrom.get(temp);
                }
                path.push(startCell);
                yield { type: 'found', visited: new Set(visitedForDrawing), frontier: new Set(frontierForDrawing), current: currentCell, path: path.reverse() };
                return;
            }

            const neighbors = getNeighbors(currentCell, rows, cols, adj);
            for (const neighbor of neighbors) {
                if (visitedForDrawing.has(neighbor)) continue; // Already processed

                const tentativeGScore = gScore.get(currentCell) + 1;

                if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
                    cameFrom.set(neighbor, currentCell);
                    gScore.set(neighbor, tentativeGScore);
                    const fScore = tentativeGScore + heuristic(neighbor, endCell);
                    
                    // If neighbor not in openSet, add it. If it is, PQ handles update implicitly if new fScore is better.
                    // For visualization, explicitly add to frontier.
                    if(!frontierForDrawing.has(neighbor)){
                        openSet.push({ cell: neighbor, fScore, gScore: tentativeGScore });
                        frontierForDrawing.add(neighbor);
                    }
                    // Note: A more complex PQ might have an updateKey method.
                    // Our simple PQ might add duplicates if a node is re-added with a better score.
                    // The one with the better score (lower fScore) will be popped first.
                    // For visualization, this is fine.

                    yield { type: 'frontierUpdate', visited: new Set(visitedForDrawing), frontier: new Set(frontierForDrawing), current: currentCell, path: [] };
                    await sleep(animationDelay);
                }
            }
        }
        yield { type: 'notFound', visited: new Set(visitedForDrawing), frontier: new Set(frontierForDrawing), current: -1, path: [] };
    }