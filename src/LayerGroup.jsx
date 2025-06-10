import { Children, cloneElement, createContext, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import CanvasHelper from './CanvasHelper'
import LayerContext from './LayerContext'

export default function LayerGroup({ cellSize, ...props }) {
    const canvasRefs = useRef([])
    const divRef = useRef(null)
    const events = useRef(new Map())
    const eventHandleRef = useRef(null)

    // Custom event system for canvas
    const addEventListener = useCallback((type, listener) => {
        if (!events.current.has(type)) {
            events.current.set(type, new Set());
        }
        events.current.get(type).add(listener);
        if (eventHandleRef.current)
            eventHandleRef.current.trigger(events.current)
    }, [])

    const removeEventListener = useCallback((type, listener) => {
        events.current.get(type)?.delete(listener);
    }, [])

    return (
        <LayerContext.Provider value={[addEventListener, removeEventListener]}>
            <div
                {...props}
                style={{
                    width: props.width,
                    height: props.height,
                }}
                ref={divRef}
            >
                {Children.map(props.children, (child, index) => {
                    return cloneElement(child, {
                        ref: e => canvasRefs.current[index] = e,
                        width: props.width,
                        height: props.height,
                        style: {
                            ...child.props.style,
                            position: 'absolute',
                            zIndex: index
                        },
                        ctx: canvasRefs.current[index]?.getContext('2d'),
                        canvas: new CanvasHelper(canvasRefs.current[index], props.rows, props.cols, cellSize),
                    })
                })}
                <EventHandleLayer ref={eventHandleRef} {...props} />
            </div>
        </LayerContext.Provider>
    )
}

function EventHandleLayer({ ref, ...props }) {
    const [events, setEvents] = useState(new Map())

    useImperativeHandle(ref, () => ({
        trigger: (events) => setEvents(events)
    }))

    return (
        <canvas
            {...Object.fromEntries(
                Array.from(events.entries()).map(([type, listeners]) => [
                    type,
                    (...args) => listeners.forEach(fn => fn(...args)),
                ])
            )}
            style={{
                zIndex: props.children.length
            }}
            width={props.width}
            height={props.height}
        />
    )
}