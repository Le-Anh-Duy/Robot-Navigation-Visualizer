import { useEffect, useRef } from 'react'
import THEME_COLORS from '../constants/theme'
import Layer from '../layer_system/Layer'
import CanvasHelper from '../layer_system/CanvasHelper'

/**
 * @param {Object} props
 * @param {CanvasHelper} props.canvas 
 * @param {CanvasRenderingContext2D} props.ctx
 * @returns 
 */
export default function BackgroundLayer({ ctx, canvas, ...props }) {
    if (ctx) {
        setTimeout(() => {
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
        }, 0)
    }

    return (
        <Layer {...props} />
    )
}