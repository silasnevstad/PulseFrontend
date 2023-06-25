import React, { useState, useRef, useEffect } from 'react';
import './styles/SourceModal.css';
import { getBackground, sortByCategory } from './utils';
import { setSources } from './firebase';
import { ALL_SOURCES } from './constants';

const SourceModal = ({ isModalOpen, setIsModalOpen, selectedSources, setSelectedSources, fetchUpdate, firstTimer }) => {
    const [mostRecentSources, setMostRecentSources] = useState(selectedSources);
    const sources = sortByCategory(ALL_SOURCES);
    const modalRef = useRef();

    useEffect(() => {
        const clickListener = event => {
            if (isModalOpen && modalRef.current && !modalRef.current.contains(event.target)) {
                handleToggleVisibility();
            }
        };
        document.addEventListener('click', clickListener);

        return () => {
            document.removeEventListener('click', clickListener);
        };
    }, [isModalOpen, modalRef]);

    const handleToggleVisibility = () => {
        if (isModalOpen) {
            if (mostRecentSources !== selectedSources) {
                fetchUpdate();
            }
            setSources(mostRecentSources);
            setMostRecentSources(selectedSources);
            setIsModalOpen(false);
          } else {
            setIsModalOpen(true);
          }
          
    }

    return (
        <div className="source-modal" ref={modalRef}>
            <div className={`source-modal__header-btn ${isModalOpen ? 'hidden' : ''}`} onClick={handleToggleVisibility}>
                <h3 className="source-modal__title">{firstTimer ? window.innerWidth > 600 ? 'Select Your Sources' : 'Sources' : 'Sources'}</h3>
                {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isModalOpen ? "feather feather-chevron up" : "feather feather-chevron down"}><polyline points="6 9 12 15 18 9"></polyline></svg> */}
            </div>

            {isModalOpen && 
                <div className="source-modal__body">
                    <button className="source-modal-close-button" onClick={handleToggleVisibility}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <button className="source-modal__top-button" onClick={() => {
                        setSelectedSources([]);
                    }}>
                        Clear (Default)
                    </button>
                    <button className="source-modal__top-button" onClick={() => {
                        setSelectedSources(ALL_SOURCES.map(source => source.id));
                    }}>
                        Select All
                    </button>

                    {sources.map(source => {
                        const isSelected = selectedSources.includes(source.id);
                        const buttonClass = isSelected ? 'source-modal__source-button--selected' : 'source-modal__source-button';
                        return (
                            <button key={source.id} className={buttonClass} style={{backgroundColor: getBackground(source.category)}} onClick={() => {
                                if (isSelected) {
                                    setSelectedSources(selectedSources.filter(id => id !== source.id));
                                } else {
                                    setSelectedSources([...selectedSources, source.id]);
                                }
                            }}>
                                {source.name}
                            </button>
                        );
                    }
                    )}
                </div>
            }
        </div>
    );
};

export default SourceModal;