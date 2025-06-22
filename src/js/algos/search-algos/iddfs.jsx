// import { sleep } from "../../../utils/utils";

// function getNeighbors(cell, rows, cols, adjacency) {
//     const neighbors = [];
//     const walls = adjacency[cell];

//     if (!walls[0]) neighbors.push(cell - cols); // top
//     if (!walls[1] && (cell + 1) % cols !== 0) neighbors.push(cell + 1); // right
//     if (!walls[2]) neighbors.push(cell + cols); // bottom
//     if (!walls[3] && cell % cols !== 0) neighbors.push(cell - 1); // left

//     return neighbors;
// }

// async function* dls(boardData, start, limit, dirtsSet, allSteps, delay) {
//     const { rows, cols, data } = boardData;
//     const { adjacency } = data;

//     const stack = [[start, [start], new Set(dirtsSet.has(start) ? [start] : []), 0]];
//     const visitedStates = new Set();
//     const visited = new Set();

//     while (stack.length > 0) {
//         const [current, path, cleaned, depth] = stack.pop();

//         const key = `${current}-${[...cleaned].sort((a, b) => a - b).join(',')}`;
//         if (visitedStates.has(key)) continue;
//         visitedStates.add(key);
//         visited.add(current);

//         allSteps.push({
//             type: depth === 0 ? "start" : "processing",
//             visited: new Set(visited),
//             frontier: new Set(stack.map(s => s[0])),
//             current,
//             path,
//             cost: path.length - 1,
//         });

//         if (cleaned.size === dirtsSet.size) {
//             allSteps.push({
//                 type: "found",
//                 visited: new Set(visited),
//                 frontier: new Set(),
//                 current,
//                 path,
//                 cost: path.length - 1,
//             });
//             return true;
//         }

//         if (depth < limit) {
//             const neighbors = getNeighbors(current, rows, cols, adjacency).reverse();
//             for (const neighbor of neighbors) {
//                 const newPath = [...path, neighbor];
//                 const newCleaned = new Set(cleaned);
//                 if (dirtsSet.has(neighbor)) newCleaned.add(neighbor);

//                 stack.push([neighbor, newPath, newCleaned, depth + 1]);
//             }
//         }

//         await sleep(delay);
//     }

//     return false;
// }

// export default async function* iddfs(boardData, delay = 200, maxDepth = 50) {
//     const { data } = boardData;
//     const { robot: start, dirts } = data;

//     const dirtsSet = new Set(dirts);
//     const allSteps = [];

//     for (let depth = 0; depth <= maxDepth; depth++) {
//         const found = await dls(boardData, start, depth, dirtsSet, allSteps, delay);
//         if (found) break;
//     }

//     if (allSteps.length === 0 || allSteps[allSteps.length - 1].type !== "found") {
//         allSteps.push({
//             type: "found",
//             visited: new Set(),
//             frontier: new Set(),
//             current: null,
//             path: [],
//             cost: -1,
//         });
//     }

//     for (const step of allSteps) {
//         yield step;
//         await sleep(delay);
//     }
// }
import { sleep } from "../../../utils/utils";

/**
 * Hàm trợ giúp để lấy các ô hàng xóm hợp lệ trên lưới.
 * ĐÃ SỬA LỖI: Thêm kiểm tra ranh giới.
 */
function getNeighbors(cell, rows, cols, adjacency) {
    const neighbors = [];
    const walls = adjacency[cell]; // [top, right, bottom, left]

    // top
    if (!walls[0] && cell >= cols) {
        neighbors.push(cell - cols);
    }
    // right
    if (!walls[1] && (cell + 1) % cols !== 0) {
        neighbors.push(cell + 1);
    }
    // bottom
    if (!walls[2] && cell < (rows - 1) * cols) {
        neighbors.push(cell + cols);
    }
    // left
    if (!walls[3] && cell % cols !== 0) {
        neighbors.push(cell - 1);
    }

    return neighbors;
}

/**
 * Hàm Depth-Limited Search (DLS) chạy trên từng ô của lưới.
 * Hàm này sẽ thêm các bước vào mảng allSteps.
 * @returns {boolean} - true nếu tìm thấy lời giải, false nếu không.
 */
