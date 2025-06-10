import { useEffect, useRef } from 'react'
import THEME_COLORS from './theme'
import Layer from './Layer'

/**
 * @param {Object} props
 * @param {CanvasHelper} props.canvas 
 * @param {CanvasRenderingContext2D} props.ctx
 * @returns 
 */
export default function BackgroundLayer({ ctx, canvas, ...props }) {
    if (ctx) {
        const rows = canvas.rows, cols = canvas.cols, cellSize = canvas.cellSize

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
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

        ctx.stroke();
        ctx.restore()
    }

    return (
        <Layer {...props} />
    )
}