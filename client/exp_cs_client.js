// Used for ensuring that subscriptions to collections with dynamically changing queries (e.g. 
// names of neighbors of a particular user) are reactive.
Session.set("clientName", "");

// Collection definitions.
if(Meteor.userId() !== undefined) {
	sessionInfo = new Meteor.Collection('sessionInfo');
	colors = new Meteor.Collection('colorsCollection');
	neighborhoods = new Meteor.Collection('neighborhoodsCollection');
	timeInfo = new Meteor.Collection('timeInfo');
	progressInfo = new Meteor.Collection('progressInfo');
	payoutInfo = new Meteor.Collection('payoutInfo');
	colorsInfo = new Meteor.Collection('colorsInfo');
	chatMessages = new Meteor.Collection('chatMessages');
	structuredMessages = new Meteor.Collection('structuredMessages');
	parameters = new Meteor.Collection('parameters');
	participantsCollection = new Meteor.Collection('participantsCollection');
	communicationLimits = new Meteor.Collection('communicationLimits');
	potentialPayoutsInfo = new Meteor.Collection('potentialPayoutsInfo');
}

var canvas = new Canvas();	

// namesOfNeighbors[0] will contain the name assigned to the current user.
namesOfNeighbors = [];	// Has to be available to methods in click_events.js.
var neighAdjMatrix;

// Updates the value of the time progress bar.
Deps.autorun( function() {
	var timeValue = 0;
	
	// !!!
	// autoSizeText();
	
	progress = progressInfo.findOne({type: "sessionInProgress"}, {fields: {value: 1}});
	
	if(progress !== undefined && progress.value){
		time = timeInfo.findOne({type: "currentTime"}, {fields: {value: 1}});
		if(time !== undefined) {
			currentTime = time.value;
			time = timeInfo.findOne({type: "currentSessionStartTime"}, {fields: {value: 1}});
			sessionLength = timeInfo.findOne({type: "sessionLength"}, {fields: {value: 1}});
			if((time !== undefined) && (sessionLength !== undefined)) {
				var currentSessionStartTime = time.value;
				timeValue = Math.min(100, 100 - (currentTime - currentSessionStartTime)/1000 * 100/sessionLength.value);
			}
		}
	}

	// Update the time progress bar.
	if(timeProgressBar = document.getElementById("timeProgress")) {
		timeProgressBar.style.width = timeValue + "%";
	}
	
});

// Updates the value of the game progress bar.
Deps.autorun( function() {
	var val = 0;
	
	sessionProgress = progressInfo.findOne({type: "sessionInProgress"}, {fields: {value: 1}});
	postSessionProgress = progressInfo.findOne({type: "postSessionInProgress"}, {fields: {value: 1}});
	
	if(((sessionProgress !== undefined) && sessionProgress.value) ||
	   ((postSessionProgress !== undefined) && postSessionProgress.value)) {
		
		// Determine the value of the game progress bar.
	    var colorCounts = new Array(theColors.length);
		for(var i=0; i<theColors.length; i++) {
			colorCounts[i] = sessionInfo.findOne({type: theColors[i] + "Count"}, {fields: {value: 1}}).value;
		}
		
		nodes = sessionInfo.findOne({type: "numberOfNodes"}, {fields: {value: 1}});
		
		val = 100 * Math.max.apply(null, colorCounts) / nodes.value;  
	}
	
	// Update the game progress bar.
	if(gameProgressBar = document.getElementById("gameProgress")) {
		gameProgressBar.style.width = val + "%";
	}
});

// Updates (redraws) the canvas during a session.
Deps.autorun( function() {
	var sessionProgress = progressInfo.findOne({type: "sessionInProgress"}, {fields: {value: 1}});
	
	if((sessionProgress !== undefined) && sessionProgress.value) {
		neigh = neighborhoods.findOne({userId: Meteor.userId()});
		if(neigh !== undefined) {
			namesOfNeighbors = neigh.namesOfNeighbors.slice();
			neighAdjMatrix = neigh.neighAdjMatrix.slice();
			
			Session.set("clientName", namesOfNeighbors[0]);
			
			if (canvas) {  
				canvas.clear();  
				canvas.draw(namesOfNeighbors,neighAdjMatrix); 
			}  
		}
	} 
});

// Updates (redraws) the canvas during a post-session.
Deps.autorun( function() {
	var postSessionProgress = progressInfo.findOne({type: "postSessionInProgress"}, {fields: {value: 1}});
	
	if((postSessionProgress !== undefined) && postSessionProgress.value) {
		neigh = neighborhoods.findOne({userId: Meteor.userId()});
		if(neigh !== undefined) {
			namesOfNeighbors = neigh.namesOfNeighbors.slice();
			neighAdjMatrix = neigh.neighAdjMatrix.slice();
			
			Session.set("clientName", namesOfNeighbors[0]);
			
			if (canvas) {  
				canvas.clear();  
				canvas.draw(namesOfNeighbors,neighAdjMatrix); 
				if(userIsALoggedInParticipant()) {
					addTheColors();
				}
				else if(userIsAdmin()) {
					addTheAdminColors();
				}
			}  
		}
	} 
});

// Clears the canvas when a pre-session starts.
Deps.autorun( function() {
	var preSessionProgress = progressInfo.findOne({type: "preSessionInProgress"}, {fields: {value: 1}});
	// If a pre-session is in progress, clear the canvas.
	if((preSessionProgress !== undefined) && preSessionProgress.value) {
		Session.set("clientName", "");
		if (canvas) {  
				canvas.clear(); 
		}
	}
});

