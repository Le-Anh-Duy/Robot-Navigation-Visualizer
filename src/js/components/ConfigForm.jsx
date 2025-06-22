import { useEffect, useState } from 'react'
import '../../styles/ConfigForm.css'
import Mode from '../constants/Mode'

/**
 * @param {Object} props
 * @param {(data: {rows: number, cols: number, file: undefined | File}) => void} props.onSubmit Callback when click "Generate" button
 * @param {() => void} props.onClickDownload Callback when click "Download terrain" button
 * @param {(mode: string) => void} props.onChangeMode Callback when change mode
 * @param {Array<{value: string, text: string}>} props.modeList Mode list
 * @returns 
 */
export default function ConfigForm({ onSubmit, onClickDownload, onChangeMode, modeList, mode }) {
    const [data, setData] = useState({ rows: 0, cols: 0, file: undefined })

    return (
        <div className='ConfigForm'>
            <fieldset>
                <legend>Terrain Setup</legend>
                <div className='rows'>
                    <label htmlFor='n-rows'>Rows</label>
                    <input
                        type='number'
                        id='n-rows'
                        readOnly={data.file !== undefined}
                        disabled={data.file !== undefined}
                        onChange={e => setData(data => ({ ...data, rows: Number(e.target.value) }))}
                    />
                </div>
                <div className='cols'>
                    <label htmlFor='n-cols'>Columns</label>
                    <input
                        type='number'
                        id='n-cols'
                        readOnly={data.file !== undefined}
                        disabled={data.file !== undefined}
                        onChange={e => setData(data => ({ ...data, cols: Number(e.target.value) }))}
                    />
                </div>
                <div className='select-file'>
                    <label htmlFor='terrain-file'>Load terrain from file (.json)</label>
                    <input
                        type='file'
                        id='terrain-file'
                        accept='.json'
                        onChange={e => setData(data => ({ ...data, file: e.target.files[0] }))}
                    />
                </div>
                <div className='select-mode'>
                    <label>
                        Mode
                        {
                            mode === Mode.SOLVING
                                ? <p style={{
                                    all: 'unset',
                                    textAlign: 'center',
                                    width: '40%',
                                    height: '2.5em',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    lineHeight: '2.5em',
                                    padding: '0px 0px',
                                    marginLeft: 'auto',
                                    border: '1px solid light-dark(#767676, #858585)',
                                    borderRadius: '2px',
                                    boxSizing: 'border-box',
                                    backgroundColor: 'rgb(255, 124, 124)',
                                }}>
                                    Solving...
                                </p>
                                : <select onChange={e => onChangeMode(Number(e.target.value))}>
                                    {modeList?.map((e, i) =>
                                        <option key={i} value={e.value}>{e.text}</option>
                                    )}
                                </select>
                        }
                    </label>
                </div>
                <button type='submit' onClick={() => onSubmit(data)}>Generate</button>
                <button type='button' onClick={onClickDownload}>Download terrain</button>
            </fieldset>
        </div>
    )
}