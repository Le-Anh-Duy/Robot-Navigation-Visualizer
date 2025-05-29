// js/pathfinding_algorithms.js

import {bfs} from './algorithms/bfs.js';
import {dfs} from './algorithms/dfs.js';
import {aStar} from './algorithms/a-star.js';

export const PathfindingAlgorithms = (() => {
    return { bfs, dfs, aStar };
})();