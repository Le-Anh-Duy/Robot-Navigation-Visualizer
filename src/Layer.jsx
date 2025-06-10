import { useContext, useEffect, useRef } from 'react'
import LayerContext from './LayerContext'

export default function Layer({ pointerEvents = true, ...props }) {
    const [addEventListener, removeEventListener] = useContext(LayerContext)
    const prevEventProps = useRef(), eventProps = useRef()

    // Extract props which are event handle
    function extractEventProps(props) {
        const eventProps = Object.fromEntries(
            Object.entries(props).filter(([key, value]) =>
                key.startsWith('on') && typeof value === 'function'
            )
        );
        return eventProps;
    }

    // Add event listener, update when events changed
    useEffect(() => {
        if (eventProps.current)
            prevEventProps.current = eventProps.current

        eventProps.current = extractEventProps(props)

        // Remove old events
        if (prevEventProps.current)
            Object.entries(prevEventProps.current).forEach(([key, value]) => {
                removeEventListener?.(key, value)
            })

        // Add new events
        if (pointerEvents && !props.disabled)
            Object.entries(eventProps.current).forEach(([key, value]) => {
                addEventListener?.(key, value)
            })

    }, [props, pointerEvents])

    return (
        <canvas
            {...props}
            style={{
                ...props.style,
                // Hidden when disabled
                display: props.disabled ? 'none' : 'block',
            }}
        />
    )
}