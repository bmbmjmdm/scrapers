import { OpenAIKey, LinkedUsername, LinkedPassword } from './Secrets.js'
import { CHAT_FREQUENCY_PENALTY, CHAT_MAX_TOKENS, CHAT_MODEL, CHAT_TEMPERATURE } from './Parameters.js';
import puppeteer from 'puppeteer';
// save results to file
import fs from 'fs';

const saveBlacklistToFile = async () => {
  await fs.writeFile('blacklist.txt', JSON.stringify(blacklist), (err) => {
    if (err) {
      console.log(err)
    }
  })
}

const readBlacklistFromFile = async () => {
  return JSON.parse(await fs.readFileSync('blacklist.txt', 'utf8'))
}

let blacklist = {};
let total = 0;
(async () => {
    blacklist = readBlacklistFromFile()
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.linkedin.com/login');

    // first, sign in 
    await typeIntoId(page, 'username', LinkedUsername);
    await typeIntoId(page, 'password', LinkedPassword);
    await clickButtonByAria(page, 'Sign in');
    await page.waitForNavigation();
  
    // search in Norway first
    await page.goto('https://www.linkedin.com/jobs/search/?currentJobId=3937739385&f_E=3%2C4%2C5%2C6&f_JT=F&f_TPR=r604800&f_WT=2&geoId=103819153&keywords=react%20native&location=Norway&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true&sortBy=R')
    await evaluateJobsAll(page)
    console.log(`Checked ${total} jobs for Norway`)
    total = 0;
    // Then Switzerland
    await page.goto('https://www.linkedin.com/jobs/search/?currentJobId=3993480027&f_E=3%2C4%2C5%2C6&f_JT=F&f_TPR=r604800&f_WT=2&geoId=106693272&keywords=react%20native&origin=JOB_SEARCH_PAGE_SEARCH_BUTTON&refresh=true&sortBy=R')
    await evaluateJobsAll(page)
    console.log(`Checked ${total} jobs for Switzerland`)
    total = 0;
    // Then Netherlands
    await page.goto('https://www.linkedin.com/jobs/search/?currentJobId=4001670730&f_E=3%2C4%2C5%2C6&f_JT=F&f_TPR=r604800&f_WT=2&geoId=102890719&keywords=react%20native&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true&sortBy=R')
    await evaluateJobsAll(page)
    console.log(`Checked ${total} jobs for Netherlands`)
    total = 0;
    // Then Austria
    await page.goto('https://www.linkedin.com/jobs/search/?currentJobId=4006135182&f_E=3%2C4%2C5%2C6&f_JT=F&f_TPR=r604800&f_WT=2&geoId=103883259&keywords=react%20native&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true&sortBy=R')
    await evaluateJobsAll(page)
    console.log(`Checked ${total} jobs for Austria`)
    total = 0;
    // Then UK
    await page.goto('https://www.linkedin.com/jobs/search/?currentJobId=3994907945&f_E=3%2C4%2C5%2C6&f_JT=F&f_TPR=r604800&f_WT=2&geoId=101165590&keywords=react%20native&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true&sortBy=R')
    await evaluateJobsAll(page)
    console.log(`Checked ${total} jobs for UK`)
    total = 0;
    // Then US
    await page.goto('https://www.linkedin.com/jobs/search/?currentJobId=3995406861&f_E=3%2C4%2C5%2C6&f_JT=F&f_TPR=r604800&f_WT=2&geoId=103644278&keywords=react%20native&origin=JOB_SEARCH_PAGE_LOCATION_AUTOCOMPLETE&refresh=true&sortBy=R')
    await evaluateJobsAll(page)
    console.log(`Checked ${total} jobs for US`)
    total = 0;

    await saveBlacklistToFile()

    await browser.close();
})();

const evaluateJobsAll = async (page) => {
  // wait 8 seconds for the page to load
  await new Promise((resolve, reject) => setTimeout(resolve, 8000));
  // for some reason using waitForSelector doesnt work for this particular element, and neither does $$. we have to do it manually with querySelectorAll 
  // extract the number of jobs loaded
  const jobsText = await page.evaluate(async () => {
    const elements = await document.querySelectorAll("div.jobs-search-results-list__subtitle")
      return Array.from(elements).map(element => element.textContent.trim());
  });
  const jobsNum = Number.parseInt(/(\d+)/.exec(jobsText[0])[0])
  // based on the number of jobs, calculate the number of pages (25 jobs per page)
  const pagesNum = Math.ceil(jobsNum / 25);
  // evaluate the first page
  await evaluateJobsPage(page);
  // go through the rest of the pages
  for (let i = 2; i <= pagesNum; i++) {
    // click on the page number
    await clickButtonByAria(page, `Page ${i}`);
    // evaluate the jobs on the page
    await evaluateJobsPage(page);
  }
}

