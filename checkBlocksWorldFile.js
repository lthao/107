// -*- javascript -*-

// Input JSON for a blocks world and math for a logical formula
// Return true iff world satisfies the formula, false otherwise.

// FIXME: Think about doing this within srflaREPL?

var fs = require('fs');
var srflaParser = require('./srflaMathParser.js');
var srflaEval = require('./srflaEval.js');
var formula;

var globalInterp = { };

// Assume "world" is a 2D array of objects.
// The 2D array is an array of arrays, all of the same length.
// Each object has coordinates (0 based) and attributes, some of which are relevant.
function blocksWorldToSrfla(world)
{
    var rows = world.length;
    var cols = world[0].length;
    var i, j, x, y, coords, color, block;
    var srflaRecord;
    var result = [];
    var pat = /^(\d+),(\d+)$/;
    for (i = 0; i < rows; i++) {
	for (j= 0; j < cols; j++) {
	    // get coordinates
	    block = world[i][j];
	    coords = block.coordinates;
	    color = block.color;
	    if (color !== "#FFFFFF") {
		// It's really there.
		// console.log("coords = ", coords);
		var parse_coords = pat.exec(coords);
		// console.log("parse_coords = ", parse_coords);
		if (parse_coords != null) {
		    x = parse_coords[1];
		    y = parse_coords[2];
		    srflaRec = ["Record",
				{ color: ["String", color],
				  x : ["Number", x],
				  y : ["Number", y]}];
		    result.push(srflaRec);
		}
		else {
		    throw new Error("Illegal coordinates string in blocks world object:", coords);
		}
	    }
	}
    }
    result.unshift("Set");
    return result;
}

var worldFile = __dirname + '/blocks.json';

////////////////////////  main ////////////////////////////////////////

if (process.argv.length != 4) {
    console.log("Usage: node checkBlocksWorld.js worldFile.json formula.srfla");
    process.exit(1);
}

var worldFile = process.argv[2];
var formulaFile = process.argv[3];

var world =  JSON.parse(fs.readFileSync(worldFile, 'utf8'));

// Convert to srfla representation
globalInterp.world = blocksWorldToSrfla(world);

// console.log("world: ", JSON.stringify(globalInterp.world, undefined, 2));

// Read function definitions: LeftOf, etc.

var blocksDefsInput = fs.readFileSync("blocksDefs.srfla", 'utf8');

// console.log("blocksDefsInput = ", blocksDefsInput);

var blocksDefs = srflaParser.parse(blocksDefsInput);

// console.log("blocksDefs: ", JSON.stringify(blocksDefs, undefined, 2));

for (var i = 0; i < blocksDefs.length; i++) {
    srflaEval.srflaEval(blocksDefs[i], globalInterp);
}

// read input formula
var inputFormula = fs.readFileSync(formulaFile, 'utf8');

inputFormula = "eval " + inputFormula + ";";

try {
//    console.log("input formula: ", JSON.stringify(inputFormula, undefined, 2 ))
    formulas = srflaParser.parse(inputFormula);
//    console.log("parsed formula: ", JSON.stringify(formulas, undefined, 2 ))
}
catch (e) {
    console.log("Exception: ", e);
    console.log("Exception: ", e.stack);
};

var result = srflaEval.srflaEval(formulas[0], globalInterp);

// FIXME: counterexample if false?

if (srflaEval.isTrue(result)) {
    // process.exit(code=0);
    console.log("T");
}
else {
    // process.exit(code=1);
    console.log("F");
}

