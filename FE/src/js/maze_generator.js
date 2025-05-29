export const MazeGenerator = (() => {
    function generate(rows, cols) {
        const totalCells = rows * cols;
        const adj = Array.from({ length: totalCells }, () => new Set());
        const visited = Array(totalCells).fill(false);
        const stack = [];

        // Directions: [dr, dc, oppositeWallBit (optional, not used here directly)]
        // 0: Up (-1, 0), 1: Right (0, 1), 2: Down (1, 0), 3: Left (0, -1)
        const dr = [-1, 0, 1, 0]; // Delta row
        const dc = [0, 1, 0, -1]; // Delta col

        // Start from a random cell (or cell 0)
        let currentCell = Math.floor(Math.random() * totalCells);
        //let currentCell = 0;
        visited[currentCell] = true;
        stack.push(currentCell);

        let visitedCount = 1;

        while (visitedCount < totalCells) {
            const r = Math.floor(currentCell / cols);
            const c = currentCell % cols;

            const neighbors = [];
            // Check all 4 directions
            for (let i = 0; i < 4; i++) {
                const nr = r + dr[i];
                const nc = c + dc[i];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const neighborCell = nr * cols + nc;
                    if (!visited[neighborCell]) {
                        neighbors.push(neighborCell);
                    }
                }
            }

            if (neighbors.length > 0) {
                const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // Carve path
                adj[currentCell].add(nextCell);
                adj[nextCell].add(currentCell);

                stack.push(currentCell);
                currentCell = nextCell;
                visited[currentCell] = true;
                visitedCount++;
            } else if (stack.length > 0) {
                currentCell = stack.pop();
            } else {
                // Should not happen in a connected grid if starting correctly
                // Pick a new unvisited starting point if disconnected (though DFS should connect)
                let foundNewStart = false;
                for (let i = 0; i < totalCells; i++) {
                    if (!visited[i]) {
                        currentCell = i;
                        visited[i] = true;
                        stack.push(currentCell);
                        visitedCount++;
                        foundNewStart = true;
                        break;
                    }
                }
                if (!foundNewStart) break; // All visited
            }
        }

        // Default start and end points
        const startCell = 0;
        const endCell = totalCells - 1;

        return { rows, cols, adj, startCell, endCell };
    }

    return { generate };
})();