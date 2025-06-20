// import { sleep } from "../../../utils/utils";

// // --- CÁC HÀM TRỢ GIÚP ---

// function getNeighbors(cell, rows, cols, adjacency) {
//     const neighbors = [];
//     const walls = adjacency[cell];
//     if (!walls[0] && cell >= cols) neighbors.push(cell - cols);
//     if (!walls[1] && (cell + 1) % cols !== 0) neighbors.push(cell + 1);
//     if (!walls[2] && cell < (rows - 1) * cols) neighbors.push(cell + cols);
//     if (!walls[3] && cell % cols !== 0) neighbors.push(cell - 1);
//     return neighbors;
// }

// // Chuyển đổi chỉ số ô sang tọa độ {r, c}
// function toCoords(cell, cols) {
//     return { r: Math.floor(cell / cols), c: cell % cols };
// }

// // Tính khoảng cách Manhattan giữa hai ô
// function manhattanDistance(cell1, cell2, cols) {
//     const coords1 = toCoords(cell1, cols);
//     const coords2 = toCoords(cell2, cols);
//     return Math.abs(coords1.r - coords2.r) + Math.abs(coords1.c - coords2.c);
// }

// // Hàm Heuristic: Khoảng cách Manhattan lớn nhất từ ô hiện tại đến các điểm bẩn còn lại.
// function heuristic(currentCell, remainingDirts, cols) {
//     if (remainingDirts.size === 0) {
//         return 0;
//     }
//     let maxDist = 0;
//     for (const dirt of remainingDirts) {
//         const dist = manhattanDistance(currentCell, dirt, cols);
//         if (dist > maxDist) {
//             maxDist = dist;
//         }
//     }
//     return maxDist;
// }


// /**
//  * Thuật toán IDA* (Iterative Deepening A*) để tìm đường đi ngắn nhất.
//  */

// export default async function* idaStarAlgo(boardData, delay = 200) {
//     const allSteps = [];
//     const { rows, cols, data } = boardData;
//     const { robot: startNode, adjacency, dirts } = data;

//     const allDirts = new Set(dirts);
//     const totalDirts = allDirts.size;
//     let solutionFound = false;
//     let foundCost = -1;
//     if (totalDirts === 0) {
//         allSteps.push({
//             type: 'found',
//             visited: new Set([startNode]),
//             frontier: new Set(),
//             current: startNode,
//             path: [startNode],
//             cost: 0,
//         });
//     } else {
//         const initialDirtsCleaned = allDirts.has(startNode) ? new Set([startNode]) : new Set();
//         const remainingInitialDirts = new Set([...allDirts].filter(d => !initialDirtsCleaned.has(d)));
        
//         let threshold = heuristic(startNode, remainingInitialDirts, cols);
//         solutionFound = false;
//         let totalProcessedCells = new Set(); // Lưu tất cả các ô đã xử lý qua mọi lần lặp

//         while (!solutionFound && threshold !== Infinity) {
//             let nextThreshold = Infinity;
//             const visitedInIteration = new Map(); 
//             const stack = [[startNode, [startNode], initialDirtsCleaned]];

//             const initialDirtsString = [...initialDirtsCleaned].sort().join(',');
//             const initialStateKey = `${startNode}-${initialDirtsString}`;
//             visitedInIteration.set(initialStateKey, 0);

//             const processedCellsInIteration = new Set(); 
//             // allSteps.push({
//             //     type: 'new_iteration',
//             //     message: `Bắt đầu tìm kiếm với ngưỡng (threshold): ${threshold}`,
//             //     threshold: threshold
//             // });

//             while (stack.length > 0) {
//                 const [current, path, dirtsCleaned] = stack.pop();

//                 processedCellsInIteration.add(current);
//                 totalProcessedCells.add(current);
                
//                 const g = path.length - 1;
//                 const remainingDirts = new Set([...allDirts].filter(d => !dirtsCleaned.has(d)));
//                 const h = heuristic(current, remainingDirts, cols);
//                 const f = g + h;
                
