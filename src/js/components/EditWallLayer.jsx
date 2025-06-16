import { useEffect, useRef, useState } from 'react'
import THEME_COLORS from '../constants/theme'
import Mode from '../constants/Mode'
import Layer from '../layer_system/Layer'

/**
 * @param {Object} props
 * @param {CanvasHelper} props.canvas 
 * @param {CanvasRenderingContext2D} props.ctx
 * @returns 
 */
export default function EditWallLayer({ onChange, adjacency, mode, ctx, canvas, ...props }) {
    const pointsRef = useRef([])
    const isDragging = useRef(false)
    const pointStack = useRef([])
    const [adj, setAdj] = useState(adjacency)

    function updateAdj(updater) {
        const newState = typeof updater === 'function' ? updater(adj) : updater;

        onChange?.(newState);

        if (adjacency === undefined) {
            setAdj(newState);
        }
    }

    class Point {
        constructor(row, col, radius = THEME_COLORS.previewPointThickness / 2) {
            this.row = row
            this.col = col
            this.x = col * canvas.cellSize
            this.y = row * canvas.cellSize
            this.radius = radius
            this.currentRadius = 0
            this.flareRadius = 0
            this.velocity = 0.1
            this.acceleration = -0.001
        }

        update(deltaTime) {
            ctx.save()
            ctx.fillStyle = (mode === Mode.DRAW_WALL) ? THEME_COLORS.previewPointColorAdd : THEME_COLORS.previewPointColorRemove
            ctx.beginPath()
            ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2)
            ctx.fill()

            if (this.velocity > 0 || this.currentRadius > this.radius) {
                this.currentRadius += this.velocity * deltaTime
                if (this.velocity < 0)
                    this.currentRadius = Math.max(this.currentRadius, this.radius)
                this.velocity += this.acceleration * deltaTime
            }
            ctx.restore()
        }
    }

    function update(deltaTime) {
        ctx.save()
        // Make "motion blur" effect
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.globalCompositeOperation = 'source-over'

        // Draw walls first
        ctx.strokeStyle = (mode === Mode.DRAW_WALL) ? THEME_COLORS.previewWallAdd : THEME_COLORS.previewWallRemove
        ctx.lineWidth = THEME_COLORS.previewWallThickness
        ctx.beginPath()
        const st = pointStack.current
        const cellSize = canvas.cellSize
        for (var i = 0; i < st.length - 1; i++) {
            ctx.moveTo(st[i].col * cellSize, st[i].row * cellSize)
            ctx.lineTo(st[i + 1].col * cellSize, st[i + 1].row * cellSize)
        }
        ctx.stroke()

        // Draw points
        for (const p of pointStack.current) {
            p.update(deltaTime)
        }
        ctx.restore()
    }

    function handleMouseDown(e) {
        isDragging.current = true

        const mousePos = canvas.worldToLocal(e.clientX, e.clientY)
        const selected = canvas.getNearestIntersect(mousePos.x, mousePos.y)

        if (!selected)
            return

        pointStack.current = [new Point(selected.row, selected.col)]
    }

    function handleMouseMove(e) {
        if (!isDragging.current)
            return

        const mousePos = canvas.worldToLocal(e.clientX, e.clientY)
        const selected = canvas.getNearestIntersect(mousePos.x, mousePos.y)

        if (!selected)
            return

        const top = pointStack.current.at(-1)
        const sec = pointStack.current.at(-2)

        if (pointStack.current.length > 1 && selected.col === sec.col && selected.row === sec.row)
            pointStack.current.pop()
        else if (pointStack.current.length === 0 || Math.abs(selected.col - top.col) + Math.abs(selected.row - top.row) === 1)
            pointStack.current.push(new Point(selected.row, selected.col))
    }

    function handleMouseUp(e) {
        isDragging.current = false

        const cols = canvas.cols, rows = canvas.rows
        const st = pointStack.current

        const newAdj = [...adj]

        for (var i = 0; i < st.length - 1; i++) {
            // Define lower and higher point (col, row)
            // 2 adjacent elements of array has either row or column is equal
            const l = { col: Math.min(st[i].col, st[i + 1].col), row: Math.min(st[i].row, st[i + 1].row) }
            const h = { col: Math.max(st[i].col, st[i + 1].col), row: Math.max(st[i].row, st[i + 1].row) }

            const d = { col: h.col - l.col, row: h.row - l.row }
            const val = mode === Mode.DRAW_WALL

            // If wall on edge of board, remove it
            if ((l.col === 0 && h.col === 0) || (l.col === cols && h.col === cols) ||
                (l.row === 0 && h.row === 0) || (l.row === rows && h.row === rows)) {
                continue
            }

            // Horizontal wall (top side of cell)
            if (d.col === 1) {
                const cellIndex = l.row * cols + l.col
                newAdj[cellIndex][0] = val
                newAdj[cellIndex - cols][2] = val
            }
            // Vertical wall (right side of cell)
            if (d.row === 1) {
                const cellIndex = l.row * cols + l.col - 1
                newAdj[cellIndex][1] = val
                newAdj[cellIndex + 1][3] = val
            }
        }

        updateAdj(newAdj)
        pointStack.current = []
    }

    function handleMouseLeave(e) {
        // Cancel
        isDragging.current = false;
        pointStack.current = []
    }

    useEffect(() => {
        if (adjacency)
            setAdj(adjacency)
    }, [adjacency])

    useEffect(() => {
        if (!ctx)
            return

        var lastTime
        const anim = (currentTime) => {
            if (!lastTime)
                lastTime = currentTime

            const deltaTime = currentTime - lastTime
            lastTime = currentTime
            update(deltaTime)

            requestAnimationFrame(anim)
        }

        requestAnimationFrame(anim)
    }, [ctx, mode])

    return (
        <Layer
            {...props}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        />
    )
}