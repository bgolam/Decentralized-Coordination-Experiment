// Produces a boolean adjacency matrix.
generateRandomErdosRenyiGraph = function(numberOfNodes, edgeProbability) {
	matrix = new Array(numberOfNodes);
	for (var i = 0; i < numberOfNodes; i++) {
		matrix[i] = new Array(numberOfNodes);
	}
	
	for (var i = 0; i < numberOfNodes; i++) {
		matrix[i][i] = false;
        for (var j = i+1; j < numberOfNodes; j++) {
			if(Math.random() < edgeProbability) {
				matrix[i][j] = false;
			}
			else {
				matrix[i][j] = true;
			}
            
			matrix[j][i] = matrix[i][j];
        }
    }
	
	return matrix;
}

generateConnectedRandomErdosRenyiGraph = function(numberOfNodes, edgeProbability) {
	matrix = new Array(numberOfNodes);
	generatedGraphIsConnected = false;
	
	do{
		matrix = generateRandomErdosRenyiGraph(numberOfNodes, edgeProbability);
		generatedGraphIsConnected = graphIsConnected(matrix, numberOfNodes);
	}
	while(!generatedGraphIsConnected);
	
	return matrix;
}

graphIsConnected = function(matrix, nodes) {
	source = 0;
	element = source;
	i = source;
	var queue = [];
	
	visited = new Array(nodes);
	for (var i = 0; i < nodes; i++) {
		visited[i] = false;
	}
	
	queue.push(source);
	
	while(queue.length > 0) {
		element = queue.shift();
		visited[element] = true;
		
		for (var i = 0; i < nodes; i++) {
			if(matrix[element][i] && !visited[i]) {
				queue.push(i);
			}
		}
	}
	
	isConnected = true;
	for (var i = 0; i < nodes; i++) {
		if(!visited[i]) {
			isConnected = false;
			break;
		}
	}
	
	return isConnected;
}