import { useEffect, useState } from "react"

export default function Switch({ value, onChange, scale = 1, hidden, ...props }) {
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        setChecked(checked)
    }, [value])

    function handleClick(e) {
        onChange?.(!checked)
        if (!value)
            setChecked(!checked)
    }

    if (hidden)
        return <></>

    return (
        <label {...props} onClick={handleClick} style={{ ...props.style, userSelect: 'none' }}>
            <div onClick={handleClick} style={{
                display: 'flex',
                borderRadius: `${20 * scale}px`,
                backgroundColor: 'rgb(141, 141, 141)',
                width: `${40 * scale}px`,
                height: `${20 * scale}px`,
                padding: `${2 * scale}px ${3 * scale}px`,
                alignItems: 'center',
                margin: '0px 5px',
                cursor: 'pointer'
            }}>
                <div style={{
                    backgroundColor: 'black',
                    borderRadius: '20px',
                    backgroundColor: 'rgb(255, 255, 255)',
                    width: `${17 * scale}px`,
                    height: `${17 * scale}px`,
                    transition: 'transform 0.2s ease',
                    transform: checked ? `translateX(${23 * scale}px)` : 'translateX(0px)'
                }} />
            </div>
            {props.children}
        </label>
    )
}