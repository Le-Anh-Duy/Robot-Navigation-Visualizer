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
import WeightsLayer from './WeightsLayer'
import Switch from './Switch'

/**
 * @param {Object} props
 * @param {number} props.rows Number of rows
 * @param {number} props.cols Number of columns
 * @param {number} props.cellSize Side length of cell (px)
 * @param {{ robot: number, dirts: Set<number>, weights: Array<number>, adjacency: Array<Array<boolean>(4)> }} props.value 
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
    animSpeed,
    onChange,
}) {
    function updateState(updater) {
        const newState = typeof updater === 'function' ? updater(state) : updater;

        onChange?.(newState);

        if (value === undefined) {
            setState(newState);
        }
    }

    const [state, setState] = useState({ robot: 0, dirts: new Set(), weights: [], adjacency: [] })
    const [isShowWeights, setIsShowWeights] = useState(false)
    const width = cols * cellSize, height = rows * cellSize

    useEffect(() => {
        if (!value) {
            setState(state => ({ ...state, adjacency: Array.from({ length: rows * cols }, (_, i) => Array(4).fill(false)) }))
        }
    }, [rows, cols])

    useEffect(() => {
        if (value)
            setState(value)
        else
            onChange?.(state)
    }, [value])

    return (
        <div style={{
            display: 'block',
        }}>
            <Switch hidden={!rows || !cols} onChange={setIsShowWeights} style={{
                display: 'flex',
                marginBottom: '10px',
            }}>
                Show weights
            </Switch>
            <LayerGroup
                className='Board'
                width={width}
                height={height}
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
                    initRobot={value?.robot}
                    setRobot={robot => setState(state => ({ ...state, robot: robot }))}
                    initDirts={value?.dirts}
                    setDirts={dirts => setState(state => ({ ...state, dirts: dirts }))}
                    animSpeed={animSpeed}
                    disabled={mode !== Mode.SOLVING}
                />
                <RobotLayer
                    onChange={robot => updateState(state => ({ ...state, robot: robot }))}
                    robot={state.robot}
                    pointerEvents={mode === Mode.SET_ROBOT}
                    animTime={mode === Mode.SOLVING ? 10 : 500}
                    disabled={!rows || !cols}
                />
                <DirtsLayer
                    dirts={state.dirts}
                    onChange={dirts => updateState(state => ({ ...state, dirts: dirts }))}
                    pointerEvents={mode === Mode.SET_DIRT}
                />
                <EditWallLayer
                    adjacency={state.adjacency}
                    onChange={adj => updateState(state => ({ ...state, adjacency: adj }))}
                    mode={mode}
                    pointerEvents={mode === Mode.DRAW_WALL || mode === Mode.DELETE_WALL}
                />
                <WeightsLayer
                    disabled={!isShowWeights}
                    weights={state.weights}
                    width={width}
                    height={height}
                    rows={rows}
                    cols={cols}
                />
            </LayerGroup>
        </div>

    )
}