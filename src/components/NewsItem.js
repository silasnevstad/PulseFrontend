import { getBackground } from './utils';

const NewsItem = ({ item, onClick, toggleMode, disabled }) => {
    const newsTitle = item.title || item.content;
    const newsDescription = item.description || item.content;

    return (
        <div className="news-item" style={{borderColor: getBackground(item.category)}} onClick={() => onClick(item)} disabled={disabled}>
            <p className="news-item-category" style={{color: getBackground(item.category)}}>{item.category[0].toUpperCase() + item.category.slice(1)}</p>
            <p className="news-item-text">{toggleMode ? newsTitle : newsDescription}</p>
        </div>
    );
}

export default NewsItem;