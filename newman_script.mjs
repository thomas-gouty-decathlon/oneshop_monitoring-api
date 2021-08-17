#!/usr/bin/env zx

// for staging
try {
    await $`newman run ./collections/staging/preprod.postman_collection.json  -d ./csv/env_id_list.csv -r cli,json-summary --reporter-summary-json-export ./reports/staging/report_staging_${new Date().toISOString()}.json -n 2`
} catch (p) {
    console.log(`Exit code: ${p.exitCode}`)
    console.log(`${p.stderr}`)
}

// for production
try {
    await $`newman run ./collections/prod/prod.postman_collection.json  -d ./csv/env_id_list.csv -r cli,json-summary --reporter-summary-json-export ./reports/prod/report_prod_${new Date().toISOString()}.json -n 2`
} catch (p) {
    console.log(`Exit code: ${p.exitCode}`)
    console.log(`${p.stderr}`)
}
