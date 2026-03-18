const fs = require('fs')
const path = require('path')

const RESULTS_DIR = path.join(__dirname, '..', 'tmp')
const PREVIOUS_JOBS_PATH = path.join(RESULTS_DIR, 'previous-jobs.json')

function getPreviousJobs(gistFileName) {
  const data = JSON.parse(fs.readFileSync(PREVIOUS_JOBS_PATH, 'utf-8'))
  return data[gistFileName] || JSON.stringify([])
}

function writeResult({ name, fileName, jobs, warning }) {
  const resultPath = path.join(RESULTS_DIR, `results-${name.toLowerCase()}.json`)
  fs.writeFileSync(resultPath, JSON.stringify({ name, fileName, jobs, warning }))
}

module.exports = { getPreviousJobs, writeResult }
