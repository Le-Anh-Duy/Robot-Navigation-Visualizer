import { useEffect, useRef } from 'react'
import Layer from '../layer_system/Layer'
import CanvasHelper from '../layer_system/CanvasHelper'

const dirtImg = new Image()
dirtImg.src = './dirt.svg'

/**
 * @param {Object} props
 * @param {CanvasHelper} props.canvas 
 * @param {CanvasRenderingContext2D} props.ctx
 * @returns 
 */
export default function DirtsLayer({ dirts, onChange, ctx, canvas, ...props }) {
    const dirtsRef = useRef(new Map([...dirts].map(value => [value, undefined])))

    class Dirt {
        constructor(x, y, padding = { top: 5, right: 5, bottom: 5, left: 5 }) {
            this.x = x
            this.y = y
            this.padding = padding
            this.width = canvas.cellSize - this.padding.left - this.padding.right
            this.height = canvas.cellSize - this.padding.top - this.padding.bottom
            this.currentWidth = 0
            this.currentHeight = 0
            this.velocity = 0.5
        }

        update(deltaTime, canvas) {
            ctx.save()
            // Draw dirt
            ctx.drawImage(dirtImg, this.x + canvas.cellSize / 2 - this.currentWidth / 2, this.y + canvas.cellSize / 2 - this.currentHeight / 2, this.currentWidth, this.currentHeight)
            if (this.currentWidth < this.width) {
                // Calculate new velocity for smooth animation
                const vel = (0.98 * (1 - this.currentWidth / this.width) ** 1.2 + 0.02) * this.velocity
                this.currentWidth += vel * deltaTime
                this.currentWidth = Math.min(this.currentWidth, this.width)
            }
            this.currentHeight = this.currentWidth
            ctx.restore()
        }
    }

    function handleClick(e) {
        const cellIndex = canvas.worldCoordToCellIndex(e.clientX, e.clientY)
        const pos = canvas.indexToCellCoord(cellIndex)

        if (dirtsRef.current.has(cellIndex))
            dirtsRef.current.delete(cellIndex)
        else
            dirtsRef.current.set(cellIndex, new Dirt(pos.x, pos.y))

        onChange?.(new Set([...dirtsRef.current.entries()].map(([key, value]) => (value && key))))
    }

    function update(deltaTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (const [key, value] of dirtsRef.current) {
            value.update(deltaTime, canvas)
        }
    }

    useEffect(() => {
        if (dirts)
            dirtsRef.current = new Map([...dirts].map(value => {
                const pos = canvas.indexToCellCoord(value)
                return [value, new Dirt(pos.x, pos.y)]
            }))
    }, [dirts])

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

        if (id)
            cancelAnimationFrame(id)

        id = requestAnimationFrame(anim)
    }, [ctx, canvas])

    return (
        <Layer {...props} onClick={handleClick} />
    )
}