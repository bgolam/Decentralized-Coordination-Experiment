// Currently, this piece of code makes the entire colors collection available to all clients,
// including  name & color pairs corresponding to nodes that are not neighbors of a given
// client. This is a potential flaw (though it can only be exploited from the console inside 
// the client's browser). Perhaps a better approach would be to get rid of this collection
// and store the relevant color data within the neighborhoods data, though this will add a bit
// of complexity in places where we create and/or modify neighborhood data. 
Meteor.publish('colorsSubscription', function (clientName) {
	adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}});
	if(adminUser !== undefined){
		if(this.userId == adminUser._id) {
			return colors.find({});
		}
	}
});

// This piece of code makes available only the neighborhood document from the neighborhoods 
// collection that corresponds to the current user (client) (made possible by using 
// userId: this.userId as our search criterion.)
Meteor.publish('neighborhoodsSubscription', function () {
    return neighborhoods.find({
	 	userId: this.userId
	});
});

Meteor.publish("allUsers", function () {
	adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}});
	if(adminUser !== undefined){
		if(this.userId == adminUser._id) {
			return Meteor.users.find({"status.online": true});
		}
	}
    return Meteor.users.find({"_id": this.userId});
});

Meteor.publish('sessionInfoSubscription', function () {
    return sessionInfo.find({});
});

Meteor.publish('timeInfoSubscription', function () {
    return timeInfo.find({});
});

Meteor.publish('progressInfoSubscription', function () {
    return progressInfo.find({});
});

Meteor.publish('payoutInfoSubscription', function () {
	adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}});
	if(adminUser !== undefined){
		if(this.userId == adminUser._id) {
	 		 return payoutInfo.find({});
	 	}
	 	else {
			return payoutInfo.find({
				id: this.userId
			});
		}
	}
});

Meteor.publish('colorsInfoSubscription', function(clientName) {
	if((id_name[this.userId] !== undefined) && (clientName == id_name[this.userId])) {
		var query = {};
		query["name"] = clientName;
		return colorsInfo.find(query);
	}
});

Meteor.publish('chatMessagesSubscription', function(clientName) {
	if((id_name[this.userId] !== undefined) && (clientName == id_name[this.userId])) {
		if(communication && (!structuredCommunication)) {
			if(globalCommunication) {
				return chatMessages.find({}, {fields: {nameOfSender: 1, message: 1}});
			}
			else {
				neighborhoodData = neighborhoods.findOne({userId: this.userId}, {fields: {namesOfNeighbors: 1}});
				if(neighborhoodData !== undefined) {
					namesOfNeighbors = neighborhoodData.namesOfNeighbors.slice();
					return chatMessages.find({nameOfSender: {$in: namesOfNeighbors}}, {fields: {nameOfSender: 1, message: 1}});
				}
			}
		}
	}
});

Meteor.publish('structuredMessagesSubscription', function(clientName) {
	if((id_name[this.userId] !== undefined) && (clientName == id_name[this.userId])) {
		// if(communication && structuredCommunication) {
		if(communication) {
			if(globalCommunication) {
				return structuredMessages.find({idOfRecipient: this.userId}, {fields: {nameOfSender: 1, message: 1}});
			}
			else {
				neighborhoodData = neighborhoods.findOne({userId: this.userId}, {fields: {namesOfNeighbors: 1}});
				if(neighborhoodData !== undefined) {
					namesOfNeighbors = neighborhoodData.namesOfNeighbors.slice();
			
					return structuredMessages.find({idOfRecipient: this.userId, nameOfSender: {$in: namesOfNeighbors}}, 
					                               {fields: {nameOfSender: 1, message: 1}});
				}
			}
		}
	}
});

Meteor.publish('adminChatMessagesSubscription', function() {
	adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}});
	if(adminUser !== undefined){
		if(this.userId == adminUser._id) {
			return chatMessages.find({}, {fields: {nameOfSender: 1, message: 1}});
		}
	}
});

Meteor.publish('adminStructuredMessagesSubscription', function() {
	adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}});
	if(adminUser !== undefined){
		if(this.userId == adminUser._id) {
			return structuredMessages.find({nameOfRecipient: "admin"}, {fields: {nameOfSender: 1, message: 1}});
		}
	}
});

Meteor.publish('parametersSubscription', function () {
    return parameters.find({});
});

Meteor.publish('participantsCollectionSubscription', function() {
	return participantsCollection.find({participantId: this.userId});
});

Meteor.publish('communicationLimitsSubscription', function() {
	return communicationLimits.find({id: this.userId});
});

Meteor.publish('potentialPayoutsInfoSubscription', function() {
	return potentialPayoutsInfo.find({id: this.userId});
});