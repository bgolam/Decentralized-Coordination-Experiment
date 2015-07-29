var sessionTimeout, timerIntervalP, timerIntervalS, preSessionTimeout, postSessionTimeout;

runExperiment = function() {
	// Clear any active "intervals" and "timeouts" from previous experiments, as well as collections data (needed when a new experiment is started,
	// before the previous experiment is completed).
	clearPastExperimentsData();
	
	updatePersistentInfo();
	
	/* Log entry. */ recordExperimentInitializationStart();
	
	// Initialize the "parameters" collection with default (baseline) parameter values (as well as the
	// corresponding server-side parameter variables). Actual parameters will be set for and varied 
	// across individual sessions of an experiment.
	initializeParameters();
	
	/* L */ initializeListOfParticipants();
	
	initializePayoutInfo(participants);
	
	/* L */ assignNodesToNames();
	
	initializeTimeInfo();
	
	initializeProgressInfo();
	
	initializeSessionInfo();
	
	/* Log entry. */ recordExperimentInitializationCompletion();
	
	/* L */ setExperimentProgress(true);
	
	runPreSession(); 
}

runPreSession = function() {
	// If this is not the last session, ...
	if(currentSession < sessionsPerExperiment){
		setPreSessionProgress(true);
		
		// ... countdown to next session.
	    timerIntervalP = setInterval(Meteor.bindEnvironment(timer), timeUpdateRate);		
		preSessionTimeout = setTimeout(Meteor.bindEnvironment(terminatePreSession), preSessionLength * 1000);
	}
	// If this is the last session, end the experiment.
	else {
		/* Log entry. */ recordExperimentPayouts();
		/* L */ setExperimentProgress(false);
		masterClear();
	}
}

timer = function() {
	setCurrentTime();
}

terminatePreSession = function() {
	clearInterval(timerIntervalP);
	setPreSessionProgress(false);
	
	// Start next session.
	runSession();  
}

runSession = function() {
	initializeSession();
	
	// Initialize the information related to enumerating and processing requests for color changes.
	requestToBeAssignedNext = 1;
	requestToBeProcessedNext = 1;
	freeToUpdateColors = true;
	
	/* L */ setSessionProgress(true);
	
	timerIntervalS = setInterval(Meteor.bindEnvironment(timer), timeUpdateRate);
	sessionTimeout = setTimeout(Meteor.bindEnvironment(function(){ terminateSession(false); }), sessionLength * 1000);	
}

initializeSession = function() {
	/* L */ setSessionNumber();
	
	adjMatrix = generateConnectedRandomErdosRenyiGraph(numNodes, 0.5);
	/* Log entry. */ recordNetworkAdjacencyMatrix(adjMatrix);
	
	/* L */ assignNeighborhoodsToClients();
	
	/* L */ assignColorsToNodes();
	
	// If colorAnonymizationActive ==  false, then initializeAnonymizationInfo will assign the identity color 
	// permutation to each node ("red" will be mapped to "red", "green" will be mapped to "green").
	/* L */ initializeAnonymizationInfo();
	
	/* L */ setSessionCommunicationParameters();
	
	if(communication) {
		/* L */ // setSessionCommunicationCostParameters();
	}
	
	/* L */ setSessionIncentivesConflictParameters();
	
	initializeSessionPayoutInfo();
	
	/* L */ initializePotentialSessionPayouts();
	
	// We need to make sure that users cannot send messages beyound the corresponding total (character) count!
	initializeSessionCommunicationUsageLevels();
	if(communication) {
		initializeCommunicationLimits();
	}
	
	
	/* L */ initializeSessionColorCounts();
	
	clearMessages();
	
	/* Log entry. */ recordSessionInitializationCompletion(currentSession);
}

terminateSession = function(outcome) {
	freeToUpdateColors = false;
	
	/* L */ setSessionProgress(false);
	
	clearTimeout(sessionTimeout);
	clearInterval(timerIntervalS);
	
	/* L */ setSessionOutcome(outcome);
	
	/* L */ applyIncentiveSessionPayouts(outcome);
	
	runPostSession();
}

