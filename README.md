# Jersey Collection

Live site: https://a3-andrynasief.onrender.com/
Dummy Account in `.env.example`

This is a two tier web app where each user keeps a personal list of jerseys. You log in, then you can add, edit, and delete jerseys tied to your own account. Nobody sees anyone else's collection. Data is stored in MongoDB so it stays around between server restarts.

## Challenges

The hardest part was getting login working the right way. I wanted new users to get an account automatically the first time they log in, but I also needed existing users to type the correct password. I also had to make sure every route that touches jersey data checks the session first, so someone can't just call the API directly and see or change another user's jerseys.

Switching the styling over to a CSS framework after building it with my own hand written CSS was also a bit of a rebuild. I had a specific dark and violet look I wanted to keep, so I had to learn how to override the framework's own CSS variables instead of fighting it with a pile of my own classes.

## Authentication

I used simple username and password login with sessions, stored in MongoDB through connect mongo. Passwords are hashed with bcrypt before they ever touch the database. If you log in with a username that doesn't exist yet, the app creates an account for you and lets you know that happened. I picked this approach because the assignment allows a simple username and password system, and it let me put my time into the database and session logic instead of setting up an OAuth provider.

## CSS framework

I used Bootstrap 5. It gave me a grid system, form styling, and button variants right out of the box, so I didn't have to build a layout system myself. On top of that I wrote a small custom stylesheet that only overrides Bootstrap's CSS variables for color, background, and border, to match the dark and violet theme I wanted. It also has a couple of small extras Bootstrap doesn't provide, like the hover lift effect on the jersey cards.