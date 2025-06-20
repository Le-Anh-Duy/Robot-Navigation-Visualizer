// import { sleep } from "../utils/utils"

// function dfs()

// const step = Array(3)

// step[0] = {
//     type: 'start',
//     visited: new Set([1, 2]),
//     frontier: new Set([4, 6, 8, 9]),
//     current: 0,
//     path: [1, 2, 12, 13],
//     cost: 0,
// }

// step[1] = {
//     type: 'processing',
//     visited: new Set([1, 2, 3, 5, 7]),
//     frontier: new Set([4, 6, 8, 9, 10, 11]),
//     current: 2,
//     path: [1, 2, 12, 13, 23, 33, 43, 42, 41, 51],
//     cost: 0,
// }

// step[2] = {
//     type: 'found',
//     visited: new Set([1, 2, 3, 5, 7, 14, 15, 21, 23, 25]),
//     frontier: new Set([4, 6, 8, 9, 10, 11, 17, 18, 24]),
//     current: 75,
//     path: [1, 2, 12, 13, 23, 33, 43, 42, 41, 51, 61, 71, 72, 73, 74, 75],
//     cost: 0,
// }


// function dataLoader(data) {
//     console.log("data", data);
// }

import { sleep } from "../../../utils/utils"; // Giả sử bạn có hàm sleep này

/**
 * Hàm trợ giúp để lấy các ô hàng xóm hợp lệ của một ô.
 * @param {number} cell - Chỉ số của ô hiện tại.
 * @param {number} rows - Số hàng của mê cung.
 * @param {number} cols - Số cột của mê cung.
 * @param {Array<Array<boolean>>} adjacency - Ma trận kề, adjacency[cell] = [top, right, bottom, left].
 * @returns {Array<number>} - Một mảng các chỉ số của các ô hàng xóm hợp lệ.
 */
function getNeighbors(cell, rows, cols, adjacency) {
    const neighbors = [];
    const walls = adjacency[cell]; // [top, right, bottom, left]

    // Hàng xóm phía trên (Top)
    if (!walls[0] && cell >= cols) {
        neighbors.push(cell - cols);
    }
    // Hàng xóm bên phải (Right)
    if (!walls[1] && (cell + 1) % cols !== 0) {
        neighbors.push(cell + 1);
    }
    // Hàng xóm phía dưới (Bottom)
    if (!walls[2] && cell < (rows - 1) * cols) {
        neighbors.push(cell + cols);
    }
    // Hàng xóm bên trái (Left)
    if (!walls[3] && cell % cols !== 0) {
        neighbors.push(cell - 1);
    }

    return neighbors;
}


/**
 * Thuật toán Tìm kiếm theo chiều sâu (DFS) để tìm đường đi qua tất cả các điểm bẩn.
 * Thuật toán này trước tiên sẽ chạy đến hết để thu thập tất cả các bước, sau đó
 * mới trả về (yield) từng bước một cho việc minh họa.
 * @param {object} boardData - Dữ liệu đầu vào của mê cung.
 * @param {number} delay - Thời gian trễ giữa các bước (ms).
 */
