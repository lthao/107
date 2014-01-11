// -*- javascript -*-

// Code for evaluation of srfla expression trees.
// Eventually, I would like this to be an arbitrary simplifier.
// For now, it only works right when everything is constant.

"use strict";

var SRFLAFALSE = [ '\\F' ];
var SRFLATRUE = [ '\\T' ];

// returns a js boolean
function isTrue (e)
{
    return e[0] === '\\T';
}

function isSymbol (e)
{
    return (e.length === 1 && e[1] === "Symbol");
}


// Op is string rep of operator.  
function isLeaf (op)
{
    switch (op) {
    case 'Number':
    case 'String':
    case 'Symbol': {
	return 1;
	break;
    }
    default: {
	return 0;
	break;
    }
    }
}

// supposedly from jQuery 
// http://stackoverflow.com/questions/767486/how-do-you-check-if-a-variable-is-an-array-in-javascript
function isArray ( obj )
{
    return toString.call(obj) === "[object Array]";
};

// accessors for relations & functions
function domain (e) { return e[1]; }
function codomain (e) { return e[2]; }
function graph (e) { return e[3]; } // the set of tuples

// assert that something is a term.
// FIXME: Terms should be a class, later.  Build this in as a method or attribute.
function checkIsTerm(e)
{
    if (isArray(e) && e.length >= 0 && typeof(e[0]) === 'string') {
	// no problem
    }
    else {
	throw new Error("Not a term: " + JSON.stringify(e, undefined,2));
    }
}


// slow exponent function
function expt(x, n)
{
    var result = 1;
    for (var i = 0; i < n; i++) {
	result *= x;
    }
    return result;
}

// division.  Throws exception for divide-by-zero
function divide(e)
{
    var e1 = e[1];
    var e2 = e[2];
    if (e2[1] === 0) {
	throw new Error("Divide by zero.");
    }
    return ["Number", e1[1]/e2[1] ];
}

// FOR NOW: just need to compare constant terms.  
// operators can be number, string, set, tuple (and that's it?).
// maybe function and relation?
// Order "lexicographically" by operator.
// If operators are the same, go by children, in order.
function compare (e1, e2) {
    var op1 = e1[0];
    var op2 = e2[0];
    var c = 0;
    if (e1 === e2) {		// fast exit if we get lucky.
	return 0;
    }
    if (op1 === op2) {
	switch (op1) {
	case '\\T':
	case '\\F': {		
	    return 0; // ops are equal.
	    break;
	}
	case 'Number': {
	    return e1[1] - e2[1];
	    break;
	}
	case 'String': {
	    return e1[1].localeCompare(e2[1]);
	    break;
	}
	case 'Tuple':
	case 'Set': {
	    // recursively lexicographically order by children
	    for (var i = 1; i < e1.length; i++) {
		if (i >= e2.length) {
		    return 1;	// e2 is shorter, put it first.
		}
		c = compare(e1[i], e2[i]);
		if (c !== 0) {
		    return c;
		}
	    }
	    if (i < e2.length) {
		return -1;		// e1 goes first.
	    }
	    else {
		// expressions are identical
		return 0;
	    }
	}
	default: {
	    console.log("Ilegal head: " + op1);
	    console.log("e1 = " + e1);
	}
	}
    }
    else if (op1 === "\\F") {
	return -1;
    }
    else if (op2 === "\\F") {
	return 1;
    }
    else if (op1 === "\\T") {
	return -1;
    }
    else if (op2 === "\\T") {
	return 1;
    }    
    else if (op1 === "Number") {
	return -1;
    }
    else if (op2 === "Number") {
	return 1;
    }
    else if (op1 === "String") {
	return -1;
    }
    else if (op2 === "String") {
	return 1;
    }
    else if (op1 === "Tuple") {
	return -1;
    }
    else if (op2 === "Tuple") {
	return 1;
    }
    else if (op1 === "Set") {
	return -1;
    }
    else if (op2 === "Set") {
	return 1;
    }
    else {
	console.log("Error: Illegal operator " + op1);
    }
}

// Structural equality.
function equals (e1, e2) { return compare(e1, e2) === 0; }

