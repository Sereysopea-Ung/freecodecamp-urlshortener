require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

const Schema = mongoose.Schema;
const url_Schema= new Schema({
  original_url:{type:String, required: true},
  short_url: Number
});
const Url = mongoose.model('Url', url_Schema);


app.use(bodyParser.urlencoded({extended: false}));

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//Create API here:
const validUrl= /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
app.post('/api/shorturl', function(req,res){
  if (validUrl.test(req.body.url)){
    Url.findOne({original_url: req.body.url},function(err,url){
      if (err) return console.log(err);
      if (url){
        res.json({
          original_url: req.body.url,
          short_url: url.short_url
        });
      } else {
        var Query= Url.find({}).sort({short_url: -1}).limit(1);
        Query.exec(function(err, doc){
          if (err) return console.log(err);
          if(doc[0]){
            let newUrl= new Url({
              original_url: req.body.url,
              short_url: doc[0].short_url +1
            });
            newUrl.save(function(err,savedUrl){
              if (err) return console.log(err);
              res.json({
                original_url: savedUrl.original_url,
                short_url: savedUrl.short_url
              });
            })
          } else {
            let newUrl = new Url({
              original_url: req.body.url,
              short_url: 1
            });
            newUrl.save(function(err,savedUrl){
              if (err) return console.log(err);
              res.json({
                original_url: savedUrl.original_url,
                short_url: savedUrl.short_url
              });
            });
          }
        });
      }
    });
  } else {
    res.json({error: 'invalid url'});
  }
});

app.get('/api/shorturl/:number', function(req,res){
  let Query = Url.findOne({short_url: req.params.number});
  Query.exec(function(err,url){
    if (err) return console.log(err);
    res.redirect(url.original_url);
  });

});
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
