// Needs to be changed! Clients should not have unrestricted access to existing accounts information. ???
Template.adminControls.helpers({
	userIsAdmin: function() {
		var response = false;
		
		adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}})
		if((adminUser !== undefined)) {
			 response = true;
		}
		
		return response;
	}
});

Template.waitForNextExperimentStatus.helpers({
	statusVisible: function() {
		var response = false;
		
		if(userIsLoggedIn()) {
			if(!experimentInProgress()) response = true;
			else if(!(userIsALoggedInParticipant() || userIsAdmin())) response = true;
		}
		
		return response;
	},
	status: function() {
		if(!experimentInProgress()) {
			setTimeout(function() {$('#waitStatus').boxfit({multiline: true});}, 50);
			return "Please wait for the next experiment to begin.";
		}
		else {
			if(!(userIsALoggedInParticipant() || userIsAdmin())) {
				setTimeout(function() {$('#waitStatus').boxfit({multiline: true});}, 50);
				return "An experiment is in progress, but you are not a participant. Please wait for the next experiment!";
			}
		}
	}
});

Template.signInStatus.helpers({
	statusVisible: function() {
		return !userIsLoggedIn(); 
	}
});

Template.preSessionCountdown.helpers({
	statusVisible: function() {
		var response = false;
		
		if(userIsALoggedInParticipant() || userIsAdmin()) {
			progress = progressInfo.findOne({type: "preSessionInProgress"});
			if((progress !== undefined) && progress.value){
				response = true;
			}
		} 
		
		return response;
	},
	status: function() {
		var status = "";
		var preSessionProgress = progressInfo.findOne({type: "preSessionInProgress"});
                        
        // If a pre-session is in progress, show how many seconds remain until the next game starts.
        if((preSessionProgress !== undefined) && preSessionProgress.value){
			sessionNumber = sessionInfo.findOne({type: "sessionNumber"});
            if(sessionNumber !== undefined){
				var secondsRemaining = 0;
                var currentTime = timeInfo.findOne({type: "currentTime"}).value;
                var lastSessionEndTime = timeInfo.findOne({type: "lastSessionEndTime"}).value;
                var preSessionLength = timeInfo.findOne({type: "preSessionLength"}).value;
                var postSessionLength = timeInfo.findOne({type: "postSessionLength"}).value;
				
				secondsRemaining = Math.ceil((1000 * preSessionLength + 1000 * postSessionLength - (currentTime - lastSessionEndTime)) / 1000);
				
				 if(sessionNumber.value < 1) {
					secondsRemaining -= postSessionLength;
				 }
				 else {
					 secondsRemaining = Math.min(preSessionLength, secondsRemaining);
				 }
				
                 status = secondsRemaining;
			}
		}
		
		return status;
	},
	statusDescription: function() {
		var statusDescription = "";
		var preSessionProgress = progressInfo.findOne({type: "preSessionInProgress"});
                
        if((preSessionProgress !== undefined) && preSessionProgress.value){
			sessionNumber = sessionInfo.findOne({type: "sessionNumber"});
            if(sessionNumber !== undefined){
				if(sessionNumber.value < 1) {
					statusDescription = "Next experiment starts in";
				}
				else {
					statusDescription = "Next game starts in";
				}
			}
		}
		
		return statusDescription;
	}
});

Template.gameInProgressStatus.helpers({
	statusVisible: function() {
		var response = false;
		
		if(userIsALoggedInParticipant() || userIsAdmin()) {
			progress = progressInfo.findOne({type: "sessionInProgress"});
			if((progress !== undefined) && progress.value){
				response = true;
			}
		} 
		
		return response;
	},
	status: function() {
		var status = "";
        
		// If a session is in progress, just show a message saying that the game is in progress.
        var sessionProgress = progressInfo.findOne({type: "sessionInProgress"});
        if((sessionProgress !== undefined) && sessionProgress.value) {
			sessionNumber = sessionInfo.findOne({type: "sessionNumber"});
            if(sessionNumber !== undefined){
				status = "Game " + sessionNumber.value;
            }
        }
                             
		return status;
	}
});