// get record or tuple field
function getField (e, int)
{
    var e1 = srflaEval(e[1], int);
    var e2 = e[2];		// not evaluated.
    var result;
    // console.log("evaluated e1 = ", e1);
    if (e1[0] === "Tuple") {
	if (e2[0] === "Number"
	    && e2[1] >= 1
	    && e2[1] < e1.length) {
	    var num = e2[1];
	    result = e1[num];	// tuple indexing is 1-based.
	}
	else {
	    throw new Error("Tuple index must be numerical: " + e2);
	}
    }
    else if (e1[0] === "Record") {
	// ["Record", <object>]
	if (e2[0] === "Symbol") {
	    var sym = e2[1];
	    var rec = e1[1];
	    result = rec[sym];
	}
	else {
	    throw new Error("Record field access must be a symbol: " + e2);
	}
    }
    else {
	throw new Error("Access to non-tuple or record: " + e);
    }
    return result;
}

// Sort set members and eliminate duplicates
function normalizeSet (e) {
    var args = e.slice(1); // copy suffix of array
    var j = 0;
    if (args.length === 0) {
	return e;
    }
    args.sort();		// FIXME: sorts alphabetically.
    for(var i = 0; i < args.length-1; i++) {
	if (!equals(args[i], args[i+1])) {
	    args[j] = args[i];
	    j++;
	}
    }
    // i = args.length here. last element should always be copied.
    args[j++] = args[i++];
    args.length = j;
    args.unshift(e[0]);
    return args;
}

// convert javascript boolean to srfla true/false object.
function boolToSrfla (b) {
    if (b) {
	return SRFLATRUE;
    }
    else {
	return SRFLAFALSE;
    }
}

// check e[1] in e[2]
function isMember (e) {
    // FIXME: ind > 0 kludge avoids having to slice S.
    return boolToSrfla(e[2].some(function (y, ind, arr) { return ind > 0 && equals(e[1],y); }));
}

// generic function for union, intersection, setdiff (and symmetric diff, if we want it)
// pushIfLess means push if arg1[i] < arg2[j],  etc.
function boolSetOp (e, pushIfLess, pushIfGtr, pushIfEq) {
    var e1 = e[1];
    var e2 = e[2];
    var args1 = e1.slice(1);
    var args2 = e2.slice(1);
    var i = 0;
    var j = 0;
    var c;
    var result = [];
    while (i < args1.length && j < args2.length) {
	c = compare(args1[i], args2[j]);
	if (c < 0) {
	    if (pushIfLess) {
		result.push(args1[i]);
	    }
	    i++;
	}
	else if (c > 0) {
	    if (pushIfGtr) {
		result.push(args2[j]);
	    }
	    j++;
	}
	else { // they're equal
	    if (pushIfEq) {
		result.push(args1[i]);
	    }
	    i++;
	    j++;
	}
    }
    // at most one of these two loops does something.
    if (pushIfLess) {
	while (i < args1.length) {
	    result.push(args1[i++]);
	}
    }
    if (pushIfGtr) {
	while (j < args2.length) {
	    result.push(args2[j++]);
	}
    }
    result.unshift("Set");
    return result;
}

function union(e) {
    return boolSetOp(e, true, true, true);
}

function intersection(e) {
    return boolSetOp(e, false, false, true);
}

function setdiff(e) {
    return boolSetOp(e, true, false, false);
}

// Checks whether constant e1 is a subseteq of e2.
// if needProper === true, requires proper subset.
// returns srfla boolean
function isSubset (e1, e2, needProper) {
    // console.log("isSubset(", e1, ", ", e2, ", ",  needProper, ")");
    var args1 = e1.slice(1);
    var args2 = e2.slice(1);
    var i = 0;
    var j = 0;
    var c;
    var isProper = false;
    
    while (i < args1.length && j < args2.length) {
	// console.log("args1[i] = ",  args1[i], ", args2[j] = ", args2[j]);
	c = compare(args1[i], args2[j]);
	if (c < 0) {
	    i++;		
	    return SRFLAFALSE;	// member of e1 not in e2.
	}
	else if (c > 0) {
	    j++;
	    isProper = true;
	}
	else { // they're equal
	    i++;		// member of both.
	    j++;
	}
    }
    if (i < args1.length) {
	return SRFLAFALSE
    }
    isProper |= (j < args2.length);
    // subseteq if we got here.  base return value on whether we need proper.
    return boolToSrfla(!needProper || isProper);
}

