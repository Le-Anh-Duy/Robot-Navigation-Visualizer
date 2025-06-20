import { sleep } from "../../../utils/utils"

/**
 * Hàm trợ giúp để lấy các ô hàng xóm hợp lệ của một ô.
 * (Không thay đổi so với phiên bản DFS)
 */
function getNeighbors(cell, rows, cols, adjacency) {
    const neighbors = [];
    const walls = adjacency[cell]; // [top, right, bottom, left]

    if (!walls[0] && cell >= cols) neighbors.push(cell - cols);
    if (!walls[1] && (cell + 1) % cols !== 0) neighbors.push(cell + 1);
    if (!walls[2] && cell < (rows - 1) * cols) neighbors.push(cell + cols);
    if (!walls[3] && cell % cols !== 0) neighbors.push(cell - 1);

    return neighbors;
}

/**
 * Thuật toán Tìm kiếm theo chiều rộng (BFS) để tìm đường đi ngắn nhất qua tất cả các điểm bẩn.
 * Thuật toán này trước tiên sẽ chạy đến hết để thu thập tất cả các bước, sau đó
 * mới trả về (yield) từng bước một cho việc minh họa.
 * @param {object} boardData - Dữ liệu đầu vào của mê cung.
 * @param {number} delay - Thời gian trễ giữa các bước (ms).
 */
export default async function* bfsAlgo(boardData, delay = 200) {
    // --- PHẦN 1: CHẠY THUẬT TOÁN VÀ THU THẬP TẤT CẢ CÁC BƯỚC ---

    const allSteps = [];
    const { rows, cols, data } = boardData;
    const { robot: startNode, adjacency, dirts } = data;

    const dirtsToClean = new Set(dirts);
    const totalDirts = dirtsToClean.size;

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
        // Queue cho BFS: [cell, path_array, dirts_cleaned_set]
        const queue = [];
        
        // `visited` lưu trữ một khóa duy nhất cho trạng thái: "cell-dirt1,dirt2,..."
        // Ví dụ: "15-7,13"
        const visitedStates = new Set();
        
        // Trạng thái ban đầu
        const initialDirtsCleaned = new Set();
        if (dirtsToClean.has(startNode)) {
            initialDirtsCleaned.add(startNode);
        }
        const initialState = [startNode, [startNode], initialDirtsCleaned];
        queue.push(initialState);

        const initialDirtsString = [...initialDirtsCleaned].sort((a, b) => a - b).join(',');
        const initialStateKey = `${startNode}-${initialDirtsString}`;
        visitedStates.add(initialStateKey);
        
        let solutionFound = false;
        // Tập hợp các ô đã được lấy ra khỏi hàng đợi để hiển thị
        const processedCells = new Set(); 

        // --- Thêm bước khởi tạo ---
        allSteps.push({
            type: 'start',
            visited: new Set(),
            frontier: new Set([startNode]),
            current: startNode,
            path: [],
            cost: 0,
        });

        while (queue.length > 0) {
            // Lấy trạng thái từ đầu hàng đợi (FIFO)
            const [current, path, dirtsCleaned] = queue.shift();
            
            processedCells.add(current);

            // --- Thêm bước xử lý (processing) vào mảng ---
            const frontierSet = new Set(queue.map(item => item[0]));
            allSteps.push({
                type: 'processing',
                visited: new Set(processedCells),
                frontier: frontierSet,
                current: current,
                path: path,
                cost: path.length - 1,
            });

            // --- Kiểm tra điều kiện dừng ---
            if (dirtsCleaned.size === totalDirts) {
                allSteps.push({
                    type: 'found',
                    visited: new Set(processedCells),
                    frontier: frontierSet,
                    current: current,
                    path: path,
                    cost: path.length - 1,
                });
                solutionFound = true;
                break; // Thoát khỏi vòng lặp, BFS đảm bảo đây là đường đi ngắn nhất
            }

            // --- Mở rộng các hàng xóm ---
            const neighbors = getNeighbors(current, rows, cols, adjacency);
            for (const neighbor of neighbors) {
                const newPath = [...path, neighbor];
                const newDirtsCleaned = new Set(dirtsCleaned);
                if (dirtsToClean.has(neighbor)) {
                    newDirtsCleaned.add(neighbor);
                }

                // Tạo khóa trạng thái để kiểm tra xem đã thăm chưa
                const dirtsString = [...newDirtsCleaned].sort((a, b) => a - b).join(',');
                const stateKey = `${neighbor}-${dirtsString}`;

                if (!visitedStates.has(stateKey)) {
                    visitedStates.add(stateKey);
                    queue.push([neighbor, newPath, newDirtsCleaned]);
                }
            }
        }
        
        // --- Nếu không tìm thấy đường đi ---
        if (!solutionFound) {
            allSteps.push({
                type: 'found', // hoặc 'not_found'
                visited: new Set(processedCells),
                frontier: new Set(),
                current: allSteps.length > 0 ? allSteps[allSteps.length-1].current : null,
                path: [], 
                cost: -1, 
                message: 'No path found to clean all dirts.'
            });
        }
    }

    // --- PHẦN 2: TRẢ VỀ TỪNG BƯỚC ĐÃ THU THẬP VỚI ĐỘ TRỄ ---
    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}