/* Methods that will be executed on the server, but may be called by the clients. */
Meteor.methods({
  // Set (update) the color corresponding to the current user.
  'updateColor': function(newColor) {
	  var requestNo = requestToBeAssignedNext;
	  requestToBeAssignedNext++;

	  /* Log entry. */ recordRequestMade(getNameOfCurrentUser(), newColor, requestNo);
	  
	  updateColor(getNameOfCurrentUser(), newColor, requestNo);
  },
  'startExperiment': function() {
	  if(this.userId == adminUserId) {
		  previousExperimentCleanup();
		  runExperiment();
	  }
  },
  'clearExperimentLog': function() {
	  if(this.userId == adminUserId) {
		  clearExperimentLog();  
	  }
  },
  'getExperimentLog': function() {
	  if(this.userId == adminUserId) {
		  var textToWrite = "";
   
		  experimentLog.find({}).forEach( function(record) {
			  textToWrite += "###\n";
			  
			  textToWrite += record.timestamp + "\n";
			  textToWrite += record.type + "\n";
			  if(record.entry !== "") {
				  textToWrite += record.entry + "\n";  
			  }
			  
			  textToWrite += "###\n";
		  });
	  
		  // Remove the last "\n" character, if any.
		  if(textToWrite[textToWrite.length-1] == "\n") {
			  textToWrite = textToWrite.slice(0, textToWrite.length-1);
		  }
	  
		  return textToWrite;
	  }
  },
  'sendChatMessage': function(message) {
	  /* Log entry. */ recordMessageRequest(this.userId, false, message);
	  
	  //"Translate" message colors to the "real" colors.
	  message = deanonymizeMessageColorNames(id_name[this.userId], message);
	  
	  if(sessionRunning) { 
		  var realMessageLength = calculateRealMessageLength(message);
		  // var messageCostInfo = calculateRelativeMessageCost(this.userId, message.length);
		  var messageCostInfo = calculateRelativeMessageCost(this.userId, realMessageLength);
	  
		  if(messageCostInfo.costIsAffordable) {
			  // updateCommunicationLimits(this.userId, message.length);
			  updateCommunicationLimits(this.userId, realMessageLength);
			  
			  var date = new Date();
			  var timestamp = date.toLocaleTimeString();
	  
			  var name = getNameOfCurrentUser();
	  
			  for(var i=0; i < participants.length; i++) {
				  var nameOfRecipient = id_name[participants[i]];
			  
				  structuredMessages.insert({
					  idOfSender: this.userId,
					  nameOfSender: name,
					  idOfRecipient: participants[i],
					  nameOfRecipient: nameOfRecipient,
					  message: anonymizeMessageColorNames(nameOfRecipient, message),
					  timestamp: timestamp
				  });  
			  }
	  
			  // Insert another, special, copy of the message (using teh actual color labels) for the admin user.
			  var adminName = "admin";
			  var adminId;
		
			  var admin = Meteor.users.findOne({emails: { $elemMatch: {address: "admin@admin"}}});
			  if(admin !== undefined) {
				  id = admin._id;
			  }
		  
			  structuredMessages.insert({
				  idOfSender: this.userId,
				  nameOfSender: name,
				  idOfRecipient: adminId,
				  nameOfRecipient: adminName,
				  message: message,
				  timestamp: timestamp
			  });  
			  
			  sessionCommunicationUsageLevels[this.userId] += messageCostInfo.relativeMessageCost;
			  
			  /* Log entry. */ recordMessageSent(this.userId, false, message);
			  
			  updatePotentialPayoutsInfo(this.userId);
		  }
		  else {
			  /* Log entry. */ recordMessageFailed(this.userId, false, message);
		  }
	  }
  },
  'sendStructuredMessage': function() {
	  /* Log entry. */ recordMessageRequest(this.userId, true, "");
	  
	  if(sessionRunning) {
		  var messageCostInfo = calculateRelativeMessageCost(this.userId, structuredCommunicationCharactersNumberMultiplier);
		  
		  if(messageCostInfo.costIsAffordable) {
			  
			  updateCommunicationLimits(this.userId, 1);
			  
			  var date = new Date();
			  var timestamp = date.toLocaleTimeString();
	  
			  var name = getNameOfCurrentUser();
	  
			  neighborhoodColorCounts = {};
			  for(var i=0; i<theColors.length; i++) {
				  neighborhoodColorCounts[theColors[i]] = 0;
			  }
	  
			  neighborhoodColors = colorsInfo.findOne({name: name});
			  if(neighborhoodColors !== undefined) {
				  for(var key in neighborhoodColors) {
					  if(neighborhoodColors.hasOwnProperty(key)) {
						  if((key !== "_id") && (key !== "name")) {
							  neighborhoodColorCounts[deanonymizeColor(name, neighborhoodColors[key])]++;
						  }
					  }
				  }
			  }
			  
			  for(var i=0; i < participants.length; i++) {
				  var nameOfRecipient = id_name[participants[i]];
			  
				  var message = neighborhoodColorCounts[anonymizeColor(nameOfRecipient, theColors[0])] + " " + (theColors[0]).toUpperCase();
				  for(var j=1; j<theColors.length; j++) {
					  message += ", " + neighborhoodColorCounts[anonymizeColor(nameOfRecipient, theColors[j])] + " " + (theColors[j]).toUpperCase();
				  }
			  
				  structuredMessages.insert({
					  idOfSender: this.userId,
					  nameOfSender: name,
					  idOfRecipient: participants[i],
					  nameOfRecipient: nameOfRecipient,
					  message: message,
					  timestamp: timestamp
				  });  
			  }
		  
			  // Insert another, special, copy of the message (using teh actual color labels) for the admin user.
			  var adminName = "admin";
			  var adminId;
		
			  var admin = Meteor.users.findOne({emails: { $elemMatch: {address: "admin@admin"}}});
			  if(admin !== undefined) {
				  id = admin._id;
			  }
		  
			  var message = neighborhoodColorCounts[theColors[0]] + " " + (theColors[0]).toUpperCase();
			  for(var j=1; j<theColors.length; j++) {
				  message += ", " + neighborhoodColorCounts[theColors[j]] + " " + (theColors[j]).toUpperCase();
			  }
		  
			  structuredMessages.insert({
				  idOfSender: this.userId,
				  nameOfSender: name,
				  idOfRecipient: adminId,
				  nameOfRecipient: adminName,
				  message: message,
				  timestamp: timestamp
			  });  
			  
			  sessionCommunicationUsageLevels[this.userId] += messageCostInfo.relativeMessageCost;
			  
			  /* Log entry. */ recordMessageSent(this.userId, true, "");
			  
			  updatePotentialPayoutsInfo(this.userId);
		  }
		  else {
			  /* Log entry. */ recordMessageFailed(this.userId, true, "");
		  }
		 
	  }
  }
});

