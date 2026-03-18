require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

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

  const oldJobs = getPreviousJobs(GIST_FILE_NAME)
  const previousCount = JSON.parse(oldJobs).length

  if (jobs.length === 0 && previousCount > 0) {
    console.log(`⚠️ ${COMPANY_NAME}: returned 0 jobs, previously had ${previousCount}`)
    writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs: [], warning: true })
    return
  }

  writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs, warning: false })
})