// cartesian product
function product(ar1, ar2) {
    var result = [];
    for (var i = 0; i < ar1.length; i++) {
	for (var j = 0; j < ar2.length; j++) {
	    result.push( [ "Tuple", ar1[i], ar2[j] ]);
	}
    }
    return result;
}

// recursive powerset on array.  ar is the set of args to "Set".
// Computes powerset of all elements at indices <= ind. (ind can be -1).
// ind = ar.length-1 gets full powerset
function powerSetAr(ar, ind) {
    // console.log("powerSetAr: ar = ", ar, ", ind = ", ind);
    var phead;
    var cur;
    var result;
    if (ind >= 0) {
	cur = ar[ind];
	phead = powerSetAr(ar, ind-1);
	result = phead.concat(phead); // copies
	for (var i = phead.length; i < result.length; i++) {
	    result[i] = result[i].slice(0); // copy it.
	    result[i].push(cur);
	}
	// console.log("powerSetAr: result = ", result);
	return result;
    }
    else {			// at end -- base case
	result = [[]];
	// console.log("powerSetAr: result = ", result);
	return result;
    }
}

// Computer powerset of an expression.
// Calls powerSetAr on args, then adds set to each sub-array
// of result and to result array.
function powerSet(e) {
    // e = ["\\powset", ["Set", ...]]
    var setargs = e[1].slice(1)
    var ar = powerSetAr(setargs, setargs.length-1);
    // console.log("ar = ", ar);
    var ar1 = ar.map(function (a) { a.unshift("Set"); return a; });
    ar1.unshift("Set");
    return ar1;
}

// Expand subrange to a set
function evalRange(e)
{
    var lb = e[1][1];
    var ub = e[2][1];
    var elts = [];
//    console.log("lb = ", lb, "ub = ", ub);
    for (var i = lb; i <= ub; i++) {
	elts.push(["Number", i]);
    }
    elts.unshift("Set");
    return elts;
}

// binary boolean functions.
// arguments are SRFLA terms and return SRFLA terms
function srflaAnd (e1, e2) { return boolToSrfla(isTrue(e1) && isTrue(e2)); }
function srflaOr (e1, e2) { return boolToSrfla(isTrue(e1) || isTrue(e2)); }
function srflaImplies (e1, e2) { return boolToSrfla(!isTrue(e1) || isTrue(e2)); }
function srflaBicond (e1, e2) { return boolToSrfla(isTrue(e1) === isTrue(e2)); }
function srflaXor (e1, e2) { return boolToSrfla(isTrue(e1) !== isTrue(e2)); }


// evaluate quantifier with multiple variables.
// init is result for empty set (T for forall, F for exists).
// vardecls is a list [ ['vardecl', ['Symbol', 'x'], ['Set', ['Number', 1] ....]], ['vardecl', ...]]
// Unlike other eval1 functions, this does recursive evaluation because it requires
// a special evaluation strategy.
// FIXME: Figure out how to do this with evalComprehension.
//    Return interpretation when we get short-circuit -- how to "return"?
function evalQuantifiers(init, vardecls, body, int) {
    checkIsTerm(init);
    vardecls.slice(1).map(checkIsTerm);
    checkIsTerm(body);

    if (vardecls.length === 0) {
	// *** For comprehension, same code, but eval result expression and
	// apply accumulation function here.
	return srflaEval(body, int); // all free variables bound.
    }
    else {
	var binding = vardecls[0];
	var symbol = binding[1];
	var variable = symbol[1];
	var set = srflaEval(binding[2], int).slice(1);
	var newvardecls = vardecls.slice(1);
	var result = init;
	// create new scope for binding the quantified variable.
	// do this OUTSIDE the loop, so we can reuse the object and
	// just change the value.
	// variables in outer scopes are accessible via prototype.
	var int1 = Object.create(int); 

	// For each value in the set, bind var to that value in int,
	// then evaluate the body.  Accumulate results according to the quantifier.
	for (var i = 0; i < set.length; i++) {
	    int1[variable] = set[i]; // bind variable to next value.
	    // For AND, if it ever returns false, we're done.  Symmetrically with OR.
	    // So, compare with init value (["\\T"] for AND) and exit if it's different.
	    // FIXME: snag example here (counterexample for forall, example for exists).
	    result = evalQuantifiers(init, newvardecls, body, int1)
	    if (compare(init, result) !== 0) {
		// this is a CROCK, but expedient (append model/countermodel to Boolean result).
		// result.push(int);
		return result;
	    }
	}
	return result;
    }
}