var deanonymizeMessageColorNames = function(name, message) {
	var processedMessage = message;
	
	for(var i=0; i<theColors.length; i++) {
		processedMessage = processedMessage.replace(new RegExp("\\b" + theColors[i] + "\\b", "gi"), 
		                                           (deanonymizeColor(name, theColors[i])).toUpperCase() + "CER");
	}
	
	for(var i=0; i<theColors.length; i++) {
		processedMessage = processedMessage.replace(new RegExp("\\b" + (deanonymizeColor(name, theColors[i])).toUpperCase() + "CER" + "\\b", "gi"), 
		                                            (deanonymizeColor(name, theColors[i])).toUpperCase());
	}
	
	return processedMessage;
}

var anonymizeMessageColorNames = function(name, message) {
	var processedMessage = message;
	
	for(var i=0; i<theColors.length; i++) {
		processedMessage = processedMessage.replace(new RegExp("\\b" + theColors[i] + "\\b", "gi"), 
											       (anonymizeColor(name, theColors[i])).toUpperCase() + "CER");
	}
	
	for(var i=0; i<theColors.length; i++) {
		processedMessage = processedMessage.replace(new RegExp("\\b" + (anonymizeColor(name, theColors[i])).toUpperCase() + "CER" + "\\b", "gi"), 
		                                           (anonymizeColor(name, theColors[i])).toUpperCase());
	}
	
	return processedMessage;
}

