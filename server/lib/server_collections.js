/* Meteor collections. */

// Stores information about current colors of network nodes. It consists of documents of 
// the format { name: someName, color: someColor }
colors = new Meteor.Collection('colorsCollection');

// Stores information about neighborhoods of nodes corresponding to registered users 
// (these are the "relevant" neighborhoods). The corresponding documents are of the format
// { userId: someUserId, namesOfNeighbors: arrayOfNamesOfNeighbors, neighAdjMatrix: 
// adjacencyMatrixOfCorrespondingNeighborhood}
neighborhoods = new Meteor.Collection('neighborhoodsCollection');

sessionInfo = new Meteor.Collection('sessionInfo');

timeInfo = new Meteor.Collection('timeInfo');

progressInfo = new Meteor.Collection('progressInfo');

experimentLog = new Meteor.Collection('experimentLog');


payoutInfo = new Meteor.Collection('payoutInfo');

colorsInfo = new Meteor.Collection('colorsInfo');

chatMessages = new Meteor.Collection('chatMessages');

structuredMessages = new Meteor.Collection('structuredMessages');

parameters = new Meteor.Collection('parameters');

participantsCollection = new Meteor.Collection('participantsCollection');

communicationLimits = new Meteor.Collection('communicationLimits');

potentialPayoutsInfo = new Meteor.Collection('potentialPayoutsInfo');

persistentInfo = new Meteor.Collection('persistentInfo');

// ???
// experimentLogFiles = new FS.Collection("experimentLogFiles", {
// 	stores: [new FS.Store.FileSystem("experimentLogFiles", {path: "~/server/experiment_logs"})]
// });

