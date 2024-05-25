# cardpoc

Run the app on linux host: `nohup node . > ../cardpoc-logs/cardpoc.log 2>&1 &`.

Run the app: `node .`. This will crash once you exit the terminal.

Run the app with hot reload with: `npx nodemon .`.

Localhost browse to:

- [localhost](http://localhost:3000/cardpoc/4d8eec53-3ab1-4517-b693-1015d6453b22)

Deployed to `hristov.app` browse to:

- [hristov.app](https://hristov.app/cardpoc/4d8eec53-3ab1-4517-b693-1015d6453b22)

This app follows the Google APIs quick start:

- [quickstart](https://developers.google.com/people/quickstart/nodejs)

To *reset the token*, delete the `token.json` file and run `node .` and it will open the browser to authentication url on Google side,
