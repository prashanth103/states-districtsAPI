const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//Get All States
app.get('/states/', async (request, response) => {
  const statesQuery = `
    SELECT 
    *
    FROM
    state;
    `
  const states = await db.all(statesQuery)
  const ans = eachState => {
    return {
      stateId: eachState.state_id,
      stateName: eachState.state_name,
      population: eachState.population,
    }
  }

  response.send(states.map(eachState => ans(eachState)))
})

//Get State
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateQuery = `
  SELECT
  *
  FROM
  state
  WHERE
  state_id = ${stateId};
  `
  const state = await db.get(stateQuery)
  const ans = state => {
    return {
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    }
  }

  response.send(ans(state))
})

//POST District
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const postDistrictQuery = `
  INSERT INTO district
  (district_name, state_id, cases, cured, active, deaths)
  VALUES
  (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );
  `
  const dbResponse = await db.run(postDistrictQuery)
  const district_id = dbResponse.lastID
  response.send('District Successfully Added')
})

//Get District
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtQuery = `
  SELECT
  *
  FROM
  district
  WHERE
  district_id = ${districtId};
  `
  const district = await db.get(districtQuery)
  const ans = district => {
    return {
      districtId: district.district_id,
      districtName: district.district_name,
      stateId: district.state_id,
      cases: district.cases,
      cured: district.cured,
      active: district.active,
      deaths: district.deaths,
    }
  }

  response.send(ans(district))
})

//Delete District
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
  DELETE FROM
  district
  WHERE
  district_id = ${districtId};
  `
  await db.run(deleteDistrict)
  response.send('District Removed')
})

//Update District
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictQuery = `
  UPDATE 
  district
  SET
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE
  district_id = ${districtId};
  `
  const updateDistrict = await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

//Get Statistics of State
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const statsQuery = `
  SELECT
  SUM(cases) AS totalCases,
  SUM(cured) AS totalCured,
  SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths
  FROM
  district
  WHERE
  state_id = ${stateId};
  `
  const states = await db.get(statsQuery)
  response.send(states)
})

//Get StateName from District Table
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateIdQuery = `
  SELECT
  state_id
  FROM
  district
  WHERE
  district_id = ${districtId}
  `
  const getStateId = await db.get(stateIdQuery)

  const getStatefromDistQuery = `
  SELECT
  state_name AS stateName
  FROM
  state
  WHERE
  state_id = ${getStateId.state_id}
  `
  const getStatefromDist = await db.get(getStatefromDistQuery)
  response.send(getStatefromDist)
})

module.exports = app
