require('dotenv').config()
const { test } = require('@playwright/test')
const { getPreviousJobs, writeResult } = require('../scraper-helper')

test('OpenAI scraper', async ({ page }) => {
  const COMPANY_NAME = 'OpenAI'
  const GIST_FILE_NAME = 'openai.json'
  const URL_TO_SCRAPE = 'https://jobs.ashbyhq.com/openai'
  const SELECTOR = 'a[href*="/openai/"]'

  await page.goto(URL_TO_SCRAPE)

  const locationSelect = page.getByLabel('Location')
  const dublinOption = locationSelect.locator('option', { hasText: 'Dublin' })
  const dublinValue = await dublinOption.getAttribute('value')
  await locationSelect.selectOption(dublinValue)
  await page.waitForTimeout(1000)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
    const data = []
    jobs.forEach((j) => {
      if (!j.checkVisibility()) return
      const title = j.querySelector('h3')?.innerText
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
