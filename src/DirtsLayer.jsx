import { useEffect, useRef } from 'react'
import Layer from './Layer'

const dirtImg = new Image()
dirtImg.src = './dirt.svg'

export default function DirtsLayer({ dirts, ctx, canvas, ...props }) {
    class Dirt {
        constructor(x, y, padding = { top: 5, right: 5, bottom: 5, left: 5 }) {
            this.x = x
            this.y = y
            this.padding = padding
            this.width = canvas.cellSize - this.padding.left - this.padding.right
            this.height = canvas.cellSize - this.padding.top - this.padding.bottom
        }

        update(deltaTime) {
            ctx.save()
            // Draw dirt
            ctx.drawImage(dirtImg, this.x + this.padding.left, this.y + this.padding.top, this.width, this.height)
            ctx.restore()
        }
    }

    const dirtsRef = useRef(null)

    function update(deltaTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (const dirt of dirtsRef.current) {
            dirt.update(deltaTime)
        }
    }

    useEffect(() => {
        if (!ctx)
            return;

        dirtsRef.current = [...dirts].map(e => {
            const pos = canvas.indexToCellCoord(e)
            return new Dirt(pos.x, pos.y)
        })

    }, [dirts])

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

    if (ctx && !dirtsRef.current) {
        dirtsRef.current = [...dirts].map(e => {
            const pos = canvas.indexToCellCoord(e)
            return new Dirt(pos.x, pos.y)
        })
    }

    return (
        <Layer {...props} />
    )
}