runPostSession = function() {
	setPostSessionProgress(true);
	
	postSessionTimeout = setTimeout(Meteor.bindEnvironment(function() {
		    setPostSessionProgress(false);
			runPreSession();
	}), postSessionLength * 1000);
}

/* Methods used for initializing the experiment setup (clearing any remaining data from previous 
   runs of the experiment, establishing the names-nodes-users correspondence, and assigning initial colors to nodes). */
previousExperimentCleanup = function() {
	experimentProgress = progressInfo.findOne({type: "experimentInProgress"}, {fields: {value: 1}});
	if((experimentProgress !== undefined) && experimentProgress.value) {
		clearInterval(timerIntervalP);
		clearInterval(timerIntervalS);
		clearTimeout(sessionTimeout);
		clearTimeout(preSessionTimeout);
		clearTimeout(postSessionTimeout);
	}
}

initializeNeighborhood = function(id) {
	// Extract the names corresponding to the current user and its neighbors.
	var namesOfNeighbors = getNamesOfNeighbors(id);
		
	// Exctract the corresponding neighborhood adjacency matrix.
	var neighAdjMatrix = getNeighborhoodAdjMatrix(namesOfNeighbors, id);
		
	// Create a document containing the relevant neighborhood data for the particular user.
	insertNeighborhood(id, namesOfNeighbors, neighAdjMatrix);
}

initializeAdminNeighborhood = function() {
	var namesOfNeighbors = [];
	for(var index in node_name) {
		if(index < numNodes)
			namesOfNeighbors.push(node_name[index]); 
	}
	var neighAdjMatrix = adjMatrix.slice();
	
	// Create a document containing the entire network data, for the admin user.
	var id;
	var admin = Meteor.users.findOne({emails: { $elemMatch: {address: "admin@admin"}}});
	if(admin !== undefined) {
		id = admin._id;
	}
	
	insertNeighborhood(id, namesOfNeighbors, neighAdjMatrix);
}

// Change name to assignNeighborhoodsToParticipants
assignNeighborhoodsToClients = function() {
	clearNeighborhoods();
	
	// Keep track of names that have already been assigned to users.
	nameTaken = new Array(numNodes);
	for (var i = 0; i < numNodes; i++) nameTaken[i] = false;
	namesRemaining = numNodes;
	
	for(var i=0; i<participants.length; i++) {
		var userId = participants[i];
		if(namesRemaining > 0) {
			var n;
			do { n = Math.floor(Math.random() * numNodes); } while (nameTaken[n]);
			id_name[userId] = node_name[n];
			name_id[node_name[n]] = userId;
			nameTaken[n] = true; 
			namesRemaining--;
				
			initializeNeighborhood(userId);
		}
	}

	initializeAdminNeighborhood();
	
	/* Log entry. */ recordParticipantsToNamesCorrespondence();
}

getNameOfCurrentUser = function() {
	return id_name[Meteor.userId()];
}

// Get the names of the neighbors of the user with the specified user ID (not necessarily
// the current user). The name in position 0 of neighNames is the name of the user with 
// identified by userId.
getNamesOfNeighbors = function(userId) {
	var neighNames = [];
	neighNames.push(id_name[userId]);
	var i = name_node[id_name[userId]];
	  
	for(var j=0; j<adjMatrix.length; j++) {
		if(adjMatrix[i][j]) {
			neighNames.push(node_name[j]);
		}
	}
  
	return neighNames;
}

// Get the neighborhood adjacency matrix corresponding to the user with the specified user ID.
getNeighborhoodAdjMatrix = function(neighNames, userId) {
	var numNodes = neighNames.length;
	  
	var neighAdjMatrix = new Array(numNodes);
	for (var i = 0; i < numNodes; i++) {
        neighAdjMatrix[i] = new Array(numNodes);
    }
	  
	var p=0, q=0;
	for (var i = 0; i < numNodes; i++) {
		neighAdjMatrix[i][i] = false;
        for (var j = i+1; j < numNodes; j++) {
			p = name_node[neighNames[i]];
			q = name_node[neighNames[j]];
			neighAdjMatrix[i][j] = adjMatrix[p][q];
			neighAdjMatrix[j][i] = neighAdjMatrix[i][j];
        }
    }
	  
	return neighAdjMatrix;
}