const evaluateJobsPage = async (page) => {
  // wait 1 second for the page to load
  await new Promise((resolve, reject) => setTimeout(resolve, 1000));
  // hide the messages sidebar
  try {
    await page.waitForSelector(`aside.msg-overlay-container`);
    await page.evaluate(() => {
      const element = document.querySelector('aside.msg-overlay-container');
      if (element) {
        element.style.display = 'none';
      }
    });
  }
  catch (e) {}
  // find all the job cards on the page
  await page.waitForSelector(`div[data-view-name='job-card']`)
  // scroll the job list to the bottom, then scroll to top again
  // this forces all job cards to load
  await scrollDown(page);
  await scrollDown(page);
  await scrollDown(page);
  await scrollDown(page);
  await scrollDown(page);
  await scrollDown(page);
  await scrollDown(page);
  await scrollDown(page);
  await scrollUp(page);
  // Iterate over the job cards and click each one
  let jobCardIndex = 0;
  while (true) {
    const jobCards = await page.$$(`div[data-view-name='job-card']`);
    if (jobCardIndex >= jobCards.length) break;
    await jobCards[jobCardIndex].click();
    // wait 3 seconds for the job to load
    await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    // first we check if this job is in the blacklist
    const jobTitleList = await page.evaluate(async () => {
      const elements = document.querySelectorAll("div.job-details-jobs-unified-top-card__job-title")
        return Array.from(elements).map(element => element.textContent.trim());
    });
    const companyNameList = await page.evaluate(async () => {
      const elements = document.querySelectorAll("div.job-details-jobs-unified-top-card__company-name")
        return Array.from(elements).map(element => element.textContent.trim());
    });
    const jobTitle = jobTitleList[0];
    const companyName = companyNameList[0];
    if (!blacklist[companyName]) blacklist[companyName] = [];
    if (blacklist[companyName].includes(jobTitle)) {
      jobCardIndex++
      continue;
    }
    else {
      blacklist[companyName].push(jobTitle);
    }
    // now extract all text in the job details and the company details
    const details = await page.$$('div[class="jobs-search__job-details--wrapper"]')
    const texts = await page.evaluate((...elements) => {
      return elements.map(element => element.textContent.trim());
    }, ...details);
    // now check the job for our desired keywords
    texts.forEach(async (text, index) => {
      const fullUrl = page.url();
      // use gpt-4o-mini to evaluate job description
      const isEthical = await askAIEthical(text)
      if (isEthical.isEthical && !isEthical.requiresBackend && !isEthical.requiresLocation) {
        console.log(isEthical.reason)
        const removePastAnd = fullUrl.split('&')[0];
        const job = removePastAnd.replace("search/?currentJobId=", "view/");
        console.log(job)
      }
      total++;
    });
    jobCardIndex++
  }
}



