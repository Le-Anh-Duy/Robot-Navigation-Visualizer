import { useEffect, useRef, useState } from 'react'
import THEME_COLORS from '../constants/theme'
import Mode from '../constants/Mode'
import Layer from '../layer_system/Layer'
import CanvasHelper from '../layer_system/CanvasHelper'
import { sleep } from '../utils'

/**
 * @param {Object} props
 * @param {CanvasHelper} props.canvas 
 * @param {CanvasRenderingContext2D} props.ctx
 * @returns 
 */
export default function SimulationLayer({ step, ctx, canvas, initRobot = 0, setRobot, initDirts = new Set(), setDirts, animSpeed, ...props }) {
    const rows = canvas.rows, cols = canvas.cols, cellSize = canvas.cellSize
    const [len, setLen] = useState(0)
    const isSolving = useRef(false)
    const dirts = useRef(initDirts)

    useEffect(() => { dirts.current = new Set(initDirts) }, [initDirts])

    useEffect(() => {
        setRobot(initRobot)
        setDirts(initDirts)
        isSolving.current = !props.disabled
    }, [props.disabled])

    function update(deltaTime) {
        if (props.disabled) {
            drawPath.time = undefined
            return
        }

    }

    function drawVisitedCells() {
        ctx.save()
        ctx.fillStyle = THEME_COLORS.visitedCell
        for (const index of step.visited) {
            const p = canvas.indexToCellCoord(index)
            ctx.fillRect(p.x, p.y, cellSize, cellSize)
        }
        ctx.restore()
    }

    function drawFrontierCells() {
        ctx.save()
        ctx.fillStyle = THEME_COLORS.frontierCell
        for (const index of step.frontier) {
            const p = canvas.indexToCellCoord(index)
            ctx.fillRect(p.x, p.y, cellSize, cellSize)
        }
        ctx.restore()
    }

    function drawCurrentProcessingCell() {
        ctx.save()
        ctx.fillStyle = THEME_COLORS.currentProcessingCell
        const p = canvas.indexToCellCoord(step.current)
        ctx.fillRect(p.x, p.y, cellSize, cellSize)
        ctx.restore()
    }

    async function drawPath() {
        if (step.type !== 'found')
            return

        if (drawPath.time === undefined) {
            drawPath.len = 0;
            drawPath.time = 0;
        }

        ctx.save()
        ctx.fillStyle = THEME_COLORS.solutionPath

        for (var i = 0; i < step.path.length && isSolving.current; i++) {
            const p = canvas.indexToCellCoord(step.path[i])
            ctx.fillRect(p.x, p.y, cellSize, cellSize)
            setRobot?.(step.path[i])
            if (dirts.current?.has(step.path[i])) {
                dirts.current.delete(step.path[i])
                console.log(dirts.current)
                setDirts(new Set(dirts.current))
            }
            await sleep(animSpeed)
        }
        ctx.restore()
    }

    useEffect(() => {
        if (!ctx)
            return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        drawVisitedCells()
        drawFrontierCells()
        drawCurrentProcessingCell()
        drawPath()
    }, [step, len])

    var id
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

            id = requestAnimationFrame(anim)
        }
        if (id) cancelAnimationFrame(id)
        id = requestAnimationFrame(anim)
    }, [ctx, canvas])

    return (
        <Layer {...props} />
    )
}