require( 'dotenv' ).config( { quiet: true } )

const express = require( 'express' )
const session = require( 'express-session' )
const { MongoStore } = require( 'connect-mongo' )
const bcrypt = require( 'bcryptjs' )
const path = require( 'path' )
const { MongoClient } = require( 'mongodb' )

const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-secret-change-me'

if ( !MONGODB_URI ) {
  console.error( 'Missing MONGODB_URI — add it to a .env file (see .env.example).' )
  process.exit( 1 )
}

const app = express()
const client = new MongoClient( MONGODB_URI )
const PUBLIC_DIR = path.join( __dirname, 'public' )

let jerseysCollection
let usersCollection

const addDerivedFields = function( jersey ) {
  const teamCode = ( jersey.team || '' ).trim().substring( 0, 3 ).toUpperCase()
  const sku = `${teamCode}-${jersey.number}`

  return Object.assign( {}, jersey, { sku } )
}

const getNextId = async function( owner ) {
  const last = await jerseysCollection.find( { owner } ).sort( { id: -1 } ).limit( 1 ).toArray()
  return last.length ? last[ 0 ].id + 1 : 1
}

const getJerseysForOwner = async function( owner ) {
  return jerseysCollection.find( { owner } ).sort( { id: 1 } ).project( { _id: 0 } ).toArray()
}

app.use( express.json() )
app.use( session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    dbName: 'jerseys',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}))

const requireAuth = function( req, res, next ) {
  if ( !req.session.user ) {
    res.status( 401 ).json( { error: 'Not logged in' } )
    return
  }
  next()
}

app.post( '/login', async ( req, res ) => {
  const { username, password } = req.body

  if ( !username || !password ) {
    res.status( 400 ).json( { error: 'Username and password are required.' } )
    return
  }

  const existingUser = await usersCollection.findOne( { username } )


  if ( !existingUser ) {
    const passwordHash = await bcrypt.hash( password, 10 )
    await usersCollection.insertOne( { username, passwordHash } )
    req.session.user = username
    res.json( { username, newAccount: true } )
    return
  }

  const passwordMatches = await bcrypt.compare( password, existingUser.passwordHash )

  if ( !passwordMatches ) {
    res.status( 401 ).json( { error: 'Incorrect password.' } )
    return
  }

  req.session.user = username
  res.json( { username, newAccount: false } )
})

app.post( '/logout', ( req, res ) => {
  req.session.destroy( () => {
    res.json( { success: true } )
  })
})

app.get( '/me', requireAuth, ( req, res ) => {
  res.json( { username: req.session.user } )
})


app.get( '/', ( req, res ) => {
  if ( !req.session.user ) {
    res.redirect( '/login.html' )
    return
  }
  res.sendFile( path.join( PUBLIC_DIR, 'index.html' ) )
})

app.get( '/index.html', ( req, res ) => {
  if ( !req.session.user ) {
    res.redirect( '/login.html' )
    return
  }
  res.sendFile( path.join( PUBLIC_DIR, 'index.html' ) )
})

app.get( '/login.html', ( req, res ) => {
  if ( req.session.user ) {
    res.redirect( '/' )
    return
  }
  res.sendFile( path.join( PUBLIC_DIR, 'login.html' ) )
})

app.use( express.static( PUBLIC_DIR, { index: false } ) )

app.get( '/jerseys', requireAuth, async ( req, res ) => {
  res.json( await getJerseysForOwner( req.session.user ) )
})

app.post( '/submit', requireAuth, async ( req, res ) => {
  const owner = req.session.user
  const id = await getNextId( owner )
  const withId = Object.assign( { id, owner }, req.body )
  const withDerived = addDerivedFields( withId )

  await jerseysCollection.insertOne( withDerived )
  res.json( await getJerseysForOwner( owner ) )
})

app.put( '/jerseys/:id', requireAuth, async ( req, res ) => {
  const owner = req.session.user
  const id = parseInt( req.params.id )
  const existing = await jerseysCollection.findOne( { id, owner } )

  if ( !existing ) {
    res.status( 404 ).json( { error: 'Jersey not found' } )
    return
  }

  const updated = addDerivedFields( Object.assign( {}, existing, req.body, { id, owner } ) )
  delete updated._id

  await jerseysCollection.updateOne( { id, owner }, { $set: updated } )
  res.json( await getJerseysForOwner( owner ) )
})

app.delete( '/jerseys/:id', requireAuth, async ( req, res ) => {
  const owner = req.session.user
  const id = parseInt( req.params.id )
  await jerseysCollection.deleteOne( { id, owner } )
  res.json( await getJerseysForOwner( owner ) )
})

const start = async function() {
  await client.connect()
  console.log( 'Connected to MongoDB Atlas' )

  const db = client.db( 'jerseys' )
  jerseysCollection = db.collection( 'jerseys' )
  usersCollection = db.collection( 'users' )

  app.listen( PORT, () => {
    console.log( `Server running at http://localhost:${PORT}` )
  })
}

start().catch( err => {
  console.error( 'Failed to start server:', err.message )
  process.exit( 1 )
})