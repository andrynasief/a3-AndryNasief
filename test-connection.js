// Run this once to confirm your .env connection string actually works
// before wiring MongoDB into server.js.
//
// Usage:
//   npm install mongodb dotenv
//   node test-connection.js

require( 'dotenv' ).config( { quiet: true } )
const { MongoClient } = require( 'mongodb' )

const uri = process.env.MONGODB_URI

if ( !uri ) {
  console.error( 'Missing MONGODB_URI — add it to a .env file in this folder.' )
  process.exit( 1 )
}

const client = new MongoClient( uri )

const main = async function() {
  try {
    await client.connect()
    console.log( 'Connected to MongoDB Atlas!' )

    // "jerseys" will be created automatically the first time you write to it —
    // it does not need to exist yet.
    const db = client.db( 'jerseys' )
    const collections = await db.listCollections().toArray()
    console.log( 'Existing collections:', collections.map( c => c.name ) )
  } catch ( err ) {
    console.error( 'Connection failed:', err.message )
  } finally {
    await client.close()
  }
}

main()
