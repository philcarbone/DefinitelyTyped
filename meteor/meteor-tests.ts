/// <reference path='meteor.d.ts'/>

interface ITemplate {
  asdf: IMeteorViewModel;
}
declare var Template: ITemplate;


// Test Meteor.Collections
var Rooms = new Meteor.Collection('rooms');
var Messages = new Meteor.Collection('messages');

/**
 * From Meteor.startup section of docs
 * Tests Meteor.isServer, Meteor.startup, Collection.insert(), Colleciton.find() *
 */

if (Meteor.isServer) {

  Meteor.startup(function () {
    if (Rooms.find().count() === 0) {
      Rooms.insert({name: "Initial room"});
    }
  });
}

/**
 * Example taken from Meteor.publish section of docs
 **/
Meteor.publish("rooms", function () {
  return Rooms.find({}, {fields: {secretInfo: 0}});
});

Meteor.publish("adminSecretInfo", function () {
  return Rooms.find({admin: this.userId}, {fields: {secretInfo: 1}});
});

Meteor.publish("roomAndMessages", function (roomId) {
  check(roomId, String);
  return [
    Rooms.find({_id: roomId}, {fields: {secretInfo: 0}}),
    Messages.find({roomId: roomId})
  ];
});

/**
 * Also from Meteor.publish
 */
Meteor.publish("counts-by-room", function (roomId) {
  var self = this;
  check(roomId, String);
  var count = 0;
  var initializing = true;
  var handle = Messages.find({roomId: roomId}).observeChanges({
    added: function (id) {
      count++;
      if (!initializing)
        self.changed("counts", roomId, {count: count});
    },
    removed: function (id) {
      count--;
      self.changed("counts", roomId, {count: count});
    }
    // don't care about moved or changed
  });

  // Observe only returns after the initial added callbacks have
  // run.  Now return an initial value and mark the subscription
  // as ready.
  initializing = false;
  self.added("counts", roomId, {count: count});
  self.ready();

  // Stop observing the cursor when client unsubs.
  // Stopping a subscription automatically takes
  // care of sending the client any removed messages.
  self.onStop(function () {
    handle.stop();
  });
});

var Counts = new Meteor.Collection("counts");

Deps.autorun(function () {
  Meteor.subscribe("counts-by-room", Session.get("roomId"));
});

console.log("Current room has " +
    Counts.findOne(Session.get("roomId")).count +
    " messages.");

/**
 * From Meteor.subscribe
 */
Meteor.subscribe("allplayers");

/**
 * Also from Meteor.subscribe
 */
Deps.autorun(function () {
  Meteor.subscribe("chat", {room: Session.get("current-room")});
  Meteor.subscribe("privateMessages");
});

/**
 * From Meteor.methods
 */
Meteor.methods({
  foo: function (arg1, arg2) {
    check(arg1, String);
    check(arg2, [Number]);

    var you_want_to_throw_an_error = true;
    if (you_want_to_throw_an_error)
    throw new Meteor.Error(404, "Can't find my pants");
    return "some return value";
  },

  bar: function () {
    // .. do other stuff ..
    return "baz";
  }
});

/**
 * From Meteor.call
 */
Meteor.call('foo', 1, 2, function (error, result) {} );
var result = Meteor.call('foo', 1, 2);