// Randomly assign initial colors to nodes. 
assignColorsToNodesRandom = function() {
	clearColors();
	
	var colored = new Array(numNodes);
	for (var i = 0; i < numNodes; i++) colored[i] = false;
	
	// Randomly choose the nodes that will be colored with red.
	var n;
	for(var i=0; i<numNodes/2; i++) {
		do { n = Math.floor(Math.random() * numNodes); } while (colored[n]);
		colors.insert({
			name: node_name[n],
			color: "red"
		});
		colored[n] = true;
	}
	
	// Color the remaining nodes with green.
	for(var i=0; i<numNodes; i++) {
		if(!colored[i]) {
			colors.insert({
				name: node_name[i],
				color: "green"
			});
			colored[i] = true;
		}
	}
}

// Assign default initial color to nodes.
assignColorsToNodesSpecial = function() {
	clearColors();
	
	for(var i=0; i<numNodes; i++) {
		colors.insert({
			name: node_name[i],
			color: defaultNodeColor
		});
	}
	
	initializeColorsInfo();
}

assignColorsToNodes = function() {
	if(randomColorAssignment) {
		assignColorsToNodesRandom();
	}
	else {
		assignColorsToNodesSpecial();
	}
	
	/* Log entry. */ recordInitialAssignmentOfColors();
}

// Currently not used.
initializeSessionPayoutRates = function() {
	sessionPayoutRates = {};
	
	for(var i=0; i<participants.length; i++){
		sessionPayoutRates[participants[i]] = consensusPayoutAmount;
	}
}

initializePotentialPayoutsInfo = function() {
	clearPotentialPayoutsInfo();
	
	for (var i = 0; i < participants.length; i++) {
		potentialPayoutsInfo.insert({
			id: participants[i]
		});
		
		for(var j=0; j<theColors.length; j++) {
			var setObject = {};
			var anonymizedColor = anonymizeColor(id_name[participants[i]],theColors[j]);
			setObject[anonymizedColor] = potentialSessionPayouts[participants[i]][theColors[j]];
			potentialPayoutsInfo.update({id: participants[i]}, {$set: setObject});
		}
	}
}

initializePotentialSessionPayouts = function() {
	if(balancedPreferences) {
		if(homophilicPreferences) {
			homophilicPreferencesPayouts();
		}
		else {
			uniformRandomIncentivePayouts();
		}
	}
	
	initializePotentialPayoutsInfo();
	
	/* Log entry. */ recordPotentialSessionPayouts();
}

assignTwoColorPayout = function(payoutMultiplier) {
	var individualPayout = {};
	
	individualPayout[theColors[0]] = payoutMultiplier * basePayout;
	individualPayout[theColors[1]] = (2 - payoutMultiplier) * basePayout;
	
	return individualPayout;
}

uniformRandomIncentivePayouts = function() {
	var payoutMultiplier = incentivesPayoutMultipliers[incentivesConflictLevel];
	
	var numberOfParticipants = participants.length;
	potentialSessionPayouts = {};
	
	var assignedPayout = new Array(numberOfParticipants);
	for (var i = 0; i < numberOfParticipants; i++) assignedPayout[i] = false;
	
	// Randomly choose the participants that will have a "payoutRate" incentive for theColor[0].
	var n;
	for(var i=0; i<numberOfParticipants/2; i++) {
		do { n = Math.floor(Math.random() * numberOfParticipants); } while (assignedPayout[n]);
		
		potentialSessionPayouts[participants[n]] = assignTwoColorPayout(payoutMultiplier);
		assignedPayout[n] = true;
	}
	
	// Assign a "payoutRate" incentive for theColor[1] to the remaining participants.
	for(var i=0; i<numberOfParticipants; i++) {
		if(!assignedPayout[i]) {
			potentialSessionPayouts[participants[i]] = assignTwoColorPayout(2 - payoutMultiplier);
			assignedPayout[i] = true;
		}
	}
}

var homophilicPreferencesPayouts = function() {
	// Needs to be changed!!!
	uniformRandomIncentivePayouts();
}

