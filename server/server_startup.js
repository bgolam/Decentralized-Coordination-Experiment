Meteor.startup(function () {
	initializePersistentInfo();
	masterClear();
	
	// Retreive the userId of the admin user account if it has already been created, or observe changes in the 
	// Meteor.users collection to retrieve it at the moment when the account is created.
	var adminAccount = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}});
	if(adminAccount !== undefined) {
		adminUserId = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}})._id;
	}
	else {
		usersQuery = Meteor.users.find();
		usersHandle = usersQuery.observe({
			added: function(user) {
				if(user.emails[0].address == "admin@admin") {
					adminUserId = user._id;
				}
			}
		});
	}	
	
	UserStatus.events.on("connectionLogin", function(fields) {
		return recordUserLoggingIn(fields.userId, fields.connectionId, fields.ipAddr, fields.userAgent, fields.loginTime);
	});
	
	UserStatus.events.on("connectionLogout", function(fields) {
		return recordUserLoggingOut(fields.userId, fields.connectionId, fields.lastActivity, fields.logoutTime);
	});
});

recordUserLoggingIn = function(userId, connectionId, ipAddr, userAgent, loginTime) {
	var record = userId + "\t" + connectionId + "\t" + ipAddr + "\t" + userAgent + "\t" + loginTime;
	
	console.log("USLI1\t" + record);
	
	insertExperimentLogEntry("USLI1", record);
}

recordUserLoggingOut = function(userId, connectionId, lastActivity, logoutTime) {
	var record = userId + "\t" + connectionId + "\t" + lastActivity + "\t" + logoutTime;
	
	console.log("USLO2\t" + record);
	
	insertExperimentLogEntry("USLO2", record);
}

var initializePersistentInfo = function() {
	if(persistentInfo.find({}).count() == 0) {
		persistentInfo.insert({
			type: "experimentNumber",
			value: 0
		});
	}
	else if(persistentInfoReset) {
		persistentInfo.clear();
		persistentInfo.insert({
			type: "experimentNumber",
			value: 0
		});
	}
}