// import { sleep } from "../../../utils/utils";

// // TSP heuristic = nearest + MST
// function tspHeuristic(current, unvisited, distMap) {
//     if (unvisited.length === 0) return 0;

//     let minToUnvisited = Math.min(...unvisited.map(u => distMap[current][u]));

//     const parent = {};
//     const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
//     const union = (x, y) => {
//         const px = find(x), py = find(y);
//         if (px !== py) parent[px] = py;
//     };

//     for (const u of unvisited) parent[u] = u;
//     const edges = [];

//     for (let i = 0; i < unvisited.length; i++) {
//         for (let j = i + 1; j < unvisited.length; j++) {
//             const u = unvisited[i], v = unvisited[j];
//             edges.push([distMap[u][v], u, v]);
//         }
//     }

//     edges.sort((a, b) => a[0] - b[0]);

//     let mstCost = 0;
//     for (const [w, u, v] of edges) {
//         if (find(u) !== find(v)) {
//             mstCost += w;
//             union(u, v);
//         }
//     }

//     return minToUnvisited + mstCost;
// }

// function getNeighbors(cell, rows, cols, adjacency) {
//     const neighbors = [];
//     const walls = adjacency[cell];

//     if (!walls[0] && cell >= cols) neighbors.push(cell - cols);     // top
//     if (!walls[1] && (cell + 1) % cols !== 0) neighbors.push(cell + 1); // right
//     if (!walls[2] && cell < (rows - 1) * cols) neighbors.push(cell + cols); // bottom
//     if (!walls[3] && cell % cols !== 0) neighbors.push(cell - 1);     // left

//     return neighbors;
// }

// export default async function* beamSearch(boardData, delay = 200, beamWidth = 3) {
//     const { rows, cols, data } = boardData;
//     const { robot: start, adjacency, dirts, weights } = data;
//     const dirtsSet = new Set(dirts);
//     const totalDirts = dirtsSet.size;

//     const visited = new Set();
//     const visitedStates = new Set();

//     // Precompute distances between all important points using Dijkstra
//     const points = [start, ...dirts];
//     const distMap = {};
//     for (const p of points) {
//         const dist = Array(rows * cols).fill(Infinity);
//         dist[p] = 0;
//         const pq = [[0, p]];
//         while (pq.length > 0) {
//             pq.sort((a, b) => b[0] - a[0]);
//             const [cost, node] = pq.pop();
//             const neighbors = getNeighbors(node, rows, cols, adjacency);
//             for (const next of neighbors) {
//                 const moveCost = weights[next];
//                 const newCost = cost + moveCost;
//                 if (newCost < dist[next]) {
//                     dist[next] = newCost;
//                     pq.push([newCost, next]);
//                 }
//             }
//         }
//         distMap[p] = dist;
//     }

//     yield {
//         type: 'start',
//         visited: new Set(),
//         frontier: new Set([start]),
//         current: start,
//         path: [],
//         cost: 0
//     };

//     let frontier = [[0, 0, start, [start], new Set(dirtsSet.has(start) ? [start] : [])]];

//     while (frontier.length > 0) {
//         const newFrontier = [];

//         for (const [f, g, current, path, cleaned] of frontier) {
//             const key = `${current}-${[...cleaned].sort((a, b) => a - b).join(',')}`;
//             if (visitedStates.has(key)) continue;
//             visitedStates.add(key);
//             visited.add(current);

//             yield {
//                 type: 'processing',
//                 visited: new Set(visited),
//                 frontier: new Set(frontier.map(x => x[2])),
//                 current,
//                 path,
//                 cost: g
//             };

//             if (cleaned.size === totalDirts) {
//                 yield {
//                     type: 'found',
//                     visited: new Set(visited),
//                     frontier: new Set(),
//                     current,
//                     path,
//                     cost: g
//                 };
//                 return;
//             }

//             const unvisited = dirts.filter(d => !cleaned.has(d));
//             const neighbors = getNeighbors(current, rows, cols, adjacency);
//             for (const neighbor of neighbors) {
//                 const moveCost = weights[neighbor];
//                 const newCleaned = new Set(cleaned);
//                 if (dirtsSet.has(neighbor)) newCleaned.add(neighbor);