export default async function* dfsAlgo(boardData, delay = 200) {
    // --- PHẦN 1: CHẠY THUẬT TOÁN VÀ THU THẬP TẤT CẢ CÁC BƯỚC ---

    const allSteps = []; // Mảng để lưu trữ tất cả các trạng thái
    const { rows, cols, data } = boardData;
    const { robot: startNode, adjacency, dirts } = data;

    const dirtsToClean = new Set(dirts);
    const totalDirts = dirtsToClean.size;

    // Nếu không có bụi bẩn, đường đi là chính nó
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
        const initialDirtsCleaned = new Set();
        if (dirtsToClean.has(startNode)) {
            initialDirtsCleaned.add(startNode);
        }
        const stack = [[startNode, [startNode], initialDirtsCleaned]];
        const visited = new Set(); // Các ô đã được pop ra khỏi stack
        let solutionFound = false;

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
            const [current, path, dirtsCleaned] = stack.pop();
            
            // Tránh xử lý lại một ô không cần thiết
            if (visited.has(current)) {
                // Trong DFS, việc thăm lại một nút có thể cần thiết nếu nó là một phần của một con đường khác.
                // Tuy nhiên, để tránh vòng lặp vô hạn và giữ cho `visited` đơn giản, ta sẽ bỏ qua.
                // Để tối ưu, cần kiểm tra xem trạng thái mới (với tập hợp dirts khác) có tốt hơn không.
                // Ở đây, ta giữ cho nó đơn giản.
            }
            
            visited.add(current);

            // --- Thêm bước xử lý (processing) vào mảng ---
            const frontierSet = new Set(stack.map(item => item[0]));
            allSteps.push({
                type: 'processing',
                visited: new Set(visited),
                frontier: frontierSet,
                current: current,
                path: path,
                cost: path.length - 1,
            });

            // --- Kiểm tra điều kiện dừng ---
            if (dirtsCleaned.size === totalDirts) {
                // Đã tìm thấy một đường đi qua tất cả các điểm bẩn
                allSteps.push({
                    type: 'found',
                    visited: new Set(visited),
                    frontier: frontierSet,
                    current: current,
                    path: path,
                    cost: path.length - 1,
                });
                solutionFound = true;
                break; // Thoát khỏi vòng lặp while
            }

            // --- Mở rộng các hàng xóm ---
            const neighbors = getNeighbors(current, rows, cols, adjacency);
            for (const neighbor of neighbors.reverse()) {
                // Tránh đi vào vòng lặp trong cùng một đường đi
                if (!path.includes(neighbor)) {
                    const newPath = [...path, neighbor];
                    const newDirtsCleaned = new Set(dirtsCleaned);
                    if (dirtsToClean.has(neighbor)) {
                        newDirtsCleaned.add(neighbor);
                    }
                    stack.push([neighbor, newPath, newDirtsCleaned]);
                }
            }
        }

        // --- Nếu không tìm thấy đường đi ---
        if (!solutionFound) {
            allSteps.push({
                type: 'found', // hoặc 'not_found'
                visited: new Set(visited),
                frontier: new Set(),
                current: allSteps.length > 0 ? allSteps[allSteps.length-1].current : null,
                path: [], // không có đường đi
                cost: -1, // chi phí vô hạn
                message: 'No path found to clean all dirts.'
            });
        }
    }


    // --- PHẦN 2: TRẢ VỀ TỪNG BƯỚC ĐÃ THU THẬP VỚI ĐỘ TRỄ ---
    
    // Bây giờ, thuật toán đã chạy xong và `allSteps` chứa toàn bộ lịch sử.
    // Chúng ta sẽ lặp qua nó và `yield` từng bước một.
    console.log(allSteps.length)
    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}

// export default async function* dfsAlgo(data, delay = 200) {
    
//     // runalgohere()

//     for (const val of step) {
//         yield val
//         await sleep(delay)
//     }
//     // dataLoader(data);
//     // console.log("aasdf")

// }
// // data input
// // {
// //     "rows": 5,
// //     "cols": 5,
// //     "data": {
// //         "robot": 0,
// //         "adjacency": [
// //             [
// //                 true,
// //                 false,
// //                 false,
// //                 true
// //             ],
// //             [
// //                 true,
// //                 false,
// //                 false,
// //                 false
// //             ],
// //             [
// //                 true,
// //                 true,
// //                 false,
// //                 false
// //             ],
// //             [
// //                 true,
// //                 true,
// //                 false,
// //                 true
// //             ],
// //             [
// //                 true,
// //                 true,
// //                 false,
// //                 true
// //             ],
// //             [
// //                 false,
// //                 false,
// //                 false,
// //                 true
// //             ],
// //             [
// //                 false,
// //                 false,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 false,
// //                 false,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 false,
// //                 true,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 false,
// //                 true,
// //                 false,
// //                 true
// //             ],
// //             [
// //                 false,
// //                 false,
// //                 false,
// //                 true
// //             ],
// //             [
// //                 true,
// //                 false,
// //                 false,
// //                 false
// //             ],
// //             [
// //                 true,
// //                 false,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 true,
// //                 false,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 false,
// //                 true,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 false,
// //                 true,
// //                 false,
// //                 true
// //             ],
// //             [
// //                 false,
// //                 false,
// //                 false,
// //                 true
// //             ],
// //             [
// //                 true,
// //                 false,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 true,
// //                 true,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 true,
// //                 true,
// //                 false,
// //                 true
// //             ],
// //             [
// //                 false,
// //                 false,
// //                 true,
// //                 true
// //             ],
// //             [
// //                 false,
// //                 false,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 true,
// //                 false,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 true,
// //                 false,
// //                 true,
// //                 false
// //             ],
// //             [
// //                 false,
// //                 true,
// //                 true,
// //                 false
// //             ]
// //         ],
// //         "weights": [
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1,
// //             1
// //         ],
// //         "dirts": {}
// //     }
// // }