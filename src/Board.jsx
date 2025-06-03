import { useState, useRef, useEffect } from 'react'
import { sleep } from './utils'
import './Board.css'

const THEME_COLORS = {
    gridLine: '#ccc',
    cellBackground: 'white',
    robot: 'blue',
    robotText: 'white',
    dirt: 'saddlebrown',
    wall: 'black',
    wallThickness: 2,
    previewWallAdd: 'rgba(100, 185, 255, 0.7)',
    previewWallRemove: 'rgba(255, 71, 71, 0.5)',
    previewWallThickness: 3,
    previewPointColor1: 'rgba(60, 167, 255, 0.7)',
    previewPointFlare1: 'rgba(97, 184, 255, 0.3)',
    previewPointColor2: 'rgba(255, 20, 20, 0.7)',
    previewPointFlare2: 'rgba(255, 137, 137, 0.3)',
    previewPointThickness: 6,
    weightText: 'rgba(0,0,0,0.7)',
    solutionPath: 'rgba(0, 255, 0, 0.7)',
    visitedCell: 'rgba(173, 216, 230, 0.5)',
    frontierCell: 'rgba(211, 211, 211, 0.5)',
    currentProcessingCell: 'rgba(255, 165, 0, 0.7)',
};

let lastTime = 0;
let deltaTime;

/**
 * @typedef {Object} Step
 * @property {string} type
 * @property {Set<number>} visited
 * @property {Set<number>} frontier
 * @property {number} current
 * @property {[]} path
 * @property {number} cost
 */

//

/**
 * @param {Object} props
 * @param {number} props.rows Number of rows
 * @param {number} props.cols Number of columns
 * @param {number} props.cellSize Side length of cell (px)
 * @param {{ robot: number, dirts: Set<number>, weights: Array<number>, adjacency: Array<number> }} props.value 
 *  Set the value of board. `dirts`, `weights` and `adjacency` are store index of cells (flatten)
 * @param {'viewing'|'setRobot'|'setWalls'|'setDirts'|'setWeights'|'solving'} props.mode Current mode
 * @param {{type: string, visited: Set<number>, frontier: Set<number>, current: number, path: Array<number>, cost: number}} props.step Current step when `mode`='solving'
 * @param {(data) => void} props.onChange Callback when edit board
 * @returns 
 */
