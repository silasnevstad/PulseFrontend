import axios from 'axios';
import { stringToBagOfWords, calculateSimilarity } from './utils.js';
const { Configuration, OpenAIApi } = require("openai");

const BASE_URL = process.env.REACT_APP_BASE_URL || "https://morningbrief.herokuapp.com/";
const DEFAULT_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const ENGINEERED_PROMPT = "You are going to be given a bunch of news headlines and descriptions from the last couple days to catch you up on what's going on in the world.";
const NEWS_PROMPT_V6 = "Using the news you just received, compile a diverse list of URLs pertaining to prominent events from across the globe. Strive for about 15 news items and prioritize those items which you deem the most significant and relevant. IMPORTANT: Each item must be enclosed in brackets [], and include its unique category (e.g., technology, politics, etc.) and its exact URL (only include these two items, nothing else). The format should be: [category, url], [category, url], [category, url],…. Prioritize diversity and significance of news (so emphasize on ensuring a broad mix of significant new), and make sure there are no repetitions.";
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
        console.log('requesting function gpt');
        response = await openai.createChatCompletion({
            model: model,
            messages: messages,
            functions: [
                {
                    "name": "make_news",
                    "description": "Makes a list of news items given a list of categories and urls pairs",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "news": {
                                "type": "array",
                                "description": "The list of news items to be made (each item is a list of category and url pairs)",
                                "items": { "type": "array", "items": { "type": "string" } },
                            },
                        },
                        "required": ["news"],
                    },
                }
            ],
        });

        console.log(response.data.choices[0]);

        const response_message = response.data.choices[0].finish_reason
        let dataToReturn = {};

        if (response_message === "function_call") {
            const functionToUse = response.data.choices[0].message?.function_call;

            if (functionToUse.name === 'make_news') {
                const args = JSON.parse(functionToUse.arguments);
                const newsDict = args.news.map(item => {
                    return {category: item[0], url: item[1]};
                });
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
        messages.push({'role': 'system', 'content': article.title + ' ' + article.url});
    });
    messages.push({'role': 'system', 'content': NEWS_PROMPT_V6});
    return messages;
}

const convertArticleToSummaryMessages = (article) => {
    let messages = [{'role': 'system', 'content': "Here's an article: " + article.title + ': ' + article.description + ' ' + article.content}];
    messages.push({'role': 'system', 'content': SUMMARY_PROMPT_V1});
    return messages;
}

// const separateNews = (news) => {
//     // regex to find category and url pairs in the string
//     const regex = /\[([^,]+), ([^\]]+)\]/g;
//     let match;
//     let result = [];

//     while ((match = regex.exec(news)) !== null) {
//       result.push({
//         category: match[1],
//         url: match[2],
//       });
//     }

//     return result;
// }

const makeNewsItems = (news, recentNews) => {
    let recentNewsMap = new Map();
    recentNews.forEach(item => recentNewsMap.set(item.url, item));
    
    let newsItems = news.map(item => {
        if (recentNewsMap.has(item.url)) {
            let recentItem = recentNewsMap.get(item.url);
            return {category: item.category, url: item.url, title: recentItem.title, content: recentItem.description};
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
            // console.log(error);
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
            const summary = await requestGPT(convertArticleToSummaryMessages(article), "gpt-3.5-turbo-0613");
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
            const gpt_response = await requestFunctionGPT(messages, "gpt-3.5-turbo-16k-0613", response.data.news);
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
            const gpt_response = await requestFunctionGPT(messages, "gpt-3.5-turbo-16k-0613", response.data.news);
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
            const gpt_response = await requestFunctionGPT(messages, "gpt-3.5-turbo-16k-0613", response.data.news);
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
            const gpt_response = await requestFunctionGPT(messages, "gpt-3.5-turbo-16k-0613", response.data.news);
            if (!gpt_response) return null;
            return gpt_response;
        } catch (error) {
            console.error(error);
        }
    }

    return { getUpdate, getSourcesUpdate, getTopicUpdate, getSearchTermUpdate, getArticleSummary, askFollowUp };
}

export default Api;