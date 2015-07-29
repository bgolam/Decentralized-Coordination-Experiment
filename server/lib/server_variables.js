/* Permissions-related variables */
/* ================================================================= */
adminUserId = "";
/* ================================================================= */

/* General experiment variables */
/* ================================================================= */
participants = [];

// Currently not used.
sessionPayoutRates = {};

potentialSessionPayouts = {};
sessionCommunicationUsageLevels = {};
/* ========================================================================================================= */

/* ========================================================================================================= */
// Experiment control variables mainly used to better enforce the order of color updates requested by clients.
currentSession = 0;
sessionRunning = false;

freeToUpdateColors = true;

requestToBeAssignedNext = 0;
requestToBeProcessedNext = 0;

colorCounts = [];
consensusColor = "";
/* ========================================================================================================= */

/* Communication-related parameters */
/* ==================================================================================================================================================== */
communication = false;	
globalCommunication = false;			// globalCommunication = false indicates that participants can only see messages sent by their neighbors.
structuredCommunication = false;		// structuredCommunication = false indicates that participants can type any message (of the allowed length);
										// structuredCommunication = true indicates that participants can only report color counts in their		
										// neighborhood.

costBasedCommunication = false;			// Relevant only when communication = true.

communicationCostLevel = "low";			// Relevant only when costBasedCommunication = true; can have three values: "low", "medium", and "high."	

messageLengthBound = 100;				// Relevant only when costBasedCommunication = false;									
/* ==================================================================================================================================================== */

/* Payment-related parameters */
/* ================================================================= */
incentivesConflictLevel = "none";			// Relevant only when balancedPreferences = true; can have four values: "none", "low", "medium", and "high".

homophilicPreferences = false;				// Not tied to actual potential payout values, but only to relative magnitudes (p1 > p2 or not).
/* ================================================================= */