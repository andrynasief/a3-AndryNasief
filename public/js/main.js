// each jersey object: { id, team, player, number, size, price, sku }

let jerseysData = []
let editingId = null

class JerseyCard {
  constructor( jersey ) {
    this.jersey = jersey
  }

  render() {
    const col = document.createElement( 'div' )
    col.className = 'col-12 col-sm-6 col-lg-4'
    col.dataset.id = this.jersey.id

    const card = document.createElement( 'div' )
    card.className = 'card jersey-card h-100 p-3'

    const title = document.createElement( 'h3' )
    title.className = 'h5 mb-1'
    title.textContent = `${this.jersey.team} #${this.jersey.number}`
    card.appendChild( title )

    const player = document.createElement( 'p' )
    player.className = 'jersey-player mb-1'
    player.textContent = this.jersey.player
    card.appendChild( player )

    const meta = document.createElement( 'p' )
    meta.className = 'jersey-meta text-secondary-emphasis small mb-1'
    meta.textContent = `Size ${this.jersey.size} — $${Number( this.jersey.price ).toFixed( 2 )}`
    card.appendChild( meta )

    const sku = document.createElement( 'p' )
    sku.className = 'jersey-sku text-secondary-emphasis small mb-2'
    sku.textContent = this.jersey.sku
    card.appendChild( sku )

    const actions = document.createElement( 'div' )
    actions.className = 'card-actions d-flex gap-2'

    const editButton = document.createElement( 'button' )
    editButton.className = 'btn btn-outline-secondary btn-sm'
    editButton.type = 'button'
    editButton.title = 'Edit jersey'
    editButton.textContent = '✎'
    editButton.onclick = () => {
      editingId = this.jersey.id
      renderJerseys( jerseysData )
    }
    actions.appendChild( editButton )

    const deleteButton = document.createElement( 'button' )
    deleteButton.className = 'btn btn-outline-danger btn-sm'
    deleteButton.type = 'button'
    deleteButton.title = 'Delete jersey'
    deleteButton.textContent = 'Delete'
    deleteButton.onclick = () => removeJersey( this.jersey.id )
    actions.appendChild( deleteButton )

    card.appendChild( actions )
    col.appendChild( card )

    return col
  }

  renderEdit() {
    const col = document.createElement( 'div' )
    col.className = 'col-12 col-sm-6 col-lg-4'
    col.dataset.id = this.jersey.id

    const card = document.createElement( 'div' )
    card.className = 'card jersey-card jersey-card-editing h-100 p-3'

    const teamInput = document.createElement( 'input' )
    teamInput.type = 'text'
    teamInput.className = 'form-control form-control-sm mb-2'
    teamInput.placeholder = 'Team'
    teamInput.setAttribute( 'aria-label', 'Team' )
    teamInput.value = this.jersey.team
    card.appendChild( teamInput )

    const playerInput = document.createElement( 'input' )
    playerInput.type = 'text'
    playerInput.className = 'form-control form-control-sm mb-2'
    playerInput.placeholder = 'Player'
    playerInput.setAttribute( 'aria-label', 'Player' )
    playerInput.value = this.jersey.player
    card.appendChild( playerInput )

    const numberInput = document.createElement( 'input' )
    numberInput.type = 'number'
    numberInput.className = 'form-control form-control-sm mb-2'
    numberInput.placeholder = 'Number'
    numberInput.setAttribute( 'aria-label', 'Number' )
    numberInput.value = this.jersey.number
    card.appendChild( numberInput )

    const sizeSelect = document.createElement( 'select' )
    sizeSelect.className = 'form-select form-select-sm mb-2'
    sizeSelect.setAttribute( 'aria-label', 'Size' )
    ;[ 'S', 'M', 'L', 'XL', 'XXL' ].forEach( size => {
      const option = document.createElement( 'option' )
      option.value = size
      option.textContent = size
      if ( size === this.jersey.size ) option.selected = true
      sizeSelect.appendChild( option )
    })
    card.appendChild( sizeSelect )

    const priceInput = document.createElement( 'input' )
    priceInput.type = 'number'
    priceInput.step = '0.01'
    priceInput.className = 'form-control form-control-sm mb-2'
    priceInput.placeholder = 'Price'
    priceInput.setAttribute( 'aria-label', 'Price' )
    priceInput.value = this.jersey.price
    card.appendChild( priceInput )

    const actions = document.createElement( 'div' )
    actions.className = 'card-actions d-flex gap-2'

    const saveButton = document.createElement( 'button' )
    saveButton.className = 'btn btn-primary btn-sm'
    saveButton.type = 'button'
    saveButton.textContent = 'Save'
    saveButton.onclick = () => saveEdit( this.jersey.id, {
      team: teamInput.value,
      player: playerInput.value,
      number: numberInput.value,
      size: sizeSelect.value,
      price: priceInput.value
    })
    actions.appendChild( saveButton )

    const cancelButton = document.createElement( 'button' )
    cancelButton.className = 'btn btn-outline-secondary btn-sm'
    cancelButton.type = 'button'
    cancelButton.textContent = 'Cancel'
    cancelButton.onclick = () => {
      editingId = null
      renderJerseys( jerseysData )
    }
    actions.appendChild( cancelButton )

    card.appendChild( actions )
    col.appendChild( card )

    return col
  }
}