// reduceFcn(accumResult, val) -> accumResult
// accumResult -- accumulated results of all interpretations
// vardecls -- list of ["vardecl" ["Symbol", "x"], <set>]
// filterForm -- term formula -- use result if true, otherwise skip it.
// resultTerm -- term that computes result 
// int -- scoped variable assignment.
// returns new accumResult
// Correctness:  This always returns the accumulated results for the 
// interpretations it evaluated.  The set of interpretations done at any point
// is the cartesian product of the interpretations evaluated so far.
// At the beginning, init is the accumResult for no interpretations.
// When the final recursive call returns, it is the accumResult for the entire
// cartesian product.
// FIXME: Can also do "choose" with this (want early exit, though).
// FIXME: Is there a general way to handle early exit?
function evalComprehension(reduceFcn, accumResult, vardecls, filterForm, resultTerm, int) {
    vardecls.map(checkIsTerm);
    checkIsTerm(filterForm);
    checkIsTerm(resultTerm);
//    console.log("evalComprehension:");
//    console.log(" vardecls = ", JSON.stringify(vardecls, null, 2));
//    console.log(" filterForm = ", JSON.stringify(filterForm, null, 2));
//    console.log(" resultTerm = ", JSON.stringify(resultTerm, null, 2));

    if (vardecls.length === 0) {
	// We have a complete intepretation.
	// If it survives the filter, transform the result and reduce it.
	var keep = isTrue(srflaEval(filterForm, int));
	if (keep) {
	    var newElt = srflaEval(resultTerm, int);
	    return reduceFcn(accumResult, newElt);
	}
	else {
	    return accumResult;	// no change.
	}
    }
    else {
	var binding = vardecls[0];
	var symbol = binding[1];
	var variable = symbol[1];
	// evaluate the set in the variable binding.
	// Note: need to do this each time because it may depend on previous variables.
	var set = srflaEval(binding[2], int).slice(1); 
	var newvardecls = vardecls.slice(1); // FIXME: unnecessary copy
	// create new scope for binding the quantified variable.
	// do this OUTSIDE the loop, so we can reuse the object and
	// just change the value.
	var int1 = Object.create(int); // make a new object to bind the quantified variable.

	// For each value in the set, bind var to that value in int,
	// then evaluate the body.  Accumulate results according to the quantifier.
	for (var i = 0; i < set.length; i++) {
	    int1[variable] = set[i];
	    accumResult =
		evalComprehension(reduceFcn, accumResult, newvardecls, filterForm, resultTerm, int1);

	}
	return accumResult;
    }
}


// FIXME: This is a special case of something more general: map, collect & reduce. 
// Are set comprehensions also a special case?
// e is ["\\forall", <vardecls>, <body>], int is an object (interpretation)
function evalForall(e, int)
{
    return evalQuantifiers(SRFLATRUE, e[1].slice(1), e[2], int);
}

// e is ["\\exists", <vardecls>, <body>], int is an object (interpretation)
function evalExists(e, int)
{
    return evalQuantifiers(SRFLAFALSE, e[1].slice(1), e[2], int);
}

// adds values to a set, returns the extended set.
function adjoinReduce(set, value)
{
    return set.concat([ value ]);
}

function evalRecord(e, int)
{
    // [ "recordfields", ["\\mapsto", var, val], ...] ]
    var rec = {};
    for (var i = 1; i < e.length; i++) {
	// FIXME: Should I allow dependencies on previous field decls, like let*?
	rec[e[i][1]] = srflaEval(e[i][2], int);
    }
    // FIXME: need different tags for record literal and record parse tree.
    return ["Record", rec];
}

function applyLambda(lambdaExpr, actuals,  int)
{
    var i;
    var formals = lambdaExpr[1].slice(1);
    var body = lambdaExpr[2];
    var newInt = Object.create(int); // make a new scope
    if (formals.length != actuals.length) {
	throw new Error("Different numbers of formals and actuals.\nformals = ",
			JSON.stringify(formals,[], 2),
			", actuals = ",
			JSON.stringify(actuals,[], 2),
			"\n");
    }
    else {
	// bind formals to actuals
	for (i=0; i < actuals.length; i++) {
	    var eactual = srflaEval(actuals[i], int);
	    newInt[formals[i]] = eactual;
	}
	return srflaEval(body, newInt);
    }
}

