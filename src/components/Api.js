const { Configuration, OpenAIApi } = require("openai");

const BASE_URL = "https://morningbrief.herokuapp.com/";
const DEFAULT_API_KEY = process.env.REACT_APP_OPENAI_API_KEY; // fallback api key (yours)

let userApiKey = ""; // You can initialize the user's key here or set it using a setter function

let configuration = new Configuration({ apiKey: userApiKey || DEFAULT_API_KEY }); // use user's key, if not available use yours
let openai = new OpenAIApi(configuration);

const ENGINEERED_PROMPT = "You are going to be given a bunch of news headlines and descriptions from the last couple days to catch you up on what's going on in the world.";
// const NEWS_PROMPT_V4 = "Using the news information you received, provide a balanced summary of key events from across the globe. Generate approximately 15 news items, each offering a concise yet informative description. Each item should be placed within square brackets [], with its category stated at the end within parentheses (). For example: [Concise news item goes here (category)]. Please avoid the use of parentheses in the news items, except for denoting the category. Aim to cover a diverse range of significant news, each item being succinct yet thorough.";
// const NEWS_PROMPT_V5 = "Using the news information you received, generate a concise summary of prominent events worldwide. Aim to produce about 15 brief yet insightful news items. Each item should be bracketed [], with its category listed (for example technology, politics)(and only one) and url at the end within parentheses (). For instance: [Brief news item goes here (category, url)]. Parentheses should only be used for category identification within the news items. Concentrate on presenting a wide array of significant news, each item being short and to the point.";
const NEWS_PROMPT_V6 = "Using the news you received, compile a diverse list of URLs pertaining to prominent events from across the globe. Strive for about 15 news items and prioritize those items which you deem the most significant and relevant. Each item must be enclosed in brackets [], and include its unique category (e.g., technology, politics, etc.) and its exact URL. The format should be: [category, url], [category, url], [category, url],…. Prioritize diversity and significance of news (so emphasize on ensuring a broad mix of significant new), and make sure there are no repetitions.";
const SUMMARY_PROMPT_V1 = "Write a thoughtful and succinct summary of the article you just recieved. Anywhere from 3-6 sentences is ideal.";
const QUESTION_PROMPT_V1 = "Asnwer me the following question, using the information from the recent article you just received (make sure you don't ever directly reference the article in your response, but rather use the information you learned from it as if its something you already knew): ";

const requestGPT = async (messages, model) => {
    let response;
    try {
        response = await openai.createChatCompletion({
            model: model,
            messages: messages,
        });
    } catch (error) {
        // console.log(error);
    }
    
    return response['data']['choices'][0]['message']['content'];
}

const setUserApiKey = (key) => {
    userApiKey = key;
    configuration = new Configuration({ apiKey: userApiKey || DEFAULT_API_KEY }); // update configuration object
    openai = new OpenAIApi(configuration); // update the OpenAIApi instance
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

// const separateNews_V5 = (news) => {
//     let newsArray = [];
  
//     let regExp = /\[([^\]]+)\]/g;
//     let newsItems = news.match(regExp);
  
//     if (newsItems) {
//       newsItems.forEach((item) => {
//         item = item.replace(/[\[\]]/g, ''); 
//         let parts = item.split('(');
//         let content = parts[0].trim();
        
//         if (parts[1]) {
//           let categoryUrlParts = parts[1].split(',');
//           let category = categoryUrlParts[0].trim();
//           let url = categoryUrlParts[1] ? categoryUrlParts[1].replace(')', '').trim() : 'Unknown';
          
//           newsArray.push({category: category, content: content, url: url});
//         } else {
//           newsArray.push({category: 'Unknown', content: content, url: 'Unknown'});
//         }
//       });
//     } else {
//       console.log('No news items found in the provided string.');
//     }
  
//     return newsArray;
// }

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

const makeNewsItems = (news, recentNews) => {
    // loop through the news matching the url to the recent news, then create a new list of news items with the category and url and title and description from the recent news
    let newsItems = [];
    news.forEach((item) => {
        recentNews.forEach((recentItem) => {
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

const Api = (mostRecentNews, setMostRecentNews, setCurrentNewsItem, userApiKey) => {
    // setUserApiKey(userApiKey);

    const getArticleSummary = async (item) => {
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
        const messages = [
            {'role': 'system', 'content': "Here is a recent article: " + item.title + ': ' + item.description + ' ' + item.content + '\n' + SUMMARY_PROMPT_V1},
            {'role': 'assistant', 'content': summary},
            {'role': 'user', 'content': QUESTION_PROMPT_V1 + question}
        ];
        const response = await requestGPT(messages, "gpt-3.5-turbo");
        return response;
    }

    const getUpdate = async () => {
        const response = await fetch(`${BASE_URL}`);
        const data = await response.json();
        setMostRecentNews(data.news);
        const messages = convertNewsToMessages(data.news);
        const gpt_response = await requestGPT(messages, "gpt-3.5-turbo");
        const newsItems = separateNews(gpt_response);
        return makeNewsItems(newsItems, data.news);
    }

    const getTopicUpdate = async (topic) => {
        const response = await fetch(`${BASE_URL}topic`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic: topic })
        });
        const data = await response.json();
        setMostRecentNews(data.news);
        const messages = convertNewsToMessages(data.news);
        const gpt_response = await requestGPT(messages, "gpt-3.5-turbo");
        const newsItems = separateNews(gpt_response);
        return makeNewsItems(newsItems, data.news);
    }

    return { getUpdate, getTopicUpdate, getArticleSummary, askFollowUp };
}

export default Api;