Template.sessionPayoutInformation.helpers({
	statusVisible: function() {
		var response = false;
		
		if(userIsALoggedInParticipant() || userIsAdmin()) {
			progress = progressInfo.findOne({type: "postSessionInProgress"});
			if((progress !== undefined) && progress.value){
				response = true;
			}
		} 
		
		return response;
	},
	totalSessionPayout: function() {
		var payout = 0;
		
		payoutInfo.find({id: Meteor.userId()}, {fields: {sessionPayout: 1}}).forEach( function(user) {
			payout += user.sessionPayout;
		});
		
		return precise_round(payout, 2);
	},
	yourSessionPayout: function() {
		// If post-session is in progress, show the user's payout from the previous session (game).
		var postSessionProgress =progressInfo.findOne({type: "postSessionInProgress"});
		if((postSessionProgress !== undefined) && postSessionProgress.value) {
			var payout = 0;
		
			if(Meteor.userId()) {
				var user = payoutInfo.findOne({id: Meteor.userId()}, {fields: {sessionPayout: 1}});
				if(user !== undefined) {
					payout = user.sessionPayout;
				}
			}
			
			return precise_round(payout, 2);
		}
		else{
			return "";
		}
	}
});

Template.gameOutcomeStatus.helpers({
	statusVisible: function() {
		var response = false;
		
		if(userIsALoggedInParticipant() || userIsAdmin()) {
			progress = progressInfo.findOne({type: "postSessionInProgress"});
			if((progress !== undefined) && progress.value){
				response = true;
			}
		} 
		
		return response;
	},
	status: function() {
		var status = "";
		
		var postSessionProgress =progressInfo.findOne({type: "postSessionInProgress"});
		if((postSessionProgress !== undefined) && postSessionProgress.value) {
			var outcome = sessionInfo.findOne({type: "outcome"});
			if(outcome !== undefined){
				// If consensus was reached, determine the consensus color (as seen by the current user) based on whether ...
				if(outcome.value) {
					var consensusColor;
						
					// ... the current user is the admin ...
					if(colors.find({}).count() > 0) {
						consensusColor = colors.findOne({}).color;
					}
					// ... or an experiment participant.
					else {
						var neighborhoodColors = colorsInfo.findOne();
						for (var key in doc) {
							if (doc.hasOwnProperty(key)) {
								if((key !== "_id") && (key !== "name")) {
									consensusColor = neighborhoodColors[key];
									break;
								}
							}
						}
					}
					status = consensusColor.toUpperCase();
				}
				else {
					status = "NO";
				}
			}
		}
		
		return status;
	}
});

Template.payoutInformation.helpers({
	userIsALoggedInParticipantOrAdmin: function() {
		var response = false;
		
		if(Meteor.userId()) {
			var neigh = neighborhoods.findOne({userId: Meteor.userId()});
			if(neigh !== undefined) {
				response = true;
			}
		}
		
		return response;
	},
	userIsAdmin: function() {
		var response = false;
		
		adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}})
		if((adminUser !== undefined)) {
			 response = true;
		}
		
		return response;
	},
	totalPayout: function() {
		var payout = 0;
		
		payoutInfo.find({}, {fields: {totalPayout: 1}}).forEach( function(user) {
			payout += user.totalPayout;
		});
		
		return precise_round(payout, 2);
		// return payout;
	},
	yourPayout: function() {
		var payout = 0;
		
		if(Meteor.userId()) {
			var user = payoutInfo.findOne({id: Meteor.userId()}, {fields: {totalPayout: 1}});
			if(user !== undefined) {
				payout = user.totalPayout;
			}
		}
		
		return precise_round(payout, 2);
		// return payout;
	},
	experimentInProgress: function() {
		response = false;
		progress = progressInfo.findOne({ type: "experimentInProgress" }, {fields: {value: 1}});
		if(progress !== undefined) {
			response = progress.value;
		} 
		return response;
	}
});

Template.potentialPayoutInformation.helpers({
	userIsALoggedInParticipant: function() {
		return userIsALoggedInParticipant();
	},
	sessionInProgress: function() {
		response = false;
		progress = progressInfo.findOne({ type: "sessionInProgress" }, {fields: {value: 1}});
		if(progress !== undefined) {
			response = progress.value;
		} 
		return response;
	}
});

Template.potentialPayoutInformation1.helpers({
	userIsALoggedInParticipant: function() {
		return userIsALoggedInParticipant();
	},
	sessionInProgress: function() {
		response = false;
		progress = progressInfo.findOne({ type: "sessionInProgress" }, {fields: {value: 1}});
		if(progress !== undefined) {
			response = progress.value;
		} 
		return response;
	},
	payout: function() {
		var payout = 0;
		
		var potentialPayouts = potentialPayoutsInfo.findOne({id: Meteor.userId()});
		if(potentialPayouts !== undefined) {
			payout = potentialPayouts[theColors[0]];
		}
		
		return precise_round(payout, 2);
	},
	color: function() {
		return (theColors[0]).toUpperCase();
	}
});

