var express = require('express');
var app = express();
var request = require('request');
require('request').debug = false;

//MongoDB MLab Connection
var MongoClient = require('mongodb').MongoClient;
var db_url = 'mongodb://admin:password@ds121222.mlab.com:21222/fcc-backend';

// Bing API Variables
var base_url = 'https://api.cognitive.microsoft.com/bing/v5.0/images/search';
var subscription_key = process.env.SUBSCRIPTION_KEY;


MongoClient.connect(db_url, (err, db) => {
  if (err) return console.log('Error connecting to database');
  
  var searches = db.collection('searches');

  app.use(express.static('public'));

  app.get("/", function (req, res) {
    //res.redirect('/latest/imagesearch');
    res.redirect('/api/imagesearch/lolcats?offset=5');
  });

  app.get("/api/imagesearch/:q", function(req, res) {

    var offset = req.query.offset;
    var search_term = req.params.q;
    
    searches.insert({'term': search_term, 'when': new Date().toLocaleString()});

    var options = {
      url: base_url,
      headers: {
        'Ocp-Apim-Subscription-Key': subscription_key,
        'Content-Type': 'application/json'
      },
      qs: {q: search_term}
    }

    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          var values = info['value'];
          var return_values = [];

          // Check to see if offset is passed as a parameter; if not, return all results
          var loop_length = 0;
          if (offset) {
            loop_length = offset;
          } else {
            loop_length = values.length;
          }

          //Loop through the array of returned values and return relevant data
          for (var i = 0; i < loop_length; i++) {
            var result = {
              'url': values[i]['contentUrl'],
              'snippet': values[i]['name'],
              'thumbnail': values[i]['thumbnailUrl']
            }
            return_values.push(result);
          }

          //res.sendFile(__dirname + '/views/index.html'); * Doesn't work
          res.send(return_values);
        } else {
          res.send('error reaching api');
        }
      }

    request(options, callback)

  } ); // end api/imagesearch route
  
  app.get("/latest/imagesearch", function(req, res) {
    searches.find( {}, {_id: 0, term: 1, when: 1 }).sort( { when: -1 } ).toArray(function(err, docs) {
      res.send(docs);
    });
  });

  var listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening on port ' + listener.address().port);
  });

}); // Close MongoDB connection