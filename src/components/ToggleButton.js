import './styles/ToggleButton.css'

const ToggleButton = ({ handleToggleMode, toggleMode }) => {
    return (
        <div className="toggle-button-container" onClick={handleToggleMode}>
            <p className="toggle-button__text">{toggleMode ? 'Expand' : 'Collapse'}</p>
            <div className="toggle-button">
                <input type="checkbox" id="checkbox" checked={toggleMode} onChange={handleToggleMode} />
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