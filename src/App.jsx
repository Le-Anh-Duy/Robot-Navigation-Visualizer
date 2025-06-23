import { useRef, useState } from 'react';
import Board from './js/components/Board';
import ConfigForm from './js/components/ConfigForm';
import SolverForm from './js/components/SolverForm';
import './styles/App.css'
import Mode from './js/constants/Mode';
import alg from './ExampleAlg';
import { flushSync } from 'react-dom';
import ResultsDialog from './js/components/ResultsDialog';
import generate from './js/algos/generate'
import dfsAlgo from './js/algos/search-algos/dfs'
import bfsAlgo from './js/algos/search-algos/bfs'
import idaStarAlgo from './js/algos/search-algos/ida-star'
import pas from './js/algos/search-algos/pas'
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
	{ value: 'pas', text: 'Precomputation and Iterative Search' },
	{ value: 'iddfs', text: 'Iterative deepening depth-first search' },
	{ value: 'beamsearch', text: 'Beam Search' },
]

const algoMap = new Map([
	['bfs', bfsAlgo],
	['dfs', dfsAlgo],
	['astar', aStar],
	['ucs', ucsAlgo],
	['idastar', idaStarAlgo],
	['pas', pas],
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
	const [solverConfig, setSolverConfig] = useState({
		mode: '',
		algorithm: 'bfs',
		heuristic: '',
		speed: 50,
	})
	const [board, setBoard] = useState({
		rows: 0,
		cols: 0,
		data: undefined,
		hasWeight: false,
		acyclic: false,
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
	const [analysis, setAnalysis] = useState({ step: 0, cost: 0 })

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
		else if (data.rows && data.cols) {
			let nData = generate(data.rows, data.cols, 3, data.hasWeight, data.acyclic);

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

	async function handleClickSolve(data) {
		setSolverConfig(data)
		setMode(Mode.SOLVING)
		isSolving.current = true
		setAnalysis({ step: 0, cost: 0 })
		setShowResults(true)

		// Call solver function
		const res = algoMap.get(data.algorithm)(board, data.speed);

		for await (const step of res) {
			if (!isSolving.current)
				break

			setStep(step)
			setAnalysis(a => ({ ...a, step: a.step + 1 }))
			if (step.type === 'found')
				setAnalysis(a => ({ ...a, cost: step.cost }))
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
				<ResultsDialog stepCount={analysis.step} cost={analysis.cost} open={showResults} onClose={() => { setShowResults(false) }} />
				<Board
					rows={board.rows}
					cols={board.cols}
					cellSize={board.cols ? Math.min(40, 600 / board.cols) : 40}
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
