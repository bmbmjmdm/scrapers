const puppeteer = require('puppeteer');
let total = 0;
(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://www.linkedin.com/login');

    // first, sign in 
    await typeIntoId(page, 'username', '');
    await typeIntoId(page, 'password', '');
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
    texts.forEach((text, index) => {
      const lowercase = text.toLowerCase();
      for (const keyword of keywords) {
        if (lowercase.includes(keyword)) {
          console.log(keyword)
          const fullUrl = page.url();
          const removePastAnd = fullUrl.split('&')[0];
          const job = removePastAnd.replace("search/?currentJobId=", "view/");
          console.log(job)
          break;
        }
      }
      total++;
    });
    jobCardIndex++
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

const keywords = [
  "energy-efficient",
  "energy efficiency",
  "circular economy",
  "ecological",
  "eco-",
  "to nature",
  "from nature",
  "the nature",
  "of nature",
  "with nature",
  "community health",
  "integrated care",
  "telehealth",
  "health education",
  "eco-minded",
  "sustainable living",
  "sustainable development",
  "sustainable community",
  "sustainable lifestyle",
  "sustainable practices",
  "sustainable solutions",
  "sustainable design",
  "sustainable energy",
  "eco-conscious", 
  "eco-friendly",
  "carbon",
  "responsible resource",
  "farming",
  "green",
  "eco-friendly",
  "the environment",
  "environmental",
  "climate",
  "global warming",
  "climate change",
  "climate action",
  "carbon reduction",
  "emissions",
  "renewables",
  "mental health",
  "mental wellbeing",
  "cultural wellbeing",
  "global wellbeing",
  "societal wellbeing",
  "society",
  "wellness",
  "emotional support",
  "psychological",
  "counseling",
  "therapy",
  "behavioral health",
  "animals",
  "animal welfare",
  "wildlife",
  "conservation",
  "biodiversity",
  "species protection",
  "habitat",
  "endangered species",
  "grades",
  "special ed",
  "autism",
  "disorder",
  "education for",
  "curriculum",
  "educational",
  "teaches",
  "teach them",
  "student",
  "child development",
  "global development",
  "international aid",
  "foreign aid",
  "poverty alleviation",
  "humanitarian",
  "relief",
  "disinformation",
  "misinformation",
  "truth",
  "fact-checking",
  "media literacy",
  "fake news",
  "information integrity",
  "social work",
  "outreach",
  "community building",
  "community outreach",
  "local communit",
  "support communit",
  "underrepresented",
  "marginalized",
  "justice reform",
  "energy reform",
  "social safety",
  "safety net",
  "inclusive education",
  "education access",
  "childhood education",
  "literacy program",
  "vulnerable",
  "underserved",
  "disadvantaged",
  "impoverished",
  "social services",
  "grassroots",
  "food",
  "nutrition",
  "hunger",
  "feeding",
  "food security",
  "agriculture",
  "farming",
  "organic",
  "shelter",
  "homelessness",
  "homeless",
  "transitional housing",
  "affordable housing",
  "+ community",
  "LGBTQ community",
  "LGBTQIA community",
  "youth",
  "children",
  "adolescents",
  "teenagers",
  "kids",
  "young people",
  "queer",
  "non-binary",
  "transgender",
  "non-profit",
  "NGO",
  "charity",
  "volunteer",
  "human rights",
  "civil rights",
  "advocacy",
  "activism",
  "renewable energy",
  "clean energy",
  "solar",
  "wind energy",
  "wind technology",
  "wind power",
  "wind turbine",
  "wind farm",
  "hydro",
  "geothermal",
  "biomass",
  "energy efficiency",
  "decarbonization",
  "clean water",
  "water access",
  "sanitation",
  "hygiene",
  "water security",
  "safe water",
  "accessible food",
  "food access",
  "accessible climate",
  "accessible energy",
  "accessible healthcare",
  "accessible education",
  "accessible housing",
  "accessible transportation",
  "accessible psych",
  "accessible legal",
  "accessible law",
  "accessible justice",
  "wastewater",
  "water purification",
  "healthcare access",
  "access to healthcare",
  "healthcare equity",
  "healthcare for",
  "healthcare services",
  "healthcare providers",
  "healthcare professionals",
  "healthcare workers",
  "of healthcare",
  "healthcare system",
  "healthcare industry",
  "mecical needs",
  "medical treatment",
  "medical services",
  "medicine",
  "medical care",
  "public health",
  "medical services",
  "clinics",
  "hospitals",
  "ethical",
  "fair trade",
  "fair wage",
  "responsible sourcing",
  "social responsibility",
  "CSR",
  "addict",
  "recovery",
  "rehabilitation",
  "substance abuse",
  "mental health",
  "trauma",
  "PTSD",
  "counseling",
  "indigenous",
  "native rights",
  "aboriginal",
  "tribal",
  "First Nations",
  "trafficking",
  "human trafficking",
  "exploitation",
  "slavery",
  "forced labor",
  "justice",
  "legal aid",
  "restorative justice",
  "criminal justice reform",
  "low-income housing",
  "subsidized housing",
  "malnutrition",
  "food justice",
  "legal services",
  "from the law",
  "with the law",
  ", law",
  "access to law",
  "educated in law",
  "disease prevention",
  "vaccination",
  "health education",
  "social justice",
  "community empowerment",
  "grassroots org",
  "grassroots movement",
  "social equity",
  "civil rights",
  "disaster relief",
  "emergency response",
  "crisis management",
  "humanitarian aid",
  "ethical trade",
  "fair labor",
  "gender equality",
  "women's rights",
  "gender equity",
  "empowerment",
  "gender-based violence",
  "refugee",
  "asylum",
  "immigrant",
  "immigration",
  "migrant",
  "refugee support",
  "immigrant rights",
  "preservation",
  "urban planning",
  "city planning",
  "sustainable cities",
  "green building",
  "public transportation",
  "ethical tech",
  "responsible AI",
  "data privacy",
  "cybersecurity",
  "vocational",
  "dairy",
  "meat",
  "vegan",
  "vegetarian",
  "vegetable",
  "special needs",
  "affordable education",
  "education for all",
  "literacy",
  "wildlife",
  "species protection",
  "ecology",
  "public policy",
  "government",
  "policy reform",
  "international development",
  "poverty alleviation",
  "economic development",
  "social impact",
  "clean water",
  "safe drinking water",
  "for good",
  "help people",
  "help anyone",
  "help children",
  "help families",
  "help animals",
  "help communities",
  "help the environment",
  "help the planet",
  "help the world",
  "help society",
];