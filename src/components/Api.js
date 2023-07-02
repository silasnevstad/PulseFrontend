import axios from 'axios';
import { stringToBagOfWords, calculateSimilarity } from './utils.js';
const { Configuration, OpenAIApi } = require("openai");

const BASE_URL = process.env.REACT_APP_BASE_URL || "https://morningbrief.herokuapp.com/";
const DEFAULT_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPEN_WEATHER_MAP_API_KEY = process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY;

const ENGINEERED_PROMPT = "You are going to be given a bunch of news headlines and descriptions from the last couple days to catch you up on what's going on in the world.";
const NEWS_PROMPT_V6 = "You must use the function make_news. Using the news articles you just received, compile a diverse list of exact titles and categories pertaining to prominent events from across the globe. Strive for about 15 news items and prioritize those items which you deem the most significant and relevant. IMPORTANT: Each item must include its category (e.g., technology, politics, Environment, etc.) and its exact title from the article. Prioritize diversity and significance of news (so emphasize on ensuring a broad mix of significant new), and make sure there are no repetitions.";
// const NEWS_PROMPT_V7 = "Using the news you just received, compile a diverse list of headlines pertaining to prominent events from across the globe. Strive for about 15 news items and prioritize those items which you deem the most significant and relevant. Each item must be enclosed in brackets [], and include its unique category (e.g., technology, politics, etc), a brief succinct summary and its exact URL. The format should be: [category, summary, url], [category, summary, url], [category, summary, url],…. Prioritize diversity and significance of news (so emphasize on ensuring a broad mix of significant new), and make sure there are no repetitions.";
const SUMMARY_PROMPT_V1 = "Write a thoughtful and succinct summary of the article you just received. Anywhere from 3-8 sentences is ideal.";
const QUESTION_PROMPT_V1 = "Answer me the following question, using the information from the recent article you just received (make sure you don't ever directly reference the article in your response, but rather use the information you learned from it as if its something you already knew):";

let globalAbortController = new AbortController();
let userApiKey = ""; 
let configuration = new Configuration({ apiKey: userApiKey || DEFAULT_API_KEY });
let openai = new OpenAIApi(configuration);

const cancelPreviousRequest = () => {
    globalAbortController.abort();
    globalAbortController = new AbortController();
}

const updateApiKey = (apiKey) => {
    userApiKey = apiKey;
    configuration = new Configuration({ apiKey: userApiKey || DEFAULT_API_KEY });
    openai = new OpenAIApi(configuration);
}

const requestGPT = async (messages, model) => {
    let response;
    try {
        response = await openai.createChatCompletion({
            model: model,
            messages: messages,
            // signal: globalAbortController.signal,
        });
    } catch (error) {
        throw error;
    }    
    
    return response['data']['choices'][0]['message']['content'];
}

const requestFunctionGPT = async (messages, model, recentNews) => {
    let response;
    try {
        response = await openai.createChatCompletion({
            model: model,
            messages: messages,
            functions: [
                {
                    "name": "make_news",
                    "description": "Makes a list of news items given a list of category, and exact title pairs",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "news": {
                                "type": "array",
                                "description": "The list of news items to be made (each item is a list with a category and a exact title, in that order)",
                                "items": { 
                                    "type": "array", 
                                    "description": "A news item (category, exact title)",
                                    "items": { 
                                        "type": "string"
                                    } 
                                },
                            },
                        },
                        "required": ["news"],
                    },
                }
            ],
        });

        const response_message = response.data.choices[0].finish_reason
        let dataToReturn = {};

        if (response_message === "function_call") {
            const functionToUse = response.data.choices[0].message?.function_call;
            console.log(response.data.choices[0])
            if (functionToUse.name === 'make_news') {
                const args = JSON.parse(functionToUse.arguments);
                const newsDict = args.news.map(item => {
                    return {category: item[0], title: item[1]};
                });
                console.log(newsDict);
                dataToReturn = makeNewsItems(newsDict, recentNews);
            }
            return dataToReturn;
        }

    } catch (error) {
        throw error;
    }
    return response['data']['choices'][0]['message']['content'];
}


const convertNewsToMessages = (news) => {
    let messages = [{'role': 'system', 'content': ENGINEERED_PROMPT}];
    // limit to 25 news items
    news = news.slice(0, 25);
    news.forEach((article) => {
        messages.push({'role': 'system', 'content': `title: "${article.title}"`});
    });
    messages.push({'role': 'system', 'content': NEWS_PROMPT_V6});
    return messages;
}

const convertArticleToSummaryMessages = (article) => {
    let messages = [{'role': 'system', 'content': "Here's an article: " + article.title + ': ' + article.description + ' ' + article.content}];
    messages.push({'role': 'system', 'content': SUMMARY_PROMPT_V1});
    return messages;
}

const cleanTitle = (title) => {
    let titleParts = title.split('-');
    if (titleParts.length > 1) {
        titleParts.pop();
    }

    return titleParts.join('-').trim();
}