Template.potentialPayoutInformation2.helpers({
	userIsALoggedInParticipant: function() {
		return userIsALoggedInParticipant();
	},
	sessionInProgress: function() {
		response = false;
		progress = progressInfo.findOne({ type: "sessionInProgress" }, {fields: {value: 1}});
		if(progress !== undefined) {
			response = progress.value;
		} 
		return response;
	},
	payout: function() {
		var payout = 0;
		
		var potentialPayouts = potentialPayoutsInfo.findOne({id: Meteor.userId()});
		if(potentialPayouts !== undefined) {
			payout = potentialPayouts[theColors[1]];
		}
		
		return precise_round(payout, 2);
	},
	color: function() {
		return (theColors[1]).toUpperCase();
	}
});

// Should be replaced by "userIsALoggedInParticipant() || userIsAdmin()".
var userIsALoggedInParticipantOrAdmin = function() {
	var response = false;
		
	if(Meteor.userId()) {
		var neigh = neighborhoods.findOne({userId: Meteor.userId()});
		if(neigh !== undefined) {
			response = true;
		}
	}
		
	return response;
}
userIsALoggedInParticipant = function() {
	if(!Meteor.userId()) return false;
	
	if(participantsCollection.find().count() > 0) return true;
	
	return false;
}
userIsAdmin = function() {
	if(!Meteor.userId()) return false;
	
	var response = false;
		
	adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}})
	if((adminUser !== undefined)) {
		 response = true;
	}
		
	return response;
}
var experimentInProgress = function() {
	response = false;
	
	progress = progressInfo.findOne({ type: "experimentInProgress" }, {fields: {value: 1}});
	if(progress !== undefined) {
		response = progress.value;
	} 
	
	return response;
}
var userIsLoggedIn = function() {
	var response = false;
	
	if(Meteor.userId()) response = true;
	
	return response;
}


Template.usersLoggedIn.helpers({
	usersCount: function() {
		return Meteor.users.find({ "status.online": true, emails: { $elemMatch: {address: {$ne: "admin@admin"}}}}, {fields: {_id: 1}}).count();
	}
});

Template.selectColor.helpers({
	colorButtonsVisible: function() {
		var response = false;
		
		var progress = progressInfo.findOne({ type: "sessionInProgress" }, {fields: {value: 1}});
		
		if(progress !== undefined) {
			 response = progress.value;
		}

		return response;
	},
	userIsALoggedInParticipant: function() {
		var response = false;
		
		var adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}});
		if(Meteor.userId() && (adminUser == undefined)) {
			var neigh = neighborhoods.findOne({userId: Meteor.userId()});
			if(neigh !== undefined) {
				response = true;
			}
		}
		
		return response;
	}
});

Template.currentName.helpers({
	userIsALoggedInParticipant: function() {
		var response = false;
		
		var adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}});
		if(Meteor.userId() && (adminUser == undefined)) {
			var neigh = neighborhoods.findOne({userId: Meteor.userId()});
			if(neigh !== undefined) {
				response = true;
			}
		}
		
		return response;
	},
	nameVisible: function() {
		var response = false;
		
		sessionProgress = progressInfo.findOne({ type: "sessionInProgress" }, {fields: {value: 1}});
		postSessionProgress = progressInfo.findOne({ type: "postSessionInProgress" }, {fields: {value: 1}});
		
		if((sessionProgress !== undefined) && (postSessionProgress !== undefined)) {
			 response = sessionProgress.value || postSessionProgress.value;
		}

		return response;
	},
	yourNameIs: function() {
		response = "";
		
		sessionProgress = progressInfo.findOne({type: "sessionInProgress"});
		postSessionProgress = progressInfo.findOne({type: "postSessionInProgress"});
		if(((sessionProgress !== undefined) && sessionProgress.value) ||
	       ((postSessionProgress !== undefined) && postSessionProgress.value)) {
			neigh = neighborhoods.findOne({userId: Meteor.userId()});
			if (Meteor.user() && (neigh !== undefined)) { 
				namesOfNeighbors = neigh.namesOfNeighbors.slice();
				if (namesOfNeighbors.length > 0) {  
					response = namesOfNeighbors[0]; 
				}  
			}
		}
		
		return response;
	}
});

