import { getNeighbors } from "./utils.js";
import { sleep } from "./utils.js";

export    async function* dfs(mazeData, animationDelay) {
        const { rows, cols, adj, startCell, endCell } = mazeData;
        const stack = [startCell]; // Stores cells to visit
        const visited = new Set();    // Cells whose processing is complete
        const pathStack = [startCell]; // Current path being explored
        const cameFrom = new Map();   // For path reconstruction (alternative to pathStack)
        
        // Use a different set for cells currently in the recursion stack or exploration path for visualization
        const exploring = new Set([startCell]); 

        yield { type: 'start', visited: new Set(visited), frontier: new Set(exploring), current: startCell, path: [] };
        await sleep(animationDelay);

        while (stack.length > 0) {
            const currentCell = stack[stack.length - 1]; // Peek

            if (!visited.has(currentCell)) {
                visited.add(currentCell);
                exploring.add(currentCell); // Mark as currently exploring

                yield { type: 'processing', visited: new Set(visited), frontier: new Set(exploring), current: currentCell, path: [] };
                await sleep(animationDelay);

                if (currentCell === endCell) {
                    const path = [];
                    let temp = endCell;
                    while (temp !== startCell) {
                        path.push(temp);
                         if (!cameFrom.has(temp) && temp !== startCell) break;
                        temp = cameFrom.get(temp);
                    }
                    path.push(startCell);
                    yield { type: 'found', visited: new Set(visited), frontier: new Set(), current: currentCell, path: path.reverse() };
                    return;
                }
            }

            const neighbors = getNeighbors(currentCell, rows, cols, adj);
            let foundNext = false;
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor) && !exploring.has(neighbor)) { // Don't go back to parent in current path
                    cameFrom.set(neighbor, currentCell);
                    stack.push(neighbor);
                    exploring.add(neighbor); // Add to exploration path
                    
                    yield { type: 'frontierUpdate', visited: new Set(visited), frontier: new Set(exploring), current: currentCell, path: [] };
                    await sleep(animationDelay);
                    foundNext = true;
                    break; 
                }
            }

            if (!foundNext) {
                stack.pop(); // Backtrack
                exploring.delete(currentCell); // Remove from current exploration path
                if (stack.length > 0) {
                     yield { type: 'backtrack', visited: new Set(visited), frontier: new Set(exploring), current: stack[stack.length-1], path: [] };
                     await sleep(animationDelay);
                }
            }
        }
        yield { type: 'notFound', visited: new Set(visited), frontier: new Set(), current: -1, path: [] };
    }