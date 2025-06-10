export default class CanvasHelper {
    constructor(canvas, rows, cols, cellSize) {
        this.canvas = canvas
        this.rows = rows
        this.cols = cols
        this.cellSize = cellSize
        this.width = cols * cellSize
        this.height = rows * cellSize
    }

    // Convert world coordinate of point to cell index (flatten)
    worldCoordToCellIndex(x, y) {
        // Get local coordinate
        const local = this.worldToLocal(x, y)

        return this.localCoordToCellIndex(local.x, local.y)
    }

    // Convert local coordinate of point to cell index (flatten)
    localCoordToCellIndex(x, y) {
        x = Math.max(x, 0)
        y = Math.max(y, 0)
        //Get cell column and row index
        const col = Math.min(Math.trunc(x / this.cellSize), this.cols - 1), row = Math.min(Math.trunc(y / this.cellSize), this.rows - 1)

        return row * this.cols + col
    }

    // Convert index (flatten) to cell coordinate
    indexToCellCoord(index) {
        if (index >= this.rows * this.cols)
            return { x: (this.cols - 1) * cellSize, y: (this.rows - 1) * this.cellSize }

        const row = Math.trunc(index / this.cols), col = index % this.cols

        return { x: col * this.cellSize, y: row * this.cellSize }
    }

    // Convert world coordinate to local coordinate
    worldToLocal(x, y) {
        // Get bounding rect
        const r = this.canvas.getBoundingClientRect()

        return { x: x - r.x, y: y - r.y }
    }

    // Convert local coordinate to (col, row)
    coordToRowCol(x, y) {
        const col = Math.min(Math.trunc(x / this.cellSize), this.cols - 1), row = Math.min(Math.trunc(y / this.cellSize), this.rows - 1)
        return { col: col, row: row }
    }

    // Get nearest intersect point (col, row) from local coordinate (vertex of cell)
    getNearestIntersect(x, y) {
        const { col, row } = this.coordToRowCol(x, y)

        var points = [{ col: col, row: row }, { col: col + 1, row: row }, { col: col, row: row + 1 }, { col: col + 1, row: row + 1 }]
        points = points.map(e => ({ ...e, x: e.col * this.cellSize, y: e.row * this.cellSize }))
        points = points.map(e => ({ col: e.col, row: e.row, dist: Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2) }))
        const THRESOLD = 0.2
        for (const p of points) {
            if (p.dist < THRESOLD * this.cellSize)
                return { col: p.col, row: p.row }
        }
        return null
    }

    // Get self bounding rect
    getBoundingClientRect() {
        return this.canvas.getBoundingClientRect()
    }
}