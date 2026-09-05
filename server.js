const http = require( 'http' )
const fs = require( 'fs' )
const path = require( 'path' )

const PORT = process.env.PORT || 3000
const PUBLIC_DIR = path.join( __dirname, 'public' )

let nextId = 1

let jerseys = []

const addDerivedFields = function( jersey ) {
  const teamCode = ( jersey.team || '' ).trim().substring( 0, 3 ).toUpperCase()
  const sku = `${teamCode}-${jersey.number}`

  return Object.assign( {}, jersey, { sku } )
}

// sample stock
const seedData = [
  { team: 'Barcelona Home', player: 'Lamine', number: 10, size: 'S', price: 25 },
  { team: 'Barcelona Away', player: 'Raphinha', number: 11, size: 'M', price: 30 },
  { team: 'Man United 3rd', player: 'No Name', number: 0, size: 'L', price: 30 },
  { team: 'Juventus Away', player: 'No Name', number: 0, size: 'XL', price: 25 },
]

seedData.forEach( row => {
  jerseys.push( addDerivedFields( Object.assign( { id: nextId++ }, row ) ) )
})

const sendJSON = function( res, status, data ) {
  res.writeHead( status, { 'Content-Type': 'application/json' } )
  res.end( JSON.stringify( data ) )
}

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml'
}

const serveFile = function( res, filePath ) {
  const ext = path.extname( filePath )
  fs.readFile( filePath, ( err, content ) => {
    if ( err ) {
      res.writeHead( 404 )
      res.end( 'Not found' )
      return
    }
    res.writeHead( 200, { 'Content-Type': CONTENT_TYPES[ ext ] || 'text/plain' } )
    res.end( content )
  })
}

const readBody = function( req ) {
  return new Promise( resolve => {
    let body = ''
    req.on( 'data', chunk => body += chunk )
    req.on( 'end', () => resolve( body ) )
  })
}

const server = http.createServer( async ( req, res ) => {
  const url = req.url

  if ( req.method === 'GET' && url === '/jerseys' ) {
    sendJSON( res, 200, jerseys )
    return
  }

  // add a new jersey
  if ( req.method === 'POST' && url === '/submit' ) {
    const body = await readBody( req )
    const incoming = JSON.parse( body )
    const withId = Object.assign( { id: nextId++ }, incoming )
    const withDerived = addDerivedFields( withId )

    jerseys.push( withDerived )
    sendJSON( res, 200, jerseys )
    return
  }

  // edit an existing jersey's fields
  if ( req.method === 'PUT' && url.startsWith( '/jerseys/' ) ) {
    const id = parseInt( url.split( '/' )[ 2 ] )
    const body = await readBody( req )
    const updates = JSON.parse( body )

    jerseys = jerseys.map( jersey => {
      if ( jersey.id !== id ) return jersey
      return addDerivedFields( Object.assign( {}, jersey, updates, { id } ) )
    })

    sendJSON( res, 200, jerseys )
    return
  }

  // delete a jersey by id
  if ( req.method === 'DELETE' && url.startsWith( '/jerseys/' ) ) {
    const id = parseInt( url.split( '/' )[ 2 ] )
    jerseys = jerseys.filter( jersey => jersey.id !== id )
    sendJSON( res, 200, jerseys )
    return
  }

  // everything else is served as a static file out of public
  const requestedPath = url === '/' ? '/index.html' : url
  const filePath = path.join( PUBLIC_DIR, requestedPath )

  if ( !filePath.startsWith( PUBLIC_DIR ) ) {
    res.writeHead( 403 )
    res.end( 'Forbidden' )
    return
  }

  serveFile( res, filePath )
})

server.listen( PORT, () => {
  console.log( `Server running at http://localhost:${PORT}` )
})