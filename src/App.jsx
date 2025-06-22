import { useState } from 'react';
import Board from './js/components/Board';
import ConfigForm from './js/components/ConfigForm';
import SolverForm from './js/components/SolverForm';
import './styles/App.css'
import Mode from './js/constants/Mode';
import alg from './ExampleAlg';
import generate from './js/algos/generate'
import dfsAlgo from './js/algos/search-algos/dfs'
import bfsAlgo from './js/algos/search-algos/bfs'
import idaStarAlgo from './js/algos/search-algos/ida-star'
import multiSourceBfsAlgo from './js/algos/search-algos/multisources-bfs'
import ucsAlgo from './js/algos/search-algos/ucs'
import aStar from './js/algos/search-algos/astar'
import iddfs from './js/algos/search-algos/iddfs'
import beamSearch from './js/algos/search-algos/beam_search'

const robotModeList = [
	{ value: 'vacuum', text: 'Vacuum' },
]
const algorithms = [
	{ value: 'bfs', text: 'Breadth-First-Search (BFS)' },
	{ value: 'dfs', text: 'Depth-First-Search (DFS)' },
	{ value: 'astar', text: 'A*' },
	{ value: 'ucs', text: 'Uniform-cost search' },
	{ value: 'idastar', text: 'Iterative deepening A*' },
	{ value: 'multisourcebfs', text: 'Multisource-BFS' },
	{ value: 'iddfs', text: 'Iterative deepening depth-first search' },
	{ value: 'beamsearch', text: 'Beam Search' },
]

const algoMap = new Map([
  ['bfs', bfsAlgo],
  ['dfs', dfsAlgo],
  ['astar', aStar],
  ['ucs', ucsAlgo],
  ['idastar', idaStarAlgo],
  ['multisourcebfs', multiSourceBfsAlgo],
  ['iddfs', iddfs],
  ['beamsearch', beamSearch],
]);

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
	{ value: Mode.SOLVING, text: 'Solve' },
]

export default function App() {
	const [mode, setMode] = useState(Mode.VIEW)
	const [solverConfig, setSolverConfig] = useState()
	const [board, setBoard] = useState({
		rows: 0,
		cols: 0,
		data: undefined,
	})
	const [step, setStep] = useState({
		type: '',
		visited: new Set(),
		frontier: new Set(),
		current: -1,
		path: [],
		cost: 0,
	})

	function handleConfigFormSubmit(data) {
		if (data.file) {
			const reader = new FileReader()
			reader.onload = e => {
				try {
					const text = e.target.result
					const data = JSON.parse(text)
					setBoard(data)
				}
				catch (err) {
					console.log('Error parse json file: ', data.file)
				}
			}

			reader.readAsText(data.file)
		}
		else {

			let nData = generate(data.rows, data.cols, 3, 1, 0);

			setBoard(board => ({
				rows: data.rows,
				cols: data.cols,
				data: nData
			}))
		}
	}

	function handleDownloadFile() {
		const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "your_board.json";
		a.click();
		URL.revokeObjectURL(url);
	}

	// Example for solving mode
	// First, generate maze with size 10 x 10 (to match with example result)
	// Then, click "Solve" button to invoke this function
	async function handleClickSolve(data) {
		// console.log(data.algorithm);
		// setMode(Mode.SOLVING);
		setSolverConfig(data)
		setMode(Mode.SOLVING)
		// data represent robot_mode, algorithm and heuristic

		// Call solver function

		const res = algoMap.get(data.algorithm)(board, 25);


		for await (const step of res)
			setStep(step)
	}

	function handleClickCancelSolve() {
		setMode(Mode.VIEW)
	}

	return (
		<div className='App'>
			<div className='controls'>
				<ConfigForm
					modeList={modeList}
					onChangeMode={m => setMode(m)}
					onSubmit={handleConfigFormSubmit}
					onClickDownload={handleDownloadFile}
					mode={mode}
				/>
				<SolverForm
					mode={robotModeList}
					algorithms={algorithms}
					heuristics={heuristics}
					onClickSolve={handleClickSolve}
					onClickCancelSolve={handleClickCancelSolve}
				/>
			</div>
			<div className='board'>
				<Board
					rows={board.rows}
					cols={board.cols}
					cellSize={40}
					value={board.data}
					mode={mode}
					step={step}
					onChange={data => {
						setBoard(board => ({ ...board, data: data }))
					}}
				/>
			</div>
		</div>
	)
}