//                 const newPath = [...path, neighbor];
//                 const newG = g + moveCost;
//                 const unvisitedAfter = dirts.filter(d => !newCleaned.has(d));
//                 const h = tspHeuristic(neighbor, unvisitedAfter, distMap);
//                 const newF = newG + h;

//                 newFrontier.push([newF, newG, neighbor, newPath, newCleaned]);
//             }
//         }

//         newFrontier.sort((a, b) => a[0] - b[0]);
//         frontier = newFrontier.slice(0, beamWidth);

//         await sleep(delay);
//     }

//     yield {
//         type: 'found',
//         visited: new Set(visited),
//         frontier: new Set(),
//         current: null,
//         path: [],
//         cost: -1
//     };
// }

import { sleep } from "../../../utils/utils";

// --- CÁC HÀM TRỢ GIÚP (GIỐNG A*) ---

// Lấy các ô hàng xóm trên lưới (dùng cho Dijkstra)
function getGridNeighbors(cell, rows, cols, adjacency, weights) {
    const neighbors = [];
    const walls = adjacency[cell];
    const directions = [
        { dr: -1, dc: 0, wall: 0 }, { dr: 0, dc: 1, wall: 1 },
        { dr: 1, dc: 0, wall: 2 }, { dr: 0, dc: -1, wall: 3 }
    ];

    for (const { dr, dc, wall } of directions) {
        if (!walls[wall]) {
            const r = Math.floor(cell / cols) + dr;
            const c = cell % cols + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const neighbor = r * cols + c;
                neighbors.push({ cell: neighbor, cost: weights[neighbor] });
            }
        }
    }
    return neighbors;
}

// Chạy Dijkstra để tìm đường đi ngắn nhất, trả về khoảng cách và đường đi
function dijkstra(start, rows, cols, adjacency, weights) {
    const dist = Array(rows * cols).fill(Infinity);
    const prev = Array(rows * cols).fill(null);
    dist[start] = 0;
    const pq = [[0, start]];

    while (pq.length > 0) {
        pq.sort((a, b) => a[0] - b[0]);
        const [d, u] = pq.shift();
        if (d > dist[u]) continue;

        for (const { cell: v, cost } of getGridNeighbors(u, rows, cols, adjacency, weights)) {
            const newDist = dist[u] + cost;
            if (newDist < dist[v]) {
                dist[v] = newDist;
                prev[v] = u;
                pq.push([newDist, v]);
            }
        }
    }
    return { dist, prev };
}

// Tái tạo lại đường đi chi tiết trên lưới
function reconstructPath(prevMap, from, to) {
    const path = [];
    let current = to;
    while (current !== null && current !== from) {
        path.unshift(current);
        current = prevMap[current];
    }
    if (current === from) {
        path.unshift(from);
    }
    return path;
}


// Heuristic cho TSP: (chi phí đến điểm bẩn chưa thăm gần nhất) + (chi phí cây bao trùm tối thiểu của các điểm bẩn còn lại)
function tspHeuristic(current, unvisited, distMap) {
    if (unvisited.length === 0) return 0;

    let minToUnvisited = Math.min(...unvisited.map(u => distMap[current][u]));
    if (unvisited.length === 1) return minToUnvisited;

    const parent = {};
    const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
    const union = (x, y) => {
        const px = find(x), py = find(y);
        if (px !== py) parent[px] = py;
    };

    for (const u of unvisited) parent[u] = u;
    const edges = [];

    for (let i = 0; i < unvisited.length; i++) {
        for (let j = i + 1; j < unvisited.length; j++) {
            const u = unvisited[i], v = unvisited[j];
            edges.push([distMap[u][v], u, v]);
        }
    }

    edges.sort((a, b) => a[0] - b[0]);

    let mstCost = 0;
    for (const [w, u, v] of edges) {
        if (find(u) !== find(v)) {
            mstCost += w;
            union(u, v);
        }
    }

    return minToUnvisited + mstCost;
}

// --- THUẬT TOÁN BEAM SEARCH CHÍNH ---

