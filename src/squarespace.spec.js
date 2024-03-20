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

const COURIER_TEMPLATE_ID = '6XA45NXXD1MHJRGMKC6J3J5XNE63'
const EMAIL_TO = 'rebeccarich1@gmail.com'

test('Squarespace scraper', async ({ page }) => {
  const COMPANY_NAME = 'Squarespace'
  const GIST_ID = '939866703c9699afe2c7806158345912'
  const GIST_NAME = 'squarespace.json'
  const URL_TO_SCRAPE = 'https://www.squarespace.com/careers/engineering?location=dublin'
  const SELECTOR = '#careers-engineering .careers-list--jobs .careers-list__items a'

  await page.goto(URL_TO_SCRAPE)

  const jobs = await page.$$eval(SELECTOR, (jobs) => {
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
  })

  let gist

  try {
    console.log('Reading previous jobs data...')
    gist = await readGist(GIST_ID)
  } catch (e) {
    console.error(e)
    process.exit()
  }

  if (JSON.stringify(jobs) !== gist.data.files[GIST_NAME].content) {
    try {
      const { requestId } = await sendNotification(
        EMAIL_TO,
        COURIER_TEMPLATE_ID,
        COMPANY_NAME,
        jobs
      )
      console.log(`New ${COMPANY_NAME} jobs found 🚀 Courier notification requested:`, requestId)
    } catch (e) {
      console.error('Error sending notification', e)
      process.exit()
    }

    try {
      console.log('⚙️ Updating result set for next run...')
      await updateGist(GIST_ID, GIST_NAME, jobs)
      console.log('Updated!')
    } catch (e) {
      console.error(e)
      process.exit()
    }
  } else {
    console.log(`No new ${COMPANY_NAME} jobs found 😞`)
  }

  await expect(page).toHaveTitle(/Engineering Careers – Squarespace/)
})

async function readGist(id) {
  return await octokit.request(`GET /gists/${id}`, {
    gist_id: id,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

async function updateGist(id, fileName, newData) {
  return await octokit.request(`PATCH /gists/${id}`, {
    gist_id: id,
    files: {
      [fileName]: {
        content: JSON.stringify(newData)
      }
    },
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

async function sendNotification(emailAddress, templateId, companyName, jobs) {
  return await courier.send({
    message: {
      to: {
        email: emailAddress
      },
      template: templateId,
      data: { jobs, company: companyName }
    }
  })
}
