# Valorant Chat Rewrite Proof of Concept
Proof-of-concept for rewriting Valorant chat by MITM-ing the XMPP connection.

https://user-images.githubusercontent.com/26680599/214389756-a5603b1f-e1de-4551-9b96-5dc9e5010f3c.mp4

Slightly modified from [Valorant XMPP Logger](https://github.com/techchrism/valorant-xmpp-logger)

## Usage
Note: This project makes use of global fetch in Node 18+
 - Clone the repo and run `npm install`
 - Run `npm run build` to build the project
 - Ensure Valorant is not running and run `node .` to start. This will start Valorant automatically.

The default "macro" (replaces entire message) is `!bee` and the default "replacement" (replaces just that occurrence) is `:heart:`.
These can easily be changed or extended in `src/main.ts`.