/* Time-related parameters */
/* ================================================================= */
timeUpdateRate = 1000;

sessionsPerExperiment = 10;

sessionLength = 60;						
preSessionLength = 5;					
postSessionLength = 5;

// Specifies the number of milliseconds after which a suspended update-color request will reattempt processing.
waitForTurnTime = 10;					
/* ================================================================= */


/* Payment-related parameters */
/* ================================================================= */
// consensusPayoutAmount = 1;

// noIncentivePayoutRate = 1;
// mediumIncentivePayoutRate = 1.25 * noIncentivePayoutRate;
// strongIncentivePayoutRate = 1.5 * noIncentivePayoutRate;

basePayout = 1;								// The amount paid to players if no color preference was assigned to them and they did not accumulate 
											// any costs due to communicating with other players.

balancedPreferences = true;
defaultIncentivesConflictLevel = "low";	// Relevant only when balancedPreferences = true; can have four values: "none", "low", "medium", and "high".

incentivesPayoutMultipliers = {				// Relevant only when balancedPreferences = true.
	none: 1.00,
	low: 1.05,
	medium: 1.25,
	high: 1.5
};

defaultHomophilicPreferences = false;				// Not tied to actual potential payout values, but only to relative magnitudes (p1 > p2 or not).
/* ================================================================= */


/* Color-related parameters */
/* ==================================================================================================================================================== */
randomColorAssignment = false;			// randomColorAssignment = false means that users will be assigned no color initially.
defaultNodeColor = "white";				// !Important! - It has to be identical to the "defaultNodeColor" defined in "\client\lib\client_parameters.js"
										// Relevant only when randomColorAssignment = false.

// Can be made arbitrarily long by adding new colors. However, considerations need to be
// made regarding the placement of the buttons controlling a node's color in the client UI.
theColors = ["red", "green"];			// !Important! - It has to be identical to the "theColors" defined in "\client\lib\client_parameters.js"
numberOfColors = theColors.length;

color_number = {};
for(var i=0; i<numberOfColors; i++) { color_number[theColors[i]] = i; }

colorAnonymizationActive = true;
/* ==================================================================================================================================================== */


/* Communication-related parameters */
/* ==================================================================================================================================================== */
defaultCommunication = true;	
defaultGlobalCommunication = false;			// globalCommunication = false indicates that participants can only see messages sent by their neighbors.
defaultStructuredCommunication = false;		// structuredCommunication = false indicates that participants can type any message (of the allowed length);
											// structuredCommunication = true indicates that participants can only report color counts in their		
											// neighborhood.

defaultCostBasedCommunication = false;		// Relevant only when communication = true.

defaultCommunicationCostLevel = "high";		// Relevant only when costBasedCommunication = true; can have three values: "low", "medium", and "high."	

communicationCostMultipliers = {			// Relevant only when costBasedCommunication = true.
	low: 0.01,
	medium: 0.05,
	high: 0.1
};

defaultMessageLengthBound = 100;				// Relevant only when costBasedCommunication = false;									

structuredCommunicationCharactersNumberMultiplier = 3;			// A value of 3 indicates that a structured message costs as much as a 
																// three-character unstructured message.

costPerCharacter = 0.01;
costPerStructuredMessage = 0.05;
/* ==================================================================================================================================================== */


/* Other parameters */
/* ==================================================================================================================================================== */
// Currently not used. It may be useful when implementing the waiting room.
preExperimentLength = 30;

// Should persistent information like experiment number be reset (may be useful when we move from testing to performing actual experiments).
persistentInfoReset = false;
/* ==================================================================================================================================================== */


/* Parameters that were used in the old versions of the application */
/* ==================================================================================================================================================== */
// The interval between consecutive sessions was split into two separate periods - pre-session and post-session.
intervalBetweenSessions = 5;

numberOfNetworkNodes = 10;
/* ==================================================================================================================================================== */