//                 const frontierSet = new Set(stack.map(item => item[0]));
//                 allSteps.push({
//                     type: 'processing',
//                     visited: new Set(processedCellsInIteration),
//                     frontier: frontierSet,
//                     current: current,
//                     path: path,
//                     cost: g,
//                     f_cost: f,
//                     threshold: threshold
//                 });
                
//                 if (f > threshold) {
//                     nextThreshold = Math.min(nextThreshold, f);
//                     continue;
//                 }

//                 // KIỂM TRA MỤC TIÊU VÀ TẠO BƯỚC 'FOUND' ĐÚNG ĐỊNH DẠNG
//                 if (remainingDirts.size === 0) {
//                     solutionFound = true;
//                     foundCost = g;
//                     allSteps.push({
//                         type: 'found',
//                         visited: new Set(processedCellsInIteration),
//                         frontier: new Set(stack.map(item => item[0])), // Frontier tại thời điểm tìm thấy
//                         current: current, // Ô hiện tại là ô mục tiêu
//                         path: path,
//                         cost: g,
//                     });
//                     break; // Thoát vòng lặp DFS
//                 }

//                 const neighbors = getNeighbors(current, rows, cols, adjacency).reverse();
//                 for (const neighbor of neighbors) {
//                     const newPath = [...path, neighbor];
//                     const new_g = newPath.length - 1;

//                     const newDirtsCleaned = new Set(dirtsCleaned);
//                     if (allDirts.has(neighbor)) newDirtsCleaned.add(neighbor);
                    
//                     const dirtsString = [...newDirtsCleaned].sort().join(',');
//                     const stateKey = `${neighbor}-${dirtsString}`;
                    
//                     const costInMap = visitedInIteration.get(stateKey);
//                     if (costInMap === undefined || new_g < costInMap) {
//                         visitedInIteration.set(stateKey, new_g);
//                         stack.push([neighbor, newPath, newDirtsCleaned]);
//                     }
//                 }
//             } 

//             if (solutionFound) {
//                 break; // Thoát vòng lặp IDA*
//             }
//             threshold = nextThreshold;
//         }

//         if (!solutionFound) {
//              allSteps.push({ 
//                  type: 'found', // Giữ type 'found' cho nhất quán
//                  visited: totalProcessedCells,
//                  frontier: new Set(),
//                  current: null,
//                  path: [], // Đường đi rỗng
//                  cost: -1, // Chi phí không hợp lệ
//                  message: 'Không tìm thấy lời giải.' 
//              });
//         }
//     }


//     console.log(allSteps.length, solutionFound, foundCost)
//     if (!solutionFound) return
//     for (const step of allSteps) {
//         yield step;
//         await sleep(delay);
//     }
// }

import { sleep } from "../../../utils/utils";

// --- CÁC HÀM TRỢ GIÚP ---

// Trả về danh sách hàng xóm và trọng số đến mỗi hàng xóm
function getNeighborsWithWeights(cell, rows, cols, adjacency, weights) {
    const neighbors = [];
    const walls = adjacency[cell];

    const directions = [
        { dr: -1, dc: 0, wall: 0 }, // up
        { dr: 0, dc: 1, wall: 1 },  // right
        { dr: 1, dc: 0, wall: 2 },  // down
        { dr: 0, dc: -1, wall: 3 }  // left
    ];

    for (let i = 0; i < directions.length; i++) {
        const { dr, dc, wall } = directions[i];
        if (!walls[wall]) {
            const r = Math.floor(cell / cols) + dr;
            const c = cell % cols + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const neighbor = r * cols + c;
                const weight = weights[neighbor];
                neighbors.push({ cell: neighbor, weight });
            }
        }
    }

    return neighbors;
}

// Chuyển đổi chỉ số ô sang tọa độ {r, c}
function toCoords(cell, cols) {
    return { r: Math.floor(cell / cols), c: cell % cols };
}

// Tính khoảng cách Manhattan giữa hai ô
function manhattanDistance(cell1, cell2, cols) {
    const coords1 = toCoords(cell1, cols);
    const coords2 = toCoords(cell2, cols);
    return Math.abs(coords1.r - coords2.r) + Math.abs(coords1.c - coords2.c);
}

