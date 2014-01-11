// -*- javascript -*-

"use strict";

var srflaParser = require('../parser/srflaMathParser.js');
var srflaEval = require('../eval/srflaEval.js');

var globalInterp = { };

// Seems like node determines end of parse by parsing
// at each end-of-line and assuming no end if there's a
// parse error.

function srflaREPL() {
    var stdin = process.stdin;
    var stdout = process.stdout;
    var expr;
    var ee;
    stdin.resume();

    stdout.write("srfla> ");
    
    stdin.once('data', function(inputStr) {
	inputStr = inputStr.toString().trim();
	try {
	    expr = srflaParser.parse(inputStr);
	    console.log("input: ", JSON.stringify(expr, undefined, 2 ))
	    // evaluate each command in returned array
	    for (var i = 0; i < expr.length; i++) {
		ee = srflaEval.srflaEval(expr[i], globalInterp);
		console.log("result: ", JSON.stringify(ee, undefined, 2 ));
	    }
	}
	catch (e) {
	    console.log("Exception: ", e);
	    console.log("Exception: ", e.stack);
	}
	srflaREPL();		// worried about stack growth.
    });
}

srflaREPL();

// no way to execute this, yet.
//process.exit();
