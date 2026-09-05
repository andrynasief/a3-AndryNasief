// FRONT-END (CLIENT) JAVASCRIPT FOR THE LOGIN PAGE

const showMessage = function( text ) {
  document.querySelector( '#login-message' ).textContent = text
}

const submitLogin = async function( event ) {
  event.preventDefault()

  const username = document.querySelector( '#username' ).value
  const password = document.querySelector( '#password' ).value

  try {
    const response = await fetch( '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify( { username, password } )
    })

    const result = await response.json()

    if ( !response.ok ) {
      showMessage( result.error || 'Login failed.' )
      return
    }

    if ( result.newAccount ) {
      alert( `Welcome! We didn't find an existing account for "${username}", so we created a new one for you.` )
    }

    window.location.href = '/'
  } catch ( err ) {
    console.error( 'Error logging in:', err )
    showMessage( 'Something went wrong — please try again.' )
  }
}

window.onload = function() {
  document.querySelector( '#login-form' ).onsubmit = submitLogin
}