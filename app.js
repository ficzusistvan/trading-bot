var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var nconf = require('nconf');
nconf.file({ file: 'config.json', search: true });

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');

var app = express();

if (nconf.get('debug:use_morgan') == true) {
  app.use(logger('tiny'));
}
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(/*createError(404)*/);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;