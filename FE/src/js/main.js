import {MazeRenderer} from './maze_parser_renderer.js';
import {MazeGenerator} from './maze_generator.js';
import {PathfindingAlgorithms} from './pathfinding_algorithms.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const rowsInput = document.getElementById('rows');
    const colsInput = document.getElementById('cols');
    const generateMazeBtn = document.getElementById('generateMaze');
    const mazeFileInput = document.getElementById('mazeFile');
    const downloadMazeBtn = document.getElementById('downloadMaze');
    
    const startRowInput = document.getElementById('startRow');
    const startColInput = document.getElementById('startCol');
    const endRowInput = document.getElementById('endRow');
    const endColInput = document.getElementById('endCol');
    const pickStartBtn = document.getElementById('pickStartPoint');
    const pickEndBtn = document.getElementById('pickEndPoint');

    const algorithmSelect = document.getElementById('solvingAlgorithm');
    const heuristicSection = document.getElementById('heuristicSection');
    const heuristicSelect = document.getElementById('heuristic');
    // const directionsSelect = document.getElementById('directions');
    const findPathBtn = document.getElementById('findPath');
    const resetCanvasBtn = document.getElementById('resetCanvas');
    const statusDiv = document.getElementById('status');
    const animationSpeedSlider = document.getElementById('animationSpeed');
    const speedValueSpan = document.getElementById('speedValue');
    const allowCyclicPathsCheckbox = document.getElementById('allowCyclicPaths');

    

    // --- Initialization ---
    let currentMaze = null; // To store {rows, cols, adj, startCell, endCell}
    let isAnimating = false; // To disable controls during animation
    let animationDelay = 50; // Default animation delay
    
    
    
    if (!MazeRenderer.init('mazeCanvas')) {
        statusDiv.textContent = "Error: Canvas could not be initialized.";
        return;
        
    }
    animationDelay = parseInt(animationSpeedSlider.value);
    speedValueSpan.textContent = `${animationDelay}ms`;
    
    // --- Event Listeners ---
    generateMazeBtn.addEventListener('click', handleGenerateMaze);
    mazeFileInput.addEventListener('change', handleFileLoad);
    downloadMazeBtn.addEventListener('click', handleDownloadMaze);

    pickStartBtn.addEventListener('click', () => MazeRenderer.setPickMode('start'));
    pickEndBtn.addEventListener('click', () => MazeRenderer.setPickMode('end'));
    
    [startRowInput, startColInput, endRowInput, endColInput].forEach(input => {
        input.addEventListener('change', () => {
            if (currentMaze) {
                MazeRenderer.updateStartEndFromUI();
                MazeRenderer.drawMaze(); // Redraw to show updated S/E if changed
            }
        });
    });

    algorithmSelect.addEventListener('change', () => {
        heuristicSection.style.display = algorithmSelect.value === 'astar' ? 'flex' : 'none';
    });

    findPathBtn.addEventListener('click', handleFindPath);
    resetCanvasBtn.addEventListener('click', handleResetCanvas);

    // Adjust canvas on window resize
    window.addEventListener('resize', () => {
        if (currentMaze) MazeRenderer.drawMaze();
    });

        animationSpeedSlider.addEventListener('input', (e) => {
        animationDelay = parseInt(e.target.value);
        speedValueSpan.textContent = `${animationDelay}ms`;
    });
    
    window.addEventListener('resize', () => {
        if (currentMaze && !isAnimating) { // Only resize if not animating to avoid conflicts
            MazeRenderer.adjustCanvasSize();
            MazeRenderer.resetAndDrawBaseMaze();
        } else if (currentMaze) {
            MazeRenderer.adjustCanvasSize(); // Still adjust size, but full redraw will happen via animation
        }
    });

    // --- Handler Functions ---
    function handleGenerateMaze() {
        if (isAnimating) return;
        const rows = parseInt(rowsInput.value);
        const cols = parseInt(colsInput.value);

        if (isNaN(rows) || isNaN(cols) || rows < 2 || cols < 2) {
            statusDiv.textContent = "Please enter valid rows and columns (min 2).";
            return;
        }
        statusDiv.textContent = "Generating maze...";
        setTimeout(() => {
            currentMaze = MazeGenerator.generate(rows, cols, allowCyclicPathsCheckbox.checked);
            MazeRenderer.adjustCanvasSize(); // Adjust size once
            MazeRenderer.loadMazeData(currentMaze); // This calls resetAndDrawBaseMaze
            updateUIForNewMaze();
            statusDiv.textContent = `Generated ${rows}x${cols} maze.`;
        }, 10);
    }

    function handleFileLoad(event) {
        if (isAnimating) return;
        const file = event.target.files[0];
        if (!file) {
            statusDiv.textContent = 'No file selected.';
            return;
        }
        if (!file.name.endsWith('.txt')) {
            statusDiv.textContent = 'Please select a .txt file.';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                MazeRenderer.parseMazeFileContent(e.target.result); // This calls adjust and draw internally
                currentMaze = MazeRenderer.getMazeData(); // Get the parsed data
                MazeRenderer.drawMaze();
                updateUIForNewMaze();
                statusDiv.textContent = `Maze loaded: ${currentMaze.rows}x${currentMaze.cols}.`;
            } catch (error) {
                console.error("Error processing maze file:", error);
                statusDiv.textContent = `Error: ${error.message}`;
                currentMaze = null;
                MazeRenderer.loadMazeData({rows:0, cols:0, adj:[], startCell:-1, endCell:-1}); // Clear
            }
        };
        reader.onerror = () => {
            statusDiv.textContent = 'Error reading file.';
            console.error("FileReader error");
        };
        reader.readAsText(file);
        mazeFileInput.value = ""; // Reset file input
    }
    
    function handleDownloadMaze() {
        if (!currentMaze || currentMaze.rows === 0) {
            statusDiv.textContent = "No maze to download.";
            return;
        }
        
        let content = `${currentMaze.rows} ${currentMaze.cols}\n`;
        const edges = new Set(); // To avoid duplicate u-v, v-u and self-loops if any
        for (let u = 0; u < currentMaze.adj.length; u++) {
            currentMaze.adj[u].forEach(v => {
                const edge1 = `${u} ${v}`;
                const edge2 = `${v} ${u}`;
                if (u < v && !edges.has(edge1) && !edges.has(edge2)) { // Store only one direction for undirected
                    content += `${u} ${v}\n`;
                    edges.add(edge1);
                } else if (u > v && !edges.has(edge1) && !edges.has(edge2)) {
                     content += `${v} ${u}\n`; // ensure smaller index first
                     edges.add(edge2);
                }
            });
        }
        content += "-1\n";
        content += `${currentMaze.startCell}\n`;
        content += `${currentMaze.endCell}\n`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maze_${currentMaze.rows}x${currentMaze.cols}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        statusDiv.textContent = "Maze downloaded.";
    }

