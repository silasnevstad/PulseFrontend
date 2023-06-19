import React, {useState } from 'react';
import './styles/SourceModal.css';
import { getBackground, sortByCategory } from './utils';
import { setSources } from './firebase';

const ALL_SOURCES = sortByCategory([
    {'id': 'abc-news', 'name': 'ABC News', 'url': 'https://abcnews.go.com', 'category': 'general'},
    {'id': 'axios', 'name': 'Axios', 'url': 'https://www.axios.com', 'category': 'general'},
    {'id': 'blasting-news-br', 'name': 'Blasting News (BR)', 'url': 'https://br.blastingnews.com', 'category': 'general'},
    {'id': 'bleacher-report', 'name': 'Bleacher Report', 'url': 'http://www.bleacherreport.com', 'category': 'sports'},
    {'id': 'business-insider-uk', 'name': 'Business Insider (UK)', 'url': 'http://uk.businessinsider.com', 'category': 'business'},
    {'id': 'buzzfeed', 'name': 'Buzzfeed', 'url': 'https://www.buzzfeed.com', 'category': 'entertainment'},
    {'id': 'cbs-news', 'name': 'CBS News', 'url': 'http://www.cbsnews.com', 'category': 'general'},
    {'id': 'cnn', 'name': 'CNN', 'url': 'http://us.cnn.com', 'category': 'general'},
    {'id': 'crypto-coins-news', 'name': 'Crypto Coins News', 'url': 'https://www.ccn.com', 'category': 'technology'},
    {'id': 'engadget', 'name': 'Engadget', 'url': 'https://www.engadget.com', 'category': 'technology'},
    {'id': 'entertainment-weekly', 'name': 'Entertainment Weekly', 'url': 'http://www.ew.com', 'category': 'entertainment'},
    {'id': 'espn', 'name': 'ESPN', 'url': 'https://www.espn.com', 'category': 'sports'},
    {'id': 'financial-post', 'name': 'Financial Post', 'url': 'http://business.financialpost.com', 'category': 'business'},
    {'id': 'fortune', 'name': 'Fortune', 'url': 'http://fortune.com', 'category': 'business'},
    {'id': 'fox-news', 'name': 'Fox News', 'url': 'http://www.foxnews.com', 'category': 'general'},
    {'id': 'fox-sports', 'name': 'Fox Sports', 'url': 'http://www.foxsports.com', 'category': 'sports'},
    {'id': 'google-news', 'name': 'Google News', 'url': 'https://news.google.com', 'category': 'general'},
    {'id': 'hacker-news', 'name': 'Hacker News', 'url': 'https://news.ycombinator.com', 'category': 'technology'},
    {'id': 'ign', 'name': 'IGN', 'url': 'http://www.ign.com', 'category': 'entertainment'},
    {'id': 'marca', 'name': 'Marca', 'url': 'http://www.marca.com', 'category': 'sports'},
    {'id': 'mashable', 'name': 'Mashable', 'url': 'https://mashable.com', 'category': 'entertainment'},
    {'id': 'medical-news-today', 'name': 'Medical News Today', 'url': 'http://www.medicalnewstoday.com', 'category': 'health'},
    {'id': 'msnbc', 'name': 'MSNBC', 'url': 'http://www.msnbc.com', 'category': 'general'},
    {'id': 'national-geographic', 'name': 'National Geographic', 'url': 'http://news.nationalgeographic.com', 'category': 'science'},
    {'id': 'nbc-news', 'name': 'NBC News', 'url': 'http://www.nbcnews.com', 'category': 'general'},
    {'id': 'news24', 'name': 'News24', 'url': 'http://www.news24.com', 'category': 'general'},
    {'id': 'newsweek', 'name': 'Newsweek', 'url': 'https://www.newsweek.com', 'category': 'general'},
    {'id': 'new-york-magazine', 'name': 'New York Magazine', 'url': 'http://nymag.com', 'category': 'general'},
    {'id': 'next-big-future', 'name': 'Next Big Future', 'url': 'https://www.nextbigfuture.com', 'category': 'science'},
    {'id': 'politico', 'name': 'Politico', 'url': 'https://www.politico.com', 'category': 'general'},
    {'id': 'polygon', 'name': 'Polygon', 'url': 'http://www.polygon.com', 'category': 'entertainment'},
    {'id': 'reuters', 'name': 'Reuters', 'url': 'http://www.reuters.com', 'category': 'general'},
    {'id': 'talksport', 'name': 'TalkSport', 'url': 'http://talksport.com', 'category': 'sports'},
    {'id': 'techcrunch', 'name': 'TechCrunch', 'url': 'https://techcrunch.com', 'category': 'technology'},
    {'id': 'techradar', 'name': 'TechRadar', 'url': 'http://www.techradar.com', 'category': 'technology'},
    {'id': 'the-globe-and-mail', 'name': 'The Globe And Mail', 'url': 'https://www.theglobeandmail.com', 'category': 'general'},
    {'id': 'the-hill', 'name': 'The Hill', 'url': 'http://thehill.com', 'category': 'general'},
    {'id': 'the-huffington-post', 'name': 'The Huffington Post', 'url': 'http://www.huffingtonpost.com', 'category': 'general'},
    {'id': 'the-lad-bible', 'name': 'The Lad Bible', 'url': 'https://www.theladbible.com', 'category': 'entertainment'},
    {'id': 'the-next-web', 'name': 'The Next Web', 'url': 'http://thenextweb.com', 'category': 'technology'},
    {'id': 'the-sport-bible', 'name': 'The Sport Bible', 'url': 'https://www.thesportbible.com', 'category': 'sports'},
    {'id': 'the-verge', 'name': 'The Verge', 'url': 'http://www.theverge.com', 'category': 'technology'},
    {'id': 'the-washington-post', 'name': 'The Washington Post', 'url': 'https://www.washingtonpost.com', 'category': 'general'},
    {'id': 'time', 'name': 'Time', 'url': 'http://time.com', 'category': 'general'},
    {'id': 'vice-news', 'name': 'Vice News', 'url': 'https://news.vice.com', 'category': 'general'},
    {'id': 'wired', 'name': 'Wired', 'url': 'https://www.wired.com', 'category': 'technology'},
    {'id': 'bloomberg', 'name': 'Bloomberg', 'url': 'http://www.bloomberg.com', 'category': 'business'},
    {'id': 'business-insider', 'name': 'Business Insider', 'url': 'http://www.businessinsider.com', 'category': 'business'},
    {'id': 'the-wall-street-journal', 'name': 'The Wall Street Journal', 'url': 'http://www.wsj.com', 'category': 'business'},
    {'id': 'new-scientist', 'name': 'New Scientist', 'url': 'https://www.newscientist.com/section/news', 'category': 'science'},
]);

const SourceModal = ({ isModalOpen, setIsModalOpen, selectedSources, setSelectedSources, fetchUpdate }) => {
    const [mostRecentSources, setMostRecentSources] = useState(selectedSources);

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
        <div className="source-modal">
            <div className="source-modal__header" onClick={handleToggleVisibility}>
                <h3 className="source-modal__title">Sources</h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isModalOpen ? "feather feather-chevron-up" : "feather feather-chevron-down"}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>

            {isModalOpen && 
                <div className="source-modal__body">
                    <button className="source-modal__top-button" onClick={() => {
                        setSelectedSources([]);
                    }}>
                        Clear
                    </button>
                    <button className="source-modal__top-button" onClick={() => {
                        setSelectedSources(ALL_SOURCES.map(source => source.id));
                    }}>
                        Select All
                    </button>

                    {ALL_SOURCES.map(source => {
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