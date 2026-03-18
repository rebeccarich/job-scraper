require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

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

  const oldJobs = getPreviousJobs(GIST_FILE_NAME)
  const previousCount = JSON.parse(oldJobs).length

  if (jobs.length === 0 && previousCount > 0) {
    console.log(`⚠️ ${COMPANY_NAME}: returned 0 jobs, previously had ${previousCount}`)
    writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs: [], warning: true })
    return
  }

  writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs, warning: false })
})