const makeNewsItems = (news, recentNews) => {
    // clean titles
    let recentNewsMap = new Map();
    recentNews.forEach(item => recentNewsMap.set(cleanTitle(item.title), item));

    let newsItems = news.map(item => {
        if (recentNewsMap.has(cleanTitle(item.title))) {
            let recentItem = recentNewsMap.get(cleanTitle(item.title));
            return {category: item.category, url: item.url, title: cleanTitle(recentNewsMap.title), content: recentItem.description };
        }
    }).filter(Boolean); // remove undefined items
    return newsItems;
}

const findArticleFromDescription = (news, item) => {
    // Check for exact match using URLs first
    for(let i = 0; i < news.length; i++){
        if(news[i].url === item.url){
            return news[i];
        }
    }
    // Proceed with bag-of-words similarity calculation if no exact match found
    let descriptionBag = stringToBagOfWords(item.content);
    let highestScore = 0;
    let mostSimilarArticle = null;

    news.forEach((article) => {
        let articleBag = stringToBagOfWords(article.description + ' ' + article.content);
        let similarityScore = calculateSimilarity(descriptionBag, articleBag);
        if(similarityScore > highestScore){
            highestScore = similarityScore;
            mostSimilarArticle = article;
        }
    });

    return mostSimilarArticle;
}

const Api = (mostRecentNews, setMostRecentNews, setCurrentNewsItem, userApiKey, selectedSources) => {
    // setUserApiKey(userApiKey);
    if (userApiKey) {
        updateApiKey(userApiKey);
    }

    const getArticleSummary = async (item) => {
        cancelPreviousRequest();
        let article;
        try {
            article = findArticleFromDescription(mostRecentNews, item);
        } catch (error) {
            return 'Sorry, I could not find an article with that description.';
        }
        if (article) {
            const response = await fetch(`${BASE_URL}article`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: article.url })
            });
            const data = await response.json();
            article.content = data.article;
            article.category = item.category;
            article.subtitle = item.content;
            setCurrentNewsItem(article);
            const summary = await requestGPT(convertArticleToSummaryMessages(article), "gpt-3.5-turbo");
            return summary;
        } else {
            return 'Sorry, I could not find an article with that description.';
        }
    }

    const askFollowUp = async (item, question, summary) => {
        cancelPreviousRequest();
        const messages = [
            {'role': 'system', 'content': "Here is a recent article: " + item.title + ': ' + item.description + ' ' + item.content + '\n' + SUMMARY_PROMPT_V1},
            {'role': 'assistant', 'content': summary},
            {'role': 'user', 'content': QUESTION_PROMPT_V1 + question}
        ];
        const response = await requestGPT(messages, "gpt-3.5-turbo-0613");
        return response;
    }

    const getUpdate = async () => {
        cancelPreviousRequest();
        try {
            const response = await axios.get(`${BASE_URL}`);
            setMostRecentNews(response.data.news);
            const messages = convertNewsToMessages(response.data.news);
            const gpt_response = await requestFunctionGPT(messages, "gpt-3.5-turbo", response.data.news);
            if (!gpt_response) return null;
            return gpt_response;
        } catch (error) {
            console.error(error);
        }
    }

    const getSourcesUpdate = async (sources) => {
        cancelPreviousRequest();
        try {
            const response = await axios.post(`${BASE_URL}sources`, { sources });
            setMostRecentNews(response.data.news);
            const messages = convertNewsToMessages(response.data.news);
            const gpt_response = await requestFunctionGPT(messages, "gpt-3.5-turbo", response.data.news);
            if (!gpt_response) return null;
            return gpt_response;
        } catch (error) {
            console.error(error);
        }
    }

    const getTopicUpdate = async (topic) => {
        cancelPreviousRequest();
        try {
            const response = await axios.post(`${BASE_URL}topic`, { topic });
            setMostRecentNews(response.data.news);
            const messages = convertNewsToMessages(response.data.news);
            const gpt_response = await requestFunctionGPT(messages, "gpt-3.5-turbo", response.data.news);
            if (!gpt_response) return null;
            return gpt_response;
        } catch (error) {
            console.error(error);
        }
    }

    const getSearchTermUpdate = async (searchTerm) => {
        cancelPreviousRequest();
        try {
            const response = await axios.post(`${BASE_URL}search`, { text: searchTerm });
            const newsCut = response.data.news.slice(0, Math.min(response.data.news.length, 30));
            setMostRecentNews(response.data.news);
            const messages = convertNewsToMessages(newsCut);
            // const gpt_response = await requestGPT(messages, "gpt-3.5-turbo-0613");
            // if (!gpt_response) return null;
            // const newsItems = separateNews(gpt_response);
            // return makeNewsItems(newsItems, response.data.news);
            const gpt_response = await requestFunctionGPT(messages, "gpt-3.5-turbo", response.data.news);
            if (!gpt_response) return null;
            return gpt_response;
        } catch (error) {
            console.error(error);
        }
    }

    const getWeatherData = async (lat, lon) => {
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=imperial&appid=${OPEN_WEATHER_MAP_API_KEY}`
                // `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_MAP_API_KEY}`
            );
            return response.data;
        } catch (error) {
            console.error('Failed to fetch weather data: ', error);
        }
    };
    

    return { getUpdate, getSourcesUpdate, getTopicUpdate, getSearchTermUpdate, getArticleSummary, askFollowUp, getWeatherData };
}

export default Api;