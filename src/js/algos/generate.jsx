export default function generate(rows, cols, nDirt, hasWeight, acyclic) {
    const adjacency = Array.from({ length: rows * cols }, () => Array(4).fill(true));
    const weights = Array.from({ length: rows * cols }, () => (hasWeight ? Math.random() * 10 : 1));
    const dirts = new Set();

    // top, right, bottom, left
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];

    let root = Math.floor(Math.random() * (rows * cols));
    let stack = [root];
    let visited = new Set([root]);
    let edges = [];

    // Generate a random spanning tree using wilson's algorithm (or a similar traversal)
    // Note: The provided logic for spanning tree generation seems to be a variation
    // of DFS/random walk, not strictly Wilson's algorithm, but it will generate
    // a connected component. For a true random spanning tree, algorithms like
    // Prim's or Kruskal's (with random weights) or Wilson's Loop-Erased Random Walk
    // are more common. However, for generating a maze-like structure, this is often sufficient.
    
    // The current loop only explores from the 'stack' and adds to 'visited' and 'stack'.
    // It doesn't guarantee connecting all cells if the initial `root` and random walk
    // doesn't reach all parts. A more robust generation for a full maze might use a
    // different approach (e.g., ensure all cells are visited before stopping).
    // For a simple spanning tree for pathfinding, this might be okay if it connects.
    // Let's assume it's intended to connect the grid or be sufficient for the purpose.

    // A more typical spanning tree approach might involve a `while (visited.size < rows * cols)` loop
    // and randomly picking a visited cell to extend from, or iteratively building.
    // The current loop structure looks like it attempts to build a path from a single root.
    // Let's modify it to be more robust for maze generation.

    // --- REVISED SPANNING TREE GENERATION (More robust for full maze) ---
    // Using a modified Prim's-like approach or simple DFS/BFS for a spanning tree
    let allCells = new Set(Array.from({ length: rows * cols }, (_, i) => i));
    let remainingCells = new Set(allCells);
    let startCell = Math.floor(Math.random() * (rows * cols));
    let frontier = [startCell]; // Cells to explore from
    remainingCells.delete(startCell);

    while (frontier.length > 0 && remainingCells.size > 0) {
        // Pick a random cell from the frontier to expand from
        let currentIdx = Math.floor(Math.random() * frontier.length);
        let current = frontier[currentIdx];
        frontier.splice(currentIdx, 1); // Remove from frontier

        // Get unvisited neighbors
        let unvisitedNeighbors = [];
        for (let i = 0; i < 4; i++) {
            let cellX = Math.floor(current / cols);
            let cellY = current % cols;

            let nx = cellX + dy[i];
            let ny = cellY + dx[i];

            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                let neighbor = nx * cols + ny;
                if (remainingCells.has(neighbor)) {
                    unvisitedNeighbors.push({ neighbor: neighbor, direction: i });
                }
            }
        }

        if (unvisitedNeighbors.length > 0) {
            // Pick a random unvisited neighbor to connect
            let randNeighbor = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
            let neighbor = randNeighbor.neighbor;
            let direction = randNeighbor.direction;

            adjacency[current][direction] = false; // Remove wall in the direction to neighbor
            adjacency[neighbor][(direction + 2) % 4] = false; // Remove wall in the reverse direction

            remainingCells.delete(neighbor);
            frontier.push(current); // Put current back to frontier to potentially explore other paths
            frontier.push(neighbor); // Add new visited neighbor to frontier
        }
    }
    // --- END REVISED SPANNING TREE GENERATION ---

    if (!acyclic) {
        let cells = rows * cols;
        // Add a proportion of cells as additional edges
        let maxAdditionalEdges = Math.round(cells / 10); // Example: 10% of cells can have an extra wall removed
        let addedEdgesCount = 0;

        // Iterate through all cells and their potential neighbors
        for (let i = 0; i < cells && addedEdgesCount < maxAdditionalEdges; i++) {
            for (let j = 0; j < 4 && addedEdgesCount < maxAdditionalEdges; j++) {
                // Only consider adding an edge if it doesn't already exist
                if (adjacency[i][j]) {
                    let cellX = Math.floor(i / cols);
                    let cellY = i % cols;

                    let nx = cellX + dy[j];
                    let ny = cellY + dx[j];

                    // Check bounds for neighbor
                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                        let neighbor = nx * cols + ny;
                        // Add edge with a certain probability
                        if (Math.random() < 0.2) { // 20% chance to add this non-existing edge
                            adjacency[i][j] = false;
                            adjacency[neighbor][(j + 2) % 4] = false;
                            addedEdgesCount++;
                        }
                    }
                }
            }
        }
    }


    // Place dirt randomly
    for (let i = 0; i < nDirt; i++) {
        let cellIndex;
        do {
            cellIndex = Math.floor(Math.random() * (rows * cols));
        } while (dirts.has(cellIndex)); // Ensure no duplicate dirt
        dirts.add(cellIndex);
    }

    if (hasWeight) {
        // Ensure that weights are non-negative and not too high
        for (let i = 0; i < weights.length; i++) {
            weights[i] = Math.max(1, Math.min(Math.round(weights[i] * 5) + 1, 10)); // Scale to 1-10 integer weights
        }
    } else {
        // If no weights are requested, set all weights to 1
        for (let i = 0; i < weights.length; i++) {
            weights[i] = 1;
        }
    }

    return {
        adjacency,
        weights,
        dirts,
    };
}