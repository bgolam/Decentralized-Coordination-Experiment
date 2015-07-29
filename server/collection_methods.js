/* Method for clearing data from previous runs of the experiment. */
masterClear = function() {
	clearColors();
	clearNeighborhoods();
	clearSessionInfo();
	clearTimeInfo();
	clearProgressInfo();
	clearPayoutInfo();
	clearColorsInfo();
	clearMessages();
	clearParticipantsCollection();
	clearCommunicationLimits();
	clearPotentialPayoutsInfo();
}

/* Metods for the "potentialPayoutsInfo" collection. */
clearPotentialPayoutsInfo = function() {
	potentialPayoutsInfo.remove({});
}

/* Metods for the "communicationLimits" collection. */
clearCommunicationLimits = function() {
	communicationLimits.remove({});
}

/* Metods for the "participants" collection. */
clearParticipantsCollection = function() {
	participantsCollection.remove({});
}

/* Methods for the "colorsInfo" collection. */
clearColorsInfo = function() {
	colorsInfo.remove({});
}

initializeColorsInfo = function() {
	clearColorsInfo();
	colorsInfo.remove({});
	
	for(var i=0; i<participants.length; i++) {
		var userId = participants[i];
		
		var name = id_name[userId];
		colorsInfo.insert({ name: name });
		
		var namesOfNeighbors = getNamesOfNeighbors(userId);
		var n = namesOfNeighbors.length;
		
		for(var j=0; j<n; j++) {
			var setExpression = {};
			setExpression[namesOfNeighbors[j]] = defaultNodeColor;
			colorsInfo.update({name: name},{$set: setExpression});
		}			
	}
}

updateColorsInfoAnonymized = function(userId, newColor, requestNo) {
	var name = id_name[userId];
	var namesOfNeighbors = getNamesOfNeighbors(userId);
	var actualNewColor = deanonymizeColor(name, newColor);
	var actualOldColor = colors.findOne({name:name}, {fields: {color: 1}}).color; 
	
	if(sessionRunning) {
		// First execute the operations that do not involve querying the database, in order to quickly check
		// for consensus, and if consensus is not reached to allow for other color-updating requests to be
		// processed.
		if(actualOldColor !== "white") { colorCounts[color_number[actualOldColor]]--; }
		colorCounts[color_number[actualNewColor]]++;
		
		/* Log entry. */ recordRequestProcessed(actualNewColor, requestNo);
		/* Log entry. */ recordSessionColorCounts();
		
		if(colorCounts[color_number[actualNewColor]] == numNodes) {
			consensusColor = actualNewColor;
			terminateSession(true);
		}
		else {
			freeToUpdateColors = true;
		}
		
		colors.update({name: name},{$set: {color: actualNewColor}});
	
		for(var i=0; i<namesOfNeighbors.length; i++) {
			var currentName = namesOfNeighbors[i];
			var setExpression = {};
			setExpression[name] = anonymizeColor(currentName,actualNewColor);
			colorsInfo.update({name: currentName},{$set: setExpression});
		}
		
		if(actualOldColor !== "white") { updateSessionCountNew(actualOldColor + "Count", -1); }
		updateSessionCountNew(actualNewColor + "Count", 1);
	}		
}

deanonymizeColor = function(name, color) {
	var node = name_node[name];
	var reversePermutationIndex = node_permutation[node];
	var reversePermutation = reverseColorPermutations[reversePermutationIndex];
	
	var deanonymizedColor = theColors[reversePermutation[color]];
	
	return deanonymizedColor;
}

anonymizeColor = function(name, color) {
	var node = name_node[name];
	var permutationIndex = node_permutation[node];
	var permutation = colorPermutations[permutationIndex];
	var colorNumber = color_number[color];
	
	var anonymizedColor = theColors[permutation[colorNumber]];
	
	return anonymizedColor;
}

/* Methods for the "colors" collection. */
clearColors = function() {
	colors.remove({});
}

