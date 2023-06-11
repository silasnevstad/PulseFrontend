import React, { useState } from 'react';
import { getBackground, getDarkerBackground } from './utils';
import '../App.css';
import Api from './Api';

const NewsModal = ({ show, handleClose, summary, isLoading, currentNewsItem, currentCategory }) => {
    const [readMore, setReadMore] = useState('');
    const [loadingReadMore, setLoadingReadMore] = useState(false);
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState('');
    const [isWaitingResponse, setIsWaitingResponse] = useState(false);
    const placeholder = window.innerWidth > 600 ? 'Ask a follow up question...' : 'Ask a question...';
    const { askFollowUp } = Api();

    const onSendClicked = async () => {
        if (question === '') {
            return;
        }
        let newMessages = [{ type: 'question', content: question }];
        setMessages(newMessages);
        setIsWaitingResponse(true);
        const response = await askFollowUp(currentNewsItem, question, summary);
        newMessages = [...newMessages, { type: 'answer', content: response }];
        setMessages(newMessages);
        setIsWaitingResponse(false);
        setQuestion('');
    }

    const onReadMoreClicked = async () => {
        setLoadingReadMore(true);
        const readMoreQuestion = "Add another paragraph to this summary, going into more detail. Here's what I have so far: " + summary;
        const response = await askFollowUp(currentNewsItem, readMoreQuestion, summary);
        setReadMore(response);
        setLoadingReadMore(false);
    }

    return (
        <div className={show ? 'modal display-block' : 'modal display-none'}>
            {isLoading ? (
                <div className="loading" style={{backgroundColor: '#333'}}>
                    <svg width="64px" height="48px">
                        <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back" style={{stroke: getDarkerBackground(currentCategory)}}></polyline>
                        <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front" style={{stroke: getBackground(currentCategory)}}></polyline>
                    </svg>
                </div>)
                : (
                    <section className='modal-main'>
                        <button className='close-button' type="button" onClick={handleClose}>×</button>
                        <div className='modal-content'>
                            <h1 className="modal-item-category" style={{color: getBackground(currentNewsItem.category)}}>{currentNewsItem.category[0].toUpperCase() + currentNewsItem.category.slice(1)}</h1>
                            <h2 className="modal-item-title" onClick={() => window.open(currentNewsItem.url, '_blank')}>{currentNewsItem.title}</h2>
                            <p className="modal-item-text">{summary}</p>
                            {readMore ? (
                                <p className="modal-item-text">{readMore}</p>
                            ) : (
                                <button className='modal-button' onClick={onReadMoreClicked} style={{backgroundColor: getDarkerBackground(currentCategory), color: getBackground(currentCategory)}}>
                                    {loadingReadMore ? (
                                        <div className="spinner"></div>
                                    ) : (
                                        'Read More'
                                    )}
                                </button>
                            )}
                            <div className="mobile-divider"></div>
                            <div className="mobile-divider"></div>
                        </div>
                        {/* when hovered button background and color should change to getBackground */}
                        
                        {messages.length != 0 && <div className='modal-line'></div>}
                        <div className='modal-chat'>
                            <div className='modal-chat-content'>
                                {messages.map((message, index) => {
                                    return (
                                        <div key={index} className={`modal-chat-content-${message.type}`}>
                                            <p>{message.content}</p>
                                        </div>
                                    )
                                })}
                                {/* {isWaitingResponse && <div className='modal-chat-content-answer'> <p>Loading...</p> </div>} */}
                                <div className="mobile-divider"></div>
                            </div>
                            <div className='modal-chat-input'>
                                <input type='text' className='modal-chat-input-text' placeholder={placeholder} value={question} onChange={(e) => setQuestion(e.target.value)} />
                                <button className='modal-chat-input-button' onClick={onSendClicked}>{
                                    isWaitingResponse ? (
                                        <div className="spinner"></div>
                                    ) : (
                                        'Send'
                                    )
                                }</button>
                            </div>
                        </div>
                    </section>
                )
            }
        </div>
    );
}

export default NewsModal;
