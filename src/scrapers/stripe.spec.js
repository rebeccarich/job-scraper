require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

test('Stripe scraper', async ({ page }) => {
  const COMPANY_NAME = 'Stripe'
  const GIST_FILE_NAME = 'stripe.json'
  const URL_TO_SCRAPE = 'https://stripe.com/jobs/search?query=frontend&office_locations=Europe--Dublin'
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

  const oldJobs = getPreviousJobs(GIST_FILE_NAME)
  const previousCount = JSON.parse(oldJobs).length

  if (jobs.length === 0 && previousCount > 0) {
    console.log(`⚠️ ${COMPANY_NAME}: returned 0 jobs, previously had ${previousCount}`)
    writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs: [], warning: true })
    return
  }

  writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs, warning: false })
})