// A method which calls the setColor function, but only when a session is in progress and no other
// color-updating request is being currently processed by the server.
var updateColor = function(name, newColor, requestNo) {
	if(sessionRunning) {
		if(freeToUpdateColors && (requestNo == requestToBeProcessedNext)) {
			/* L */ setColor(name, newColor, requestNo);
		}
		else {
			setTimeout(Meteor.bindEnvironment(function() {
				updateColor(name, newColor, requestNo);
			}), waitForTurnTime);
		}
	}
	else {
		/* Log entry. */ recordRequestCancelled(getNameOfCurrentUser(), newColor, requestNo);
	}
}

// A method for calculating the character cost of a message, taking into account the fact that different color names,
// have different numbers of characters.
var calculateRealMessageLength = function(message) {
	var realMessageLength = message.length;
	
	for(var i=0; i<theColors.length; i++) {
		var matchedColorOccurences = message.match(new RegExp("\\b" + theColors[i] + "\\b", "gi"));
		
		if(matchedColorOccurences) {
			var numberOfColorOccurences = matchedColorOccurences.length; 
			realMessageLength += (structuredCommunicationCharactersNumberMultiplier - (theColors[i]).length) * numberOfColorOccurences;
		}
	}
	
	return Math.max(realMessageLength, 0);
}

// A method for calculating the potential cost of a message (based on the minimum potential payout) of the sender, and whether that cost
// is feasible (the player can send the message )
var calculateRelativeMessageCost = function(userId, messageLength) {	
	var messageCostInfo = {};
	var relativeMessageCost;
	var costIsAffordable = false;
	
	if(costBasedCommunication) {
		relativeMessageCost = communicationCostMultipliers[communicationCostLevel] * messageLength;
		if(relativeMessageCost < (1 - sessionCommunicationUsageLevels[userId] + communicationCostMultipliers[communicationCostLevel])) {
			costIsAffordable = true;
		}
	}
	else {
		relativeMessageCost = (1/messageLengthBound) * messageLength;
		if(relativeMessageCost < (1 - sessionCommunicationUsageLevels[userId] + 1/messageLengthBound)) {
			costIsAffordable = true;
		}
	}
	
	messageCostInfo["relativeMessageCost"] = relativeMessageCost;
	messageCostInfo["costIsAffordable"] = costIsAffordable;
	
	return messageCostInfo;
}

var updateCommunicationLimits = function(userId, updateAmount) {
	communicationLimits.update({id: userId},{$inc: {unitsRemaining: (-updateAmount)}});
}

var updatePotentialPayoutsInfo = function(userId) {
	if(costBasedCommunication) {
		var minPotentialPayout = Math.min(potentialSessionPayouts[userId][theColors[0]], 
										  potentialSessionPayouts[userId][theColors[1]]);
										  
		// The cost of communication is relative to the participant's minimum potential payout.
		var sessionCommunicationCost = minPotentialPayout * sessionCommunicationUsageLevels[userId];
		
		for(var i=0; i<theColors.length; i++) {
			var setObject = {};
			var anonymizedColor = anonymizeColor(id_name[userId], theColors[i]);
			setObject[anonymizedColor] = potentialSessionPayouts[userId][theColors[i]] - sessionCommunicationCost;
			potentialPayoutsInfo.update({id: userId}, {$set: setObject});
		}
	}
}