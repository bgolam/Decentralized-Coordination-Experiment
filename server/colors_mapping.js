colorPermutations = [];

initializeAnonymizationInfo = function() {
	generateColorPermutations();
	if(colorAnonymizationActive) {
		assignRandomColorPermutationsToNodes();
	}
	else {
		// Equivalent to no anonymization of colors.
		assignIdentityColorPermutationToNodes();
	}
	generateReverseColorPermutationsForNodes();
	
	/* Log entry. */ recordAnonymizationInfo();
}

recordAnonymizationInfo = function() {
	var anonymizationInfo = "";
	
	for(var node in node_permutation) {
		if(node_permutation.hasOwnProperty(node)) {
			anonymizationInfo += node + "\t";
			var permutation = colorPermutations[node_permutation[node]];
			for(var i=0; i<permutation.length; i++) {
				anonymizationInfo += permutation[i] + "\t";
			}
			anonymizationInfo += "\n";
		}
	}
	
	// Remove the last "\n" character.
	anonymizationInfo = anonymizationInfo.slice(0, anonymizationInfo.length - 1);
	
	insertExperimentLogEntry("ANOI1", anonymizationInfo);
}

// Generate an array of "count" consecutive integers starting with "start". 
function range(start, count) {
    if(arguments.length == 1) {
        count = start;
        start = 0;
    }

    var foo = [];
    for (var i = 0; i < count; i++) {
        foo.push(start + i);
    }
    return foo;
}

// Internally, the colors are treated as integers from 0 to theColors.length.
generateColorPermutations = function() {
	permutations = [];

	function permuteColors(inputArray, inMemory) {
		var currentCharacter, inMemory = inMemory || [];
		
		for(var i=0; i<inputArray.length; i++) {
			currentCharacter = inputArray.splice(i,1);
			if(inputArray.length == 0) {
				permutations.push(inMemory.concat(currentCharacter));
			}
			permuteColors(inputArray.slice(), inMemory.concat(currentCharacter));
			inputArray.splice(i,0,currentCharacter[0]);
		}
		
		return permutations;
	}
	
	colorPermutations = permuteColors(range(theColors.length)).slice();
}

// node_permutation[x] indicates that node x was assigned the permutation colorPermutations[node_permutation[x]].
node_permutation = {};

assignRandomColorPermutationsToNodes = function() {
	node_permutation = {};
	
	var n;
	for(var i=0; i<numNodes; i++) {
		n = Math.floor(Math.random() * colorPermutations.length); 
		node_permutation[i] = n;
	}
}

assignIdentityColorPermutationToNodes = function() {
	node_permutation = {};
	
	for(var i=0; i<numNodes; i++) {
		node_permutation[i] = 0;
	}
}

reverseColorPermutations = [];

generateReverseColorPermutationsForNodes = function() {
	var n = colorPermutations.length;
	reverseColorPermutations = new Array(n);
	
	for(var i=0; i<n; i++) {
		var reversePermutation = {};
		for(var j=0; j<n; j++) {
			reversePermutation[theColors[colorPermutations[i][j]]] = j;
		}
		reverseColorPermutations[i] = reversePermutation;
	}
}