setColor = function(nameOfCurrentUser, colorOfCurrentUser, requestNo) {
	freeToUpdateColors = false;		
	
	if(sessionRunning) {
		/* L */ updateColorsInfoAnonymized(Meteor.userId(), colorOfCurrentUser, requestNo);
	}
	
	requestToBeProcessedNext++;
}


/* Methods for the "neighborhoods" collection. */
clearNeighborhoods = function() {
	neighborhoods.remove({});
}

insertNeighborhood = function(id, namesOfNeighbors, neighAdjMatrix) {
	neighborhoods.insert({
		userId: id,
		namesOfNeighbors: namesOfNeighbors,
		neighAdjMatrix: neighAdjMatrix
	});
}

clearNeighborhood = function(id) {
	neighborhoods.remove({userId: id});
}


/* Methods for the "sessionInfo" collection. */
clearSessionInfo = function() {
	sessionInfo.remove({});
}

initializeSessionInfo = function() {
	clearSessionInfo();
	  
	currentSession = 0;  
	sessionInfo.insert({
		type: "sessionNumber",
		value: 0
	}); 
	  
	for(var i=0; i<numberOfColors; i++) {
		sessionInfo.insert({
			type: theColors[i] + "Count",
			value: 0
		});
	}  
	  
	sessionInfo.insert({
		type: "outcome",
		value: false
	});

	sessionInfo.insert({
		type: "numberOfNodes",
		value: 0
	});
}

initializeSessionColorCounts = function() {
	for(var i=0; i<numberOfColors; i++) {
		colorCounts[i] = colors.find({color: theColors[i]}).count();
		
		var query = {};
		query["type"] = theColors[i] + "Count";
		sessionInfo.update(query,{$set: {value: colorCounts[i]}});
	}
	
	sessionInfo.update({type: "outcome"},{$set: {value: false}});
	
	/* Log entry. */ recordSessionColorCounts();
	
	// Probably should not be here!
	sessionInfo.update({type: "numberOfNodes"},{$set: {value: numNodes}});
}

setSessionNumber = function() {
	currentSession++;
	
	/* Log entry. */ recordSessionInitializationStart(currentSession);
	
	sessionInfo.update({type: "sessionNumber"},{$set: {value: currentSession}});
}

setSessionOutcome = function(outcome) {
	sessionInfo.update({type: "outcome"},{$set: {value: outcome}});
	
	/* Log entry. */ recordSessionOutcome(outcome);
}

updateSessionCount = function(typeOfCount, updateCountBy) {
	if((typeOfCount == "redCount") || (typeOfCount == "greenCount")){
		sessionInfo.update({type: typeOfCount},{$inc: {value: updateCountBy}});
	}
} 

updateSessionCountNew = function(typeOfCount, updateCountBy) {
	// In the future, it would be nice to check if typeOfCount is a valid field in the 
	// "sessionInfo" collection.
	sessionInfo.update({type: typeOfCount},{$inc: {value: updateCountBy}});
}   

/* Methods for the "timeInfo" collection. */
clearTimeInfo = function() {
	timeInfo.remove({});
}
  
initializeTimeInfo = function() {
	clearTimeInfo();
	  
	var time = new Date().getTime();
	  
	timeInfo.insert({
		type: "experimentStartTime",
		value: time
	});
	  
	timeInfo.insert({
		type: "currentSessionStartTime",
		value: -1
	});
	  
	timeInfo.insert({
		type: "lastSessionEndTime",
		value: time
	});
	  
	timeInfo.insert({
		type: "currentTime",
		value: time
	});
	
	timeInfo.insert({
		type: "sessionLength",
		value: sessionLength
	});
	
	timeInfo.insert({
		type: "preSessionLength",
		value: preSessionLength
	});
	
	timeInfo.insert({
		type: "postSessionLength",
		value: postSessionLength
	});
}

setTime = function(typeOfTime, time) {
	if((typeOfTime == "currentTime") || (typeOfTime == "currentSessionStartTime") || 
	   (typeOfTime == "lastSessionEndTime") || (typeOfTime == "experimentStartTime")){
		timeInfo.update({type: typeOfTime},{$set: {value: time}});
	}
}

