// import { sleep } from "../../../utils/utils";

// /**
//  * Hàm BFS đơn giản từ 1 điểm tới toàn bộ lưới, trả về khoảng cách.
//  */
// function bfsDistances(start, rows, cols, adjacency, weights) {
//     const dist = Array(rows * cols).fill(Infinity);
//     const visited = new Set();
//     const queue = [[start, 0]];

//     dist[start] = 0;

//     while (queue.length > 0) {
//         const [current, d] = queue.shift();
//         if (visited.has(current)) continue;
//         visited.add(current);

//         const walls = adjacency[current];
//         const directions = [
//             { dr: -1, dc: 0, wall: 0 },
//             { dr: 0, dc: 1, wall: 1 },
//             { dr: 1, dc: 0, wall: 2 },
//             { dr: 0, dc: -1, wall: 3 }
//         ];

//         for (const { dr, dc, wall } of directions) {
//             if (!walls[wall]) {
//                 const r = Math.floor(current / cols) + dr;
//                 const c = current % cols + dc;
//                 if (r >= 0 && r < rows && c >= 0 && c < cols) {
//                     const neighbor = r * cols + c;
//                     const cost = weights[neighbor];
//                     if (d + cost < dist[neighbor]) {
//                         dist[neighbor] = d + cost;
//                         queue.push([neighbor, d + cost]);
//                     }
//                 }
//             }
//         }
//     }

//     return dist;
// }

// /**
//  * TSP Backtracking trên tập các điểm [start, dirt1, dirt2, ...]
//  */
// function tspBacktrack(distMap, points, currentIdx, visitedSet, currentCost, pathSoFar, best) {
//     if (visitedSet.size === points.length) {
//         if (currentCost < best.cost) {
//             best.cost = currentCost;
//             best.path = [...pathSoFar];
//         }
//         return;
//     }

//     for (let i = 1; i < points.length; i++) {
//         if (!visitedSet.has(i)) {
//             visitedSet.add(i);
//             pathSoFar.push(i);
//             const nextCost = currentCost + distMap[points[currentIdx]][points[i]];
//             if (nextCost < best.cost) {
//                 tspBacktrack(distMap, points, i, visitedSet, nextCost, pathSoFar, best);
//             }
//             pathSoFar.pop();
//             visitedSet.delete(i);
//         }
//     }
// }

// /**
//  * Multiple BFS + Backtrack để tìm thứ tự đi qua các điểm bẩn tối ưu.
//  */
// export default async function* multiBfsBacktrack(boardData, delay = 200) {
//     const { rows, cols, data } = boardData;
//     const { robot: start, dirts, adjacency, weights } = data;
//     const allPoints = [start, ...dirts];
//     const pointIndices = allPoints; // map: index => cell

//     const distMap = {};
//     for (const p of allPoints) {
//         distMap[p] = bfsDistances(p, rows, cols, adjacency, weights);
//     }

//     // yield start step
//     yield {
//         type: 'start',
//         visited: new Set(),
//         frontier: new Set([start]),
//         current: start,
//         path: [],
//         cost: 0
//     };

//     await sleep(delay);

//     // TSP backtrack từ start (index 0)
//     const best = { cost: Infinity, path: [] };
//     tspBacktrack(distMap, allPoints, 0, new Set([0]), 0, [0], best);

//     // reconstruct full path in the grid
//     const fullPath = [];
//     let totalCost = 0;
//     for (let i = 0; i < best.path.length - 1; i++) {
//         const from = allPoints[best.path[i]];
//         const to = allPoints[best.path[i + 1]];

//         // reconstruct actual path step-by-step (BFS-based)
//         const prev = Array(rows * cols).fill(null);
//         const queue = [from];
//         const visited = new Set([from]);

//         while (queue.length > 0) {
//             const current = queue.shift();
//             if (current === to) break;

//             const neighbors = [];
//             const walls = adjacency[current];
//             const directions = [
//                 { dr: -1, dc: 0, wall: 0 },
//                 { dr: 0, dc: 1, wall: 1 },
//                 { dr: 1, dc: 0, wall: 2 },
//                 { dr: 0, dc: -1, wall: 3 }
//             ];

//             for (const { dr, dc, wall } of directions) {
//                 if (!walls[wall]) {
//                     const r = Math.floor(current / cols) + dr;
//                     const c = current % cols + dc;
//                     if (r >= 0 && r < rows && c >= 0 && c < cols) {
//                         const neighbor = r * cols + c;
//                         if (!visited.has(neighbor)) {
//                             visited.add(neighbor);
//                             prev[neighbor] = current;
//                             queue.push(neighbor);
//                         }
//                     }
//                 }
//             }
//         }

//         // build path
//         const subPath = [];
//         let curr = to;
//         while (curr !== null && curr !== from) {
//             subPath.push(curr);
//             curr = prev[curr];
//         }
//         subPath.push(from);
//         subPath.reverse();

//         for (const step of subPath.slice(i === 0 ? 0 : 1)) {
//             fullPath.push(step);
//             totalCost += weights[step];

//             yield {
//                 type: 'processing',
//                 visited: new Set(fullPath),
//                 frontier: new Set(),
//                 current: step,
//                 path: [...fullPath],
//                 cost: totalCost
//             };
//             await sleep(delay);
//         }
//     }

//     yield {
//         type: 'found',
//         visited: new Set(fullPath),
//         frontier: new Set(),
//         current: fullPath.at(-1),
//         path: fullPath,
//         cost: totalCost
//     };
// }

