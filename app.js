const express = require('express')
const app = express()
app.use(express.json())

const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertPlayerDBObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatchDBObjectToResponseObject = databaseObject => {
  return {
    matchId: databaseObject.match_id,
    match: databaseObject.match,
    year: databaseObject.year,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
        SELECT
          *
        FROM
            player_details
        ORDER BY
            player_id;`
  const playersArray = await db.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerDBObjectToResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
      SELECT
        *
      FROM
          player_details
      WHERE
          player_id=${playerId};`

  const playerArray = await db.get(getPlayerQuery)
  response.send(convertPlayerDBObjectToResponseObject(playerArray))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerQuery = `
      UPDATE player_details
      SET 
        player_name='${playerName}'
      WHERE
          player_id=${playerId};`
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailsQuery = `
    SELECT
      *
    FROM
        match_details
    WHERE
        match_id=${matchId};`

  const matchDetails = await db.get(getMatchDetailsQuery)
  response.send(convertMatchDBObjectToResponseObject(matchDetails))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchDetails = `
      SELECT
        player_match_score.match_id ,
        match_details.match ,
        match_details.year 
      From 
          player_match_score
      NATURAL JOIN match_details
      WHERE 
          player_id=${playerId};`

  const playerMatchDetails = await db.all(getPlayerMatchDetails)
  response.send(
    playerMatchDetails.map(eachMatch =>
      convertMatchDBObjectToResponseObject(eachMatch),
    ),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayersOfSpecificMatchDetails = `
      SELECT
        
        player_details.player_id as playerId,
        player_details.player_name as playerName
      From 
          player_details
      NATURAL JOIN player_match_score
      WHERE 
          match_id=${matchId};`

  const playerOfSpecificMatchDetails = await db.all(
    getPlayersOfSpecificMatchDetails,
  )
  response.send(playerOfSpecificMatchDetails.map(eachMatch => eachMatch))
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerStats = `
      SELECT
        player_details.player_id as playerId,
        player_details.player_name as playerName,
        sum(player_match_score.score) as totalScore,
        sum(fours) as totalFours,
        sum(sixes) as totalSixes
        FROM
          player_details
      INNER JOIN player_match_score ON
      player_details.player_id = player_match_score.player_id
      WHERE 
           player_details.player_id=${playerId};`

  const playerStats = await db.get(getPlayerStats)
  console.log(getPlayerStats)
  console.log(playerStats)
  response.send(playerStats)
})

module.exports = app
