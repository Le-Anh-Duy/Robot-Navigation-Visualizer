import { sleep } from "../../../utils/utils"; // Giả sử bạn có hàm sleep này

/**
 * Hàm trợ giúp để lấy các ô hàng xóm hợp lệ của một ô.
 * (Không thay đổi)
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
 * Thuật toán Tìm kiếm theo chiều sâu (DFS) được cải tiến để không thăm lại các trạng thái cũ.
 * Thuật toán này trước tiên sẽ chạy đến hết để thu thập tất cả các bước, sau đó
 * mới trả về (yield) từng bước một cho việc minh họa.
 * @param {object} boardData - Dữ liệu đầu vào của mê cung.
 * @param {number} delay - Thời gian trễ giữa các bước (ms).
 */
export default async function* dfsAlgo(boardData, delay = 200) {
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
        // Stack cho DFS: [cell, path_array, dirts_cleaned_set]
        const stack = [];
        
        // CẢI TIẾN: Sử dụng visitedStates để không thăm lại trạng thái cũ
        // Trạng thái được định nghĩa là "cell-dirt1,dirt2,..."
        const visitedStates = new Set();
        
        // Trạng thái ban đầu
        const initialDirtsCleaned = new Set();
        if (dirtsToClean.has(startNode)) {
            initialDirtsCleaned.add(startNode);
        }
        const initialState = [startNode, [startNode], initialDirtsCleaned];
        stack.push(initialState);
        
        // Đánh dấu trạng thái ban đầu đã được thêm vào stack
        const initialDirtsString = [...initialDirtsCleaned].sort((a, b) => a - b).join(',');
        const initialStateKey = `${startNode}-${initialDirtsString}`;
        visitedStates.add(initialStateKey);

        let solutionFound = false;
        const processedCells = new Set(); // Chỉ để minh họa các ô đã được lấy ra xử lý

        // --- Thêm bước khởi tạo ---
        allSteps.push({
            type: 'start',
            visited: new Set(),
            frontier: new Set([startNode]),
            current: startNode,
            path: [],
            cost: 0,
        });

        while (stack.length > 0) {
            // Lấy trạng thái từ đỉnh stack (LIFO)
            const [current, path, dirtsCleaned] = stack.pop();

            processedCells.add(current);

            // --- Thêm bước xử lý (processing) vào mảng ---
            const frontierSet = new Set(stack.map(item => item[0]));
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
                break; // Tìm thấy giải pháp, dừng lại.
            }

            // --- Mở rộng các hàng xóm ---
            // Đảo ngược để khi push, thứ tự khám phá sẽ tự nhiên hơn (top, right, bottom, left)
            const neighbors = getNeighbors(current, rows, cols, adjacency).reverse();
            for (const neighbor of neighbors) {
                const newDirtsCleaned = new Set(dirtsCleaned);
                if (dirtsToClean.has(neighbor)) {
                    newDirtsCleaned.add(neighbor);
                }

                const dirtsString = [...newDirtsCleaned].sort((a, b) => a - b).join(',');
                const stateKey = `${neighbor}-${dirtsString}`;

                // CẢI TIẾN: Chỉ thêm vào stack nếu trạng thái này chưa từng được khám phá
                if (!visitedStates.has(stateKey)) {
                    visitedStates.add(stateKey);
                    const newPath = [...path, neighbor]; // Chỉ tạo path mới khi cần
                    stack.push([neighbor, newPath, newDirtsCleaned]);
                }
            }
        }
        
        if (!solutionFound) {
            // Xử lý trường hợp không tìm thấy giải pháp
        }
    }

    // --- PHẦN 2: TRẢ VỀ TỪNG BƯỚC ĐÃ THU THẬP VỚI ĐỘ TRỄ ---
    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}