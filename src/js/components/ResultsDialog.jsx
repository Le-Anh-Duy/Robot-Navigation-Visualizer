import { useEffect, useState } from "react"
import '../../styles/ResultsDialog.css'

export default function ResultsDialog({ stepCount = 0, cost = 0, open, onClose, ...props }) {
    const [stepColor, setStepColor] = useState('black')
    const [costColor, setCostColor] = useState('black')
    useEffect(() => {
        setStepColor('red')
        setTimeout(() => setStepColor('black'), 500)
    }, [stepCount])
    useEffect(() => {
        setCostColor('red')
        setTimeout(() => setCostColor('black'), 500)
    }, [cost])

    return (
        <div draggable className='ResultsDialog' {...props} onClick={e => e.stopPropagation()} style={{
            position: 'absolute',
            backgroundColor: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            minWidth: '300px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            backgroundColor: 'rgb(201, 230, 255)',
            top: open ? '10px' : '-20%',
            opacity: open ? 1 : 0,
            transition: 'all 0.3s ease',
        }}
        >
            <span>
                Step
                <span style={{ color: stepColor }}>{stepCount}</span>
            </span>
            <div />
            <span>
                Cost
                <span style={{ color: costColor }}>{cost}</span>
            </span>
        </div>
    )
}