var mongoose = require('mongoose');

var PictureSchema = new mongoose.Schema({
    filename: String,
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    score: {
        type: Number,
        default: 0
    },
    upload_date: {
        type: Date,
        default: Date.now
    },
    uploader: {
        type: String,
        ref: 'User'
    },
    rated_by: [],
    liked_by: [],
    disliked_by: []
});

PictureSchema.methods.like = function(cb) {
    this.likes += 1;
    //this.score = calculateScore(this.likes, this.dislikes);
    this.save(cb);
};

PictureSchema.methods.unlike = function(cb) {
    this.likes -= 1;
    //this.score = calculateScore(this.likes, this.dislikes);
    this.save(cb);
};

/*PictureSchema.methods.dislike = function(cb) {
    this.dislikes += 1;
    this.score = calculateScore(this.likes, this.dislikes);
    this.save(cb);
};*/

calculateScore = function(likes, dislikes) {
    var score = likes / (likes + dislikes);
    return score;
};

mongoose.model('Picture', PictureSchema);
