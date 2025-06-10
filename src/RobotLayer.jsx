import { useEffect, useRef } from 'react'
import Layer from './Layer'

const robotImg = new Image()
robotImg.src = './robot.svg'

/**
 * @param {Object} props
 * @param {CanvasHelper} props.canvas 
 * @param {CanvasRenderingContext2D} props.ctx
 * @returns 
 */
export default function RobotLayer({ onChange, robot, ctx, canvas, ...props }) {
    const robotRef = useRef(null)

    class Robot {
        constructor(x, y, padding = { top: 5, right: 5, bottom: 5, left: 5 }) {
            this.x = x
            this.y = y
            this.padding = padding
            this.width = canvas.cellSize - this.padding.left - this.padding.right
            this.height = canvas.cellSize - this.padding.top - this.padding.bottom
            this.velocity = { x: 0, y: 0 }
        }

        update(deltaTime) {
            ctx.save()

            // Make "motion blur" effect
            ctx.globalCompositeOperation = 'destination-out'
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.globalCompositeOperation = 'source-over'

            // // Draw robot
            ctx.drawImage(robotImg, this.x + this.padding.left, this.y + this.padding.top, this.width, this.height)
            // Update position
            this.x += this.velocity.x * deltaTime
            this.y += this.velocity.y * deltaTime
            ctx.restore()
        }
    }

    function update(deltaTime) {
        robotRef.current.update(deltaTime)
    }

    function handleClick(e) {
        const cellIndex = canvas.worldCoordToCellIndex(e.clientX, e.clientY)
        if (cellIndex !== robot)
            onChange(cellIndex)
    }

    useEffect(() => {
        if (!ctx)
            return;

        // Calculate position, distance and length of animation
        const pos = canvas.indexToCellCoord(robot)
        const d = { x: pos.x - robotRef.current.x, y: pos.y - robotRef.current.y }
        const time = 500

        const v = { x: d.x / time, y: d.y / time }

        robotRef.current.velocity = v

        const timeout = setTimeout(() => {
            // Stop animation
            robotRef.current.velocity = { x: 0, y: 0 }
            robotRef.current.x = pos.x
            robotRef.current.y = pos.y
        }, time)
        return () => clearTimeout(timeout)

    }, [robot])

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

    if (ctx && !robotRef.current)
        robotRef.current = new Robot(0, 0)

    return (
        <Layer
            {...props}
            onClick={handleClick}
        />
    )
}