require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

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

  const oldJobs = getPreviousJobs(GIST_FILE_NAME)
  const previousCount = JSON.parse(oldJobs).length

  if (jobs.length === 0 && previousCount > 0) {
    console.log(`⚠️ ${COMPANY_NAME}: returned 0 jobs, previously had ${previousCount}`)
    writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs: [], warning: true })
    return
  }

  writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs, warning: false })
})
