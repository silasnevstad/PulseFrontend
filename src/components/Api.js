// import nlp from 'compromise';
const { Configuration, OpenAIApi } = require("openai");
// const keyword_extractor = require("keyword-extractor");

let globalAbortController = new AbortController();

const BASE_URL = "https://morningbrief.herokuapp.com/";
const DEFAULT_API_KEY = process.env.REACT_APP_OPENAI_API_KEY; // fallback api key (yours)

let userApiKey = ""; // You can initialize the user's key here or set it using a setter function

let configuration = new Configuration({ apiKey: userApiKey || DEFAULT_API_KEY }); // use user's key, if not available use yours
let openai = new OpenAIApi(configuration);

const ENGINEERED_PROMPT = "You are going to be given a bunch of news headlines and descriptions from the last couple days to catch you up on what's going on in the world.";
const NEWS_PROMPT_V6 = "Using the news you just received, compile a diverse list of URLs pertaining to prominent events from across the globe. Strive for about 15 news items and prioritize those items which you deem the most significant and relevant. Each item must be enclosed in brackets [], and include its unique category (e.g., technology, politics, etc.) and its exact URL. The format should be: [category, url], [category, url], [category, url],…. Prioritize diversity and significance of news (so emphasize on ensuring a broad mix of significant new), and make sure there are no repetitions.";
const NEWS_PROMPT_V7 = "Using the news you just received, compile a diverse list of headlines pertaining to prominent events from across the globe. Strive for about 15 news items and prioritize those items which you deem the most significant and relevant. Each item must be enclosed in brackets [], and include its unique category (e.g., technology, politics, etc), a brief succinct summary and its exact URL. The format should be: [category, summary, url], [category, summary, url], [category, summary, url],…. Prioritize diversity and significance of news (so emphasize on ensuring a broad mix of significant new), and make sure there are no repetitions.";
const SUMMARY_PROMPT_V1 = "Write a thoughtful and succinct summary of the article you just received. Anywhere from 3-8 sentences is ideal.";
const QUESTION_PROMPT_V1 = "Answer me the following question, using the information from the recent article you just received (make sure you don't ever directly reference the article in your response, but rather use the information you learned from it as if its something you already knew):";

const cancelPreviousRequest = () => {
    globalAbortController.abort();
    globalAbortController = new AbortController();
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
        console.log(error);
        throw error;
    }    
    
    return response['data']['choices'][0]['message']['content'];
}

const convertNewsToMessages = (news) => {
    let messages = [{'role': 'system', 'content': ENGINEERED_PROMPT}];
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

const separateNews = (news) => {
    // regex to find category and url pairs in the string
    const regex = /\[([^,]+), ([^\]]+)\]/g;
    let match;
    let result = [];

    while ((match = regex.exec(news)) !== null) {
      result.push({
        category: match[1],
        url: match[2],
      });
    }

    return result;
}

const isEnglish = (str) => {
    return /^[A-Za-z0-9]*$/.test(str);
}

const makeNewsItems = (news, recentNews) => {
    let newsItems = [];
    news.forEach((item) => {
        recentNews.forEach((recentItem) => {
            // if language is not english, skip
            if (item.url === recentItem.url) {
                newsItems.push({category: item.category, url: item.url, title: recentItem.title, content: recentItem.description});
            }
        });
    });
    return newsItems;
}


const stringToBagOfWords = (str) => {
    return str.toLowerCase().split(' ').reduce((bag, word) => {
        bag[word] = (bag[word] || 0) + 1;
        return bag;
    }, {});
}

const calculateSimilarity = (bagA, bagB) => {
    let score = 0;
    for(let word in bagA){
        if(bagB[word]){
            score += Math.min(bagA[word], bagB[word]);
        }
    }
    return score;
}

const findArticleFromDescription = (news, item) => {
    // Check for exact match using URLs first
    for(let i = 0; i < news.length; i++){
        if(news[i].url === item.url){
            return news[i];
        }
    }
    // console.log('No exact match found for article with description: ' + item.content);
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

// const getKeywordsFromString = (str) => {
//     let doc = nlp(str);
//     let nouns = doc.nouns().out('array'); // extracts the nouns

//     // extract keywords from the nouns using keyword-extractor
//     let keywords = keyword_extractor.extract(nouns.join(' '), {
//         language: 'english',
//         remove_digits: true,
//         return_changed_case: true,
//         remove_duplicates: true
//     });

//     // remove numbers and punctuation
//     keywords = keywords.filter((keyword) => {
//         return !keyword.match(/^[0-9]+$/) && !keyword.match(/^[.,/#!$%;:{}=\-_`~()]+$/);
//     });

//     return keywords;
// }

// const getKeywords = async (news) => {
//     let keywords = [];

//     news.forEach((article) => {
//         let articleKeywords = getKeywordsFromString(article.description + ' ' + article.content);
//         keywords = keywords.concat(articleKeywords);
//     });

//     // Remove duplicates
//     keywords = [...new Set(keywords)];

//     return keywords;
// }

const Api = (mostRecentNews, setMostRecentNews, setCurrentNewsItem, userApiKey) => {
    // setUserApiKey(userApiKey);

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
        const response = await requestGPT(messages, "gpt-3.5-turbo");
        return response;
    }

    const getUpdate = async () => {
        cancelPreviousRequest();
        const response = await fetch(`${BASE_URL}`);
        const data = await response.json();
        setMostRecentNews(data.news);
        console.log('Most recent news: ', data.news);
        // const keywords = await getKeywords(data.news);
        // setLoadingKeywords(keywords);
        const messages = convertNewsToMessages(data.news);
        const gpt_response = await requestGPT(messages, "gpt-3.5-turbo");
        console.log(gpt_response);
        if (!gpt_response) {
            return null;
        }
        const newsItems = separateNews(gpt_response);
        return makeNewsItems(newsItems, data.news);
    }

    const getTopicUpdate = async (topic) => {
        cancelPreviousRequest();
        const response = await fetch(`${BASE_URL}topic`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic: topic })
        });
        const data = await response.json();
        setMostRecentNews(data.news);
        console.log(data.news);
        // const keywords = await getKeywords(data.news);
        // setLoadingKeywords(keywords);
        const messages = convertNewsToMessages(data.news);
        const gpt_response = await requestGPT(messages, "gpt-3.5-turbo");
        if (!gpt_response) {
            return null;
        }
        console.log(gpt_response);
        const newsItems = separateNews(gpt_response);
        return makeNewsItems(newsItems, data.news);
    }

    const getSearchTermUpdate = async (searchTerm) => {
        cancelPreviousRequest();
        const response = await fetch(`${BASE_URL}search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: searchTerm })
        });
        const data = await response.json();
        setMostRecentNews(data.news);
        // const keywords = await getKeywords(data.news);
        // setLoadingKeywords(keywords);
        console.log(data.news);
        const messages = convertNewsToMessages(data.news);
        const gpt_response = await requestGPT(messages, "gpt-3.5-turbo");
        const newsItems = separateNews(gpt_response);
        return makeNewsItems(newsItems, data.news);
    }

    return { getUpdate, getTopicUpdate, getSearchTermUpdate, getArticleSummary, askFollowUp };
}

export default Api;