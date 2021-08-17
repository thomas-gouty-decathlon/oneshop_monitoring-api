import fs from 'fs-extra'
import path from 'path'
import parse from 'csv-parse/lib/sync.js'

import { ENVS } from '../index.mjs'

let csvMappingData = null

const REQ = Object.freeze({
    ProductPage:
        'https://api.decathlon.net/decashop/dk/v1/getPageProduct?environmentId=ENVID_here&productId=8494856',
    ProductList:
        'https://api.decathlon.net/decashop/dk/v1/productList/ENVID_here/12845/DEFAULT',
    Search: 'https://api.decathlon.net/decashop/dk/v1/productSearch?environmentId=ENVID_here&query=8529458&filter=codeModel',
    CategoryList:
        'https://api.decathlon.net/decashop/dk/v1/categoryList?environmentId=ENVID_here',
    Availability1FF:
        'https://api.decathlon.net/decashop/dk/v1/productSearch?environmentId=ENVID_here&query=8529458&filter=codeModel',
})
class Report {
    constructor(file) {
        this.collectionName = file.Collection.Info.Name
        this.launchTime = new Date(file.Run.Timings.started).toLocaleString(
            'fr-FR',
            { timeZone: 'America/New_York' }
        )
        this.executionTime = this._computeTimeDuration(
            file.Run.Timings.started,
            file.Run.Timings.completed
        )
        this.totalReq = file.Run.Stats.Assertions.total
        this.failReqNumber = file.Run.Stats.Assertions.failed
        const fileFailures = file.Run.Failures
        this.failures =
            fileFailures.length > 0
                ? this._generateFailuresMapping(fileFailures)
                : null
    }
    _generateFailuresMapping(failures) {
        const res = new FailResults(failures)
        return { errors: res.arrFail, mapping: res._envIdMap }
    }
    _computeTimeDuration(start, end) {
        const d1 = new Date(start).getTime()
        const d2 = new Date(end).getTime()
        const seconds = (d2 - d1) / 1000
        return seconds
    }
}
class FailResults {
    constructor(failures) {
        this.arrFail = []
        this._envIdMap = new Map()

        failures.forEach((fail) => {
            const envIdValue = this._getEnvIdFrom(fail.Error.Test)
            this.arrFail.push({
                issueType: fail.Source.Name,
                errorCode: this._getCodeErrorFrom(fail.Error.Message),
                envId: this._getEnvIdFrom(fail.Error.Test),
                country: this._mapCountryFrom(envIdValue),
                request: this._mapReqFrom(fail.Source.Name),
            })
        })
        this._initCountErrorByEnvId()
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
    _mapReqFrom(issueType) {
        return REQ[`${issueType}`]
    }
    _initCountErrorByEnvId() {
        this.arrFail.forEach((error) => {
            if (this._envIdMap.has(error.envId)) {
                let currValue = this._envIdMap.get(error.envId)
                this._envIdMap.set(error.envId, ++currValue)
            } else this._envIdMap.set(error.envId, 1)
        })
    }
    getAggregationByEnvIds() {
        return this._envIdMap
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

async function getFormatedResults(jsonPath) {
    try {
        const file = await fs.readJson(jsonPath)
        if (!csvMappingData) {
            csvMappingData = getMappedDataFromMappingFileCsv()
        }
        return new Report(file)
    } catch (err) {
        console.error(
            'Something go wrong when reading the output.json file --> ',
            err
        )
    }
}

const getMappedDataFromMappingFileCsv = () => {
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
    data.forEach((mapLine) => {
        map.set(`${mapLine.envId}`, mapLine.name)
    })
    return map
}

async function getDataFromLastReportby(env) {
    const dir = env === ENVS.STAGING ? './reports/staging/' : './reports/prod/'
    const res = await getFormatedResults(
        dir.concat(getMostRecentFile(dir).file)
    )
    // console.log(res)
    return res
}

export { getDataFromLastReportby }
