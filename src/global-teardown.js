require('dotenv').config()
const fs = require('fs')
const path = require('path')
const {
  diffJobs,
  updateGist,
  sendNotification,
  sendNotificationRollup
} = require('./utils')

const RESULTS_DIR = path.join(__dirname, '..', 'tmp')
const PREVIOUS_JOBS_PATH = path.join(RESULTS_DIR, 'previous-jobs.json')

module.exports = async function globalTeardown() {
  const resultsFiles = fs.readdirSync(RESULTS_DIR).filter(f => f.startsWith('results-'))

  if (resultsFiles.length === 0) {
    console.log('Global teardown: no scraper results found')
    return
  }

  const previousJobs = JSON.parse(fs.readFileSync(PREVIOUS_JOBS_PATH, 'utf-8'))
  const companiesToUpdate = []
  const warnings = []

  for (const file of resultsFiles) {
    const result = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, file), 'utf-8'))

    if (result.warning) {
      warnings.push(`${result.name} returned 0 jobs (previously had jobs) — skipping gist update`)
      console.log(`⚠️ ${result.name}: returned 0 jobs, skipping update`)
      continue
    }

    const oldJobs = previousJobs[result.fileName] || JSON.stringify([])

    if (JSON.stringify(result.jobs) !== oldJobs) {
      companiesToUpdate.push({
        name: result.name,
        detailedDiff: diffJobs(JSON.parse(oldJobs), result.jobs),
        fileName: result.fileName,
        updatedJobs: result.jobs
      })
    } else {
      console.log(`No new ${result.name} jobs found`)
    }
  }

  // Send notifications
  if (companiesToUpdate.length > 0) {
    if (process.env.ROLLUP === 'true') {
      try {
        const { requestId } = await sendNotificationRollup(
          process.env.EMAIL_TO,
          process.env.COURIER_ROLLUP_TEMPLATE_ID,
          companiesToUpdate
        )
        console.log(
          `New ${companiesToUpdate.map(({ name }) => name).join(', ')} jobs found — notification sent:`,
          requestId
        )
      } catch (e) {
        console.error('Error sending rollup notification', e)
      }
    } else {
      for (const company of companiesToUpdate) {
        try {
          const { requestId } = await sendNotification(
            process.env.EMAIL_TO,
            process.env.COURIER_TEMPLATE_ID,
            company.name,
            company.detailedDiff
          )
          console.log(`New ${company.name} jobs found — notification sent:`, requestId)
        } catch (e) {
          console.error(`Error sending ${company.name} notification`, e)
        }
      }
    }

    // Update gist
    try {
      console.log('Updating gist...')
      await updateGist(process.env.GIST_ID, companiesToUpdate)
      console.log('Gist updated!')
    } catch (e) {
      console.error('Error updating gist', e)
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:\n' + warnings.join('\n'))
  }
}