Template.progressPercentage.helpers({
	percentage: function () {
		var percentageValue = "";
		
		var sessionProgress = progressInfo.findOne({type: "sessionInProgress"});
		var postSessionProgress = progressInfo.findOne({type: "postSessionInProgress"});
	
		if(((sessionProgress !== undefined) && sessionProgress.value) ||
	       ((postSessionProgress !== undefined) && postSessionProgress.value)) {
			     
			var redCount = sessionInfo.findOne({type: "redCount"});
			var greenCount = sessionInfo.findOne({type: "greenCount"});
			var nodes =  sessionInfo.findOne({type: "numberOfNodes"}); 
			 
			if((redCount !== undefined) && (greenCount !== undefined) && (nodes !== undefined)){
				var value = 100 * Math.max(redCount.value, greenCount.value) / nodes.value;
				percentageValue = Math.round(value) + " %";
			}
		}
                          
        return percentageValue;
	}
});

Template.timeRemaining.helpers({                            
	time: function () {
		var timeValue = "";
		
		var sessionProgress = progressInfo.findOne({type: "sessionInProgress"});
		if((sessionProgress !== undefined) && sessionProgress.value) {
			var currentTime = timeInfo.findOne({type: "currentTime"});
			var currentSessionStart = timeInfo.findOne({type: "currentSessionStartTime"});
			var sessionLength = timeInfo.findOne({type: "sessionLength"});
			
			if((currentTime !== undefined) && (currentSessionStart !== undefined) && (sessionLength !== undefined)){
				var millisecondsRemaining = sessionLength.value * 1000 - (currentTime.value - currentSessionStart.value);
				timeValue = millisecondsToTime(millisecondsRemaining);
			}
		}
	
		return timeValue;
	}                            
});

Template.chatBox.helpers({
	messages: function() {
		if (Meteor.user()) { 
			sessionProgress = progressInfo.findOne({type: "sessionInProgress"});
			postSessionProgress = progressInfo.findOne({type: "postSessionInProgress"});
			if(((sessionProgress !== undefined) && sessionProgress.value) ||
	           ((postSessionProgress !== undefined) && postSessionProgress.value)) {
				var messagesToBeReturned = []; 
				var messagesCursor;
				   
				// var structuredCommunication = parameters.findOne({type: "structuredCommunication"});
				// if((structuredCommunication !== undefined) && structuredCommunication.value) {
					messagesCursor = structuredMessages.find({});
				// }
				// else {
				// 	messagesCursor = chatMessages.find({});
				// }
				
				messagesCursor.forEach( function(messageDocument) {
					if((messageDocument.nameOfSender == Session.get("clientName")) && (!currentUserIsTheAdmin())) {
						messagesToBeReturned.push({nameOfSender: "Me", message: messageDocument.message});
					}
					else {
						messagesToBeReturned.push({nameOfSender: messageDocument.nameOfSender, message: messageDocument.message});
					}
				});
				
				return messagesToBeReturned;
			}
		}
	},
	chatBoxVisible: function() {
		var response = false;
		
		sessionProgress = progressInfo.findOne({type: "sessionInProgress"});
		postSessionProgress = progressInfo.findOne({type: "postSessionInProgress"});
		
		if((sessionProgress !== undefined) && (postSessionProgress !== undefined)) {
			 response = sessionProgress.value || postSessionProgress.value;
		}

		return response;
	},
	userIsNotAdmin: function() {
		var response = true;
		
		var adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}})
		if((adminUser !== undefined)) {
			 response = false;
		}
		
		return response;
	},
	userIsALoggedInParticipant: function() {
		var response = false;
		
		if(Meteor.userId()) {
			var neigh = neighborhoods.findOne({userId: Meteor.userId()});
			if(neigh !== undefined) {
				response = true;
			}
		}
		
		return response;
	},
	messagingIsActive: function() {
		var response = false;
		
		var communication = parameters.findOne({type: "communication"});
		if(communication !== undefined) {
			response = communication.value;
		}
		
		return response;
	},
	communicationIsStructured: function() {
		var response = false;
		
		var structuredCommunication = parameters.findOne({type: "structuredCommunication"});
		if(structuredCommunication !== undefined) {
			response = structuredCommunication.value;
		}
		
		return response;
	},
	communicationLimit: function() {
		var status = "";
		
		var remainingInfo = communicationLimits.findOne({});
		if(remainingInfo !== undefined) {
			var remaining = remainingInfo.unitsRemaining;
			
			var structuredCommunication = parameters.findOne({type: "structuredCommunication"});
			if(structuredCommunication !== undefined) {
				status = remaining;
				if(structuredCommunication.value) {
					status += " messages remaining.";
				}
				else {
					status += " characters remaining.";
				}
			}
		}
		
		return status;
	}
});

