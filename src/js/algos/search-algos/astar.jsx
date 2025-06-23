import { sleep } from "../../../utils/utils";

// Lấy các ô hàng xóm trên lưới (dùng cho Dijkstra)
function getGridNeighbors(cell, rows, cols, adjacency, weights) {
    const neighbors = [];
    const walls = adjacency[cell];

    const directions = [
        { dr: -1, dc: 0, wall: 0 }, // top
        { dr: 0, dc: 1, wall: 1 },  // right
        { dr: 1, dc: 0, wall: 2 },  // bottom
        { dr: 0, dc: -1, wall: 3 }  // left
    ];

    for (const { dr, dc, wall } of directions) {
        if (!walls[wall]) {
            const r = Math.floor(cell / cols) + dr;
            const c = cell % cols + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                const neighbor = r * cols + c;
                // Chi phí để *bước vào* ô hàng xóm
                neighbors.push({ cell: neighbor, cost: weights[neighbor] });
            }
        }
    }

    return neighbors;
}

// Chạy Dijkstra để tìm đường đi ngắn nhất từ một điểm bắt đầu đến tất cả các điểm khác
// Trả về cả khoảng cách và đường đi để tái tạo lại sau này
function dijkstra(start, rows, cols, adjacency, weights) {
    const dist = Array(rows * cols).fill(Infinity);
    const prev = Array(rows * cols).fill(null);
    dist[start] = 0;
    
    // Sử dụng mảng làm hàng đợi ưu tiên đơn giản
    const pq = [[0, start]]; 

    while (pq.length > 0) {
        // Sắp xếp để lấy phần tử có chi phí nhỏ nhất (thay thế cho Min-Heap)
        pq.sort((a, b) => a[0] - b[0]);
        const [d, u] = pq.shift();

        if (d > dist[u]) continue;

        for (const { cell: v, cost } of getGridNeighbors(u, rows, cols, adjacency, weights)) {
            // Chi phí để đi từ start đến v thông qua u
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

// Tái tạo lại đường đi chi tiết trên lưới từ bản đồ `prev` của Dijkstra
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
// Đây là một heuristic hợp lệ (admissible) và rất hiệu quả.
function tspHeuristic(current, unvisited, distMap) {
    if (unvisited.length === 0) return 0;

    // 1. Chi phí nhỏ nhất để đi từ điểm hiện tại đến một điểm chưa thăm
    let minToUnvisited = Math.min(...unvisited.map(u => distMap[current][u]));

    // 2. Chi phí cây bao trùm tối thiểu (MST) của các điểm chưa thăm
    // Dùng thuật toán Prim hoặc Kruskal. Ở đây dùng Kruskal.
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

export default async function* aStar(boardData, delay = 200) {
    const { rows, cols, data } = boardData;
    const { robot: start, adjacency, dirts, weights } = data;
    
    // --- GIAI ĐOẠN 1: TIỀN XỬ LÝ ---
    
    // Các điểm quan trọng cần đi qua
    const pointsOfInterest = [start, ...dirts];
    const uniquePoints = [...new Set(pointsOfInterest)]; // Đảm bảo không có điểm trùng lặp
    const dirtsSet = new Set(dirts);

    // Tính toán trước khoảng cách và đường đi giữa tất cả các cặp điểm quan trọng
    const distMap = {};
    const prevMap = {};
    for (const p of uniquePoints) {
        const { dist, prev } = dijkstra(p, rows, cols, adjacency, weights);
        distMap[p] = dist;
        prevMap[p] = prev;
    }

    // --- GIAI ĐOẠN 2: CHẠY A* TRÊN KHÔNG GIAN BÀI TOÁN TSP ---

    // Trạng thái: [f_cost, g_cost, current_point, path_sequence, visited_dirts_set]
    const startH = tspHeuristic(start, [...dirtsSet], distMap);
    const openSet = [[startH, 0, start, [start], new Set()]];
    
    // Dùng để tránh lặp lại trạng thái (vị trí, tập đã thăm)
    const visitedStates = new Set();
    
    // Dùng để hiển thị các ô đã được khám phá trong quá trình Dijkstra
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


    while (openSet.length > 0) {
        openSet.sort((a, b) => a[0] - b[0]); // Sắp xếp theo f_cost
        const [f, g, currentPoint, sequence, visitedDirts] = openSet.shift();

        // Tạo key cho trạng thái hiện tại để kiểm tra trùng lặp
        const stateKey = `${currentPoint}-${[...visitedDirts].sort().join(',')}`;
        if (visitedStates.has(stateKey)) {
            continue;
        }
        visitedStates.add(stateKey);

        // Hiển thị đường đi tạm thời
        let partialPath = [];
        if(sequence.length > 1){
            for(let i=0; i < sequence.length - 1; i++){
                const subPath = reconstructPath(prevMap[sequence[i]], sequence[i], sequence[i+1]);
                partialPath.push(...(i > 0 ? subPath.slice(1) : subPath));
            }
        }
        
        yield {
            type: 'processing',
            visited: exploredByDijkstra,
            frontier: new Set(openSet.map(item => item[2])),
            current: currentPoint,
            path: partialPath,
            cost: g
        };
        await sleep(delay);

        // Kiểm tra điều kiện dừng: đã thăm tất cả các điểm bẩn
        if (visitedDirts.size === dirtsSet.size) {
            // Tái tạo lại đường đi cuối cùng
            const finalPath = partialPath.length > 0 ? partialPath : [start];
            yield {
                type: 'found',
                visited: exploredByDijkstra,
                frontier: new Set(),
                current: currentPoint,
                path: finalPath,
                cost: g
            };
            return;
        }

        // Mở rộng các trạng thái kế tiếp: đi đến các điểm bẩn chưa được thăm
        const unvisitedDirts = [...dirtsSet].filter(d => !visitedDirts.has(d));

        for (const nextPoint of unvisitedDirts) {
            if (nextPoint === currentPoint) continue; // Bỏ qua nếu điểm tiếp theo là chính nó

            const newGCost = g + distMap[currentPoint][nextPoint];
            const newVisitedDirts = new Set(visitedDirts);
            newVisitedDirts.add(nextPoint);
            
            const remainingDirts = [...dirtsSet].filter(d => !newVisitedDirts.has(d));
            const newHCost = tspHeuristic(nextPoint, remainingDirts, distMap);
            const newFCost = newGCost + newHCost;
            
            const newSequence = [...sequence, nextPoint];
            openSet.push([newFCost, newGCost, nextPoint, newSequence, newVisitedDirts]);
        }
    }
    
    // Trường hợp không tìm thấy đường đi (về lý thuyết không xảy ra nếu input hợp lệ)
    yield {
        type: 'found',
        visited: exploredByDijkstra,
        frontier: new Set(),
        current: null,
        path: [],
        cost: -1
    };
}