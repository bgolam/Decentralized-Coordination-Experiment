Template.button1.events({
    'click button': function() {
		if(namesOfNeighbors.length > 0){
			var currentName = namesOfNeighbors[0];
			var fieldQuery = {};
			fieldQuery[currentName] = 1;
			var colorInfo = colorsInfo.findOne({name: currentName}, {fields: fieldQuery});
		
			if(colorInfo !== undefined){
				currentColor = colorInfo[currentName];
				if(currentColor !== theColors[0]) {
					// Update the 'colors' collection
					Meteor.call('updateColor', theColors[0]);  
				}	
			}
		}		
	}                              
});

Template.button2.events({
    'click button': function() {
		if(namesOfNeighbors.length > 0){
			var currentName = namesOfNeighbors[0];
			var fieldQuery = {};
			fieldQuery[currentName] = 1;
			var colorInfo = colorsInfo.findOne({name: currentName}, {fields: fieldQuery});
			
			if(colorInfo !== undefined){
				currentColor = colorInfo[currentName];
				if(currentColor !== theColors[1]) {
					// Update the 'colors' collection
					Meteor.call('updateColor', theColors[1]);  
				}	
			}
		}		
	}                              
});

Template.startGame.events({
	'click button': function() {
		Meteor.call('startExperiment');
	}
});

Template.clearLog.events({
	'click button': function() {
		Meteor.call('clearExperimentLog');
	}
});

Template.chatBox.events({
  "click #sendButton": function() {
    var message = $('#chat-message').val();
    
	// Send only non-empty messages. 
	if((message !== undefined) && (message !== "")) {
		// If the previous message sent by the user was submitted by pressing the "enter" key, the "message" string
		// will start with an undesired "\n" character.
		if(message[0] == "\n") {
			message = message.slice(1, message.length);
		}
		
		Meteor.call('sendChatMessage', message);
	}
	
    $('#chat-message').val('');
  },
  "click #reportButton": function() {
	Meteor.call('sendStructuredMessage');
  }
});

// Allow users to send messages by pressing the "enter" key.
sendMessageUsingEnterKey = function(event) {
	if (event.keyCode == 13) {
		document.getElementById('sendButton').click();
	}
}

/* For testing purposes only. */
/* ==================================================================================================================================================== */
simulateClickEvents = false;

if(simulateClickEvents) {
	var clickEventRate = 500;
	
	setInterval(function() {
		// First click button1.
		if(bt1 = document.getElementById("b1")) { bt1.click(); }
	
		// After clickEventRate/2 milliseconds, click button2.
		setTimeout(function() {
			if(bt2 = document.getElementById("b2")) { bt2.click(); }
		}, clickEventRate/2);
		
	}, clickEventRate);
}
/* ==================================================================================================================================================== */