// Evaluate a call expression.  ["call", funexpr, ...]
// Funexpr must eval to a javascript function or a lambda expression
function evalCall(e, int)
{
    var fun = e[1];
    var efun = srflaEval(fun, int);	// eval the operator
    var actuals = e.slice(2);
    var result;
    if (typeof(efun) === 'function') {
	// It's a native function
	// FIXME: Unclear whether to evaluate actuals.
	result = apply(efun, actuals);
    }
    else if (isArray(efun) && efun[0] === '\\lambda') {
	// this code is for a lambda.
	result = applyLambda(efun, actuals, int);
    }
    else {
	throw new Error("Call not a function: ", efun);
    }
    return result;
}

function evalITE(e, int)
{
    var evalCond = srflaEval(e[1], int);
    if (isTrue(evalCond)) {
	return srflaEval(e[2], int);
    }
    else {
	return srflaEval(e[3], int);	
    }
}

// FIXME: Check that args are constant and of appropriate type.
// FIXME: THIS IS A SPECIAL FUNCTION SCOPE.  Use normal scope?  Or put this in it?
// Dispatch based on operator.  This only evaluates the top-level.
var eval1 = {
    // Data type constructors
    // FIXME: canonicalize string rep of number. Or do this in lexer?
    '\\T': function evalT (e) { return e; },
    '\\F': function evalF (e) { return e; },
    'Number': function evalNumber (e) { return e; },
    'String': function evalString (e) { return e; },
    'Symbol': function evalSymbol (e, int) {
	var val = int[e[1]];
	var err;
	if (typeof(val) === "undefined") {
	    throw new Error("Undefined variable: " + e[1]);
	}
	return val;
    },
    'Record': function (e, int) { return e; }, // recordfields vs. Record confusion.
    'getfield': getField,
    '(' : function (e) { return e[1]; },
    'Tuple' : function evalTuple (e) { return e; },
    'Set': normalizeSet,

    // equality
    '=': function evalEquals (e) { return boolToSrfla(equals(e[1], e[2])); },

    // Set relations
    '\\subseteq': function evalSubsetEq (e) { return isSubset(e[1], e[2], false); },
    '\\subset': function evalSubset (e) { return isSubset(e[1], e[2], true); },
    '\\supseteq': function evalSupsetEq (e) { return isSubset(e[2], e[1], false); },
    '\\supset': function evalSupset (e) { return isSubset(e[2], e[1], true); },

    // Set operations
    '\\in' : function (e) {
	// FIXME: check if e[2] is an array.
	// special case to treat relations as sets of tuples.
	if (isArray(e[2]) && e[2][0] === '\\relation') {
	    return isMember(e[1], graph(e[2]));
	}
	else {
	    return isMember(e);
	}
    },

    '\\cup' : union,
    '\\cap' : intersection,
    '\\backslash' : setdiff,
    '\\times': function evalCartesianProduct(e) {
	var result =  product(e[1].slice(1), e[2].slice(1));
	result.unshift("Set");
	return result;
    },
    '\\powset': powerSet,

    '\\ldots' : evalRange,

    // FIXME: have to check for arithmetic interpretation.
    '+' : function evalPlus(e) { return ["Number", e[1][1] + e[2][1]]; },
    '-' :  function evalSubtract(e) { if (e.length === 2) {
		             return ["Number", - e[1][1]];
			  }
			  else {
			    return ["Number", e[1][1] - e[2][1]];
			  }
		       },
    '\\cdot' : function evalTimes(e) { return ["Number", e[1][1] * e[2][1]]; },
    // FIXME: How to handle undefined values?  Exception?
    '/' : divide,
    '^' : function evalExpt(e) { return ["Number", expt(e[1][1], e[2][1])]; },

    // *** String operations

    // arithmetic comparison
    '<' : function evalLess (e) { return boolToSrfla(e[1] < e[2]); },
    '>' : function evalGtr (e) { return boolToSrfla(e[1] > e[2]); },
    '\\le' : function evalLE (e) { return boolToSrfla(e[1] <= e[2]); },
    '\\ge' : function evalGE (e) { return boolToSrfla(e[1] >= e[2]); },

    // Logical connectives
    '\\neg': function evalNeg(e) { return boolToSrfla(!isTrue(e[1])); },
    '\\wedge': function evalAnd(e) { return srflaAnd(e[1], e[2]); },
    '\\vee': function evalOr(e) { return srflaOr(e[1], e[2]); },
    '\\implies': function evalImplies(e) {
	// console.log("implies: ", JSON.stringify(e, null, 2));
	return srflaImplies(e[1], e[2]); },
    '\\bicond': function evalBicond(e) { return srflaBicond(e[1], e[2]); },
    '\\xor': function evalXor(e) { return srflaXor(e[1], e[2]); },

    // quantifiers
    '\\forall' : evalForall,
    '\\exists' : evalExists,

    // **** predicates

    'comprehension' : 
	function (e) {
	    return evalComprehension(adjoinReduce, // reduceFcn
				     ["Set"],	    // accumResult
				     e[2].slice(1), // varDecls
				     e[3],	     // filterForm
				     e[1],	     // resultTerm
				     {});	     // int
	},
    'var' :
    function(e, int) {
	// ? int should be global interp?
	var sym = e[1];
	var val = srflaEval(e[2], int)
	int[sym] = val;
	// return is intentionally undefined
    },
    'recordfields' : evalRecord,
    '\\relation' : function (e) {
	// just return "e" -- recursive evaluation did all the work.
	return e;
    },
    'ite' : evalITE,
    // For now, just return the lambda.  Later, could error-check and
    // substitute defined variables (or make a closure).
    // Oops -- don't want to substitute, because it breaks recursion!
    '\\lambda' : function (e) { return e; },
    'call' : evalCall
}

