import { useState } from 'react';
import Board from './js/components/Board';
import ConfigForm from './js/components/ConfigForm';
import SolverForm from './js/components/SolverForm';
import './styles/App.css'
import Mode from './js/constants/Mode';

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
	const [board, setBoard] = useState({
		rows: 0,
		cols: 0,
		data: undefined,
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

	return (
		<div className='App'>
			<div className='controls'>
				<ConfigForm
					modeList={modeList}
					onChangeMode={m => setMode(m)}
					onSubmit={handleConfigFormSubmit}
					onClickDownload={handleDownloadFile}
				/>
				<SolverForm mode={robotModeList} algorithms={algorithms} heuristics={heuristics} />
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