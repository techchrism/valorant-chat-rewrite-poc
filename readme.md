# Valorant XMPP Logger
A simple tool to log XMPP traffic between the Riot client and the Riot XMPP server. Includes information such as presences and chat.

*Heavily* based on [Burak](https://github.com/BurakDev)'s [riot-xmpp-mitm](https://github.com/ValorantDevelopers/riot-xmpp-mitm) project.

## Usage
Note: This project makes use of global fetch in Node 18+
 - Clone the repo and run `npm install`
 - Run `npm run build` to build the project
 - Ensure Valorant is not running and run `node .` to start the logger. This will start Valorant automatically.

## Log Format
The first line of the file must contain a json-encoded object with required properties
`type` being set to `valorant-xmpp-logger` and `version` being a semver representing the format version.

Following lines are either comments (to be ignored by parsers) starting with `#` or log entries.
Log entries are json-encoded objects with the following properties:
 - `type`: `incoming` for incoming data, `outgoing` for outgoing data
 - `time`: timestamp of the log entry
 - `data`: the data that was sent or received

## Motivation
While [an excellent xmpp mitm project](https://github.com/ValorantDevelopers/riot-xmpp-mitm) had already been created,
I wanted to try my hand at creating a similar project to better understand MITM-ing the Riot client config.
This project also writes logs to disk in an easily parsable format, which is useful for creating tools to analyze the logs.
Finally, this project automatically finds and starts the Riot client which is convenient.