<img width="150" src="https://i.cloudup.com/zfY6lL7eFa-3000x3000.png" />
<img width="50" src="https://angular.io/assets/images/logos/angular/angular.svg" />

## Angular4+ Express Starter ( Advanced )

- Angular 5+
- ExpressJS ( 4.x - with compression )
- Webpack ( angular-cli )

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Concepts

- Redux ( NgRx/Store - with server calls)
- Smart & dumb components
- AOT: Ahead-of-Time compilation
- Advanced routing ( lazy loading, router outlets...)

## Install / Development

```bash
git clone https://github.com/vladotesanovic/angular2-express-starter
cd angular2-express-starter

# Install dependencies
npm install

# start server
npm run start

# Client url: http://localhost:4200
# Application ( epxress ) API: http://localhost:4300
```

Install Redux DevTools chrome extenstion:

https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd

## Build / Production

```bash

npm run build

## Deploy dist folder to app server

Structure of dist folder:

/dist/server <-- expressjs
/dist/client <-- angular2

```

## Note

All html and css are from: http://www.w3schools.com/howto/
<table style="border: 0">
  <tr>
    <td><img width="200" src="http://www.innovic.io/favicon.png" /></td>
    <td>
      <ul>
        <li>INNOVIC doo</li>
        <li>Software consulting company for building full stack solutions.</li>
        <li>Proficient in: NodeJS, TypeScript, Angular, MongoDB...</li>
        <li><b>You have project for us? hello@innovic.io</b></li>
      </ul>
    </td>
  </tr>
</table>


`Server Initialisation`
GameSetup and GameData objects are created.

`CLIENT SEND` *Authenticate*
New Client joins
Server checks whether any Users match the SocketId inside GameSetup
Server returns GameData AND User = NULL/CorrectUser
`CLIENT RECEIVE` *Authenticated (GameData, User)*

`CLIENT SEND` *Login (UserType)*
Client has already received GameData and therefore access to unallocated UserTypes.
Client will pick a UserType and sent to Server.
Server will check if available and allocate the user if available inside GameSetup
`CLIENT RECEIVE` *Authenticated (GameData, User)*
`SERVER SEND ALL` *GameStatus (GameData)*

`CLIENT SEND` *Logout*
User will logout.
Server will deallocate the User and remove User from GameSetup
`CLIENT RECEIVE` *Authenticated (GameData, User=NULL)*
`SERVER SEND ALL` *GameStatus (GameData)*

`SERVER SEND ALL` *GameStatus (GameData)*
Sends the GameData to all connections

`CLIENT SEND` *NewGame*
#Check command is Leader UserType and GameData(Round != 0)
Server will start a new game and regenerate GameData:
                id: new guid
                cards: randomly generated cards
                currentRound: 0
                currentTeam: null
`SERVER SEND ALL` *GameStatus (GameData)*

`CLIENT SEND` *ChangeTheme*
#Check command is Leader UserType and GameData(Round == 0)
Server will adjust GameData:
                currentWordType: switch to next WordType
`SERVER SEND ALL` *GameStatus (GameData)*

`CLIENT SEND` *GenerateWords*
#Check command is Leader UserType and GameData(Round == 0)
Server will adjust GameData:
                cards: randomly generated cards
`SERVER SEND ALL` *GameStatus (GameData)*

`CLIENT SEND` *GenerateWord (id: number)*
#Check command is Leader UserType and GameData(Round == 0)
Server will adjust GameData:
                cards: random specific card id
`SERVER SEND ALL` *GameStatus (GameData)*

`CLIENT SEND` *GenerateMap*
#Check command is Leader UserType and GameData(Round == 0)
Server will adjust GameData:
                cards: randomly assign CardType given GameSetup settings
                currentTeam: assign Team
`SERVER SEND ALL` *GameStatus (GameData)*

`CLIENT SEND` *StartGame*
#Check command is Leader UserType and GameData(Round == 0)
Server will adjust GameData:
                currentRound: 1
`SERVER SEND ALL` *GameStatus (GameData)*

`CLIENT SEND` *SendHint (hint: string)*
#Check command is Team Leader UserType compared with GameData(Team) and GameData(Round != 0)
`SERVER SEND ALL` *SendHint (hint: string)*

`CLIENT SEND` *GuessCard (id: number)*
#Check command is Team User UserType compared with GameData(Team) and GameData(Round != 0)
`SERVER SEND ALL` *GuessCard (id: number)*

`CLIENT SEND` *PickCard (id: number)*
#Check command is Team Leader UserType compared with GameData(Team) and GameData(Round != 0)
Server plays a card and updates GameData:
                cards: card id is isPlayed = true
If played cardType matches GameData(Team) then
                `SERVER SEND ALL` *GameStatus (GameData)*
else
                GameData:
                                currentRound++
                                currentTeam = OtherTeam
                `SERVER SEND ALL` *GameStatus (GameData)*

`CLIENT SEND` *NextRound*
#Check command is Team Leader UserType compared with GameData(Team) and GameData(Round != 0)
Server will adjust GameData:
GameData:
                currentRound++
                currentTeam = OtherTeam
`SERVER SEND ALL` *GameStatus (GameData)*

*GameDebug // Additional errors*