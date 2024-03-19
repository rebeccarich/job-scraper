const { test, expect } = require('@playwright/test')
import { CourierClient } from '@trycourier/courier'
import fs from 'fs'
import path from 'path'

import squarespaceResults from './data/squarespace.json'

const courier = new CourierClient({
  authorizationToken: process.env.COURIER_AUTH_TOKEN
})

test('Squarespace scraper', async ({ page }) => {
  await page.goto('https://www.squarespace.com/careers/engineering?location=dublin')
  const jobs = await page.$$eval(
    '#careers-engineering .careers-list--jobs .careers-list__items a',
    (jobs) => {
      const data = []
      jobs.forEach((j) => {
        const title = j.querySelector('.careers-list__item__title')?.innerHTML
        const location = j.querySelector('.careers-list__item__locations')?.innerHTML
        const href = j.href
        if (location === 'Dublin, IE') {
          data.push({ title, location, href })
        }
      })
      return data
    }
  )

  if (JSON.stringify(jobs) !== JSON.stringify(squarespaceResults)) {
    const { requestId } = await courier.send({
      message: {
        to: {
          email: 'rebeccarich1@gmail.com'
        },
        template: '6XA45NXXD1MHJRGMKC6J3J5XNE63',
        data: { jobs, company: 'Squarespace' }
      }
    })
    console.log('New Squarespace jobs found 🚀 Courier notification requested:', requestId)
    console.log('⚙️ Updating result set for next run...')
    const resultsPath = path.join(__dirname, 'data', 'squarespace.json')
    fs.writeFileSync(resultsPath, JSON.stringify(jobs))
  } else {
    console.log('No new Squarespace jobs found 😞')
  }

  await expect(page).toHaveTitle(/Engineering Careers – Squarespace/)
})
