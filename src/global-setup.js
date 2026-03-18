require('dotenv').config()
const { readGist } = require('./utils')
const fs = require('fs')
const path = require('path')

const RESULTS_DIR = path.join(__dirname, '..', 'tmp')
const PREVIOUS_JOBS_PATH = path.join(RESULTS_DIR, 'previous-jobs.json')

module.exports = async function globalSetup() {
  // Clean results dir
  if (fs.existsSync(RESULTS_DIR)) {
    fs.rmSync(RESULTS_DIR, { recursive: true })
  }
  fs.mkdirSync(RESULTS_DIR, { recursive: true })

  // Read gist and write previous jobs to disk
  try {
    const gist = await readGist(process.env.GIST_ID)
    const previousJobs = {}
    for (const [fileName, file] of Object.entries(gist.data.files)) {
      previousJobs[fileName] = file.content
    }
    fs.writeFileSync(PREVIOUS_JOBS_PATH, JSON.stringify(previousJobs))
    console.log('Global setup: loaded previous jobs data')
  } catch (e) {
    console.error('Global setup: failed to read gist', e)
    fs.writeFileSync(PREVIOUS_JOBS_PATH, JSON.stringify({}))
  }
}