setSessionStartTime = function() {
	time = new Date().getTime();
	setTime("currentTime", time);
	setTime("currentSessionStartTime", time);
	
	/* Log entry. */ recordSessionStart(currentSession);
}

setSessionEndTime = function() {
	time = new Date().getTime();
	setTime("currentTime", time);
	setTime("lastSessionEndTime", time);
	
	/* Log entry. */ recordSessionCompletion(currentSession);
}

setCurrentTime = function() {
	time = new Date().getTime();
	setTime("currentTime", time);
}


/* Methods for the "progressInfo" collection. */
clearProgressInfo = function() {
	progressInfo.remove({});
}

initializeProgressInfo = function() {
	clearProgressInfo();
	  
	progressInfo.insert({
		type: "experimentInProgress",
		value: false
	});
	  
	progressInfo.insert({
		type: "sessionInProgress",
		value: false
	});
	  
	progressInfo.insert({
		type: "preSessionInProgress",
		value: false
	});
	  
	progressInfo.insert({
		type: "postSessionInProgress",
		value: false
	});
}

setProgressValue = function(typeOfValue, progressValue) {
	if((typeOfValue == "preSessionInProgress") || (typeOfValue == "sessionInProgress") || 
	   (typeOfValue == "postSessionInProgress") || (typeOfValue == "experimentInProgress")){
		progressInfo.update({type: typeOfValue},{$set: {value: progressValue}});
	}
}

setExperimentProgress = function(progressValue) {
	setProgressValue("experimentInProgress", progressValue);
	
	if(progressValue) {
		/* Log entry. */ recordExperimentStart();
	}
	else {
		/* Log entry. */ recordExperimentCompletion();
	}
}

setSessionProgress = function(progressValue) {
	sessionRunning = progressValue;
	setProgressValue("sessionInProgress", progressValue);
	
	if(progressValue) {
		/* L */ setSessionStartTime();
	}
	else {
		/* L */ setSessionEndTime();
	}
}

setPreSessionProgress = function(progressValue) {
	setProgressValue("preSessionInProgress", progressValue);
}

setPostSessionProgress = function(progressValue) {
	setProgressValue("postSessionInProgress", progressValue);
}
  
  
/* Methods for the "experimentLog" collection. */  
clearExperimentLog = function() {
	experimentLog.remove({});
}  

insertExperimentLogEntry = function(typeOfEntry, entry) {
	var date = new Date();
	var timestamp = date.toLocaleTimeString();
	
	var milliseconds = date.getMilliseconds();
	millisecondsTimestamp = ".";
	if(milliseconds < 10) { millisecondsTimestamp += "00"; }
	else if(milliseconds < 100) {millisecondsTimestamp += "0"; }
	millisecondsTimestamp += milliseconds;
	
	timestamp += millisecondsTimestamp;
	
	experimentLog.insert({
		timestamp: timestamp,
		type: typeOfEntry,
		entry: entry
	}); 
}

/* Methods for the "chatMessages" collection. */  
clearChatMessages = function() {
	chatMessages.remove({});
} 

/* Methods for the "structuredMessages" collection. */  
clearStructuredMessages = function() {
	structuredMessages.remove({});
} 

/* General methods for the communication collections. */  
clearMessages = function() {
	clearChatMessages();
	clearStructuredMessages();
}

/* ================================================================================ */
recordExperimentStart = function() {
	insertExperimentLogEntry("EXPS1", "A new experiment has started.");
}

recordExperimentCompletion = function() {
	insertExperimentLogEntry("EXPT2", "The experiment has ended.");
}

recordExperimentInitializationStart = function() {
	insertExperimentLogEntry("ITES1", "");
}

recordExperimentInitializationCompletion = function() {
	insertExperimentLogEntry("ITET2", "");
}

recordSessionInitializationStart = function(sessionNumber) {
	insertExperimentLogEntry("ITZS1", "" + sessionNumber)
}

