// Adapted from user-provided maze.js
export const MazeRenderer = (() => {
    let canvas, ctx;
    let mazeData = {
        rows: 0,
        cols: 0,
        adj: [],
        startCell: -1,
        endCell: -1,
        cellSize: 20,
        wallColor: 'black',
        pathColor: 'white',
        startColor: 'green',
        endColor: 'red',
        solutionPathColor: 'blue',
        visitedCellColor: 'rgba(173, 216, 230, 0.7)', // LightBlue with alpha
        frontierColor: 'rgba(211, 211, 211, 0.7)',   // LightGray with alpha
        currentProcessingColor: 'rgba(255, 165, 0, 0.8)', // Orange with alpha
        wallThickness: 2
    };
    let pickMode = null;

    function init(canvasId) {
        canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error("Canvas element not found:", canvasId);
            return false;
        }
        ctx = canvas.getContext('2d');
        
        canvas.addEventListener('click', handleCanvasClick);
        return true;
    }
    
    function setPickMode(mode) { // mode can be 'start', 'end', or null
        pickMode = mode;
        const instructionEl = document.getElementById('clickInstruction');
        if (pickMode === 'start') {
            instructionEl.textContent = 'Click on the maze to set the start point.';
        } else if (pickMode === 'end') {
            instructionEl.textContent = 'Click on the maze to set the end point.';
        } else {
            instructionEl.textContent = '';
        }
    }

    function handleCanvasClick(event) {
        if (!pickMode || mazeData.rows === 0 || mazeData.cols === 0) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const c = Math.floor(x / mazeData.cellSize);
        const r = Math.floor(y / mazeData.cellSize);

        if (r >= 0 && r < mazeData.rows && c >= 0 && c < mazeData.cols) {
            const cellIndex = r * mazeData.cols + c;
            if (pickMode === 'start') {
                mazeData.startCell = cellIndex;
                document.getElementById('startRow').value = r;
                document.getElementById('startCol').value = c;
                console.log("New start cell:", cellIndex, "(", r, ",", c, ")");
            } else if (pickMode === 'end') {
                mazeData.endCell = cellIndex;
                document.getElementById('endRow').value = r;
                document.getElementById('endCol').value = c;
                 console.log("New end cell:", cellIndex, "(", r, ",", c, ")");
            }
            setPickMode(null); // Reset pick mode after selection
            drawMaze(); // Redraw to show new start/end
        }
    }


    function parseMazeFileContent(fileContent) {
        const lines = fileContent.trim().split('\n').map(line => line.trim());
        if (lines.length < 4) throw new Error("File format incorrect: too few lines.");

        const dimensions = lines[0].split(/\s+/).map(Number);
        if (dimensions.length !== 2 || isNaN(dimensions[0]) || isNaN(dimensions[1]) || dimensions[0] <= 0 || dimensions[1] <= 0) {
            throw new Error("Invalid dimensions. First line must be 'rows cols' (positive integers).");
        }
        mazeData.rows = dimensions[0];
        mazeData.cols = dimensions[1];
        const totalCells = mazeData.rows * mazeData.cols;

        mazeData.adj = Array.from({ length: totalCells }, () => new Set());

        let lineIndex = 1;
        while (lineIndex < lines.length && lines[lineIndex] !== "-1") {
            const connection = lines[lineIndex].split(/\s+/).map(Number);
            if (connection.length !== 2 || isNaN(connection[0]) || isNaN(connection[1])) {
                throw new Error(`Invalid connection format on line ${lineIndex + 1}: '${lines[lineIndex]}'. Expected 'u v'.`);
            }
            const u = connection[0];
            const v = connection[1];

            if (u < 0 || u >= totalCells || v < 0 || v >= totalCells) {
                throw new Error(`Invalid cell index in connection on line ${lineIndex + 1}: ${u}, ${v}. Max index is ${totalCells - 1}.`);
            }
            mazeData.adj[u].add(v);
            mazeData.adj[v].add(u);
            lineIndex++;
        }

        if (lineIndex >= lines.length || lines[lineIndex] !== "-1") {
            throw new Error("Separator line '-1' not found after connections.");
        }
        lineIndex++;

        if (lineIndex >= lines.length) throw new Error("Start point missing.");
        mazeData.startCell = Number(lines[lineIndex]);
        if (isNaN(mazeData.startCell) || mazeData.startCell < 0 || mazeData.startCell >= totalCells) {
            throw new Error(`Invalid start cell: ${lines[lineIndex]}. Must be between 0 and ${totalCells - 1}.`);
        }
        lineIndex++;

        if (lineIndex >= lines.length) throw new Error("Exit point missing.");
        mazeData.endCell = Number(lines[lineIndex]);
        if (isNaN(mazeData.endCell) || mazeData.endCell < 0 || mazeData.endCell >= totalCells) {
            throw new Error(`Invalid end cell: ${lines[lineIndex]}. Must be between 0 and ${totalCells - 1}.`);
        }
        
        // Update UI inputs for rows/cols, start/end from loaded file
        document.getElementById('rows').value = mazeData.rows;
        document.getElementById('cols').value = mazeData.cols;
        document.getElementById('startRow').value = Math.floor(mazeData.startCell / mazeData.cols);
        document.getElementById('startCol').value = mazeData.startCell % mazeData.cols;
        document.getElementById('endRow').value = Math.floor(mazeData.endCell / mazeData.cols);
        document.getElementById('endCol').value = mazeData.endCell % mazeData.cols;
        
        return true; // Success
    }
    
    function loadMazeData(data) { // data = {rows, cols, adj, startCell, endCell}
        mazeData.rows = data.rows;
        mazeData.cols = data.cols;
        mazeData.adj = data.adj.map(s => new Set(s)); // Ensure adj contains Sets
        mazeData.startCell = data.startCell;
        mazeData.endCell = data.endCell;

        document.getElementById('rows').value = mazeData.rows;
        document.getElementById('cols').value = mazeData.cols;
        if (mazeData.startCell !== -1 && mazeData.cols > 0) {
            document.getElementById('startRow').value = Math.floor(mazeData.startCell / mazeData.cols);
            document.getElementById('startCol').value = mazeData.startCell % mazeData.cols;
        }
        if (mazeData.endCell !== -1 && mazeData.cols > 0) {
            document.getElementById('endRow').value = Math.floor(mazeData.endCell / mazeData.cols);
            document.getElementById('endCol').value = mazeData.endCell % mazeData.cols;
        }
        
        resetAndDrawBaseMaze(); // Use this to draw fresh
    }

    
    function resetAndDrawBaseMaze() {
        if (mazeData.adj.length === 0 || !ctx) {
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        adjustCanvasSize();
        drawMaze([], new Set(), new Set(), -1); // Draw with no highlights
    }


    function getMazeData() {
        return { ...mazeData }; // Return a copy
    }
    
    function updateStartEndFromUI() {
        const startR = parseInt(document.getElementById('startRow').value);
        const startC = parseInt(document.getElementById('startCol').value);
        const endR = parseInt(document.getElementById('endRow').value);
        const endC = parseInt(document.getElementById('endCol').value);

        if (isNaN(startR) || isNaN(startC) || isNaN(endR) || isNaN(endC) || !mazeData.cols) return false;

        const newStartCell = startR * mazeData.cols + startC;
        const newEndCell = endR * mazeData.cols + endC;
        
        const totalCells = mazeData.rows * mazeData.cols;

        if (newStartCell >= 0 && newStartCell < totalCells) mazeData.startCell = newStartCell;
        if (newEndCell >= 0 && newEndCell < totalCells) mazeData.endCell = newEndCell;
        
        return true;
    }


    function adjustCanvasSize() {
        if (!canvas || mazeData.rows === 0 || mazeData.cols === 0) return;

        const mazeArea = document.querySelector('.maze-area');
        const maxCanvasWidth = mazeArea.clientWidth - 20; // padding
        const maxCanvasHeight = mazeArea.clientHeight - 20; // padding

        let cellSizeByWidth = maxCanvasWidth / mazeData.cols;
        let cellSizeByHeight = maxCanvasHeight / mazeData.rows;

        mazeData.cellSize = Math.floor(Math.min(cellSizeByWidth, cellSizeByHeight, 40));
        if (mazeData.cellSize < 5) mazeData.cellSize = 5;

        canvas.width = mazeData.cols * mazeData.cellSize;
        canvas.height = mazeData.rows * mazeData.cellSize;
    }
    function drawMaze(solutionPath = [], visitedCells = new Set(), frontierCells = new Set(), currentProcessingCell = -1) {
        if (mazeData.adj.length === 0 || !ctx) return;

        // Don't call adjustCanvasSize here for every animation frame, only on load/resize
        // It should be called by a higher-level function when necessary.

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = mazeData.pathColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Layer 1: Frontier cells (lowest priority highlight)
        if (frontierCells.size > 0) {
            ctx.fillStyle = mazeData.frontierColor;
            for (const cellIndex of frontierCells) {
                if (cellIndex === mazeData.startCell || cellIndex === mazeData.endCell || visitedCells.has(cellIndex)) continue;
                const r = Math.floor(cellIndex / mazeData.cols);
                const c = cellIndex % mazeData.cols;
                ctx.fillRect(c * mazeData.cellSize, r * mazeData.cellSize, mazeData.cellSize, mazeData.cellSize);
            }
        }

        // Layer 2: Visited cells
        if (visitedCells.size > 0) {
            ctx.fillStyle = mazeData.visitedCellColor;
            for (const cellIndex of visitedCells) {
                 if (cellIndex === mazeData.startCell || cellIndex === mazeData.endCell) continue;
                const r = Math.floor(cellIndex / mazeData.cols);
                const c = cellIndex % mazeData.cols;
                ctx.fillRect(c * mazeData.cellSize, r * mazeData.cellSize, mazeData.cellSize, mazeData.cellSize);
            }
        }
        
        // Layer 3: Current processing cell (if any)
        if (currentProcessingCell !== -1 && currentProcessingCell !== mazeData.startCell && currentProcessingCell !== mazeData.endCell) {
            ctx.fillStyle = mazeData.currentProcessingColor;
            const r = Math.floor(currentProcessingCell / mazeData.cols);
            const c = currentProcessingCell % mazeData.cols;
            ctx.fillRect(c * mazeData.cellSize, r * mazeData.cellSize, mazeData.cellSize, mazeData.cellSize);
        }

        // Layer 4: Solution path (if found and provided)
        if (solutionPath.length > 0) {
            ctx.strokeStyle = mazeData.solutionPathColor;
            ctx.lineWidth = Math.max(1, mazeData.cellSize * 0.3); // Thicker line for path
            ctx.beginPath();
            for (let i = 0; i < solutionPath.length; i++) {
                const cellIndex = solutionPath[i];
                const r = Math.floor(cellIndex / mazeData.cols);
                const c = cellIndex % mazeData.cols;
                const x = c * mazeData.cellSize + mazeData.cellSize / 2;
                const y = r * mazeData.cellSize + mazeData.cellSize / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Layer 5: Walls
        ctx.strokeStyle = mazeData.wallColor;
        ctx.lineWidth = mazeData.wallThickness;
        ctx.beginPath(); // Start a single path for all walls

        for (let r = 0; r < mazeData.rows; r++) {
            for (let c = 0; c < mazeData.cols; c++) {
                const cellIndex = r * mazeData.cols + c;
                const x = c * mazeData.cellSize;
                const y = r * mazeData.cellSize;

                if (c < mazeData.cols - 1) {
                    const rightNeighborIndex = r * mazeData.cols + (c + 1);
                    if (!mazeData.adj[cellIndex] || !mazeData.adj[cellIndex].has(rightNeighborIndex)) {
                        ctx.moveTo(x + mazeData.cellSize, y);
                        ctx.lineTo(x + mazeData.cellSize, y + mazeData.cellSize);
                    }
                }

                if (r < mazeData.rows - 1) {
                    const bottomNeighborIndex = (r + 1) * mazeData.cols + c;
                    if (!mazeData.adj[cellIndex] || !mazeData.adj[cellIndex].has(bottomNeighborIndex)) {
                        ctx.moveTo(x, y + mazeData.cellSize);
                        ctx.lineTo(x + mazeData.cellSize, y + mazeData.cellSize);
                    }
                }
            }
        }
        ctx.moveTo(0, 0); ctx.lineTo(canvas.width, 0);
        ctx.moveTo(canvas.width, 0); ctx.lineTo(canvas.width, canvas.height);
        ctx.moveTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height);
        ctx.moveTo(0, canvas.height); ctx.lineTo(0, 0);
        ctx.stroke();

        // Layer 6: Start and End points (drawn last to be on top of everything except path potentially)
        drawSpecialCell(mazeData.startCell, mazeData.startColor, "S");
        drawSpecialCell(mazeData.endCell, mazeData.endColor, "E");
    }

    function drawSpecialCell(cellIndex, color, text = "") {
        if (cellIndex < 0 || cellIndex === undefined || !mazeData.cols || !ctx) return;
        const r = Math.floor(cellIndex / mazeData.cols);
        const c = cellIndex % mazeData.cols;

        const x = c * mazeData.cellSize;
        const y = r * mazeData.cellSize;

        ctx.fillStyle = color;
        const padding = mazeData.cellSize * 0.1;
        ctx.fillRect(
            x + padding,
            y + padding,
            mazeData.cellSize - 2 * padding,
            mazeData.cellSize - 2 * padding
        );

        if (text) {
            ctx.fillStyle = "white";
            ctx.font = `${mazeData.cellSize * 0.5}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, x + mazeData.cellSize / 2, y + mazeData.cellSize / 2);
        }
    }

    return {
        init,
        parseMazeFileContent,
        loadMazeData,
        getMazeData,
        updateStartEndFromUI,
        drawMaze,
        setPickMode,
        adjustCanvasSize, // Expose this
        resetAndDrawBaseMaze // Expose this
    };
})();