import { sleep } from "../../../utils/utils";

/**
 * Hàm Dijkstra để tính khoảng cách và đường đi ngắn nhất từ 1 điểm.
 * (Không đổi)
 */
function dijkstra(start, rows, cols, adjacency, weights) {
    const dist = Array(rows * cols).fill(Infinity);
    const prev = Array(rows * cols).fill(null);
    dist[start] = 0;
    const pq = [[0, start]]; 

    while (pq.length > 0) {
        pq.sort((a, b) => a[0] - b[0]); 
        const [d, u] = pq.shift();

        if (d > dist[u]) continue;

        const walls = adjacency[u];
        const directions = [
            { dr: -1, dc: 0, wall: 0 }, { dr: 0, dc: 1, wall: 1 },
            { dr: 1, dc: 0, wall: 2 }, { dr: 0, dc: -1, wall: 3 }
        ];

        for (const { dr, dc, wall } of directions) {
            if (!walls[wall]) {
                const r = Math.floor(u / cols) + dr;
                const c = u % cols + dc;
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    const neighbor = r * cols + c;
                    const cost = weights[neighbor];
                    if (dist[u] + cost < dist[neighbor]) {
                        dist[neighbor] = dist[u] + cost;
                        prev[neighbor] = u;
                        pq.push([dist[neighbor], neighbor]);
                    }
                }
            }
        }
    }
    return { dist, prev };
}

/**
 * Tái tạo lại đường đi chi tiết trên lưới từ `prevMap`.
 * (Không đổi)
 */
function reconstructPath(from, to, prevMap) {
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

/**
 * Solves TSP using precomputation (Dijkstra) and an iterative Backtracking approach with a stack.
 * All visualization steps are collected first, then yielded.
 */
export default async function* backtrackingTsp(boardData, delay = 200) {
    const { rows, cols, data } = boardData;
    const { robot: start, dirts, adjacency, weights } = data;
    const allSteps = [];
    const points = [...new Set([start, ...dirts])]; 

    // --- PHASE 1: PRECOMPUTATION ---
    const distMap = {};
    const prevMaps = {};
    for (const p of points) {
        const { dist, prev } = dijkstra(p, rows, cols, adjacency, weights);
        distMap[p] = dist;
        prevMaps[p] = prev;
    }

    // --- Add START step ---
    allSteps.push({
        type: 'start',
        visited: new Set(),
        frontier: new Set(points.filter(p => p !== start)),
        current: start,
        path: [],
        cost: 0
    });

    // --- PHASE 2: ITERATIVE BACKTRACKING SEARCH ---
    const best = { cost: Infinity, sequence: [] };
    
    // The stack will hold the state for our search
    // State: [currentPoint, sequence_of_points, visitedPoints_set, currentCost]
    const stack = [[start, [start], new Set([start]), 0]];

    while (stack.length > 0) {
        const [currentPoint, sequence, visitedPoints, currentCost] = stack.pop();

        // --- Add PROCESSING step ---
        // Reconstruct path for visualization
        const partialPath = [];
        if (sequence.length > 1) {
            for (let i = 0; i < sequence.length - 1; i++) {
                const from = sequence[i];
                const to = sequence[i + 1];
                partialPath.push(...reconstructPath(from, to, prevMaps[from]).slice(i > 0 ? 1 : 0));
            }
        } else {
            partialPath.push(currentPoint);
        }

        allSteps.push({
            type: 'processing',
            visited: new Set(partialPath),
            frontier: new Set(points.filter(p => !visitedPoints.has(p))),
            current: currentPoint,
            path: partialPath,
            cost: currentCost
        });
        
        // --- BASE CASE CHECK ---
        // If all points have been visited, we have a potential solution
        if (visitedPoints.size === points.length) {
            if (currentCost < best.cost) {
                best.cost = currentCost;
                best.sequence = sequence;
            }
            // Continue search, don't stop, as other branches might be better
            continue;
        }

        // --- EXPAND NODE (like the recursive step) ---
        // Find unvisited neighbors and push them to the stack
        // We reverse to maintain a more natural exploration order (like in recursion)
        const unvisitedNeighbors = points.filter(p => !visitedPoints.has(p)).reverse();

        for (const nextPoint of unvisitedNeighbors) {
            const nextCost = currentCost + distMap[currentPoint][nextPoint];

            // PRUNING: Only add to stack if this path has a chance to be better
            if (nextCost < best.cost) {
                const newVisited = new Set(visitedPoints);
                newVisited.add(nextPoint);
                const newSequence = [...sequence, nextPoint];
                stack.push([nextPoint, newSequence, newVisited, nextCost]);
            }
        }
    }

    // --- Add FOUND step ---
    // Reconstruct the best path found
    const finalFullPath = [];
    if (best.sequence.length > 0) {
        for (let i = 0; i < best.sequence.length - 1; i++) {
            const from = best.sequence[i];
            const to = best.sequence[i + 1];
            finalFullPath.push(...reconstructPath(from, to, prevMaps[from]).slice(i > 0 ? 1 : 0));
        }
    }

    allSteps.push({
        type: 'found',
        visited: new Set(finalFullPath),
        frontier: new Set(),
        current: finalFullPath.length > 0 ? finalFullPath.at(-1) : start,
        path: finalFullPath,
        cost: best.cost !== Infinity ? best.cost : -1
    });

    // --- FINAL PHASE: YIELD ALL COLLECTED STEPS ---
    for (const step of allSteps) {
        yield step;
        await sleep(delay);
    }
}