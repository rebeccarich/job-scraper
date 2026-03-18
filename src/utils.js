const diff = require('diff-arrays-of-objects')
const { CourierClient } = require('@trycourier/courier')
const { Octokit } = require('@octokit/core')

const courier = new CourierClient({
  authorizationToken: process.env.COURIER_AUTH_TOKEN
})

const octokit = new Octokit({
  auth: process.env.GH_AUTH_TOKEN
})

function diffJobs(oldJobs, newJobs) {
  return diff(oldJobs, newJobs, 'title')
}

async function readGist(id) {
  return await octokit.request(`GET /gists/${id}`, {
    gist_id: id,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

async function updateGist(id, companiesToUpdate) {
  const files = companiesToUpdate.reduce((acc, current) => {
    acc[current.fileName] = {
      content: JSON.stringify(current.updatedJobs)
    }
    return acc
  }, {})
  return await octokit.request(`PATCH /gists/${id}`, {
    gist_id: id,
    files,
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
      data: {
        added: jobs.added,
        removed: jobs.removed,
        updated: jobs.updated,
        same: jobs.same,
        company: companyName
      }
    }
  })
}

async function sendNotificationRollup(emailAddress, templateId, jobsByCompany) {
  return await courier.send({
    message: {
      to: {
        email: emailAddress
      },
      template: templateId,
      data: {
        jobsByCompany
      }
    }
  })
}

module.exports = { diffJobs, readGist, updateGist, sendNotification, sendNotificationRollup }