recordSessionInitializationCompletion = function(sessionNumber) {
	insertExperimentLogEntry("ITZT2", "" + sessionNumber)
}

recordSessionStart = function(sessionNumber) {
	insertExperimentLogEntry("SESS1", "" + sessionNumber);
}

recordSessionCompletion = function(sessionNumber) {
	insertExperimentLogEntry("SEST2", "" + sessionNumber);
}

recordExperimentParticipants = function(participants) {
	var listOfParticipants = "";
	for(var i=0; i<participants.length; i++) {
		listOfParticipants += participants[i] + "\t" + Meteor.users.findOne({_id: participants[i]}).emails[0].address + "\n";
	}
	
	// Remove the last "\n" character.
	listOfParticipants = listOfParticipants.slice(0, listOfParticipants.length - 1);
	
	insertExperimentLogEntry("PART1", listOfParticipants);
}

recordNodesToNamesCorrespondence = function() {
	var correspondence = "";
	
	for(var i=0; i<numNodes; i++) {
		if(i < 10) correspondence += " ";
		correspondence += i + "\t" + node_name[i] + "\n";
	}
	
	// Remove the last "\n" character.
	correspondence = correspondence.slice(0, correspondence.length - 1);
	
	insertExperimentLogEntry("NDNM1", correspondence);
}

recordNetworkAdjacencyMatrix = function(adjMatrix) {
	var adjMatrixRecord = "";
	
	for(var i=0; i<adjMatrix.length; i++) {
		for(var j=0; j<adjMatrix[i].length; j++) {
			adjMatrixRecord += adjMatrix[i][j] + "\t";
		}
		adjMatrixRecord += "\n"
	}
	
	// Remove the last "\n" character.
	adjMatrixRecord = adjMatrixRecord.slice(0, adjMatrixRecord.length - 1);
	
	insertExperimentLogEntry("ADJM1", adjMatrixRecord);
}

recordParticipantsToNamesCorrespondence = function() {
	var correspondence = "";
	
	for (var userId in id_name) {
		if (id_name.hasOwnProperty(userId)) {
			correspondence += userId + "\t" + id_name[userId] + "\n";
		}
	}
	
	// Remove the last "\n" character.
	correspondence = correspondence.slice(0, correspondence.length - 1);
	
	insertExperimentLogEntry("PRNM1", correspondence);
}

recordInitialAssignmentOfColors = function() {
	var assignmentOfColors = "";
	
	colors.find({}).forEach( function(document) {
		assignmentOfColors += document.name + "\t" + document.color + "\n";
	});
	
	// Remove the last "\n" character.
	assignmentOfColors = assignmentOfColors.slice(0, assignmentOfColors.length - 1);
	
	insertExperimentLogEntry("COLA1", assignmentOfColors);
}

recordSessionCommunicationParameters = function() {
	var communicationParameters = "";
	
	communicationParameters += "communication\t" + communication + "\n";
	if(communication) {
		communicationParameters += "globalCommunication\t" + globalCommunication + "\n";
		communicationParameters += "structuredCommunication\t" + structuredCommunication + "\n";	
	}
	
	// Remove the last "\n" character.
	communicationParameters = communicationParameters.slice(0, communicationParameters.length - 1);
	
	insertExperimentLogEntry("PRMM1", communicationParameters);
}

recordSessionCommunicationCostParameters = function() {
	// No need to record communication cost parameters if no communication is taking place in the current session.
	if(!communication) {
		return;
	}
	
	var communicationCostParameters = "";
	
	communicationCostParameters += "costBasedCommunication\t" + costBasedCommunication + "\n";
	
	if(costBasedCommunication) {
		communicationCostParameters += "communicationCostLevel\t" + communicationCostLevel + "\n";
	}
	else {
		communicationCostParameters += "messageLengthBound\t" + messageLengthBound + "\n";
	}	
	
	// Remove the last "\n" character.
	communicationCostParameters = communicationCostParameters.slice(0, communicationCostParameters.length - 1);
	
	insertExperimentLogEntry("PRMC2", communicationCostParameters);
}