export default function Board({
    rows = 10,
    cols = 10,
    cellSize = 20,
    value,
    mode = 'view',
    step = { type: '', visited: new Set(), frontier: new Set(), current: -1, path: [], cost: 0 },
    onChange,
}) {
    const [state, setState] = useState({ robot: 0, dirts: new Set(), weights: [], adjacency: [] })
    const bgRef = useRef(null)
    const layerRef = useRef([])
    const wallStack = useRef([])
    const isDragging = useRef(false)

    console.log(mode)

    // Calculate width & heigh of canvas
    const width = cols * cellSize, height = rows * cellSize

    // Convert world coordinate of point to cell index (flatten)
    function worldCoordToCellIndex(x, y) {
        // Get local coordinate
        const local = worldToLocal(x, y)

        return localCoordToCellIndex(local.x, local.y)
    }

    // Convert local coordinate of point to cell index (flatten)
    function localCoordToCellIndex(x, y) {
        x = Math.max(x, 0)
        y = Math.max(y, 0)
        //Get cell column and row index
        const col = Math.min(Math.trunc(x / cellSize), cols - 1), row = Math.min(Math.trunc(y / cellSize), rows - 1)

        return row * cols + col
    }

    // Convert index (flatten) to cell coordinate
    function indexToCellCoord(index) {
        if (index >= rows * cols)
            return { x: (cols - 1) * cellSize, y: (rows - 1) * cellSize }

        const row = Math.trunc(index / cols), col = index % cols

        return { x: col * cellSize, y: row * cellSize }
    }

    // Convert world coordinate to local coordinate
    function worldToLocal(x, y) {
        // Get bounding rect
        const r = bgRef.current?.getBoundingClientRect()

        return { x: x - r.x, y: y - r.y }
    }

    // Convert local coordinate to (col, row)
    function coordToRowCol(x, y) {
        const col = Math.min(Math.trunc(x / cellSize), cols - 1), row = Math.min(Math.trunc(y / cellSize), rows - 1)
        return { col: col, row: row }
    }

    // Get nearest intersect point (col, row) from local coordinate (vertex of cell)
    function getNearestIntersect(x, y) {
        const { col, row } = coordToRowCol(x, y)

        var points = [{ col: col, row: row }, { col: col + 1, row: row }, { col: col, row: row + 1 }, { col: col + 1, row: row + 1 }]
        points = points.map(e => ({ ...e, x: e.col * cellSize, y: e.row * cellSize }))
        points = points.map(e => ({ col: e.col, row: e.row, dist: Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2) }))
        const THRESOLD = 0.2
        for (const p of points) {
            if (p.dist < THRESOLD * cellSize)
                return { col: p.col, row: p.row }
        }
        return null
    }

    // Get self bounding rect
    function getBoundingClientRect() {
        return bgRef.current?.getBoundingClientRect()
    }

    function createPoint(selected) {
        return {
            col: selected.col,
            row: selected.row,
            radius: 0,
            radiusFlare: 0,
            time: 0,

            draw: function (ctx) {
                ctx.save()
                ctx.fillStyle = mode === 'setWalls' ? THEME_COLORS.previewPointColor1 : THEME_COLORS.previewPointColor2
                ctx.beginPath()
                ctx.arc(this.col * cellSize, this.row * cellSize, this.radius, 0, Math.PI * 2)
                ctx.fill()
                ctx.fillStyle = mode === 'setWalls' ? THEME_COLORS.previewPointFlare1 : THEME_COLORS.previewPointFlare2
                ctx.beginPath()
                ctx.arc(this.col * cellSize, this.row * cellSize, this.radiusFlare, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
                if (this.time < 200) {
                    this.time += deltaTime
                    this.time = Math.min(this.time, 200)

                    this.radius = -25 / 100000 * (this.time ** 2) + 65 / 1000 * this.time
                    this.radiusFlare = -8 / 10000 * (this.time ** 2) + 16 / 100 * this.time
                }
            }
        }
    }

    function handleClick(e) {
        const cellIndex = worldCoordToCellIndex(e.clientX, e.clientY)

        if (mode === 'setRobot') {
            setState(state => ({
                ...state,
                robot: cellIndex,
            }))
            return
        }
        if (mode === 'setDirts') {
            if (cellIndex === state.robot)
                return

            setState(state => {
                const copyDirts = new Set(state.dirts)
                if (!copyDirts.delete(cellIndex))
                    copyDirts.add(cellIndex)

                return {
                    ...state,
                    dirts: copyDirts
                }
            })
            return
        }
        if (mode === 'setWalls') {

        }
    }

    function handleMouseDown(e) {
        isDragging.current = true

        if (mode === 'setWalls' || mode == 'deleteWalls') {
            const mousePos = worldToLocal(e.clientX, e.clientY)
            const selected = getNearestIntersect(mousePos.x, mousePos.y)

            if (!selected)
                return

            wallStack.current = [createPoint(selected)]
        }
    }

    function handleMouseMove(e) {
        if (mode === 'setWalls' || mode == 'deleteWalls') {
            if (!isDragging.current)
                return

            const mousePos = worldToLocal(e.clientX, e.clientY)
            const selected = getNearestIntersect(mousePos.x, mousePos.y)

            if (!selected)
                return

            const top = wallStack.current.at(-1)
            const sec = wallStack.current.at(-2)

            if (wallStack.current.length > 1 && selected.col === sec.col && selected.row === sec.row)
                wallStack.current.pop()
            else if (wallStack.current.length === 0 || Math.abs(selected.col - top.col) + Math.abs(selected.row - top.row) === 1)
                wallStack.current.push(createPoint(selected))
        }
    }

    function handleMouseUp(e) {
        isDragging.current = false

        if (mode === 'setWalls' || mode == 'deleteWalls') {
            const newAdj = [...state.adjacency]

            for (var i = 0; i < wallStack.current.length - 1; i++) {
                const st = wallStack.current
                // Define lower and higher point (col, row)
                // 2 adjacent elements of array has either row or column is equal
                const l = { col: Math.min(st[i].col, st[i + 1].col), row: Math.min(st[i].row, st[i + 1].row) }
                const h = { col: Math.max(st[i].col, st[i + 1].col), row: Math.max(st[i].row, st[i + 1].row) }

                const d = { col: h.col - l.col, row: h.row - l.row }
                // Horizontal wall (top side of cell)
                if (d.col === 1) {
                    const cellIndex = l.row * cols + l.col
                    newAdj[cellIndex][0] = mode === 'setWalls' ? true : false
                }
                // Vertical wall (right side of cell)
                if (d.row === 1) {
                    const cellIndex = l.row * cols + l.col - 1
                    newAdj[cellIndex][1] = mode === 'setWalls' ? true : false
                }
            }

            setState(state => ({ ...state, adjacency: newAdj }))

            wallStack.current = []
        }
    }

    function draw() {
        if (!bgRef.current)
            return;

        const canvas = bgRef.current
        const ctx = canvas.getContext('2d')

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        drawGrid(ctx)
        drawRobot(ctx)
        drawDirts(ctx)
        drawWalls(ctx)
    }

    function drawGrid(ctx) {
        // Style
        ctx.strokeStyle = THEME_COLORS.gridLine

        ctx.beginPath()

        // Draw horizontal lines
        for (var i = 1; i < rows; i++) {
            ctx.moveTo(0, i * cellSize)
            ctx.lineTo(cols * cellSize, i * cellSize)
        }

        // Draw vertical lines
        for (var i = 1; i < cols; i++) {
            ctx.moveTo(i * cellSize, 0)
            ctx.lineTo(i * cellSize, rows * cellSize)
        }

        // Fill stroke
        ctx.stroke();
    }

    function drawRobot(ctx) {
        // Style
        ctx.fillStyle = THEME_COLORS.robot

        // Convert index of robot to coordinate
        const pos = indexToCellCoord((value ?? state).robot)

        // Draw rectangle
        ctx.fillRect(pos.x + 5, pos.y + 5, cellSize - 10, cellSize - 10)
    }

    function drawDirts(ctx) {
        const img = new Image()
        img.src = '../public/color-splash-svgrepo-com.svg'

        // Style
        ctx.fillStyle = THEME_COLORS.dirt

        for (const dirt of (value ?? state).dirts) {
            const pos = indexToCellCoord(dirt)
            ctx.drawImage(img, pos.x + 5, pos.y + 5, cellSize - 10, cellSize - 10)
        }
    }

    function drawWalls(ctx) {
        // Style
        ctx.strokeStyle = THEME_COLORS.wall

        // Draw actual walls
        ctx.beginPath()

        for (const [index, adj] of (value ?? state).adjacency.entries()) {
            const row = Math.trunc(index / cols), col = index % cols
            if (!adj)
                continue

            // Top wall
            if (adj[0]) {
                ctx.moveTo(col * cellSize, row * cellSize)
                ctx.lineTo((col + 1) * cellSize, row * cellSize)
            }
            // Right wall
            if (adj[1]) {
                ctx.moveTo((col + 1) * cellSize, row * cellSize)
                ctx.lineTo((col + 1) * cellSize, (row + 1) * cellSize)
            }
            // Bottom wall
            if (adj[2]) {
                ctx.moveTo(col * cellSize, (row + 1) * cellSize)
                ctx.lineTo((col + 1) * cellSize, (row + 1) * cellSize)
            }
            // Left wall
            if (adj[3]) {
                ctx.moveTo(col * cellSize, row * cellSize)
                ctx.lineTo(col * cellSize, (row + 1) * cellSize)
            }

        }
        ctx.stroke()
    }

    function drawEffectLayer() {

        if (!layerRef.current[1])
            return

        const canvas = layerRef.current[1]
        const ctx = canvas.getContext('2d')


        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        drawDrawingWalls(ctx)
        drawDeletingWalls(ctx)
        drawSelectedPoint(ctx)
    }

    function drawDrawingWalls(ctx) {
        if (mode !== 'setWalls')
            return

        // Style
        ctx.save()
        ctx.strokeStyle = THEME_COLORS.previewWallAdd
        ctx.lineWidth = THEME_COLORS.previewWallThickness
        ctx.beginPath()

        const st = wallStack.current
        for (var i = 0; i < st.length - 1; i++) {
            ctx.moveTo(st[i].col * cellSize, st[i].row * cellSize)
            ctx.lineTo(st[i + 1].col * cellSize, st[i + 1].row * cellSize)
        }
        ctx.stroke()
        ctx.restore()
    }

    function drawDeletingWalls(ctx) {
        if (mode !== 'deleteWalls')
            return

        // Style
        ctx.save()
        ctx.strokeStyle = THEME_COLORS.previewWallRemove
        ctx.lineWidth = THEME_COLORS.previewWallThickness
        ctx.beginPath()

        const st = wallStack.current
        for (var i = 0; i < st.length - 1; i++) {
            ctx.moveTo(st[i].col * cellSize, st[i].row * cellSize)
            ctx.lineTo(st[i + 1].col * cellSize, st[i + 1].row * cellSize)
        }
        ctx.stroke()
        ctx.restore()
    }

    function drawSelectedPoint(ctx) {
        if (wallStack.current.length === 0)
            return

        // Style
        ctx.save()
        ctx.fillStyle = THEME_COLORS.previewPointColor

        for (const p of wallStack.current) {
            p.draw(ctx)
        }
        ctx.restore()

    }

    function drawStepsVisuzlizeLayer() {
        if (!layerRef.current[2] || mode !== 'solving')
            return

        const canvas = layerRef.current[2]
        const ctx = canvas.getContext('2d')

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        drawVisitedCells(ctx)
        drawFrontierCells(ctx)
        drawCurrentProcessingCell(ctx)
        drawPath(ctx)
    }

    function drawVisitedCells(ctx) {
        ctx.save()
        ctx.fillStyle = THEME_COLORS.visitedCell
        for (const index of step.visited) {
            const p = indexToCellCoord(index)
            ctx.fillRect(p.x, p.y, cellSize, cellSize)
        }
        ctx.restore()
    }

    function drawFrontierCells(ctx) {
        ctx.save()
        ctx.fillStyle = THEME_COLORS.frontierCell
        for (const index of step.frontier) {
            const p = indexToCellCoord(index)
            ctx.fillRect(p.x, p.y, cellSize, cellSize)
        }
        ctx.restore()
    }

    function drawCurrentProcessingCell(ctx) {
        ctx.save()
        ctx.fillStyle = THEME_COLORS.currentProcessingCell
        const p = indexToCellCoord(step.current)
        ctx.fillRect(p.x, p.y, cellSize, cellSize)
        ctx.restore()
    }

    function drawPath(ctx, delay = 20) {
        if (step.type !== 'found')
            return

        if (drawPath.time === undefined) {
            drawPath.len = 0;
            drawPath.time = 0;
        }

        ctx.save()
        ctx.fillStyle = THEME_COLORS.solutionPath
        drawPath.time += deltaTime
        if (drawPath.time >= delay) {
            drawPath.len++
            drawPath.time = 0
        }

        for (var i = 0; i < drawPath.len; i++) {
            const p = indexToCellCoord(step.path[i])
            ctx.fillRect(p.x, p.y, cellSize, cellSize)

            // Delete dirt
            // setState(state => {
            //     const newState = { ...state }
            //     newState.dirts.delete(index)
            //     return newState
            // })
        }
        ctx.restore()
    }


    useEffect(() => {
        draw()
        if (onChange) {
            if (value)
                setState(value)
            onChange(state)
        }
    }, [!value ? state : (state.robot === value.robot && state.dirts === value.dirts && state.weights === value.weights && state.adjacency === value.adjacency)])

    function callback(currentTime) {
        deltaTime = currentTime - lastTime
        lastTime = currentTime

        drawEffectLayer()
        drawStepsVisuzlizeLayer()
        requestAnimationFrame(callback)
    }

    var id
    useEffect(() => {
        if (id)
            cancelAnimationFrame(id)
        id = requestAnimationFrame(callback)
    }, [state, mode])

    useEffect(() => {
        if (!value) {
            setState(state => ({ ...state, adjacency: Array.from({ length: rows * cols }, (_, i) => Array(4).fill(false)) }))
        }
        else {
            setState(value)
        }
    }, [rows, cols])

    return (
        <div
            className='Board'
            style={{
                width: `${width}px`,
                height: `${height}px`,
            }}
        >
            <canvas
                ref={bgRef}
                className='bg-layer'
                width={`${width}px`}
                height={`${height}px`}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
            <canvas
                ref={e => layerRef.current[1] = e}
                className='effect-layer'
                width={`${width}px`}
                height={`${height}px`}
            />
            <canvas
                ref={e => layerRef.current[2] = e}
                className='steps-visualize-layer'
                width={`${width}px`}
                height={`${height}px`}
            />
        </div>

    )
}