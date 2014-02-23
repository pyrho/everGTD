var winston = require('winston');
var myCustomLevels = {
  levels: {
    'crit': 0,
    'error': 1,
    'warning': 2,
    'info': 3,
    'debug': 4
  },
  colors: {
    debug: 'green',
    error: 'red',
    info: 'blue'
  }
};

winston.addColors(myCustomLevels.colors);

var logger = new (winston.Logger)({
  transports: [new (winston.transports.Console)({
    colorize: true,
    level: 'crit'
  })],
  levels: myCustomLevels.levels,
  colors: myCustomLevels.colors
});


module.exports = logger;

// vim: sw=2 ts=2 et
