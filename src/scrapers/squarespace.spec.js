require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

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

  const oldJobs = getPreviousJobs(GIST_FILE_NAME)
  const previousCount = JSON.parse(oldJobs).length

  if (jobs.length === 0 && previousCount > 0) {
    console.log(`⚠️ ${COMPANY_NAME}: returned 0 jobs, previously had ${previousCount}`)
    writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs: [], warning: true })
    return
  }

  writeResult({ name: COMPANY_NAME, fileName: GIST_FILE_NAME, jobs, warning: false })
})
