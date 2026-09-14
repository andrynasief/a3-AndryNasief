//   im using this for testing purposes
//   1. npm install mongodb dotenv
//   2. node test-connection.js

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
