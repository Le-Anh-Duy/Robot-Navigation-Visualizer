import { useRef, useState } from 'react';
import Board from './js/components/Board';
import ConfigForm from './js/components/ConfigForm';
import SolverForm from './js/components/SolverForm';
import './styles/App.css'
import Mode from './js/constants/Mode';
import alg from './ExampleAlg';
import { flushSync } from 'react-dom';
import ResultsDialog from './js/components/ResultsDialog';

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
	{ value: Mode.SOLVING, text: 'Solve' },
]

export default function App() {
	const [mode, setMode] = useState(Mode.VIEW)
	const [solverConfig, setSolverConfig] = useState(useState({
		mode: '',
		algorithm: '',
		heuristic: '',
		speed: 50,
	}))
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
	const isSolving = useRef(false)
	const [showResults, setShowResults] = useState(false)

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
			setBoard(board => ({
				rows: data.rows,
				cols: data.cols,
				data: board.data
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

	async function handleClickSolve(data) {
		setSolverConfig(data)
		setMode(Mode.SOLVING)
		isSolving.current = true
		setShowResults(true)

		const res = alg(data, 1000)
		for await (const step of res) {
			if (!isSolving.current)
				break

			setStep(step)
		}
	}

	function handleClickCancelSolve() {
		setMode(Mode.VIEW)
		isSolving.current = false
		setShowResults(false)
	}

	function handleClickResults() {
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
					onChange={setSolverConfig}
					onClickSolve={handleClickSolve}
					onClickCancelSolve={handleClickCancelSolve}
					onClickResults={handleClickResults}
				/>
			</div>
			<div className='board'>
				<ResultsDialog open={showResults} onClose={() => { setShowResults(false) }} />
				<Board
					rows={board.rows}
					cols={board.cols}
					cellSize={40}
					value={board.data}
					mode={mode}
					step={step}
					animSpeed={solverConfig.speed}
					onChange={data => {
						setBoard(board => ({ ...board, data: data }))
					}}
				/>
			</div>
		</div>
	)
}