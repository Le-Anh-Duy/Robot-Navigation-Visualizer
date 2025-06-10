import { useState } from 'react';
import Board from './Board';
import ConfigForm from './ConfigForm';
import SolverForm from './SolverForm';
import './App.css'
import Mode from './Mode';

const robotModeList = [
	{ value: 'vacuum', text: 'Vacuum' },
]
const algorithms = [
	{ value: 'bfs', text: 'Breadth-First-Search (BFS)' },
	{ value: 'dfs', text: 'Depth-First-Search (DFS)' },
	{ value: 'astar', text: 'A*' },
	{ value: 'dijkstra', text: 'Dijkstra\'s Algorithm' },
]
const heuristics = [
	{ value: '', text: '' },
]
const modeList = [
	{ value: Mode.VIEW, text: 'View' },
	{ value: Mode.SET_ROBOT, text: 'Set Robot' },
	{ value: Mode.DRAW_WALL, text: 'Draw Walls' },
	{ value: Mode.DELETE_WALL, text: 'Delete Walls' },
	{ value: Mode.SET_DIRT, text: 'Set Dirts' },
	{ value: Mode.SET_WEIGHT, text: 'Set Weights' },
]

export default function App() {
	const step = {
		type: 'found',
		visited: new Set([1, 2, 3, 5, 7, 14, 15, 21, 23, 25]),
		frontier: new Set([4, 6, 8, 9, 10, 11, 17, 18, 24]),
		current: 0,
		path: [1, 2, 12, 13, 23, 33, 43, 42, 41, 51, 61, 71, 72, 73, 74, 75],
		cost: 0,
	}
	const [mode, setMode] = useState(Mode.VIEW)

	return (
		<div className='App'>
			<div className='controls'>
				<ConfigForm modeList={modeList} onChangeMode={m => setMode(m)} />
				<SolverForm mode={robotModeList} algorithms={algorithms} heuristics={heuristics} />
			</div>
			<div className='board'>
				<Board rows={10} cols={10} cellSize={40} mode={mode} step={step} />
			</div>
		</div>
	)
}