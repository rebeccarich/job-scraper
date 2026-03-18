require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

test('Datadog scraper', async ({ page }) => {
  const COMPANY_NAME = 'Datadog'
  const GIST_FILE_NAME = 'datadog.json'
  const URL_TO_SCRAPE = 'https://careers.datadoghq.com/dublin/?parent_department_Engineering%5B0%5D=Engineering'
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

  const oldJobs = getPreviousJobs(GIST_FILE_NAME)
  const previousCount = JSON.parse(oldJobs).length

  if (jobs.length === 0 && previousCount > 0) {
    console.log(`⚠️ ${COMPANY_NAME}: returned 0 jobs, previously had ${previousCount}`)
    writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs: [], warning: true })
    return
  }

  writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs, warning: false })
})