recordSessionIncentivesConflictParameters = function() {
	var incentivesConflictParameters = "";
	
	if(balancedPreferences) {
		incentivesConflictParameters += "incentivesConflictLevel\t" + incentivesConflictLevel + "\n"; 
	}
	
	incentivesConflictParameters += "homophilicPreferences\t" + homophilicPreferences + "\n";

	// Remove the last "\n" character.
	incentivesConflictParameters = incentivesConflictParameters.slice(0, incentivesConflictParameters.length - 1);
	
	insertExperimentLogEntry("PRMI3", incentivesConflictParameters);
}

recordPotentialSessionPayouts = function() {
	var potSessionPayouts = "";
	
	for(var userId in potentialSessionPayouts) {
		if(potentialSessionPayouts.hasOwnProperty(userId)) {
			potSessionPayouts += userId;
			
			for(var color in potentialSessionPayouts[userId]) {
 			    if((potentialSessionPayouts[userId]).hasOwnProperty(color)) {
					potSessionPayouts += "\t" + potentialSessionPayouts[userId][color]; 
 				}
			}
			
			potSessionPayouts += "\n";
		}
	}
	
	// Remove the last "\n" character.
	potSessionPayouts = potSessionPayouts.slice(0, potSessionPayouts.length - 1);
	
	insertExperimentLogEntry("PYSP2", potSessionPayouts);
}

recordSessionColorCounts = function() {
	var record = "";
	
	for(var i=0; i<numberOfColors; i++) {
		record += theColors[i] + "\t" + colorCounts[i] + "\n";
	}  
	
	if(record !== "") {
		// Remove the last "\n" character.
		record = record.slice(0, record.length - 1);
		
		insertExperimentLogEntry("COLC2", record);
	}
}

recordRequestMade = function(name, newColor, requestNo) {
	var actualNewColor = deanonymizeColor(name, newColor);
	
	insertExperimentLogEntry("CRQM3", requestNo + "\t" + actualNewColor);
}

recordRequestCancelled = function(name, newColor, requestNo) {
	var actualNewColor = deanonymizeColor(name, newColor);
	
	insertExperimentLogEntry("CRQC5", requestNo + "\t" + actualNewColor);
}

recordRequestProcessed = function(actualNewColor, requestNo) {
	insertExperimentLogEntry("CRQP4", requestNo + "\t" + actualNewColor);
}

// Keep record of the type of consensus being reached!!!
recordSessionOutcome = function(outcome) {
	var outcomeRecord = "" + outcome;
	
	insertExperimentLogEntry("SESO3", outcomeRecord);
}

recordSessionPayouts = function() {
	var sessionPayoutsRecord = "";
	
	payoutInfo.find({}).forEach( function(user) {
		sessionPayoutsRecord += user.id + "\t" + user.sessionPayout + "\n";
	});
	
	// Remove the last "\n" character.
	sessionPayoutsRecord = sessionPayoutsRecord.slice(0, sessionPayoutsRecord.length - 1);
	
	insertExperimentLogEntry("PYSA3", sessionPayoutsRecord);
}

recordExperimentPayouts = function() {
	var experimentPayoutsRecord = "";
	
	payoutInfo.find({}).forEach( function(user) {
		experimentPayoutsRecord += user.id + "\t" + user.totalPayout + "\n";
	});
	
	// Remove the last "\n" character.
	experimentPayoutsRecord = experimentPayoutsRecord.slice(0, experimentPayoutsRecord.length - 1);
	
	insertExperimentLogEntry("PYEA1", experimentPayoutsRecord);
}

var prepareMessageRecord = function(userId, structured, message) {
	var messageRecord = id_name[userId] + "\t" + structured;
	
	if(!structured) {
		messageRecord += "\t" + message;
	}
	
	return messageRecord;
}

