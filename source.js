
var world = new Array();

var row_one = '[{"id":"cc00","coordinates":"0,0","x":0,"y":0,"color":"gray"},{"id":"cc01","coordinates":"0,1","x":50,"y":0,"color":"blue"},{"id":"cc02","coordinates":"0,2","x":100,"y":0,"color":"white"},{"id":"cc03","coordinates":"0,3","x":150,"y":0,"color":"white"},{"id":"cc04","coordinates":"0,4","x":200,"y":0,"color":"white"}]';
var row_two = '[{"id":"cc10","coordinates":"1,0","x":0,"y":50,"color":"white"},{"id":"cc11","coordinates":"1,1","x":50,"y":50,"color":"white"},{"id":"cc12","coordinates":"1,2","x":100,"y":50,"color":"white"},{"id":"cc13","coordinates":"1,3","x":150,"y":50,"color":"white"},{"id":"cc14","coordinates":"1,4","x":200,"y":50,"color":"white"}]';
var row_three = '[{"id":"cc20","coordinates":"2,0","x":0,"y":100,"color":"white"},{"id":"cc21","coordinates":"2,1","x":50,"y":100,"color":"white"},{"id":"cc22","coordinates":"2,2","x":100,"y":100,"color":"white"},{"id":"cc23","coordinates":"2,3","x":150,"y":100,"color":"white"},{"id":"cc24","coordinates":"2,4","x":200,"y":100,"color":"white"}]';
var row_four = '[{"id":"cc30","coordinates":"3,0","x":0,"y":150,"color":"white"},{"id":"cc31","coordinates":"3,1","x":50,"y":150,"color":"white"},{"id":"cc32","coordinates":"3,2","x":100,"y":150,"color":"white"},{"id":"cc33","coordinates":"3,3","x":150,"y":150,"color":"white"},{"id":"cc34","coordinates":"3,4","x":200,"y":150,"color":"white"}]';
var row_five = '[{"id":"cc40","coordinates":"4,0","x":0,"y":200,"color":"white"},{"id":"cc41","coordinates":"4,1","x":50,"y":200,"color":"white"},{"id":"cc42","coordinates":"4,2","x":100,"y":200,"color":"white"},{"id":"cc43","coordinates":"4,3","x":150,"y":200,"color":"white"},{"id":"cc44","coordinates":"4,4","x":200,"y":200,"color":"white"}]';

var base_grid = "["+row_one+","+row_two+","+row_three+","+row_four+","+row_five+"]";

var numRows = 5;
var numColumns = 5;
var Elem_Width = 50;
var Elem_Height = 50;

var gridWidth = 0;
var gridHeight = 0;
var borderWidth = 0;
var borderHeight = 0;

var borderObjOffsetTop = 0;
var borderObjOffsetLeft = 0;

var gridObjOffsetTop = 0;
var gridObjOffsetLeft = 0;

var paletteClicked = false;
var gridClicked = false;

//vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv//

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
		    x = parse_coords[2];
		    y = parse_coords[1];
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

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^//

function getJSON()
{
	alert(JSON.stringify(world));
}

function submitAndVerify()
{
	var inputFormula = "eval \\forall x \\in world, y \\in world : (Blue(x) \\wedge Gray(y) \\implies LeftOf(x, y));";

  	// Convert to srfla representation
  	globalInterp.world = blocksWorldToSrfla(world);

  	// console.log("world: ", JSON.stringify(globalInterp.world, undefined, 2));

  	// Read function definitions: LeftOf, etc.

    var blocksDefsInput = 
        "function LeftOf(b1, b2) b1.x < b2.x;\n"
        + "function RightOf(b1, b2) b1.x > b2.x;\n"
        + "function Below(b1, b2) b1.y > b2.y;\n"
        + "function Above(b1, b2) b1.y < b2.y;\n"
        + "function Red(b1) b1.color = \"red\";\n"
        + "function Gray(b1) b1.color = \"gray\";\n"
        + "function Blue(b1) b1.color = \"blue\";\n";

    // console.log("blocksDefsInput = ", blocksDefsInput);

    var blocksDefs = srflaMathParser.parse(blocksDefsInput);

    console.log("blocksDefs: ", JSON.stringify(blocksDefs, undefined, 2));

    for (var i = 0; i < blocksDefs.length; i++) {
        srflaEval(blocksDefs[i], globalInterp);
    }

    var formulas;

    try {
    //    console.log("input formula: ", JSON.stringify(inputFormula, undefined, 2 ))
        formulas = srflaMathParser.parse(inputFormula);
    //    console.log("parsed formula: ", JSON.stringify(formulas, undefined, 2 ))
    }
    catch (e) {
        console.log("Exception: ", e);
        console.log("Exception: ", e.stack);
    };

    var result = srflaEval(formulas[0], globalInterp);

    // FIXME: counterexample if false?

    if (isTrue(result)) {
        // process.exit(code=0);
        console.log("T");
    }
    else {
        // process.exit(code=1);
        console.log("F");
    }

    if (isTrue(result)) {
    	alert("TRUE");
      	//document.getElementById("result").innerHTML="<p>TRUE</p>";
      	//$("#result").html("<p> T </p>");
    }
    else {
    	alert("FALSE");
      	//document.getElementById("result").innerHTML="<p>FALSE</p>";
      	//$("#result").html("<p> F </p>");
    }
	//alert(JSON.stringify(world));
	//console.log("submitted");
	//$.post("submit.php", { "blue_Y": localBlueY, "red_Y": localRedY } );
}