const askAIEthical = async (text) => {
  try {
    const messages = []
    const question = 'You will recieve a job posting from the user. You need to read it and answer 4 questions. 1. Is this job ethical? Your answer should be true or false. A job is ethical if it does any of the following: benefits the environment (e.g. alternative energy, reducing energy consumption, support conservation, supporting biodiversity, converting existing practices to green ones, etc), benefits animals (e.g. improves animal healthcare, supports adoption, etc), benefits underprivelidged people (e.g. provides goods and services to impoverished communities, provides a meeting space for LGBTQ folk, etc), is a non-profit, supports political organizing, supports education of children, or supports healthcare (e.g. therapy, cancer treatment, telehealth, etc). If a job\'s product or service does not explicitely serve one of these buckets, you should answer false. Additionally do not consider how the employer treats its employees or conducts business internally as a factor when determining whether the job is ethical (for example if an employer promotes DEI in their hiring process, that\'s not ethical work. However if they have a product that promotes DEI in other businesses, that is). Lastly, never consider any of these categories ethical: weight-loss, exercise, cryptocurrency, financial literacy, loans. 2. What is the reason for your answer to question 1? This should be short (ex: improves vetrinarian software, increases green spending habbits, etc). 3. Does this job REQUIRE backend experience? Note the difference between frontend and backend. Technologies like React and Javascript are frontend, while technolgies like Go, Python, Kafka, Rust, Ruby, etc are backend. You should only label this true if it is clear that the job REQUIRES backend experience. If it simply mentions it as nice to have, or you are unsure, default to false. Of course any job labeled "fullstack developer" will require backend experience. 4. Does this job REQUIRE being located in a specific place(s) outside Norway? For example if a job is onsite or hybrid, that requires being located close to the job. Or if a job specifically says where a candidate must be located such as a list of US states. However the location of the job itself (often listed as "Country - Time of listing - # of applicants) should not be considered for this. Your response must be in valid JSON format. Here is an example response: {"isEthical": false, "reason": "generic business software", "requiresBackend": true, "requiresLocation": false}';
    messages.push({ role: 'system', content: question })
    messages.push({ role: 'user', content: text })
    const result = await openAiFetch(messages)
    if (result.status !== 200) throw new Error(`Status ${result.status}`)
    const json = await result.json()
    const response = json.choices[0].message.content
    let sanitized = response.replace(/`/g, '')
    sanitized = sanitized.replace(/json/g, '')
    const parsedAnswer = JSON.parse(sanitized)

    const nextQuestion = "Refer to the original question, the job description, and your initial answer. Now I want you to scrutinize your own answer and decide if it is accurate. Begin your response with \"Let's think this through step-by-step\".";    
    messages.push({ role: 'assistant', content: JSON.stringify(parsedAnswer) })
    messages.push({ role: 'system', content: nextQuestion })
    const nextResult = await openAiFetch(messages)
    if (nextResult.status !== 200) throw new Error(`Status ${nextResult.status}`)
    const nextJson = await nextResult.json()
    const nextResponse = nextJson.choices[0].message.content
    
    const finalQuestion = "Using your scrutiny, update your original JSON answer. Respond with the exact same JSON format as the original question."
    messages.push({ role: 'assistant', content: nextResponse })
    messages.push({ role: 'system', content: finalQuestion })
    const finalResult = await openAiFetch(messages)
    if (finalResult.status !== 200) throw new Error(`Status ${finalResult.status}`)
    const finalJson = await finalResult.json()
    const finalResponse = finalJson.choices[0].message.content
    let nextSanitized = finalResponse.replace(/`/g, '')
    nextSanitized = nextSanitized.replace(/json/g, '')
    const nextParsedAnswer = JSON.parse(nextSanitized)
    return nextParsedAnswer
  }
  catch (e) {
    console.log(e)
    return { isEthical: true, reason: 'error', requiresBackend: false, requiresLocation: false }
  }
}

const openAiFetch = async (messages) => {
  return await fetch(`https://api.openai.com/v1/chat/completions`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: `Bearer ${OpenAIKey}`
    },
    body: JSON.stringify({
      model: CHAT_MODEL, 
      messages: messages,
      max_tokens: CHAT_MAX_TOKENS,
      temperature: CHAT_TEMPERATURE,
      frequency_penalty: CHAT_FREQUENCY_PENALTY
    })
  })
}


const scrollDown = async (page) => {
  await page.evaluate(() => {
    const element = document.querySelector('div.jobs-search-results-list');
    element.scrollBy(0, 500);
  });
  await new Promise((resolve, reject) => setTimeout(resolve, 500));
}

const scrollUp = async (page) => {
  await page.evaluate(() => {
    const element = document.querySelector('div.jobs-search-results-list');
    element.scrollTo(0, 0);
  });
  await new Promise((resolve, reject) => setTimeout(resolve, 1000));
}

const clickButtonByAria = async (page, ariaLabel) => {
    // Wait for the button with the specific aria-label to appear
    await page.waitForSelector(`button[aria-label='${ariaLabel}']`);
    // Click the button with the specific aria-label
    await page.click(`button[aria-label='${ariaLabel}']`);
}

const typeIntoId = async (page, id, text) => {
  // Wait for the element with the specified ID to appear
  await page.waitForSelector(`#${id}`);
  // Click the element with the specified ID
  await page.type(`#${id}`, text);
}
