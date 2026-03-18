require('dotenv').config()
const { test, expect } = require('@playwright/test')
const {
  diffJobs,
  readGist,
  updateGist,
  sendNotificationRollup,
  sendNotification
} = require('./utils')

let gist
const companiesToUpdate = []

test.beforeAll('Load Previous Jobs Data', async () => {
  try {
    console.log('Reading previous jobs data')
    gist = await readGist(process.env.GIST_ID)
  } catch (e) {
    console.error(e)
    process.exit()
  }
})

test.afterAll('Send Notifications & Update Jobs Data', async () => {
  if (!companiesToUpdate.length) {
    return
  }

  if (process.env.ROLLUP === 'true') {
    try {
      const { requestId } = await sendNotificationRollup(
        process.env.EMAIL_TO,
        process.env.COURIER_ROLLUP_TEMPLATE_ID,
        companiesToUpdate
      )
      console.log(
        `New ${companiesToUpdate
          .map(({ name }) => name)
          .join(', ')} jobs found 🚀 Courier notification requested:`,
        requestId
      )
    } catch (e) {
      console.error('Error sending notification', e)
      process.exit()
    }
  } else {
    for (const company of companiesToUpdate) {
      try {
        const { requestId } = await sendNotification(
          process.env.EMAIL_TO,
          process.env.COURIER_TEMPLATE_ID,
          company.name,
          company.detailedDiff
        )
        console.log(`New ${company.name} jobs found 🚀 Courier notification requested:`, requestId)
      } catch (e) {
        console.error('Error sending notification', e)
        process.exit()
      }
    }
  }

  try {
    console.log('⚙️ Updating result set for next run...')
    await updateGist(process.env.GIST_ID, companiesToUpdate)
    console.log('Updated!')
  } catch (e) {
    console.error(e)
    process.exit()
  }
})

test('Squarespace scraper', async ({ page }) => {
  const COMPANY_NAME = 'Squarespace'
  const GIST_FILE_NAME = 'squarespace.json'
  const URL_TO_SCRAPE = 'https://www.squarespace.com/careers/engineering?location=dublin'
  const SELECTOR = '#careers-engineering .careers-list--jobs .careers-list__items a >> visible=true'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const title = j.querySelector('.careers-list__item__title')?.innerHTML
      const href = j.href
      const location = j.querySelector('.careers-list__item__locations')?.innerHTML
      if (location.toLowerCase() === 'dublin') {
        data.push({ title, href })
      }
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Engineering Careers – Squarespace/)
})

test('Stripe scraper', async ({ page }) => {
  const COMPANY_NAME = 'Stripe'
  const GIST_FILE_NAME = 'stripe.json'
  const URL_TO_SCRAPE =
    'https://stripe.com/jobs/search?query=frontend&office_locations=Europe--Dublin'
  const SELECTOR = 'a.JobsListings__link'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const title = j.innerHTML
      const href = j.href
      data.push({ title, href })
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Stripe Jobs/)
})

test('OpenAI scraper', async ({ page }) => {
  const COMPANY_NAME = 'OpenAI'
  const GIST_FILE_NAME = 'openai.json'
  const URL_TO_SCRAPE = 'https://openai.com/careers/search?l=dublin-ireland'
  const SELECTOR = 'a.break-words.shrink-1.max-w-full'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const title = j.innerText
      const href = j.href
      data.push({ title, href })
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/OpenAI/)
})

test('Pinterest scraper', async ({ page }) => {
  const COMPANY_NAME = 'Pinterest'
  const GIST_FILE_NAME = 'pinterest.json'
  const URL_TO_SCRAPE =
    'https://www.pinterestcareers.com/en/jobs/?search=&team=Engineering&location=Dublin&pagesize=200'
  const SELECTOR = '#results .js-view-job'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const title = j.innerText
      const href = j.href
      data.push({ title, href })
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Discover opportunities at Pinterest | Pinterest Careers/)
})

test('Reddit scraper', async ({ page }) => {
  const COMPANY_NAME = 'Reddit'
  const GIST_FILE_NAME = 'reddit.json'
  const URL_TO_SCRAPE = 'https://boards.greenhouse.io/reddit'
  const SELECTOR = '.opening'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const location = j.querySelector('span').innerText
      const href = j.querySelector('a').href
      const title = j.querySelector('a').innerText
      if (location === 'Dublin, Ireland') {
        data.push({ title, href })
      }
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Jobs at Reddit/)
})