applyStandardSessionPayouts = function(outcome) {
	if(outcome){
		for(var i=0; i<participants.length; i++){
			setSessionPayoutInfo(participants[i], sessionPayoutRates[participants[i]]);
			updateTotalPayoutInfo(participants[i], sessionPayoutRates[participants[i]]);
		}
	}
	else {
		for(var i=0; i<participants.length; i++){
			setSessionPayoutInfo(participants[i], 0);
		}
	}
}

applyIncentiveSessionPayouts = function(outcome) {
	if(outcome) {
		for(var i=0; i<participants.length; i++){
			var actualPayout;
			
			if(costBasedCommunication) {
				var minPotentialPayout = Math.min(potentialSessionPayouts[participants[i]][theColors[0]], 
												  potentialSessionPayouts[participants[i]][theColors[1]]);
				
				// The cost of communication is relative to the participant's minimum potential payout.
				var sessionCommunicationCost = minPotentialPayout * sessionCommunicationUsageLevels[participants[i]];
				
				// Participants always receive nonzero payout.
				actualPayout = Math.max(0, potentialSessionPayouts[participants[i]][consensusColor] - sessionCommunicationCost);
			}
			else {
				actualPayout = Math.max(0, potentialSessionPayouts[participants[i]][consensusColor]);
			}
			
			actualPayout = precise_round_to_number(actualPayout, 2); 
								
			setSessionPayoutInfo(participants[i], actualPayout);
			updateTotalPayoutInfo(participants[i], actualPayout);
		}
	}
	else {
		for(var i=0; i<participants.length; i++){
			setSessionPayoutInfo(participants[i], 0);
		}
	}
	
	/* Log entry. */ recordSessionPayouts();
}

initializeSessionCommunicationUsageLevels = function() {
	sessionCommunicationUsageLevels = {};
	
	for(var i=0; i<participants.length; i++) {
		sessionCommunicationUsageLevels[participants[i]] = 0;
	}
}

initializeCommunicationLimits = function() {
	clearCommunicationLimits();
	
	for(var i=0; i<participants.length; i++) {
		var remaining = 0;
		
		if(costBasedCommunication) {
			if(structuredCommunication) {
				remaining = Math.floor(1/(communicationCostMultipliers[communicationCostLevel] * structuredCommunicationCharactersNumberMultiplier));
			}
			else {
				remaining = precise_round_to_number(1/communicationCostMultipliers[communicationCostLevel], 0); 
			}
		}
		else {
			if(structuredCommunication) {
				remaining = Math.floor(messageLengthBound/structuredCommunicationCharactersNumberMultiplier);
			}
			else {
				remaining = messageLengthBound;
			}
		}
		
		communicationLimits.insert({
			id: participants[i],
			unitsRemaining: remaining
		});
	}
}

clearPastExperimentsData = function() {
	clearTimeout(sessionTimeout);
	clearTimeout(preSessionTimeout);
	clearTimeout(postSessionTimeout);
	clearInterval(timerIntervalS);
	clearInterval(timerIntervalP);
	
	// If the "experimentLog" collection is not empty, save the records from the previous experiment in a file, and clear the 
	// collecton.
	/*
	if(experimentLog.find({}).count() > 0) {
		var text = Meteor.call('getExperimentLog');
		var expNo = persistentInfo.findOne({type: "experimentNumber"}).value;
	
		var fs = Npm.require('fs');
		
		fs.writeFile("experiment" + expNo + ".txt", text, function (err) {
			if (err) throw err;
			console.log('It\'s saved!');
		});
	}
	*/
	masterClear();
}

var updatePersistentInfo = function() {
	persistentInfo.update({type: "experimentNumber"},{$inc: {value: 1}});
	
	console.log("Experiment number " + persistentInfo.findOne({}).value);
}

/* For testing purposes only. */
printSessionCommunicationCosts = function() {
	console.log("Communication usage levels of participants")
	for(var i=0; i<participants.length; i++) {
		console.log(id_name[participants[i]] + ":\t$" + sessionCommunicationUsageLevels[participants[i]]);
	}
}
/* For testing purposes only. */