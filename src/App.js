import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import NewsItem from './components/NewsItem';
import NewsModal from './components/NewsModal';
import NewsButtons from './components/NewsButtons';
import SignUpModal from './components/SignUpModal';
import AccountModal from './components/AccountModal';
import ToggleButton from './components/ToggleButton';
import Api from './components/Api';
import { onAuthStateChanged, auth, getApiKey, addApiKey, signIn, signUp, signOut } from './components/firebase';
import { sortByCategory, getFormattedDate } from './components/utils';
import { getBackground, getDarkerBackground } from './components/utils';

function App() {
  // const [currentFreeUse, setCurrentFreeUse] = useState(0);
  // const maxFreeUse = 5;
  const [userId, setUserId] = useState('');
  const [userApiKey, setUserApiKey] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // const [loadingKeywords, setLoadingKeywords] = useState([]);
  // const [currentKeyword, setCurrentKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const requestedRef = useRef(false);
  const [currentNewsItem, setCurrentNewsItem] = useState(null);
  const [mostRecentNews, setMostRecentNews] = useState([]);
  const [update, setUpdate] = useState([]);
  const [summary, setSummary] = useState('');
  const [toggleMode, setToggleMode] = useState(false);
  const { getUpdate, getTopicUpdate, getSearchTermUpdate, getArticleSummary } = Api(mostRecentNews, setMostRecentNews, setCurrentNewsItem, userApiKey);

  const fetchUpdate = async () => {
    setIsLoading(true);
    const update = await getUpdate();
    setUpdate(sortByCategory(update));
    setIsLoading(false);
    requestedRef.current = true;
  }

  const onNewsItemClicked = async (item) => {
    setIsLoading(true);
    setShowNewsModal(true);
    setIsModalOpen(true);
    setCurrentCategory(item.category);
    const summaryResponse = await getArticleSummary(item);
    setSummary(summaryResponse);
    setIsLoading(false);
  }

  const onTopicClicked = async (topic) => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    setCurrentCategory(topic.toLowerCase());
    const update = await getTopicUpdate(topic);
    setUpdate(sortByCategory(update));
    setIsLoading(false);
  }

  useEffect(() => {
    if (!requestedRef.current) {
      if (update.length === 0) {
        fetchUpdate();
      }
    }
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        getApiKeyForUser(user.uid);
        setUserEmail(user.email);
      }
    });
  }, []);

  const signUpUser = async (email, password) => {
    const user = await signUp(email, password);

    if (user) {
      setUserId(user.uid);
      setShowSignUpModal(false);
      setIsModalOpen(false);
    }
  }

  const logInUser = async (email, password) => {
    const user = await signIn(email, password);

    if (user) {
      console.log('user: ', user);
      setUserId(user.uid);
      getApiKeyForUser(user.uid);
      setShowSignUpModal(false);
      setIsModalOpen(false);
    } else {
      console.log('error logging in user');
    }
  }

  const logOutUser = async () => {
    const signOutResponse = await signOut();
    if (signOutResponse.success) {    
      setUserId('');
      setUserApiKey('');
      setShowAccountModal(false);
      setIsModalOpen(false);
    }
  }

  const setApiKeyForUser = async (apiKey) => {
    const setApiKeyResponse = await addApiKey(userId, apiKey);
    if (setApiKeyResponse.success) {
      setUserApiKey(apiKey);
      closeAccountModal();
    } else {
    }
  }

  const getApiKeyForUser = async (uid) => {
    const apiKeyResponse = await getApiKey(uid);
    if (apiKeyResponse.success) {
      setUserApiKey(apiKeyResponse.apiKey);
    } else {
    }
  }

  const closeNewsModal = () => {
    setShowNewsModal(false);
    setIsModalOpen(false);
  }

  const onSignUpClicked = () => {
    setShowSignUpModal(true);
    setIsModalOpen(true);
  }

  const onAccountClicked = () => {
    setShowAccountModal(true);
    setIsModalOpen(true);
  }

  const closeAccountModal = () => {
    setShowAccountModal(false);
    setIsModalOpen(false);
  }

  const closeSignUpModal = () => {
    setShowSignUpModal(false);
    setIsModalOpen(false);
  }

  const handleToggleMode = () => {
    setToggleMode(!toggleMode);
  }

  const onSearchTermChanged = (e) => {
    setSearchTerm(e.target.value);
  }

  const onSearchTermKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearchClicked();
    }
  }

  const onSearchClicked = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    setCurrentCategory('all');
    const update = await getSearchTermUpdate(searchTerm);
    setUpdate(sortByCategory(update));
    setIsLoading(false);
  }

  // useEffect(() => {
  //   const changeKeyword = setInterval(() => {
  //       setCurrentKeyword(loadingKeywords[Math.floor(Math.random() * loadingKeywords.length)]);
  //   }, 2000); // change keyword every 2 seconds

  //   return () => clearInterval(changeKeyword); // clear interval on component unmount
  // }, [loadingKeywords]);

  return (
    <div className={`App ${isModalOpen ? '' : ''}`}>
      
      <header className="App-header">
        <h1 className='App-title'>Pulse</h1>
        {!userId && <button className='App-transparent-button' onClick={onSignUpClicked}>Sign Up</button>}
        {userId && <button className='App-transparent-button' onClick={onAccountClicked}>Account</button>}
      </header>
      <main className='App-main'>
        {isModalOpen && <div className="overlay"></div>}
        {isLoading && 
          <div className="loading">
            <svg width="64px" height="48px">
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back" style={{stroke: getDarkerBackground(currentCategory)}} />
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front" style={{stroke: getBackground(currentCategory)}} />
            </svg>
            {/* {loadingKeywords && <p className='loading-text'>Reading about {currentKeyword}...</p>} */}
          </div>}
        {showNewsModal && <NewsModal show={showNewsModal} handleClose={closeNewsModal} summary={summary} isLoading={isLoading} currentNewsItem={currentNewsItem} currentCategory={currentCategory} />}
        {showSignUpModal && <SignUpModal show={showSignUpModal} onClose={closeSignUpModal} onSignUp={signUpUser} onLogin={logInUser} />}
        {showAccountModal && <AccountModal show={showAccountModal} onClose={closeAccountModal} onLogout={logOutUser} onAddKey={setApiKeyForUser} userId={userId} userApiKey={userApiKey} userEmail={userEmail} />}
        <div className="App-top">
          {/* <p className='App-subheader'>Browse a specific topic</p> */}
          <input className='App-search' type='text' placeholder='Search for news...' value={searchTerm} onChange={onSearchTermChanged} onKeyDown={onSearchTermKeyDown} />
          <NewsButtons onTopicClicked={onTopicClicked} isLoading={isLoading} fetchUpdate={fetchUpdate} setCurrentCategory={setCurrentCategory} />
        </div>
        <div className='App-news'>
          <div className='App-date'>
            <p>{getFormattedDate()}</p>
            <ToggleButton handleToggleMode={handleToggleMode} />
          </div>
          <div className='App-paragraph'>
            {update && sortByCategory(update).map((item, index) => {
              return <NewsItem key={index} item={item} onClick={onNewsItemClicked} toggleMode={toggleMode} disabled={isLoading} />
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
