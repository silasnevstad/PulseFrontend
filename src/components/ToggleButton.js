import './styles/ToggleButton.css'

const ToggleButton = ({ handleToggleMode, toggleMode }) => {
    const onToggle = () => {
        // handleToggleMode and toggle the input checkbox
        handleToggleMode();
        // document.getElementById('checkbox').checked = !toggleMode;
    }
    return (
        <div className="toggle-button-container" onClick={onToggle}>
            <p className="toggle-button__text">{toggleMode ? 'Expand' : 'Collapse'}</p>
            <div className="toggle-button">
                <input type="checkbox" id="checkbox" checked={toggleMode} />
                <label htmlFor="checkbox" className="toggle">
                    <div className="bar bar--top"></div>
                    <div className="bar bar--middle"></div>
                    <div className="bar bar--bottom"></div>
                </label>
            </div>
        </div>
    );
}

export default ToggleButton;