function remap(input)
{
	console.log("input: "+input);
	if ((0 < input) && (input <= 50)) return 0;
	if ((50 < input) && (input <= 100)) return 1;
	if ((100 < input) && (input <= 150)) return 2;
	if ((150 < input) && (input <= 200)) return 3;
	if ((200 < input) && (input <= 250)) return 4;
}

function getMouseXY(event) 
{

    //turn on and off as a sanity check 
    // document.getElementById('absX').value = event.pageX;
    // document.getElementById('absY').value = event.pageY;
    var localX = event.pageX - borderObjOffsetLeft;
    var localY = event.pageY - borderObjOffsetTop;
  	// document.getElementById('cursorX').value = localX;
   //  document.getElementById('cursorY').value = localY;

	if (paletteClicked)
	{
		var absX = event.pageX;
    	var absY = event.pageY;
    	var adjX = absX - borderObjOffsetLeft;
    	var adjY = absY - borderObjOffsetTop;

    	var currentElement = document.getElementById("paletteElem");
		//console.log("adjX: " + adjX);
		//console.log("adjY: " + adjY);
		// currentObj.x = (adjX - 25);
		// currentObj.y = (adjY - 25);
		currentElement.style.left = (adjX - 25) + "px";
		//console.log("objLeft: " + currentObj.styleLeft);
		currentElement.style.top = (adjY - 25) + "px";
		//console.log("objTop: " + currentObj.styleTop);
		displayGrid();
	}
}

function createGrid()
{
	var borderObj = document.getElementById('borderContainer');
	var gridObj = document.getElementById('gridContainer');
	for (var i = 0; i < numRows; i++)
	{
		var gridRow = new Array();
		world[i] = gridRow;
		for (var j = 0; j < numColumns; j++)
		{
			var newChild = document.createElement('div');
			newChild.className = "childContainer";
			var newLeft = j * Elem_Width;
			var newTop = i * Elem_Height;
			newChild.style.top = newTop + "px";
			newChild.style.left = newLeft + "px";
			newChild.style.backgroundColor = "white";
			var newID = "cc" + i + j;
			newChild.setAttribute("id", newID);
			gridObj.appendChild(newChild);

			var gridElem = new Object();
			gridElem.id = newID;
			gridElem.coordinates = String(i) + "," + String(j);
			gridElem.x = newLeft;
			gridElem.y = newTop;
			gridElem.color = "white";
			world[i][j] = gridElem;
		}
	}
	gridWidth = (numColumns * Elem_Width);
	gridHeight = (numRows * Elem_Height);
	gridObj.style.width = gridWidth + "px";
	gridObj.style.height = gridHeight + "px";

	borderWidth = (numColumns * Elem_Width + (4 * Elem_Width)) - 2;
	borderHeight = (numRows * Elem_Height + (2 * Elem_Height)) - 2;
	//we count 3 separating columns + an additional one for the positioning = 4
	borderObj.style.width = borderWidth + "px";
	//we count two for the top and bottom borders
	borderObj.style.height = borderHeight + "px";
}

