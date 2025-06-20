import { sleep } from "./utils/utils"

const step = Array(3)

step[0] = {
    type: 'start',
    visited: new Set([1, 2]),
    frontier: new Set([4, 6, 8, 9]),
    current: 0,
    path: [1, 2, 12, 13],
    cost: 0,
}

step[1] = {
    type: 'processing',
    visited: new Set([1, 2, 3, 5, 7]),
    frontier: new Set([4, 6, 8, 9, 10, 11]),
    current: 2,
    path: [1, 2, 12, 13, 23, 33, 43, 42, 41, 51],
    cost: 0,
}

step[2] = {
    type: 'found',
    visited: new Set([1, 2, 3, 5, 7, 14, 15, 21, 23, 25]),
    frontier: new Set([4, 6, 8, 9, 10, 11, 17, 18, 24]),
    current: 75,
    path: [1, 2, 12, 13, 23, 33, 43, 42, 41, 51, 61, 71, 72, 73, 74, 75],
    cost: 0,
}

export default async function* alg(data, delay = 200) {
    console.log(data)
    for (const val of step) {
        yield val
        await sleep(delay)
    }
}