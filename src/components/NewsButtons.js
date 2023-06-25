const NewsButtons = ({ onTopicClicked, isLoading, fetchUpdate, setCurrentCategory, currentCategory }) => {
    const handleAll = () => {
        fetchUpdate();
        setCurrentCategory('all');
    }

    return (
        <div className="App-categories" style={{ opacity: isLoading ? 0.75 : 1 }}>
            <button className={`App-button  ${currentCategory === 'all' ? 'red-active' : 'red'}`} onClick={handleAll} disabled={isLoading}>All</button>
            <button className={`App-button ${currentCategory === 'technology' ? 'blue-active' : 'blue'}`} onClick={() => {onTopicClicked('technology')}} disabled={isLoading}>Technology</button>
            <button className={`App-button ${currentCategory === 'science' ? 'green-active' : 'green'}`} onClick={() => {onTopicClicked('science')}} disabled={isLoading}>Science</button>
            <button className={`App-button ${currentCategory === 'sports' ? 'orange-active' : 'orange'}`} onClick={() => {onTopicClicked('sports')}} disabled={isLoading}>Sports</button>
            <button className={`App-button ${currentCategory === 'business' ? 'lightblue-active' : 'lightblue'}`} onClick={() => {onTopicClicked('business')}} disabled={isLoading}>Business</button>
            <button className={`App-button ${currentCategory === 'entertainment' ? 'purple-active' : 'purple'}`} onClick={() => {onTopicClicked('entertainment')}} disabled={isLoading}>Entertainment</button>
            <button className={`App-button ${currentCategory === 'health' ? 'pink-active' : 'pink'}`} onClick={() => {onTopicClicked('health')}} disabled={isLoading}>Health</button>
            {/* <button className='App-button green' onClick={() => {onTopicClicked('science')}} disabled={isLoading}>Science</button>
            <button className='App-button orange' onClick={() => {onTopicClicked('sports')}} disabled={isLoading}>Sports</button>
            <button className='App-button lightblue' onClick={() => {onTopicClicked('business')}} disabled={isLoading}>Business</button>
            <button className='App-button purple' onClick={() => {onTopicClicked('entertainment')}} disabled={isLoading}>Entertainment</button> */}
        </div>
    )
}

export default NewsButtons;