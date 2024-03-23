require('dotenv').config()
const { test, expect } = require('@playwright/test')
import { CourierClient } from '@trycourier/courier'
import { Octokit } from '@octokit/core'
import diff from 'diff-arrays-of-objects'

const courier = new CourierClient({
  authorizationToken: process.env.COURIER_AUTH_TOKEN
})

const octokit = new Octokit({
  auth: process.env.GH_AUTH_TOKEN
})

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
  const SELECTOR = '#careers-engineering .careers-list--jobs .careers-list__items a'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const title = j.querySelector('.careers-list__item__title')?.innerHTML
      const location = j.querySelector('.careers-list__item__locations')?.innerHTML
      const href = j.href
      if (location === 'Dublin, IE') {
        data.push({ title, href })
      }
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME].content

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

  const oldJobs = gist.data.files[GIST_FILE_NAME].content

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
  const URL_TO_SCRAPE = 'https://openai.com/careers/search'
  const SELECTOR = 'ul[aria-label="All teams roles"] a.ui-link.relative.group.inline-block'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const title = j.querySelector('h3')?.innerHTML
      const location = j.querySelector('span')?.innerText
      const href = j.href
      if (location?.includes('Dublin, Ireland')) {
        data.push({ title, href })
      }
    })
    return data
  })

  const oldJobs = gist.data.files[GIST_FILE_NAME].content

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

  await expect(page).toHaveTitle(/Careers at OpenAI/)
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

  const oldJobs = gist.data.files[GIST_FILE_NAME].content

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

  const oldJobs = gist.data.files[GIST_FILE_NAME].content

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

function diffJobs(oldJobs, newJobs) {
  return diff(oldJobs, newJobs, 'title')
}

async function readGist(id) {
  return await octokit.request(`GET /gists/${id}`, {
    gist_id: id,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

async function updateGist(id, companiesToUpdate) {
  const files = companiesToUpdate.reduce((acc, current) => {
    acc[current.fileName] = {
      content: JSON.stringify(current.updatedJobs)
    }
    return acc
  }, {})
  return await octokit.request(`PATCH /gists/${id}`, {
    gist_id: id,
    files,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

async function sendNotification(emailAddress, templateId, companyName, jobs) {
  return await courier.send({
    message: {
      to: {
        email: emailAddress
      },
      template: templateId,
      data: {
        ...(!!jobs.added?.length && { added: jobs.added }),
        ...(!!jobs.removed?.length && { removed: jobs.removed }),
        ...(!!jobs.updated?.length && { updated: jobs.updated }),
        ...(!!jobs.same?.length && { same: jobs.same }),
        company: companyName
      }
    }
  })
}

async function sendNotificationRollup(emailAddress, templateId, jobsByCompany) {
  return await courier.send({
    message: {
      to: {
        email: emailAddress
      },
      template: templateId,
      data: {
        jobsByCompany
      }
    }
  })
}
