const Express = require('express');
const Cors = require('cors');
const MtgData = require('./src/mtg-data');

const ErrorHandlers = require('./src/error-handlers');
const Controllers = require('./controllers');
const Updater = require('./src/mtgjson/Updater');

const expressApp = Express();

expressApp.use(Cors({ origin: true }));

// Expose the public directory as a static file resource
expressApp.use(`/static`, Express.static('static'));

// Routes for the server to expose
expressApp.use(Controllers);

// Error handling
expressApp.use(ErrorHandlers.logErrors);
expressApp.use(ErrorHandlers.clientErrorHandler);
expressApp.use(ErrorHandlers.errorHandler);

let readyPromise = null;

class App {
  static listen(port) {
    if (readyPromise === null) {
      readyPromise = App.updateAndStartExpress(port);
    }
    return readyPromise;
  }

  static getReady() {
    return readyPromise;
  }

  static listenRandomPort() {
    const TEST_PORT = 3031 + Math.floor(Math.random() * 10000);
    return App.listen(TEST_PORT);
  }

  static async updateAndStartExpress(port) {
    const allSets = await Updater.updateAllSets();
    global.mtgData = new MtgData(allSets);
    return new Promise((resolve, reject) => {
      try {
        expressApp.listen(port,
          () => resolve(port));
      } catch (e) {
        reject(e);
      }
    });
  }

  static getExpress() {
    return expressApp;
  }
}

// Allows testing
module.exports = App;
