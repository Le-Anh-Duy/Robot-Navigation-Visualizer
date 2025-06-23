import { useState, useRef, useEffect } from 'react'
import '../../styles/SolverForm.css'

/**
 * @param {Object} props
 * @param {{value: Mode, text: string}} props.mode Mode
 * @param {{value: string, text: string}} props.algorithms Algorithms list for selection
 * @param {{value: string, text: string}} props.heuristics Heuristics list for selection
 * @param {number} props.minSpeed Minium animation speed for simulate solving steps
 * @param {number} props.maxSpeed Maximum animation speed for simulate solving steps
 * @param {(data: { mode: string, algorithm: string, heuristic: string, speed: number }) => void} props.onChange Callback when change selection
 * @param {(data: { mode: string, algorithm: string, heuristic: string, speed: number }) => void} props.onClickSolve Callback when click "Solve" button
 * @param {() => void} props.onClickResults Callback when click "See result" button
 * @returns
 */
export default function SolverForm({ mode = [], algorithms = [], heuristics = [],
    minSpeed = 1, maxSpeed = 1000, onChange, onClickSolve, onClickCancelSolve, onClickResults
}) {
    const [data, setData] = useState({
        mode: '',
        algorithm: algorithms?.[0].value,
        heuristic: '',
        speed: 50,
    })
    const selectRef = useRef(null)
    const [isSolving, setIsSolving] = useState(false)

    useEffect(() => onChange?.(data), [data])

    function handleFileChange(e) {
        if (e.target.files.length === 0)
            setData(data => ({ ...data, heuristic: selectRef?.current.value }))
        else
            setData(data => ({ ...data, heuristic: e.target.files[0] }))

        console.log(e.target)
    }

    function handleAlgorithmChange(e) {
        setData(data => ({ ...data, algorithm: e.target.value }))
    }

    function handleHeuristicSelectChange(e) {
        setData(data => ({ ...data, heuristic: e.target.value }))
    }

    function handleSpeedChange(e) {
        setData(data => ({ ...data, speed: Number(e.target.value) }))
    }

    return (
        <div className='SolverForm'>
            <fieldset>
                <legend>Solver</legend>
                <div>
                    <label htmlFor='algorithm'>Algorithm</label>
                    <select id='algorithm' onChange={handleAlgorithmChange}>
                        {algorithms.map((e, i) => <option key={i} value={e.value}>{e.text}</option>)}
                    </select>
                </div>
                <hr />
                <div className='heuristic'>
                    <label htmlFor='heuristic'>Heuristic</label>
                    <div id='heuristic'>
                        <select
                            ref={selectRef}
                            onChange={handleHeuristicSelectChange}
                            disabled={typeof data.heuristic !== 'string'}
                        >
                            {heuristics.map((e, i) => <option key={i} value={e.value}>{e.text}</option>)}
                        </select>
                        <p>OR</p>
                        <input type='file' onChange={handleFileChange} />
                    </div>
                </div>
                <div>
                    <label htmlFor='speed'>Animation speed: {data.speed}</label>
                    <input id='speed' type='range' min={minSpeed} max={maxSpeed} value={data.speed} onChange={handleSpeedChange} />
                </div>
                <div className='button-field'>
                    <button onClick={() => {
                        setIsSolving(isSolving => !isSolving)
                        if (!isSolving)
                            onClickSolve?.(data)
                        else
                            onClickCancelSolve?.()
                    }} style={{
                        ...(isSolving && { backgroundColor: 'rgb(255, 100, 100)' })
                    }}>
                        {isSolving ? 'Cancel' : 'Solve'}
                    </button>
                    <button onClick={onClickResults}>See results</button>
                </div>
            </fieldset>
        </div>
    )
}