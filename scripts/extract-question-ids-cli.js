#!/usr/bin/env node
// To run this script, execute at the root of the project:
// node client/utils/extract-question-ids-cli.js  demenagement-logement-ids.json
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// Get current file's directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the JSON file
const filePath = path.join(__dirname, '../client/public/forms/demenagement-logement.json')
const outputPath = process.argv[2] || 'question-ids.json'

// Read and parse the JSON file
try {
  const data = fs.readFileSync(filePath, 'utf8')
  const jsonData = JSON.parse(data)

  // Array to store all question IDs
  const questionIds = []

  // Extract question IDs from steps
  if (jsonData.steps && Array.isArray(jsonData.steps)) {
    jsonData.steps.forEach((step) => {
      if (step.questions && Array.isArray(step.questions)) {
        step.questions.forEach((question) => {
          if (question.id) {
            questionIds.push(question.id)
          }
        })
      }
    })
  }

  // Output the results
  console.warn('Question IDs:')
  console.warn(questionIds)
  console.warn(`Total questions found: ${questionIds.length}`)

  // Save to a file if an output path is provided
  fs.writeFileSync(outputPath, JSON.stringify(questionIds, null, 2))
  console.warn(`Results saved to ${outputPath}`)
}
catch (error) {
  console.error('Error reading or parsing the JSON file:', error)
  process.exit(1)
}
