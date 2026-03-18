require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

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

  const oldJobs = getPreviousJobs(GIST_FILE_NAME)
  const previousCount = JSON.parse(oldJobs).length

  if (jobs.length === 0 && previousCount > 0) {
    console.log(`⚠️ ${COMPANY_NAME}: returned 0 jobs, previously had ${previousCount}`)
    writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs: [], warning: true })
    return
  }

  writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs, warning: false })
})