async function handleFindPath() {
        if (!currentMaze || currentMaze.startCell < 0 || currentMaze.endCell < 0) {
            statusDiv.textContent = "Maze not ready or start/end points not set.";
            return;
        }
        if (isAnimating) {
            statusDiv.textContent = "Animation already in progress.";
            return;
        }

        isAnimating = true;
        toggleControls(false); // Disable controls

        MazeRenderer.updateStartEndFromUI();
        currentMaze = MazeRenderer.getMazeData(); // Refresh currentMaze

        const algorithmName = algorithmSelect.value;
        statusDiv.textContent = `Solving with ${algorithmName.toUpperCase()}...`;

        // Ensure the base maze is drawn correctly before starting animation highlights
        MazeRenderer.resetAndDrawBaseMaze(); 
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for UI to update

        let algorithmGenerator;
        const mazeForSolver = { // Pass a clean copy
            rows: currentMaze.rows,
            cols: currentMaze.cols,
            adj: currentMaze.adj.map(s => new Set(s)),
            startCell: currentMaze.startCell,
            endCell: currentMaze.endCell
        };

        if (algorithmName === 'bfs') {
            algorithmGenerator = PathfindingAlgorithms.bfs(mazeForSolver, animationDelay);
        } else if (algorithmName === 'dfs') {
            algorithmGenerator = PathfindingAlgorithms.dfs(mazeForSolver, animationDelay);
        } else if (algorithmName === 'astar') {
            const heuristic = heuristicSelect.value;
            algorithmGenerator = PathfindingAlgorithms.aStar(mazeForSolver, heuristic, animationDelay);
        }

        let finalPath = [];
        try {
            for await (const step of algorithmGenerator) {
                // step will be { type, visited, frontier, current, path }
                MazeRenderer.drawMaze(step.path || [], step.visited, step.frontier, step.current);
                if (step.type === 'found') {
                    finalPath = step.path;
                    statusDiv.textContent = `Path found using ${algorithmName.toUpperCase()}! Length: ${finalPath.length -1}`;
                    break; 
                } else if (step.type === 'notFound') {
                    statusDiv.textContent = `No path found using ${algorithmName.toUpperCase()}.`;
                    break;
                }
            }
        } catch (error) {
            console.error("Error during pathfinding animation:", error);
            statusDiv.textContent = "An error occurred during animation.";
        } finally {
            // Final draw with the path if found, or just visited cells if not
            const finalState = await algorithmGenerator.next(); // Get the very last state if loop broke early
             if (finalState && finalState.value) {
                 MazeRenderer.drawMaze(finalState.value.path || finalPath, finalState.value.visited, new Set(), -1);
             } else if (finalPath.length > 0) {
                 // If already found, redraw with just path and visited for clarity
                 const lastVisitedSnapshot = MazeRenderer.getMazeData().lastVisitedSnapshot || new Set(); // Need to store this
                 MazeRenderer.drawMaze(finalPath, lastVisitedSnapshot, new Set(), -1); // Simplified final view
             }


            isAnimating = false;
            toggleControls(true); // Re-enable controls
        }
    }
    

    
    function handleResetCanvas() {
        if (isAnimating) {
            // Implement logic to stop animation if desired, for now just disallow reset during anim.
            statusDiv.textContent = "Cannot reset during animation.";
            return;
        }
        if (currentMaze) {
            MazeRenderer.resetAndDrawBaseMaze();
            statusDiv.textContent = "Maze view reset.";
        } else {
            statusDiv.textContent = "No maze loaded to reset.";
        }
    }

    function updateUIForNewMaze() {
        const mazeExists = currentMaze && currentMaze.rows > 0;
        if (!isAnimating) { // Only modify if not animating
            downloadMazeBtn.disabled = !mazeExists;
            findPathBtn.disabled = !mazeExists;
        } // Other controls handled by toggleControls
        
        if (mazeExists) {
            startRowInput.max = currentMaze.rows - 1;
            startColInput.max = currentMaze.cols - 1;
            endRowInput.max = currentMaze.rows - 1;
            endColInput.max = currentMaze.cols - 1;
        }
    }

    
    function toggleControls(enable) {
        generateMazeBtn.disabled = !enable;
        mazeFileInput.disabled = !enable;
        // downloadMazeBtn should be enabled based on currentMaze, not animation
        downloadMazeBtn.disabled = !enable || !currentMaze || currentMaze.rows === 0;
        pickStartBtn.disabled = !enable;
        pickEndBtn.disabled = !enable;
        findPathBtn.disabled = !enable || !currentMaze || currentMaze.rows === 0;
        resetCanvasBtn.disabled = !enable;
        rowsInput.disabled = !enable;
        colsInput.disabled = !enable;
        startRowInput.disabled = !enable;
        startColInput.disabled = !enable;
        endRowInput.disabled = !enable;
        endColInput.disabled = !enable;
        algorithmSelect.disabled = !enable;
        heuristicSelect.disabled = !enable || algorithmSelect.value !== 'astar';
        animationSpeedSlider.disabled = !enable;
    }

    // Initial state
    // heuristicSection.style.display = 'none'; // A* not selected initially
    
    // Initial state
    heuristicSection.style.display = 'none';
    updateUIForNewMaze(); // Initial UI state based on no maze loaded
    toggleControls(true); // Ensure controls are enabled at start
    // updateUIForNewMaze(); // Disable buttons if no maze
});