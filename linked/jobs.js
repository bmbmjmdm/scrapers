import { OpenAIKey, LinkedUsername, LinkedPassword } from './Secrets.js'
import { CHAT_FREQUENCY_PENALTY, CHAT_MAX_TOKENS, CHAT_MODEL, CHAT_TEMPERATURE } from './Parameters.js';
import puppeteer from 'puppeteer';

let total = 0;
(async () => {
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
    console.log(`Checked ${total} jobs for Austra`)
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

    await browser.close();
})();

const evaluateJobsAll = async (page) => {
  // wait 5 seconds for the page to load
  await new Promise((resolve, reject) => setTimeout(resolve, 5000));
  // wait for jobs to load
  await page.waitForSelector(`div[class='jobs-search-results-list__subtitle']`);
  // extract the number of jobs loaded
  const jobsRaw = await page.$$(`div[class='jobs-search-results-list__subtitle']`);
  const jobsText = await page.evaluate((...elements) => {
      return elements.map(element => element.textContent.trim());
  }, ...jobsRaw);
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
      //if (isEthical.isEthical && isEthical.appropriateExperience && isEthical.isRemote && isEthical.isFullTime) {
      if (isEthical.isEthical && !isEthical.requiresBackend) {
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
    //const question = 'You will recieve a job posting from the user. You need to read it and answer 5 questions. 1. Is this job ethical? Your answer should be true or false. A job is ethical if it benefits the environment (alternative energy, converting existing practices to green ones, etc), animal or human rights (e.g. healthcare, education, social services, etc.), is a non-profit, or similar ethical efforts. 2. What is the reason for your answer to question 1? This should be a single or two word reason (ex: environment, animals, etc). 3. Is this job suitable for a software developer with primarily frontend and ai experience? 4. Is this job fully remote? If you don't know, say true. 5. Is this job full time/permanant position? If you don't know, say true. Your response must be in valid JSON format. Here is an example response: {"isEthical": false, "reason": "business software", "isRemote": true, "isFullTime": true}';
    const question = 'You will recieve a job posting from the user. You need to read it and answer 3 questions. 1. Is this job ethical? Your answer should be true or false. A job is ethical if it does any of the following: benefits the environment (e.g. alternative energy, reducing energy consumption, support conservation, supporting biodiversity, converting existing practices to green ones, etc), benefits animals (e.g. improves animal healthcare, supports adoption, etc), benefits underprivelidged people (e.g. provides goods and services to impoverished communities, provides a meeting space for LGBTQ folk, etc), is a non-profit, supports political organizing, supports education of children, or supports healthcare (not including exercise/diet). Avoid considering jobs that contribute to general societal functioning without a clear ethical focus (e.g., cyber security, open source software, hr/recruiting, cryptocurrency, loans or banking, generic business software, etc). Only consider these if they have a clear connection to one of the ethical fields mentioned previously. Additionally do not consider how the employer treats its employees or conducts business internally as a factor when determining whether the job is ethical (for example if an employer promotes DEI in their hiring process, that\'s not ethical work. However if they have a product that promotes DEI in other businesses, that is). 2. What is the reason for your answer to question 1? This should be short (ex: improves vetrinarian software, increases green spending habbits, etc). 3. Does this job REQUIRE backend experience? Note the difference between frontend and backend. Technologies like React and Javascript are frontend, while technolgies like Go, Python, Kafka, Rust, Ruby, etc are backend. You should only label this true if it is clear that the job REQUIRES backend experience. If it simply mentions it as nice to have, or you are unsure, default to false. Your response must be in valid JSON format. Here is an example response: {"isEthical": false, "reason": "generic business software", "requiresBackend": true}';
    const result = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${OpenAIKey}`
      },
      body: JSON.stringify({
        model: CHAT_MODEL, 
        messages: [
          { role: 'system', content: question },
          { role: 'user', content: text }
        ],
        max_tokens: CHAT_MAX_TOKENS,
        temperature: CHAT_TEMPERATURE,
        frequency_penalty: CHAT_FREQUENCY_PENALTY
      })
    })
    if (result.status !== 200) throw new Error(`Status ${result.status}`)
    const json = await result.json()
    const response = json.choices[0].message.content
    let sanitized = response.replace(/`/g, '')
    sanitized = sanitized.replace(/json/g, '')
    return JSON.parse(sanitized)
  }
  catch (e) {
    console.log(e)
    return { isEthical: true, reason: 'error', appropriateExperience: true, isRemote: true, isFullTime: true }
  }
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
