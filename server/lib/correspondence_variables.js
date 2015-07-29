/* Objects and arrays used to establish and make use of the correspondence between actual nodes,
names of nodes visible to the clients, and user IDs of clients. */

// name_node[someName] gives the actual node (a number from 0 to numNodes-1) corresponding to 
// someName.
name_node = {};

// node_name[i] gives the name corresponding to the actual node i.
node_name = {};

// id_name[someUserId] gives the name assigned to the client (user) with user ID someUserId.
id_name = {};

// name_id[someName] gives the user ID of the client that was assigned the name someName.
name_id = {};

// Keep track of names that have already been assigned to users.
nameTaken = [];
namesRemaining = 0;
