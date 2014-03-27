var debug = require('debug')('my-application');
var app = require('./server/app');

app.set('port', process.env.PORT || 8983);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});