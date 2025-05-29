import { getNeighbors } from "./utils.js";
import { sleep } from "./utils.js";

export   async function* bfs(mazeData, animationDelay) {
        const { rows, cols, adj, startCell, endCell } = mazeData;
        const queue = [startCell]; // Store only cells, path reconstructed later
        const visited = new Set([startCell]);
        const cameFrom = new Map();

        yield { type: 'start', visited: new Set(visited), frontier: new Set(queue), current: -1, path: [] };
        await sleep(animationDelay);

        while (queue.length > 0) {
            const currentCell = queue.shift();

            yield { type: 'processing', visited: new Set(visited), frontier: new Set(queue), current: currentCell, path: [] };
            await sleep(animationDelay);

            if (currentCell === endCell) {
                const path = [];
                let temp = endCell;
                while (temp !== startCell) {
                    path.push(temp);
                    if (!cameFrom.has(temp)) break; // Should not happen if path found
                    temp = cameFrom.get(temp);
                }
                path.push(startCell);
                yield { type: 'found', visited: new Set(visited), frontier: new Set(), current: currentCell, path: path.reverse() };
                return;
            }

            const neighbors = getNeighbors(currentCell, rows, cols, adj);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    cameFrom.set(neighbor, currentCell);
                    queue.push(neighbor);
                    yield { type: 'frontierUpdate', visited: new Set(visited), frontier: new Set(queue), current: currentCell, path: [] };
                    await sleep(animationDelay);
                }
            }
        }
        yield { type: 'notFound', visited: new Set(visited), frontier: new Set(), current: -1, path: [] };
    }