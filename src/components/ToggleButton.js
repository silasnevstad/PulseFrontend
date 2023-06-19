import './styles/ToggleButton.css'

const ToggleButton = ({ handleToggleMode }) => {
    return (
        <div className="toggle-button">
            <input type="checkbox" id="checkbox" onChange={handleToggleMode} />
            <label htmlFor="checkbox" className="toggle">
                <div className="bar bar--top"></div>
                <div className="bar bar--middle"></div>
                <div className="bar bar--bottom"></div>
            </label>
        </div>
    );
}

export default ToggleButton;