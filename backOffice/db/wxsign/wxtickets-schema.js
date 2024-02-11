/**
 * Created by admin on 12/4/2015.
 */
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// XX时间，获取了wxTicket， 避免重复获取
var wxTicketSchema = new Schema({
  jsapiTicket: String,
  jsapiTicketExpireTime: Number,
  accessToken: String,
  accessTokenExpireTime: Number,
  _id: Number
}, { _id: false });

function setup(autoIncrement) {
  wxTicketSchema.plugin(autoIncrement, { id: "wxTicket_id", inc_field: "_id" });
  mongoose.model("WxTickets", wxTicketSchema);
}

exports.setup = setup;
