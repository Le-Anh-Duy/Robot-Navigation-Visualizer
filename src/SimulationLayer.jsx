import { useEffect, useRef, useState } from 'react'
import THEME_COLORS from './theme'
import Mode from './Mode'
import Layer from './Layer'

export default function SimulationLayer({ step, ctx, canvas, ...props }) {
    const rows = canvas.rows, cols = canvas.cols, cellSize = canvas.cellSize

    function update(deltaTime) {
        drawVisitedCells(deltaTime)
        drawFrontierCells(deltaTime)
        drawCurrentProcessingCell(deltaTime)
        drawPath(deltaTime)
    }

    function drawVisitedCells(deltaTime) {
        ctx.save()
        ctx.fillStyle = THEME_COLORS.visitedCell
        for (const index of step.visited) {
            const p = canvas.indexToCellCoord(index)
            ctx.fillRect(p.x, p.y, cellSize, cellSize)
        }
        ctx.restore()
    }

    function drawFrontierCells(deltaTime) {
        ctx.save()
        ctx.fillStyle = THEME_COLORS.frontierCell
        for (const index of step.frontier) {
            const p = canvas.indexToCellCoord(index)
            ctx.fillRect(p.x, p.y, cellSize, cellSize)
        }
        ctx.restore()
    }

    function drawCurrentProcessingCell(deltaTime) {
        ctx.save()
        ctx.fillStyle = THEME_COLORS.currentProcessingCell
        const p = canvas.indexToCellCoord(step.current)
        ctx.fillRect(p.x, p.y, cellSize, cellSize)
        ctx.restore()
    }

    function drawPath(deltaTime, delay = 20) {
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
            const p = canvas.indexToCellCoord(step.path[i])
            ctx.fillRect(p.x, p.y, cellSize, cellSize)
        }
        ctx.restore()
    }

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
    }, [ctx])

    return (
        <Layer {...props} />
    )
}