function mouseDown(event)
{
	var absX = event.pageX;
	var absY = event.pageY;
	var adjX = absX - borderObjOffsetLeft;
	var adjY = absY - borderObjOffsetTop;

    //if within the borderContainer
    if ((absX < (borderObjOffsetLeft + borderWidth) ) && (absX > borderObjOffsetLeft))
  	{
  		if ((absY < (borderObjOffsetTop + borderHeight) ) && (absY > borderObjOffsetTop))
  		{
    		console.log("down within borderContainer ");
    		if ((50<adjX) && (adjX <300))
    		{
    			if ((50<adjY) && (adjY <300))
    			{
    				console.log("down within the grid");
					var xIndex = remap(adjX - 50);//x is the column
					var yIndex = remap(adjY - 50);//y is the row
					console.log("xIndex in grid: " + xIndex);
					console.log("yIndex in grid: " + yIndex);
					var selectedGridElem = world[yIndex][xIndex];
					console.log("color in grid: " + selectedGridElem.color);
					var clr = selectedGridElem.color;
					if (clr == 'white')
					{
						console.log("white, no color");
					}
					else
					{
						console.log("color");
						var borderObj = document.getElementById('borderContainer');
						var newElem = document.createElement('div');
						newElem.style.left = (adjX - 25) + "px";
						newElem.style.top = (adjY - 25) + "px";
						newElem.style.width = Elem_Width + "px";
						newElem.style.height = Elem_Height + "px";
						newElem.style.position = 'absolute';
						newElem.style.backgroundColor = clr;
						newElem.setAttribute("id", "paletteElem");
						borderObj.appendChild(newElem);
						paletteClicked = true;

						selectedGridElem.color = "white";
						displayGrid();
					}
    			}
    		}
  		}
  	}
  	if ((375<adjX) && (adjX <425))
  	{
  		console.log("down within palette");
  		if ((50<adjY) && (adjY<=100))
  		{
  			console.log("palette1");
			var borderObj = document.getElementById('borderContainer');
			var newElem = document.createElement('div');
			newElem.style.left = (adjX - 25) + "px";
			newElem.style.top = (adjY - 25) + "px";
			newElem.style.width = Elem_Width + "px";
			newElem.style.height = Elem_Height + "px";
			newElem.style.position = 'absolute';
			newElem.style.backgroundColor = 'blue';
			newElem.setAttribute("id", "paletteElem");
			borderObj.appendChild(newElem);
			paletteClicked = true;
  		}
  		if ((100<adjY) && (adjY<=150))
  		{
  			console.log("palette2");
  			var borderObj = document.getElementById('borderContainer');
			var newElem = document.createElement('div');
			newElem.style.left = (adjX - 25) + "px";
			newElem.style.top = (adjY - 25) + "px";
			newElem.style.width = Elem_Width + "px";
			newElem.style.height = Elem_Height + "px";
			newElem.style.position = 'absolute';
			newElem.style.backgroundColor = 'red';
			newElem.setAttribute("id", "paletteElem");
			borderObj.appendChild(newElem);
			paletteClicked = true;
  		}
  		if ((150<adjY) && (adjY<=200))
  		{
  			console.log("palette3");
  			var borderObj = document.getElementById('borderContainer');
			var newElem = document.createElement('div');
			newElem.style.left = (adjX - 25) + "px";
			newElem.style.top = (adjY - 25) + "px";
			newElem.style.width = Elem_Width + "px";
			newElem.style.height = Elem_Height + "px";
			newElem.style.position = 'absolute';
			newElem.style.backgroundColor = 'green';
			newElem.setAttribute("id", "paletteElem");
			borderObj.appendChild(newElem);
			paletteClicked = true;
  		}
  		if ((200<adjY) && (adjY<=250))
  		{
  			console.log("palette4");
  			var borderObj = document.getElementById('borderContainer');
			var newElem = document.createElement('div');
			newElem.style.left = (adjX - 25) + "px";
			newElem.style.top = (adjY - 25) + "px";
			newElem.style.width = Elem_Width + "px";
			newElem.style.height = Elem_Height + "px";
			newElem.style.position = 'absolute';
			newElem.style.backgroundColor = 'yellow';
			newElem.setAttribute("id", "paletteElem");
			borderObj.appendChild(newElem);
			paletteClicked = true;
  		}
  		if ((250<adjY) && (adjY<=300))
  		{
  			console.log("palette5");
  			var borderObj = document.getElementById('borderContainer');
			var newElem = document.createElement('div');
			newElem.style.left = (adjX - 25) + "px";
			newElem.style.top = (adjY - 25) + "px";
			newElem.style.width = Elem_Width + "px";
			newElem.style.height = Elem_Height + "px";
			newElem.style.position = 'absolute';
			newElem.style.backgroundColor = 'gray';
			newElem.setAttribute("id", "paletteElem");
			borderObj.appendChild(newElem);
			paletteClicked = true;
  		}
  	}
}