function dls(
    boardData,
    startNode,
    limit, // Giới hạn số bước đi trên lưới
    dirtsSet,
    allSteps
) {
    const { rows, cols, data } = boardData;
    const { adjacency } = data;
    const totalDirts = dirtsSet.size;

    // Stack cho DLS: [cell, path_array, dirts_cleaned_set]
    const stack = [];
    const visitedStates = new Set();
    const processedCells = new Set(); // Chỉ để minh họa

    // Trạng thái ban đầu
    const initialDirtsCleaned = new Set();
    if (dirtsSet.has(startNode)) {
        initialDirtsCleaned.add(startNode);
    }
    
    // Lưu ý: path ở đây là đường đi chi tiết trên lưới
    const initialState = [startNode, [startNode], initialDirtsCleaned];
    stack.push(initialState);

    const initialDirtsString = [...initialDirtsCleaned].sort().join(',');
    const initialStateKey = `${startNode}-${initialDirtsString}`;
    visitedStates.add(initialStateKey);


    while (stack.length > 0) {
        const [current, path, cleaned] = stack.pop();
        const depth = path.length - 1; // Độ sâu là số bước đã đi

        processedCells.add(current);

        // --- Thêm bước xử lý (processing) vào mảng ---
        allSteps.push({
            type: "processing",
            visited: new Set(processedCells),
            frontier: new Set(stack.map(s => s[0])),
            current: current,
            path: path,
            cost: depth,
        });

        // --- Kiểm tra điều kiện dừng ---
        if (cleaned.size === totalDirts) {
            allSteps.push({
                type: "found",
                visited: new Set(processedCells),
                frontier: new Set(),
                current: current,
                path: path,
                cost: depth,
            });
            return true; // Tìm thấy lời giải
        }

        // --- Mở rộng nếu chưa đạt giới hạn độ sâu (số bước) ---
        if (depth < limit) {
            const neighbors = getNeighbors(current, rows, cols, adjacency).reverse();
            for (const neighbor of neighbors) {
                const newCleaned = new Set(cleaned);
                if (dirtsSet.has(neighbor)) {
                    newCleaned.add(neighbor);
                }

                const dirtsString = [...newCleaned].sort().join(',');
                const stateKey = `${neighbor}-${dirtsString}`;

                if (!visitedStates.has(stateKey)) {
                    visitedStates.add(stateKey);
                    const newPath = [...path, neighbor];
                    stack.push([neighbor, newPath, newCleaned]);
                }
            }
        }
    }

    return false; // Không tìm thấy trong giới hạn độ sâu này
}

export default async function* iddfs(boardData, delay = 200, maxDepth = 50) {
    const { data } = boardData;
    const { robot: start, dirts } = data;
    const allSteps = [];

    const dirtsSet = new Set(dirts);
    if (dirts.length === 0 || (dirts.length === 1 && dirts[0] === start)) {
         yield { type: 'found', path: [start], cost: 0, visited: new Set([start]), frontier: new Set() };
         return;
    }
    
    // --- Thêm bước khởi tạo ---
    allSteps.push({
        type: 'start',
        visited: new Set(),
        frontier: new Set([start]),
        current: start,
        path: [],
        cost: 0,
    });
    
    let solutionFound = false;

    // Vòng lặp chính của IDDFS, tăng dần giới hạn số bước đi
    for (let depthLimit = 0; depthLimit <= maxDepth; depthLimit++) {
        // Cần reset visitedStates cho mỗi lần lặp DLS vì nó có thể tìm ra
        // đường đi tốt hơn đến một trạng thái ở độ sâu nông hơn.
        // Tuy nhiên, để đơn giản và theo phong cách DFS, ta có thể không reset,
        // nhưng cách đúng đắn của IDDFS là phải reset.
        // Trong trường hợp này, vì dls đã có visitedStates riêng, ta không cần làm gì.
        
        const found = dls(boardData, start, depthLimit, dirtsSet, allSteps);

        if (found) {
            solutionFound = true;
            break; // Dừng khi DLS tìm thấy lời giải
        }
    }

    if (!solutionFound) {
        // Xử lý trường hợp không tìm thấy giải pháp
        const lastStep = allSteps[allSteps.length - 1];
        allSteps.push({
            type: "found",
            visited: lastStep ? lastStep.visited : new Set(),
            frontier: new Set(),
            current: null,
            path: [],
            cost: -1,
        });
    }

    // --- Trả về từng bước đã thu thập ---
    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}