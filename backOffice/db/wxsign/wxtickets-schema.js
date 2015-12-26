/**
 * Created by admin on 12/4/2015.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// XX时间，获取了wxTicket， 避免重复获取
var wxTicketSchema = new Schema({
    jsapiTicket: String,
    jsapiTicketExpireTime: Number,
    accessToken: String,
    accessTokenExpireTime: Number
});

function setup(autoIncrement) {
    wxTicketSchema.plugin(autoIncrement.plugin, 'WxTickets');
    mongoose.model('WxTickets', wxTicketSchema);
}

exports.setup = setup;