function mouseUp(event)
{
	console.log("mouseup");
	var absX = event.pageX;
	var absY = event.pageY;
	var adjX = absX - borderObjOffsetLeft;
	var adjY = absY - borderObjOffsetTop;

	if (paletteClicked)
	{
    	var currentElement = document.getElementById("paletteElem");
		var roundedX = (50 * (Math.round(adjX/50) - 1));
		var roundedY = (50 * (Math.round(adjY/50) - 1));
		currentElement.style.left = roundedX + "px";
		//console.log("objLeft: " + currentObj.styleLeft);
		currentElement.style.top = roundedY + "px";
		//console.log("objTop: " + currentObj.styleTop);
		//console.log("within obj");
		var gridX = roundedX - 50;
		var gridY = roundedY - 50;
		console.log("gridX: " + gridX);
		console.log("gridY: " + gridY);
		if ((0<=gridX) && (gridX<=200))
		{
			if ((0<=gridY) && (gridY<=200))
			{
				var xIndex = gridX / 50;//x is the column
				var yIndex = gridY / 50;//y is the row
				var selectedGridElem = world[yIndex][xIndex];
				selectedGridElem.color = currentElement.style.backgroundColor;
				console.log("new color: " + currentElement.style.backgroundColor);
			}
		}
		currentElement.parentNode.removeChild(currentElement);
	}
	paletteClicked = false;
	displayGrid();
}

function initGridObj(json_str)
{
	world = JSON.parse(json_str);
	numRows = world.length;
	numColumns = world[0].length;
}

function displayGrid()
{
	var borderObj = document.getElementById('borderContainer');
	var gridObj = document.getElementById('gridContainer');
	gridObj.innerHTML = ''; //clears contents on screen
	
	for (var i = 0; i < numRows; i++) 
	{
		for (var j = 0; j < numColumns; j++) 
		{
			var grid_elem = world[i][j];
			var newChild = document.createElement('div');
			newChild.className = "childContainer";
			var newLeft = j * Elem_Width;
			var newTop = i * Elem_Height;
			newChild.style.top = newTop + "px";
			newChild.style.left = newLeft + "px";
			newChild.style.backgroundColor = grid_elem.color;
			var newID = "cc" + i + j;
			newChild.setAttribute("id", newID);
			gridObj.appendChild(newChild);
		}
	}
	gridWidth = (numColumns * Elem_Width);
	gridHeight = (numRows * Elem_Height);
	gridObj.style.width = gridWidth + "px";
	gridObj.style.height = gridHeight + "px";

	// multiply by 2 for visual buffer space, subtract two for the border
	borderWidth = (numColumns * Elem_Width + (2 * Elem_Width)) - 2;
	borderHeight = (numRows * Elem_Height + (2 * Elem_Height)) - 2;

	borderObj.style.width = borderWidth + "px";
	borderObj.style.height = borderHeight + "px";
}

function init()
{

	// var obj = document.getElementById('childContainer');
	// console.log(obj);
	// obj.onmouseover = displayInnerCoordinates;
	initGridObj(base_grid)
	displayGrid();
//	createObjects(6, 50, 50);

	var borderObj = document.getElementById('borderContainer');
	borderObjOffsetTop = borderObj.offsetTop + 2;
	borderObjOffsetLeft = borderObj.offsetLeft + 2;
	console.log("borderObjOffsetTop: " + borderObjOffsetTop);
	console.log("borderObjOffsetLeft: " + borderObjOffsetLeft);

	var gridObj = document.getElementById('gridContainer');
	gridObj.style.top = 50 + "px";
	gridObj.style.left = 50 + "px";
	gridObjOffsetTop = gridObj.offsetTop;
	gridObjOffsetLeft = gridObj.offsetLeft;
	console.log("gridObjOffsetTop: " + gridObjOffsetTop);
	console.log("gridObjOffsetLeft: " + gridObjOffsetLeft);

	document.onmousemove = getMouseXY;
	document.onmousedown = mouseDown;
	document.onmouseup = mouseUp;
	console.log("done init");
}



