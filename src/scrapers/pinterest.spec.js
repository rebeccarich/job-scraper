require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

test('Pinterest scraper', async ({ page }) => {
  const COMPANY_NAME = 'Pinterest'
  const GIST_FILE_NAME = 'pinterest.json'
  const URL_TO_SCRAPE = 'https://job-boards.greenhouse.io/embed/job_board?for=pinterest'
  const SELECTOR = 'table a[href*="pinterestcareers.com"]'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      const paragraphs = j.querySelectorAll('p')
      const title = paragraphs[0]?.innerText
      const location = paragraphs[1]?.innerText || ''
      const href = j.href
      if (title && location.includes('Dublin')) {
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
