require('dotenv').config()
const { test, expect } = require('@playwright/test')
import { CourierClient } from '@trycourier/courier'
import { Octokit } from '@octokit/core'

const courier = new CourierClient({
  authorizationToken: process.env.COURIER_AUTH_TOKEN
})

const octokit = new Octokit({
  auth: process.env.GH_AUTH_TOKEN
})

test('Squarespace scraper', async ({ page }) => {
  const GIST_ID = '939866703c9699afe2c7806158345912'
  const GIST_NAME = 'squarespace.json'

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

  let gist

  try {
    gist = await octokit.request(`GET /gists/${GIST_ID}`, {
      gist_id: GIST_ID,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  } catch (e) {
    throw new Error(e)
  }

  const results = gist.data.files[GIST_NAME].content
  console.log('Comparing against previous results', results)

  if (JSON.stringify(jobs) !== JSON.stringify(results)) {
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
    try {
      await octokit.request(`PATCH /gists/${GIST_ID}`, {
        gist_id: GIST_ID,
        files: {
          [GIST_NAME]: {
            content: JSON.stringify(jobs)
          }
        },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
      console.log('Updated!')
    } catch (e) {
      throw new Error(e)
    }
  } else {
    console.log('No new Squarespace jobs found 😞')
  }

  await expect(page).toHaveTitle(/Engineering Careers – Squarespace/)
})
