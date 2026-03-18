require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

test('Algolia scraper', async ({ page }) => {
  const COMPANY_NAME = 'Algolia'
  const GIST_FILE_NAME = 'algolia.json'
  const URL_TO_SCRAPE = 'https://www.algolia.com/careers/?PROD_algolia.com-career-page%5Bquery%5D=dublin'
  const SELECTOR = '.ais-Highlight-nonHighlighted'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const title = j.innerText
      data.push({
        title,
        href: 'https://www.algolia.com/careers/?PROD_algolia.com-career-page%5Bquery%5D=dublin'
      })
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
