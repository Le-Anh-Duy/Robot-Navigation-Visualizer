import { useState, useRef, useEffect } from 'react'
import '../../styles/Board.css'
import Mode from '../constants/Mode'
import LayerGroup from '../layer_system/LayerGroup'
import RobotLayer from './RobotLayer'
import DirtsLayer from './DirtsLayer'
import WallsLayer from './WallsLayer'
import EditWallLayer from './EditWallLayer'
import BackgroundLayer from './BackgroundLayer'
import SimulationLayer from './SimulationLayer'

/**
 * @param {Object} props
 * @param {number} props.rows Number of rows
 * @param {number} props.cols Number of columns
 * @param {number} props.cellSize Side length of cell (px)
 * @param {{ robot: number, dirts: Set<number>, weights: Array<number>, adjacency: Array<number> }} props.value 
 *  Set the value of board. `dirts`, `weights` and `adjacency` are store index of cells (flatten)
 * @param {Mode} props.mode Current mode (see Mode.jsx)
 * @param {{type: string, visited: Set<number>, frontier: Set<number>, current: number, path: Array<number>, cost: number}} props.step Current step when `mode`=`Mode.SOLVING`
 * @param {(data) => void} props.onChange Callback when edit board
 * @returns 
 */
export default function Board({
    rows = 10,
    cols = 10,
    cellSize = 20,
    value,
    mode = Mode.VIEW,
    step = { type: '', visited: new Set(), frontier: new Set(), current: -1, path: [], cost: 0 },
    onChange,
}) {
    const [state, setState] = useState({ robot: 0, dirts: new Set(), weights: [], adjacency: [] })
    const width = cols * cellSize, height = rows * cellSize

    useEffect(() => {
        if (!value) {
            setState(state => ({ ...state, adjacency: Array.from({ length: rows * cols }, (_, i) => Array(4).fill(false)) }))
        }
        else {
            setState(value)
        }
    }, [rows, cols])

    return (
        <LayerGroup
            className='Board'
            width={`${width}px`}
            height={`${height}px`}
            rows={rows}
            cols={cols}
            cellSize={cellSize}
        >
            <BackgroundLayer />
            <WallsLayer
                adjacency={state.adjacency}
            />
            <SimulationLayer
                step={step}
                disabled={mode !== Mode.SOLVING}
            />
            <RobotLayer
                pointerEvents={mode === Mode.SET_ROBOT}
                onChange={robot => setState(state => ({ ...state, robot: robot }))}
                robot={state.robot}
            />
            <DirtsLayer
                dirts={state.dirts}
                onChange={dirts => setState(state => ({ ...state, dirts: dirts }))}
            />
            <EditWallLayer
                adjacency={state.adjacency}
                onChange={(adj) => setState(state => ({ ...state, adjacency: adj }))}
                mode={mode}
                pointerEvents={mode === Mode.DRAW_WALL || mode === Mode.DELETE_WALL}
            />
        </LayerGroup>

    )
}