test('Strava scraper', async ({ page }) => {
  const COMPANY_NAME = 'Strava'
  const GIST_FILE_NAME = 'strava.json'
  const URL_TO_SCRAPE = 'https://boards.greenhouse.io/strava'
  const SELECTOR = '.opening'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const location = j.querySelector('span').innerText
      const href = j.querySelector('a').href
      const title = j.querySelector('a').innerText
      if (location === 'Dublin') {
        data.push({ title, href })
      }
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Jobs at Strava/)
})

test('Anthropic scraper', async ({ page }) => {
  const COMPANY_NAME = 'Anthropic'
  const GIST_FILE_NAME = 'anthropic.json'
  const URL_TO_SCRAPE = 'https://www.anthropic.com/careers/jobs?office=4006509008'
  const SELECTOR = 'a[href*="job-boards.greenhouse.io/anthropic/jobs"]'

  await page.goto(URL_TO_SCRAPE)

  const searchBox = page.getByPlaceholder('Search roles')
  await searchBox.pressSequentially('software engineer')
  await page.waitForTimeout(1000)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      if (!j.checkVisibility()) return
      const title = j.querySelector('p')?.innerText
      const href = j.href
      if (title) {
        data.push({ title, href })
      }
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Anthropic/)
})

test('Notion scraper', async ({ page }) => {
  const COMPANY_NAME = 'Notion'
  const GIST_FILE_NAME = 'notion.json'
  const URL_TO_SCRAPE = 'https://www.notion.so/careers'
  const SELECTOR = '.GreenhouseJobList_jobsList__l8jJG li'

  await page.goto(URL_TO_SCRAPE)

  const el = page.locator('#open-positions select')
  const allEls = await el.all()

  await allEls[0]?.selectOption({ label: 'Dublin, Ireland' })
  await allEls[1]?.selectOption({ label: 'Engineering' })

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const href = j.querySelector('a').href
      const title = j.querySelector('a p.GreenhouseJobList_jobTitle__dRBzj').innerText
      data.push({ title, href })
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Careers at Notion | We're Hiring!/)
})

test('Etsy scraper', async ({ page }) => {
  const COMPANY_NAME = 'Etsy'
  const GIST_FILE_NAME = 'etsy.json'
  const URL_TO_SCRAPE = 'https://careers.etsy.com/jobs/search?query=dublin'
  const SELECTOR = '.job-search-results-card-body'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const href = j.querySelector('h3 a').href
      const title = j.querySelector('h3 a').innerText
      data.push({ title, href })
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Search Page/)
})

test('Datadog scraper', async ({ page }) => {
  const COMPANY_NAME = 'Datadog'
  const GIST_FILE_NAME = 'datadog.json'
  const URL_TO_SCRAPE =
    'https://careers.datadoghq.com/dublin/?parent_department_Engineering%5B0%5D=Engineering'
  const SELECTOR = '#hits li button a'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const href = j.href
      const title = j.querySelector('.job-card-title h3').innerText
      data.push({ title, href })
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Dublin | Datadog Careers/)
})

test('Algolia scraper', async ({ page }) => {
  const COMPANY_NAME = 'Algolia'
  const GIST_FILE_NAME = 'algolia.json'
  const URL_TO_SCRAPE =
    'https://www.algolia.com/careers/?PROD_algolia.com-career-page%5Bquery%5D=dublin'
  const SELECTOR = '.ais-Highlight-nonHighlighted'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const title = j.innerText
      // No href - each job button triggers a modal. Hardcoding to the main Dublin jobs page
      data.push({
        title,
        href: 'https://www.algolia.com/careers/?PROD_algolia.com-career-page%5Bquery%5D=dublin'
      })
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME]?.content || JSON.stringify([])

  if (JSON.stringify(jobs) !== oldJobs) {
    companiesToUpdate.push({
      name: COMPANY_NAME,
      detailedDiff: diffJobs(JSON.parse(oldJobs), jobs),
      fileName: GIST_FILE_NAME,
      updatedJobs: jobs
    })
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Careers & jobs at Algolia | Hiring worldwide | Algolia/)
})