const renderJerseys = function( jerseys ) {
  jerseysData = jerseys

  const container = document.querySelector( '#jersey-container' )
  container.innerHTML = ''

  jerseys.forEach( jersey => {
    const card = new JerseyCard( jersey )
    const el = jersey.id === editingId ? card.renderEdit() : card.render()
    container.appendChild( el )
  })
}

const loadJerseys = async function() {
  const response = await fetch( '/jerseys' )

  if ( response.status === 401 ) {
    window.location.href = '/login.html'
    return
  }

  const jerseys = await response.json()
  renderJerseys( jerseys )
}

const submit = async function( event ) {
  event.preventDefault()

  const json = {
    team: document.querySelector( '#team' ).value,
    player: document.querySelector( '#player' ).value,
    number: document.querySelector( '#number' ).value,
    size: document.querySelector( '#size' ).value,
    price: document.querySelector( '#price' ).value
  }

  try {
    const response = await fetch( '/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( json )
    })

    if ( response.status === 401 ) {
      window.location.href = '/login.html'
      return
    }

    if ( !response.ok ) {
      console.error( 'Failed to add jersey:', response.status )
      return
    }

    const jerseys = await response.json()
    renderJerseys( jerseys )
    event.target.reset()
  } catch ( err ) {
    console.error( 'Error adding jersey:', err )
  }
}

const saveEdit = async function( id, updates ) {
  try {
    const response = await fetch( `/jerseys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( updates )
    })

    if ( response.status === 401 ) {
      window.location.href = '/login.html'
      return
    }

    if ( !response.ok ) {
      console.error( 'Failed to save jersey:', response.status )
      return
    }

    const jerseys = await response.json()
    editingId = null
    renderJerseys( jerseys )
  } catch ( err ) {
    console.error( 'Error saving jersey:', err )
  }
}

const removeJersey = async function( id ) {
  try {
    const response = await fetch( `/jerseys/${id}`, { method: 'DELETE' } )

    if ( response.status === 401 ) {
      window.location.href = '/login.html'
      return
    }

    if ( !response.ok ) {
      console.error( 'Failed to delete jersey:', response.status )
      return
    }

    const jerseys = await response.json()
    renderJerseys( jerseys )
  } catch ( err ) {
    console.error( 'Error deleting jersey:', err )
  }
}

const loadSession = async function() {
  const response = await fetch( '/me' )

  if ( response.status === 401 ) {
    window.location.href = '/login.html'
    return
  }

  const session = await response.json()
  document.querySelector( '#current-username' ).textContent = `Logged in as ${session.username}`
}

const logout = async function() {
  await fetch( '/logout', { method: 'POST' } )
  window.location.href = '/login.html'
}

window.onload = function() {
  const form = document.querySelector( '#jersey-form' )
  form.onsubmit = submit

  document.querySelector( '#logout-button' ).onclick = logout

  loadSession()
  loadJerseys()
}