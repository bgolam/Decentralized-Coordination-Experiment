/* Hardcoded input data */

// List of available first names. Need to make sure there are at least as many names 
// available as there are nodes in the full network.
listOfNames = ["Ben", "Ava", "Dan", "Eve", "Gus", "Ivy", "Ian", "Joy", "Jay", "Kim", 
				   "Lee", "Liz", "Pat", "Mae", "Ray", "Uma", "Sam", "Sky", "Ted", "Sue"];

// Adjacency matrix specifying the full network. A better approach would be to adapt the
// application so that an adjacency matrix can be read from an external file.

//*
adjMatrix = [ [ false, false, false, false, true, false, true, false ],
				[ false, false, true, false, true, true, true, false ],
				[ false, true, false, false, true, false, false, true ],
				[ false, false, false, false, true, true, false, true ],
				[ true, true, true, true, false, false, false, true ],
				[ false, true, false, true, false, false, true, false ],
				[ true, true, false, false, false, true, false, true ],
				[ false, false, true, true, true, false, true, false ] ];
//*/
/*
adjMatrix = [ [ false, false, false, false ],
				[ false, false, true, false ],
				[ false, true, false, false ],
				[ false, false, false, false ] ];
*/