recordMessageRequest = function(userId, structured, message) {
	var messageRecord = prepareMessageRecord(userId, structured, message);
	insertExperimentLogEntry("MSGR1", messageRecord);
}

recordMessageSent = function(userId, structured, message) {
	var messageRecord = prepareMessageRecord(userId, structured, message);
	insertExperimentLogEntry("MSGS2", messageRecord);
}

recordMessageFailed = function(userId, structured, message) {
	var messageRecord = prepareMessageRecord(userId, structured, message);
	insertExperimentLogEntry("MSGF3", messageRecord);
}

/* Methods for the "parameters" collection. */  
clearParameters = function() {
    parameters.remove({});
}

initializeParameters = function() {
	clearParameters();
	
	communication = defaultCommunication;
	parameters.insert({
		type: "communication",
		value: defaultCommunication
	}); 
	
	globalCommunication = defaultGlobalCommunication;
	parameters.insert({
		type: "globalCommunication",
		value: defaultGlobalCommunication
	});
	
	structuredCommunication = defaultStructuredCommunication;
	parameters.insert({
		type: "structuredCommunication",
		value: defaultStructuredCommunication
	}); 
	
	costBasedCommunication = defaultCostBasedCommunication;
	parameters.insert({
		type: "costBasedCommunication",
		value: defaultCostBasedCommunication
	}); 
	
	communicationCostLevel = defaultCommunicationCostLevel;
	parameters.insert({
		type: "communicationCostLevel",
		value: defaultCommunicationCostLevel
	}); 	

	messageLengthBound = defaultMessageLengthBound;
	parameters.insert({
		type: "messageLengthBound",
		value: defaultMessageLengthBound
	}); 
	
	incentivesConflictLevel = defaultIncentivesConflictLevel;
	parameters.insert({
		type: "incentivesConflictLevel",
		value: defaultIncentivesConflictLevel
	});
	
	homophilicPreferences = defaultHomophilicPreferences;	
	parameters.insert({
		type: "homophilicPreferences",
		value: defaultHomophilicPreferences
	});

}

var randomizeCommunicationParameters = function() {
	var value = Math.random();
	
	if(value < (1/3)) {							// No communication.
		communication = false;
	}
	else {
		communication = true;
		if(value < (2/3)) globalCommunication = false;
		else globalCommunication = true;

		parameters.update({type: "globalCommunication"},{$set: {value: globalCommunication}});
	}
	
	parameters.update({type: "communication"},{$set: {value: communication}});
	
	if(communication) {
		// randomizeCommunicationNature();
		setCommunicationNatureToUnstructured();
	}
}

var setCommunicationNatureToUnstructured = function() {
	structuredCommunication = false;	
	parameters.update({type: "structuredCommunication"},{$set: {value: structuredCommunication}});
}

// Communication can be structured or unstructured.
var randomizeCommunicationNature = function() {
	var value = Math.random();
	
	if(value < (1/2)) structuredCommunication = true;
	else structuredCommunication = false;	
	
	parameters.update({type: "structuredCommunication"},{$set: {value: structuredCommunication}});
}

setSessionCommunicationParameters = function() {
	// Set communication parameters here!!!
	randomizeCommunicationParameters();
	
	console.log("communication: ", communication);
	console.log("globalCommunication: ", globalCommunication);
	console.log("structuredCommunication: ", structuredCommunication);
	
	/* Log entry. */ recordSessionCommunicationParameters();
}

var randomizeCommunicationCostParameters = function() {
	var value = Math.random();
	
	if(value < (1/2)) {
		costBasedCommunication  = true;						// Cost-based communication.
		randomizeCommunicationCostLevel();
	}
	else {
		costBasedCommunication = false;						// No-cost communication.
		randomizeMessageLengthBound();
	}
	
	parameters.update({type: "costBasedCommunication"},{$set: {value: costBasedCommunication}});
}

var randomizeCommunicationCostLevel = function() {
	var value = Math.random();
	
	if(value < (1/3)) communicationCostLevel = "low";
	else if(value < (2/3)) communicationCostLevel = "medium";
	else communicationCostLevel = "high";
		
	parameters.update({type: "communicationCostLevel"},{$set: {value: communicationCostLevel}});
}

