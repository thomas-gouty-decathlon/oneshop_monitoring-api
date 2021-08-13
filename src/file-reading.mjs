import fs from 'fs-extra'
import path from 'path'
import stringify from 'csv-stringify'
import parse from 'csv-parse/lib/sync.js'
import { dirname } from 'path'

import { ENVS } from '../index.mjs'

let csvMappingData = null

const REQ_BY_COUNTRY = 4
const COUNTRY_NUMBER = 30

class Report {
    constructor(file) {
        this.collectionName = file.Collection.Info.Name
        this.launchTime = new Date(file.Run.Timings.started).toLocaleString(
            'fr-FR',
            { timeZone: 'America/New_York' }
        )
        this.totalReq = file.Run.Stats.Assertions.total
        this.failReqNumber = file.Run.Stats.Assertions.failed
        const fileFailures = file.Run.Failures
        this.failures =
            fileFailures.length > 0
                ? new FailResults(fileFailures).arrFail
                : null
    }
}
class FailResults {
    constructor(failures) {
        this.arrFail = []

        failures.forEach((fail) => {
            const envIdValue = this._getEnvIdFrom(fail.Error.Test)
            this.arrFail.push({
                issueType: fail.Source.Name,
                errorCode: this._getCodeErrorFrom(fail.Error.Message),
                envId: this._getEnvIdFrom(fail.Error.Test),
                country: this._mapCountryFrom(envIdValue),
            })
        })
    }
    // private, structure: "EnvId: my_en - Status code is 200"
    _getEnvIdFrom(string) {
        return string.split(' ')[1]
    }
    // private, structure: "expected response to have status code 200 but got 404"
    _getCodeErrorFrom(string) {
        return string.split(' ').pop()
    }
    //private
    _mapCountryFrom(envId) {
        return csvMappingData.get(envId)
    }
}
const getMostRecentFile = (dir) => {
    const files = orderReccentFiles(dir)
    return files.length ? files[0] : undefined
}
const orderReccentFiles = (dir) => {
    return fs
        .readdirSync(dir)
        .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
        .map((file) => ({
            file,
            mtime: fs.lstatSync(path.join(dir, file)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
}

async function readJsonResults(jsonPath) {
    try {
        const file = await fs.readJson(jsonPath)
        console.log(file)

        if (!csvMappingData) {
            csvMappingData = getMappedDataFromMappingFileCsv()
        }

        const data = new Report(file)
        console.dir(data)
    } catch (err) {
        console.error(
            'Something go wrong when reading the output.json file --> ',
            err
        )
    }
}

const getMappedDataFromMappingFileCsv = () => {
    // call newman.run to pass `options` object and wait for callback
    const map = new Map()
    let data = fs.readFileSync('./csv/country_mapping.csv', {
        encoding: 'utf8',
        flag: 'r',
    })
    data = parse(data, {
        columns: true,
        from_line: 1,
        skip_empty_lines: true,
    })
    console.log(data)

    data.forEach((mapLine) => {
        map.set(`${mapLine.envId}`, mapLine.name)
    })
    return map
}

function getDataFromLastReportby(env) {
    const dir = env === ENVS.STAGING ? './reports/staging/' : './reports/prod/'
    console.log(dir)

    console.count(dir.concat(getMostRecentFile(dir).file))
    readJsonResults(dir.concat(getMostRecentFile(dir).file))
}

export { getDataFromLastReportby }
