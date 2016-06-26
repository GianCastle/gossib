/*jshint esversion:6*/

const mongoose = require('mongoose');
const modelRandom =  require('mongoose-simple-random');

const gossipSchema = mongoose.Schema({
  user_id: String,
  message: String,

});

gossipSchema.plugin(modelRandom);
const Gossip = mongoose.model('Gossip', gossipSchema);



Gossip.findOneRandom((error, result) =>
      console.log((error) ? error : result));

let saveGossip = function(gossipText) {
        const gossip = new Gossip( { message: gossipText} );
        gossip.save( (error) =>
          console.log((error) ? error : 'A gossip message was saved on database'));
};

mongoose.connect('mongodb://uri:fwx3kacx9vec4@jello.modulusmongo.net:27017/ipaw3yqA');

module.exports = Gossip;
module.exports.saveGossip = saveGossip;
module.exports.findOneRandom = Gossip.findOneRandom;