var randomizeMessageLengthBound = function() {
	var value = Math.random();
	
	if(value < (1/3)) messageLengthBound = 100;
	else if(value < (2/3)) messageLengthBound = 20;
	else messageLengthBound = 10;

	parameters.update({type: "messageLengthBound"},{$set: {value: messageLengthBound}});
}

setSessionCommunicationCostParameters = function() {
	// Set communication cost parameters here!!!
	randomizeCommunicationCostParameters();
	
	console.log("costBasedCommunication: ", costBasedCommunication);
	console.log("communicationCostLevel: ", communicationCostLevel);
	console.log("messageLengthBound: ", messageLengthBound);
	
	/* Log entry. */ recordSessionCommunicationCostParameters();
	
}

var randomizeIncentivesConflictParameters = function() {
	randomizeIncentivesConflictLevel();
	randomizeHomophilicPreferences();
}

var randomizeIncentivesConflictLevel = function() {
	var value = Math.random();
	
	if(value < (1/4)) incentivesConflictLevel = "none"; 
	else if(value < (2/4)) incentivesConflictLevel = "low";
	else if(value < (3/4)) incentivesConflictLevel = "medium";
	else incentivesConflictLevel = "high";
	
	parameters.update({type: "incentivesConflictLevel"},{$set: {value: incentivesConflictLevel}});
}

var randomizeHomophilicPreferences = function() {
	var value = Math.random();
	
	if(value < (1/2)) homophilicPreferences = true;
	else homophilicPreferences = false;
	
	parameters.update({type: "homophilicPreferences"},{$set: {value: homophilicPreferences}});
}

setSessionIncentivesConflictParameters = function() {
	// Set incentive conflict cost parameters here!!!
	randomizeIncentivesConflictParameters();
	
	console.log("incentivesConflictLevel: ", incentivesConflictLevel);
	console.log("homophilicPreferences: ", homophilicPreferences);
	
	/* Log entry. */ recordSessionIncentivesConflictParameters();
	
}

/* Methods for the "payoutInfo" collection. */  
clearPayoutInfo = function() {
    payoutInfo.remove({});
}

insertPayoutInfoEntry = function(userId, sessionPayout, totalPayout) {
	payoutInfo.insert({
		id: userId,
		sessionPayout: sessionPayout,
		totalPayout: totalPayout
	}); 
}

initializePayoutInfo = function(participants) {
	clearPayoutInfo();
	
	for(var i=0; i<participants.length; i++){
		insertPayoutInfoEntry(participants[i], 0, 0);
	}
}

updateTotalPayoutInfo = function(userId, updateTotalPayoutBy) {
	payoutInfo.update({id: userId},{$inc: {totalPayout: updateTotalPayoutBy}});
}

setSessionPayoutInfo = function(userId, sessionPayout) {
	payoutInfo.update({id: userId},{$set: {sessionPayout: sessionPayout}});
}

initializeSessionPayoutInfo = function() {
	payoutInfo.update({}, {$set: {sessionPayout: 0}});
}

/* Methods for dealing with server-side-only data. */  
initializeListOfParticipants = function() {
	// The experiment participants are all those users who are currently logged in.
	participants = [];
	Meteor.users.find({ "status.online": true, _id: {$ne: adminUserId}}, {fields: {_id: 1}}).forEach( function(user) {
		participants.push(user._id);
		participantsCollection.insert({
			participantId: user._id
		});
	});

	/* Log entry. */ recordExperimentParticipants(participants);
}

assignNodesToNames = function() {
	// Need to make this piece of code more robust - make sure that
	// there are at least numNodes names available.
	
	numNodes = participants.length;	
	
	for(var i=0; i<numNodes; i++) {
		name_node[listOfNames[i]] = i;
		node_name[i] = listOfNames[i];
	}
	
	/* Log entry. */ recordNodesToNamesCorrespondence();
}