import { background_colors } from './constants';

export const getBackground = (category) => {
  return background_colors[category.toLowerCase()] || "#D2D2D2";
}

export const getDarkerBackground = (category) => {
  return background_colors[category.toLowerCase()] + "30" || "#D2D2D230";
}

export const sortByCategory = (news) => {
  // Sort news grouped by category putting world news first and then alphabetically
  let sortedNews = news.sort((a, b) => {
    if (a.category === 'world news') {
      return -1;
    } else if (b.category === 'world news') {
      return 1;
    } else {
      return a.category.localeCompare(b.category);
    }
  });

  return sortedNews;
}
  
export const getFormattedDate = () => {
  let date = new Date();
  let weekday = ["Sunday", "Monday", "Tues", "Wednesday", "Thursday", "Friday", "Saturday"];
  let month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let day = date.getDate();
  let daySuffix = day < 11 || day > 13 ? ["st", "nd", "rd", "th"][Math.min((day-1)%10, 3)] : "th";
  return `${weekday[date.getDay()]} ${month[date.getMonth()]} ${day}${daySuffix}`;
}

export const stringToBagOfWords = (str) => {
  return str.toLowerCase().split(' ').reduce((bag, word) => {
    bag[word] = (bag[word] || 0) + 1;
    return bag;
  }, {});
}

export const calculateSimilarity = (bagA, bagB) => {
  let score = 0;
  for(let word in bagA){
    if(bagB[word]){
      score += Math.min(bagA[word], bagB[word]);
    }
  }
  return score;
}