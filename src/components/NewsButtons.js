const NewsButtons = ({ onTopicClicked, isLoading, fetchUpdate }) => {
    return (
        <div className="App-categories">
            <button className='App-button red' onClick={() => {fetchUpdate()}} disabled={isLoading}>All</button>
            <button className='App-button blue' onClick={() => { onTopicClicked('technology')}} disabled={isLoading}>Technology</button>
            <button className='App-button pink' onClick={() => {onTopicClicked('health')}} disabled={isLoading}>Health</button>
            <button className='App-button green' onClick={() => {onTopicClicked('science')}} disabled={isLoading}>Science</button>
            <button className='App-button orange' onClick={() => {onTopicClicked('sports')}} disabled={isLoading}>Sports</button>
            <button className='App-button lightblue' onClick={() => {onTopicClicked('business')}} disabled={isLoading}>Business</button>
        </div>
    )
}

export default NewsButtons;