// Hàm Heuristic: Khoảng cách Manhattan lớn nhất từ ô hiện tại đến các điểm bẩn còn lại.
function heuristic(currentCell, remainingDirts, cols) {
    if (remainingDirts.size === 0) {
        return 0;
    }
    let maxDist = 0;
    for (const dirt of remainingDirts) {
        const dist = manhattanDistance(currentCell, dirt, cols);
        if (dist > maxDist) {
            maxDist = dist;
        }
    }
    return maxDist;
}


/**
 * Thuật toán IDA* (Iterative Deepening A*) với trọng số
 */
export default async function* idaStarAlgo(boardData, delay = 200) {
    const allSteps = [];
    const { rows, cols, data } = boardData;
    const { robot: startNode, adjacency, dirts, weights } = data;

    const allDirts = new Set(dirts);
    const totalDirts = allDirts.size;
    let solutionFound = false;
    let foundCost = -1;

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
        const initialDirtsCleaned = allDirts.has(startNode) ? new Set([startNode]) : new Set();
        const remainingInitialDirts = new Set([...allDirts].filter(d => !initialDirtsCleaned.has(d)));
        
        let threshold = heuristic(startNode, remainingInitialDirts, cols);
        solutionFound = false;
        let totalProcessedCells = new Set();

        while (!solutionFound && threshold !== Infinity) {
            let nextThreshold = Infinity;
            const visitedInIteration = new Map();
            const stack = [[startNode, [startNode], initialDirtsCleaned, 0]];

            const initialDirtsString = [...initialDirtsCleaned].sort().join(',');
            const initialStateKey = `${startNode}-${initialDirtsString}`;
            visitedInIteration.set(initialStateKey, 0);

            const processedCellsInIteration = new Set();

            while (stack.length > 0) {
                const [current, path, dirtsCleaned, g] = stack.pop();

                processedCellsInIteration.add(current);
                totalProcessedCells.add(current);

                const remainingDirts = new Set([...allDirts].filter(d => !dirtsCleaned.has(d)));
                const h = heuristic(current, remainingDirts, cols);
                const f = g + h;

                const frontierSet = new Set(stack.map(item => item[0]));
                allSteps.push({
                    type: 'processing',
                    visited: new Set(processedCellsInIteration),
                    frontier: frontierSet,
                    current: current,
                    path: path,
                    cost: g,
                    f_cost: f,
                    threshold: threshold
                });

                if (f > threshold) {
                    nextThreshold = Math.min(nextThreshold, f);
                    continue;
                }

                if (remainingDirts.size === 0) {
                    solutionFound = true;
                    foundCost = g;
                    allSteps.push({
                        type: 'found',
                        visited: new Set(processedCellsInIteration),
                        frontier: new Set(stack.map(item => item[0])),
                        current: current,
                        path: path,
                        cost: g,
                    });
                    break;
                }

                const neighbors = getNeighborsWithWeights(current, rows, cols, adjacency, weights).reverse();
                for (const { cell: neighbor, weight } of neighbors) {
                    const newPath = [...path, neighbor];
                    const new_g = g + weight;

                    const newDirtsCleaned = new Set(dirtsCleaned);
                    if (allDirts.has(neighbor)) newDirtsCleaned.add(neighbor);

                    const dirtsString = [...newDirtsCleaned].sort().join(',');
                    const stateKey = `${neighbor}-${dirtsString}`;

                    const costInMap = visitedInIteration.get(stateKey);
                    if (costInMap === undefined || new_g < costInMap) {
                        visitedInIteration.set(stateKey, new_g);
                        stack.push([neighbor, newPath, newDirtsCleaned, new_g]);
                    }
                }
            }

            if (solutionFound) break;
            threshold = nextThreshold;
        }

        if (!solutionFound) {
            allSteps.push({ 
                type: 'found',
                visited: totalProcessedCells,
                frontier: new Set(),
                current: null,
                path: [],
                cost: -1,
                message: 'Không tìm thấy lời giải.' 
            });
        }
    }

    console.log(allSteps.length, solutionFound, foundCost);
    if (!solutionFound) return;
    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}
