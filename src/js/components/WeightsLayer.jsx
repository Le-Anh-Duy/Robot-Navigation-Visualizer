export default function WeightsLayer({ weights, width, height, rows, cols, disabled, ...props }) {
    // const width = canvas?.width, height = canvas?.height, rows = canvas?.rows, cols = canvas?.cols
    const weights2D = []
    var maxWeight, minWeight

    if (cols !== 0) {
        for (let i = 0; i < weights.length; i += cols) {
            weights2D.push(weights.slice(i, i + cols))
        }
        maxWeight = weights.reduce((a, b) => Math.max(a, b), -Infinity)
        minWeight = weights.reduce((a, b) => Math.min(a, b), Infinity)
    }

    return (
        <table hidden={disabled} style={{
            ...props.style,
            width: width,
            height: height,
            tableLayout: 'fixed',
            textAlign: 'center',
        }}>
            <tbody>
                {weights2D.map((value, index) =>
                    <tr key={index}>
                        {value.map((value, index) => {
                            const hue = (maxWeight - minWeight) ? 120 * (1 - (value - minWeight) / (maxWeight - minWeight)) : 120

                            return <td key={index} style={{
                                backgroundColor: `hsla(${hue}, 100%, 50%, 0.3)`
                            }}>
                                {value}
                            </td>
                        })}
                    </tr>
                )}
            </tbody>
        </table>
    )
}