export default async function* beamSearch(boardData, delay = 200, beamWidth = 3) {
    const { rows, cols, data } = boardData;
    const { robot: start, adjacency, dirts, weights } = data;
    const dirtsSet = new Set(dirts);

    // --- GIAI ĐOẠN 1: TIỀN XỬ LÝ ---
    const pointsOfInterest = [start, ...dirts];
    const uniquePoints = [...new Set(pointsOfInterest)];
    const distMap = {};
    const prevMap = {};

    for (const p of uniquePoints) {
        const { dist, prev } = dijkstra(p, rows, cols, adjacency, weights);
        distMap[p] = dist;
        prevMap[p] = prev;
    }

    // --- GIAI ĐOẠN 2: CHẠY BEAM SEARCH TRÊN KHÔNG GIAN BÀI TOÁN TSP ---
    
    // Trạng thái: [f_cost, g_cost, current_point, sequence, visited_dirts_set]
    const h = tspHeuristic(start, [...dirtsSet], distMap);
    let beam = [[h, 0, start, [start], new Set()]];

    const visitedStates = new Set();
    const exploredByDijkstra = new Set(uniquePoints);

    yield {
        type: 'start',
        visited: exploredByDijkstra,
        frontier: new Set([start]),
        current: start,
        path: [],
        cost: 0
    };
    await sleep(delay);

    while (beam.length > 0) {
        let candidates = [];

        // Mở rộng tất cả các trạng thái trong beam hiện tại
        for (const [f, g, currentPoint, sequence, visitedDirts] of beam) {
            
            // Hiển thị trạng thái đang xử lý (lấy trạng thái tốt nhất trong beam để hiển thị)
            let partialPath = [];
            if (sequence.length > 1) {
                for(let i = 0; i < sequence.length - 1; i++) {
                    const subPath = reconstructPath(prevMap[sequence[i]], sequence[i], sequence[i+1]);
                    partialPath.push(...(i > 0 ? subPath.slice(1) : subPath));
                }
            }
             yield {
                type: 'processing',
                visited: exploredByDijkstra,
                frontier: new Set(beam.map(item => item[2])), // Các điểm cuối trong beam là frontier
                current: currentPoint,
                path: partialPath,
                cost: g
            };

            // Kiểm tra điều kiện dừng
            if (visitedDirts.size === dirtsSet.size) {
                 yield {
                    type: 'found',
                    visited: exploredByDijkstra,
                    frontier: new Set(),
                    current: currentPoint,
                    path: partialPath,
                    cost: g
                };
                // Beam search không tối ưu, nên nó dừng ngay khi tìm thấy lời giải đầu tiên
                return;
            }

            // Tạo các trạng thái kế tiếp (đi đến các điểm bẩn chưa thăm)
            const unvisitedDirts = [...dirtsSet].filter(d => !visitedDirts.has(d));
            for (const nextPoint of unvisitedDirts) {
                const newGCost = g + distMap[currentPoint][nextPoint];
                
                const newVisitedDirts = new Set(visitedDirts);
                newVisitedDirts.add(nextPoint);
                
                const stateKey = `${nextPoint}-${[...newVisitedDirts].sort().join(',')}`;
                if (visitedStates.has(stateKey)) continue;
                visitedStates.add(stateKey);
                
                const remainingDirts = [...dirtsSet].filter(d => !newVisitedDirts.has(d));
                const newHCost = tspHeuristic(nextPoint, remainingDirts, distMap);
                const newFCost = newGCost + newHCost;
                
                const newSequence = [...sequence, nextPoint];
                candidates.push([newFCost, newGCost, nextPoint, newSequence, newVisitedDirts]);
            }
        }

        // Sắp xếp tất cả các ứng viên và chỉ giữ lại beamWidth ứng viên tốt nhất
        candidates.sort((a, b) => a[0] - b[0]);
        beam = candidates.slice(0, beamWidth);

        await sleep(delay);
    }

    // Không tìm thấy lời giải (beam bị rỗng)
    yield {
        type: 'found',
        visited: exploredByDijkstra,
        frontier: new Set(),
        current: null,
        path: [],
        cost: -1 // Báo hiệu thất bại
    };
}