// Clears the canvas when the experiment is over.
Deps.autorun ( function() {
	var experimentProgress = progressInfo.findOne({type: "experimentInProgress"}, {fields: {value: 1}});
	// If an experiment has been terminated, clear the canvas.
	if((experimentProgress == undefined) || (!experimentProgress.value)) {
		if(canvas) {
			canvas.clear();
		}
	}
});

// Show changes in colors of neighboring nodes on the canvas.
var colorsInfoQuery = colorsInfo.find();
var colorsInfoHandle = colorsInfoQuery.observe({
	changed: function(newDocument, oldDocument) {
		if(canvas) {
			for (var key in newDocument) {
				if (newDocument.hasOwnProperty(key)) {
					if((key !== "_id") && (key !== "name")) {
						canvas.updateNodeColor(key, newDocument[key]);
					}
				}
			}
		}
	}
});

// Method for coloring the nodes the first time the subscription to the colorsInfo collection is established. This
// prevents the situation where upon page refresh, the node colors on the canvas are lost. Subsequent color changes
// are shown on the canvas by the above code which observes changes in the colorsInfo collection.
addTheColors = function() {
	if(canvas){
		doc = colorsInfo.findOne();
		
		for (var key in doc) {
			if (doc.hasOwnProperty(key)) {
				if((key !== "_id") && (key !== "name")) {
					canvas.updateNodeColor(key, doc[key]);
				}
			}
		}
	}
}

addTheAdminColors = function() {
	if(canvas) {
		colors.find({}).forEach( function(document) {
			canvas.updateNodeColor(document.name, document.color);
		});
	}
}

// Whenever a new message is added and if there is a need for it, scroll down so that the message added last is visible
// in the chat box.
Deps.autorun( function() {
	var messagesCount = chatMessages.find().count();
	var elem = document.getElementById('messages');
	if(elem !== null) {
		elem.scrollTop = elem.scrollHeight;
	}
});

// Method which extracts the contents of the experimentLog collection and allows the admin user to download them 
// as a .txt file.
saveTextAsFile = function()
{   
	Meteor.call("getExperimentLog", function(err, data){
		if(err){
			console.log(err);
		}
		else {
			// grab the content of the form field and place it into a variable
			var textToWrite = data;
			
			//  create a new Blob (html5 magic) that conatins the data from your form feild
			var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
			// Specify the name of the file to be saved
			var fileNameToSaveAs = "myNewFile.txt";
    
			// Optionally allow the user to choose a file name by providing 
			// an imput field in the HTML and using the collected data here
			// var fileNameToSaveAs = txtFileName.text;

			// create a link for our script to 'click'
			var downloadLink = document.createElement("a");
			//  supply the name of the file (from the var above).
			// you could create the name here but using a var
			// allows more flexability later.
			downloadLink.download = fileNameToSaveAs;
			// provide text for the link. This will be hidden so you
			// can actually use anything you want.
			downloadLink.innerHTML = "My Hidden Link";
    
			// allow our code to work in webkit & Gecko based browsers
			// without the need for a if / else block.
			window.URL = window.URL || window.webkitURL;
          
			// Create the link Object.
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			// when link is clicked call a function to remove it from
			// the DOM in case user wants to save a second file.
			downloadLink.onclick = destroyClickedElement;
			// make sure the link is hidden.
			downloadLink.style.display = "none";
			// add the link to the DOM
			document.body.appendChild(downloadLink);
    
			// click the new link
			downloadLink.click();
		}
	});
}

function destroyClickedElement(event)
{
	// remove the link from the DOM
    document.body.removeChild(event.target);
}

// Responsible for coloring the nodes in the screen canvas of the admin user.
if(Meteor.userId() !== undefined) {
	Deps.autorun( function () {
		Meteor.subscribe('colorsSubscription', Session.get("clientName"), function(){
			addTheAdminColors();
		});
	});
			
	// Updates the color of a node on the admin screen.
	var colorsQuery = colors.find();
	var colorsHandle = colorsQuery.observe({
		// If the color of a node has changed update the color of the corresponding circle (only) on the canvas.
		changed: function(newDocument, oldDocument) {
			if(canvas) {
				canvas.updateNodeColor(newDocument.name, newDocument.color);
			}
		}
	});
}

if(Meteor.userId() !== undefined) {
	Deps.autorun( function () {
		Meteor.subscribe('allUsers');
	});
	
	Deps.autorun( function () {
		Meteor.subscribe('neighborhoodsSubscription');
	});
	
	Deps.autorun( function () {
		Meteor.subscribe('sessionInfoSubscription');
	});

	Deps.autorun( function () {
		Meteor.subscribe('progressInfoSubscription');
	});

	Deps.autorun( function () {
		Meteor.subscribe('timeInfoSubscription');
	});

	Deps.autorun( function () {
		Meteor.subscribe('payoutInfoSubscription');
	});
	
	Deps.autorun( function() {
		Meteor.subscribe('colorsInfoSubscription', Session.get("clientName"), function(){
			addTheColors();
		});
	});
	
	Deps.autorun( function () {
		Meteor.subscribe('chatMessagesSubscription', Session.get("clientName"));
	});
	
	Deps.autorun( function () {
		Meteor.subscribe('adminChatMessagesSubscription');
	});
	
	Deps.autorun( function () {
		Meteor.subscribe('structuredMessagesSubscription', Session.get("clientName"));
	});
	
	Deps.autorun( function () {
		Meteor.subscribe('adminStructuredMessagesSubscription');
	});
	
	Deps.autorun( function () {
		Meteor.subscribe('parametersSubscription');
	});
	
	Deps.autorun( function() {
		Meteor.subscribe('participantsCollectionSubscription');
	});
	
	Deps.autorun( function() {
		Meteor.subscribe('communicationLimitsSubscription');
	});
	
	Deps.autorun( function() {
		Meteor.subscribe('potentialPayoutsInfoSubscription');
	});
}
