import { memo, useEffect, useMemo, useRef } from 'react'
import THEME_COLORS from './theme'
import Layer from './Layer'

export default function WallsLayer({ adjacency, ctx, canvas, ...props }) {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.save()
        // Style
        ctx.strokeStyle = THEME_COLORS.wall
        ctx.lineWidth = THEME_COLORS.wallThickness

        // Draw walls
        ctx.beginPath()
        adjacency.forEach((adj, index) => {
            const row = Math.trunc(index / canvas.cols), col = index % canvas.cols
            const cellSize = canvas.cellSize


            if (!adj)
                return

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
        })

        ctx.stroke()
        ctx.restore()
    }

    return (
        <Layer {...props} />
    )
}