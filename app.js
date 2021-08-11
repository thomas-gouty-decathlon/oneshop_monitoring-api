const express = require('express')
const app = express()
const port = 3000
const { spawn } = require('child_process');

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/go', (req, res) => {
  const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run',  'new_report']);
  let allScriptsDone = 0

  child.stdout.on('data', data => {
    console.log(`${data}`);
  })
  child.stderr.on('data', data => { 
    console.error(`stderr: ${data}`);
  });

  child.on('error', (error) => {
    console.error(`error: ${error.message}`);
    res.send('Error!') 
  });
  child.on('close', (code) => {
    res.send(`done`)
    console.log(`child process exited with code 0`);
    child.kill()
    main()
  });
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

const fs = require('fs-extra')
const path = require("path");
const { stringify } = require('csv');

 const REQ_BY_COUNTRY = 4
const COUNTRY_NUMBER = 30

// var from json file
let collectionName = null
let launchTime = null
let totalReq = null
let failReqNumber = null

let failRequests = null // mapping
// TODO csv mapping


const getMostRecentFile = (dir) => {
  const files = orderReccentFiles(dir);
  return files.length ? files[0] : undefined;
};

const orderReccentFiles = (dir) => {
  return fs.readdirSync(dir)
    .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
    .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
};

// With async/await:
async function readJsonResults (jsonPath) {
  try {
    const file = await fs.readJson(jsonPath) 
    console.log(file)
    
    collectionName= file.Collection.Info.Name
    launchTime= new Date(file.Run.Timings.started).toLocaleString('fr-FR', { timeZone: 'America/New_York' });
    // console.log(launchTime)

    totalReq= file.Run.Stats.Assertions.total
    failReqNumber= file.Run.Stats.Assertions.failed

    failRequests = file.Run.Failures // mapping
    // console.dir(failRequests) 
    // console.table(file)
  } catch (err) {
    console.error('Something go wrong when reading the output.json file --> ',err)
  }
}

// TEST cli with Iteration but no report

// const newman = require('newman'); // require newman in your project
// const stringify = require('csv-stringify')
// const parse = require('csv-parse/lib/sync')
// const fs = require("fs")
// // call newman.run to pass `options` object and wait for callback
// let data = fs.readFileSync('./csv/env_id_list.csv',
//     { encoding: 'utf8', flag: 'r' });
// data = parse(data, {
//     columns: true,
//     skip_empty_lines: true
// })
// console.log(data)

// //index doesn't consider header so 0 is first data row
// stringify(data.slice(0, 2), { 
//     header: true
// }, function (err, output) {
    
//     fs.writeFileSync("temp.csv", output);
    
//     newman.run({
//         collection: require('./collections/staging/preprod.postman_collection.json'),
//         reporters: 'cli',
//         iterationData: require('./temp.csv') 
//     }, function (err) {
//         if (err) { throw err; }
//         console.log('collection run complete!');
//     });
// })

function main() {
  console.count('toto')
  const dir = __dirname + '/reports/staging/'
  console.count(dir.concat(getMostRecentFile(dir).file))
  readJsonResults(dir.concat(getMostRecentFile(dir).file))
}
main()