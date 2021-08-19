#!/usr/bin/env zx
const date = new Date().toISOString().split('.').shift()
// for staging
try {
    await $`newman run ./collections/staging/preprod.postman_collection.json  -d ./csv/env_id_list.csv -r json-summary,html --reporter-summary-json-export ./reports/staging/report_staging_${date}.json --reporter-html-export ./reports/staging/html/html_report_${date}.html`
} catch (p) {
    console.log(`Exit code: ${p.exitCode}`)
    console.log(`${p.stderr}`)
}

// for production
try {
    await $`newman run ./collections/prod/prod.postman_collection.json  -d ./csv/env_id_list.csv -r json-summary,html --reporter-summary-json-export ./reports/prod/report_prod_${date}.json --reporter-html-export ./reports/prod/html/html_report_${date}.html`
} catch (p) {
    console.log(`Exit code: ${p.exitCode}`)
    console.log(`${p.stderr}`)
}
