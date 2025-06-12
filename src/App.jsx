import { useState } from 'react';
import Board from './js/components/Board';
import ConfigForm from './js/components/ConfigForm';
import SolverForm from './js/components/SolverForm';
import './styles/App.css'
import Mode from './js/constants/Mode';
import generate from './js/algos/generate';


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
	// adjacency matrix for top, right, bottom, left
	// let nrow = 10, ncol = 10;

	const [nrow, setNrow] = useState(10);
	const [ncol, setNcol] = useState(10);

	// value to update: * @param {{ robot: number, dirts: Set<number>, weights: Array<number>, adjacency: Array<Array<boolean>(4)> }} props.value 
	const [value, setValue] = useState(null);

	return (
		<div className='App'>
			<div className='controls'>
				<ConfigForm modeList={modeList} onChangeMode={m => setMode(m)} onSubmit={
					values => 
						{
							console.log(values); setNrow(values.rows); setNcol(values.cols);
							setValue({ robot: 0, dirts: new Set(), ...generate(values.rows, values.cols, 0, true, true) });
						}
					} />
				<SolverForm mode={robotModeList} algorithms={algorithms} heuristics={heuristics} />
			</div>
			<div className='board'>
				<Board rows={nrow} cols={ncol} cellSize={40} mode={mode} step={step} value={value} />
			</div>
		</div>
	)
}