// recursive evaluator
// FIXME: split into special eval function with default of switch going to bottom-up eval.
// FIXME: If op were attribute of array object, accessing children would be easier.
// Later: ITE?
//   *** Need array objects for true and false?
// e is an expr, int is an object representing an interpretation
function srflaEval (e, int) {
//    console.log("int: ", JSON.stringify(int, undefined, 2) );
//    console.log("srflaEval e= ", JSON.stringify(e, undefined, 2) );
//    console.log("srflaEval int= ", JSON.stringify(int, undefined, 2) );
    checkIsTerm(e);
    if (!int) { throw new Error("int is undefined."); };
    var op = e[0];
    var ee = e;
    // FIXME: evaluation strategy. This should be handled more generally.
    // perhaps a separate table for how to evaluate each operator?
    // Also, non-strict evaluation of if, and, or, etc. here.
    // first, evaluate children.
    if (op === "\\forall" || op === "\\exists" || op === "comprehension" || op === 'var'
        || op === 'recordfields' || op === 'Record' || op === 'getfield' || op === '\\lambda'
	|| op === 'ite') {
	// special evaluation to avoid messing with vardecl names.
	// is this a special case of some kind of "do" operator? map/reduce?
	// like a set comprehension, but with a special non-boolean accumulator
	// handle evaluation in eval1
    }
    else if (!isLeaf(op)) {
	ee = e.slice(1);	// ee copy of args of e
	ee = ee.map(function (e) { return srflaEval(e, int); } );
	ee.unshift(op);		// put op on front
    }
    // fallthrough case: it's a symbol.
    
    //    console.log(ee);
    // eval this
    // FIXME: Should eval1 separate op, args?
    return eval1[op](ee, int);
}

// exports.compare = compare;
// exports.isTrue = isTrue;
// exports.eval1 = eval1;
// exports.srflaEval = srflaEval;
// exports.boolToSrfla = boolToSrfla;
// exports.evalComprehension = evalComprehension;
// exports.expt = expt;


// *** a lot of othis can be combined with lower level operations!
// *** intersection and set difference could have been comprehensions!
// Superset and subset are just implications.
// S1 subseteq S2 == \forall x \in S1 : \exists y \in S2 -- that would be slow, though. 
// What the heck -- I have to implement model checking, anyway.

// logical formula interpretation on an object.
// object binds symbols -- symbol lookup in object.
// function "satisfies" -- interpretation satisfies formula.