Template.progressBars.helpers({
	progressBarsVisible: function() {
		var response = false;
		
		var sessionProgress = progressInfo.findOne({ type: "sessionInProgress" }, {fields: {value: 1}});
		var postSessionProgress = progressInfo.findOne({ type: "postSessionInProgress" }, {fields: {value: 1}});
		
		if(Meteor.user() && (sessionProgress !== undefined) && (postSessionProgress !== undefined)) {
			 response = sessionProgress.value || postSessionProgress.value;
		}
		
		return response;
	},
	userIsALoggedInParticipant: function() {
		var response = false;
		
		if(Meteor.userId()) {
			var neigh = neighborhoods.findOne({userId: Meteor.userId()});
			if(neigh !== undefined) {
				response = true;
			}
		}
		
		return response;
	}
});

Template.communicationInstructions.helpers({
	instructionsVisible: function() {
		var response = false;
		
		var communication = parameters.findOne({type: "communication"});
		if((communication !== undefined) && communication.value) {
			if(userIsALoggedInParticipant()) {
				sessionProgress = progressInfo.findOne({type: "sessionInProgress"});
				postSessionProgress = progressInfo.findOne({type: "postSessionInProgress"});
		
				if((sessionProgress !== undefined) && (postSessionProgress !== undefined)) {
					response = sessionProgress.value || postSessionProgress.value;
				}
			}
		}
		
		return response;
	},
	instructions: function() {
		var response = "";
		
		var costBasedCommunication = parameters.findOne({type: "costBasedCommunication"});
		if(costBasedCommunication !== undefined) {
			if(costBasedCommunication.value) {
				response += "The communication is cost-based. Every time you send a message, your potential consensus payouts will be reduced.";
			}
			else {
				response += "The communication is not cost-based.";
			}
		}
		
		var structuredCommunication = parameters.findOne({type: "structuredCommunication"});
		if(structuredCommunication !== undefined) {
			if(structuredCommunication.value) {
				response += " You can communicate the current aggregate color counts in your neighborhood to other players," + 
							" as long as the number of messages remaining is positive.";
			}
			else {
				response += " You can type a message. The message length cannot exceed the number of characters currently remaining.";
			}
		}
		
		var globalCommunication = parameters.findOne({type: "globalCommunication"});
		if(globalCommunication !== undefined) {
			if(globalCommunication.value) {
				response += " You can communicate with all players.";
			}
			else {
				response += " You can only communicate with your neighbors.";
			}
		}
		
		return response;
	}
});

// Technically not helpers, but allow us to dynamically change the background color and label of buttons.
button1OnLoad = function() {
	if(bt1 = document.getElementById("b1")) {
		bt1.style.backgroundColor = theColors[0];
		bt1.innerHTML = (theColors[0]).charAt(0).toUpperCase() + (theColors[0]).slice(1);
	}
	return "";
}

button2OnLoad = function() {
	// console.log(document.getElementById("b2"));
	
	if(bt2 = document.getElementById("b2")) {
		// bt2.style["background-color"] = theColors[1];
		bt2.style.backgroundColor = theColors[1];
		bt2.innerHTML = (theColors[1]).charAt(0).toUpperCase() + (theColors[1]).slice(1);
	}
	return "";
}

potentialPayout1OnLoad = function() {
	if(pp1 = document.getElementById("potentialPayout1")) {
		pp1.style.backgroundColor = theColors[0];
		pp1.style.borderColor = theColors[0];
	}
	return "";
}

potentialPayout2OnLoad = function() {
	if(pp2 = document.getElementById("potentialPayout2")) {
		pp2.style.backgroundColor = theColors[1];
		pp2.style.borderColor = theColors[1];
	}
	return "";
}

// Helpful method for determining what should be displayed on the client's screen.
currentUserIsTheAdmin = function() {
	var response = false;
		
	adminUser = Meteor.users.findOne({'emails.address': 'admin@admin'}, {fields: {_id: 1}})
	if((adminUser !== undefined)) {
		 response = true;
	}
		
	return response;
}

// var autoSizeText;

/*
autoSizeText = function() {
  var el, elements, _i, _len, _results;
  elements = $('.resize');
  console.log(elements);
  if (elements.length < 0) {
    return;
  }
  _results = [];
  for (_i = 0, _len = elements.length; _i < _len; _i++) {
    el = elements[_i];
    _results.push((function(el) {
      var resizeText, _results1;
      resizeText = function() {
        var elNewFontSize;
        elNewFontSize = (parseInt($(el).css('font-size').slice(0, -2)) - 1) + 'px';
        return $(el).css('font-size', elNewFontSize);
      };
      _results1 = [];
      while (el.scrollHeight > el.offsetHeight) {
        _results1.push(resizeText());
      }
       return _results1;
    })(el));
  }
  return _results;
};
*/

$(document).ready(function() {
  // return autoSizeText();
});