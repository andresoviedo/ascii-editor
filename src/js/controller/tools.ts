// ---------------------------------------------- CANVAS TOOL ------------------------------------------------------ //

/**
 * Abstract tool
 */
class CanvasTool {
	toolId: string;
	enabled: boolean;

	constructor(toolId:string){
		this.toolId = toolId;
		this.enabled = false;
	}
	getId(){ return this.toolId; }
	isEnabled(){ return this.enabled; }
	setEnabled(enabled: boolean){ this.enabled = enabled; }
	click() {}
	mouseDown(eventObject: JQuery.Event) {	}
	mouseMove(eventObject: JQuery.Event) {	}
	mouseUp() {	}
	mouseEnter() { }
	mouseLeave() { }
	cellDown(coord:Coord) { }
	cellMove(coord:Coord) { }
	cellUp(coord:Coord) { }
	keyDown(eventObject:JQuery.Event){	}
	keyPress(eventObject:JQuery.Event){ }
	keyUp(eventObject:JQuery.Event){ }
	cursor(): string | undefined { return undefined }
}

// ---------------------------------------------- MOVE FEATURE ----------------------------------------------------- //

class SelectTool extends CanvasTool {
	canvas: CanvasDecorator & DrawableCanvas;
	changed = false;
	// mouse action
	startCoord: Coord | null = null;
	currentCoord: Coord | null = null;
	startTime: number | null = null;
	currentTime: number | null = null;
	action: string | null | undefined = null;
	mouseStatus: string | null = null;
	// area selection
	controlKeyEnabled = false;
	selectionArea: Box | null = null;
	finalBox: Box | null = null;
	finalMove: Box | null = null;
	// shape selection
	endPointsInfo: EndPointInfo[] | null = null;
	selectedBox: BoxInfo |null = null;

	constructor(toolId: string, canvas: SelectTool['canvas']){
		super(toolId);
		this.canvas = canvas;
	}
	cursor(){
		return "pointer";
	}
	hasChanged(){
		return this.canvas.hasChanged() || this.changed;
	}
	setChanged(changed:boolean){
		this.canvas.setChanged(changed)
		this.changed = changed;
	}
	keyDown(eventObject: JQuery.Event){
		// check if canvas has the focus
		if (!this.canvas.isFocused()) return;
		// capture control key event
		if (eventObject.keyCode == KeyEvent.DOM_VK_CONTROL){
			this.controlKeyEnabled = true;
		}
		// check if user is deleting the selection
		if (eventObject.keyCode == KeyEvent.DOM_VK_DELETE) {
			if (this.finalBox != null){
				console.log("Deleting selection '"+this.finalBox+"'...");
				this.canvas.getGrid().clear(this.finalBox.min, this.finalBox.max);
				this.canvas.commit();
				this.finalBox = null;
				return;
		 }
	 }
	}
	keyUp(eventObject: JQuery.Event){
		// capture control key event
		if (eventObject.keyCode == KeyEvent.DOM_VK_CONTROL){
			this.controlKeyEnabled = false;
		}
	}
	cellDown(coord:Coord){
		this.startCoord = coord;
		this.startTime = this.currentTime = new Date().getTime();
		this.mouseStatus = "down";
		this.process();
	}
	cellMove(coord: Coord){
		this.currentCoord = coord;
		this.currentTime = new Date().getTime();
		this.mouseStatus = this.mouseStatus == "down" || this.mouseStatus == "dragging"? "dragging" : "hover";
		this.process();
	}
	cellUp(coord: Coord){
		this.currentCoord = coord;
		this.currentTime = new Date().getTime();
		this.mouseStatus = "up";
		this.process();
	}
	mouseLeave(){
		this.mouseStatus = "leave";
		this.process();
	}
	process(){
		var coord = this.currentCoord;
		this.action = this.getNextAction();
		switch(this.action){
			case "select-area":
			case "select-area-in-progress": this.selectArea(coord); break;
			case "select-area-ready": this.selectArea(coord); break;
			case "select-area-moving": this.selectArea(coord); break;
			case "select-area-finalized": this.selectArea(coord); this.action = null; break;
			case "select-shape":
			case "select-shape-moving": this.selectShape(coord); break;
			case "select-shape-finalized": this.selectShape(coord); this.action = null; break;
			case "all": this.selectArea(coord); this.selectShape(coord); break;
			case "rollback": this.canvas.rollback(); this.action = null;
		}
	}
	getNextAction(){
		if (this.mouseStatus == "hover") return this.action;
		if (this.mouseStatus == "down" && this.action == "select-area-ready") return "select-area-moving";
		if (this.mouseStatus == "down") return "all";
		if (this.mouseStatus == "dragging" && this.action == "select-area-moving") return "select-area-moving";
		if (this.mouseStatus == "dragging" && this.action == "select-area-in-progress") return "select-area-in-progress";
		if (this.mouseStatus == "dragging" && this.action == "select-shape-moving") return "select-shape-moving";
		if (this.mouseStatus == "dragging" && this.controlKeyEnabled) return "select-area-in-progress";
		if (this.mouseStatus == "dragging" && this.selectedBox != null) return "select-shape-moving";
		if (this.mouseStatus == "dragging") return "select-area-in-progress";
		if (this.mouseStatus == "up" && this.action == "select-shape-moving") return "select-shape-finalized";
		if (this.mouseStatus == "up" && this.action == "select-area-in-progress") return "select-area-ready";
		if (this.mouseStatus == "up" && this.action == "select-area-moving") return "select-area-finalized";
		if (this.mouseStatus == "leave") return "rollback";
		return undefined;
	}
	selectArea (coord: Coord){
		// user finalized the selection
		if (this.mouseStatus == "up"){
			// only do it once (user may click several times on the final selection)
			if (this.finalBox == null){
				this.finalBox = this.selectionArea;
				this.selectionArea = null;
			} else if (this.finalMove != null){
				// user thas completed moving the selection
				this.canvas.commit();
				this.finalMove = null;
				this.finalBox = null;
				this.selectionArea = null;
			}
			return;
		}
		// user is selecting, either to start a new selection or to move selection
		if (this.mouseStatus == "down"){
			// check if user is starting new selection
 			if (this.finalBox == null || !this.finalBox.contains(coord)){
				this.finalBox = null;
				this.selectionArea = null;
				this.canvas.rollback();
			}
			// user is going to move the selection
			return;
		}

		if (this.mouseStatus == "dragging") {
			// user is moving selection
			if (this.finalBox != null && this.finalBox.contains(coord)	|| this.finalMove != null && this.finalMove.contains(coord)){
				// move implementation
				this.canvas.rollback();
				// calculate movement difference
				var diffCoord = coord.substract(this.startCoord);
				// move selected area
				this.canvas.moveArea(this.finalBox, diffCoord);
				// update final box
				this.finalMove = this.finalBox.add(diffCoord);
				return;
			}
			// user is selecting...
			// check we are selecting at least 1 pixel
			if (this.startCoord == null || this.startCoord.equals(coord)){
				if (this.selectionArea != null){
					this.selectionArea = null;
					this.canvas.rollback();
				}
				return;
			}
			// calculate box so we know from where to where we should draw the line
			this.canvas.rollback();
			this.selectionArea = new Box(this.startCoord, coord);

			// stack non-empty pixel within the selected square
			for (var minX = this.selectionArea.minX; minX <= this.selectionArea.maxX; minX++) {
				for (var minY = this.selectionArea.minY; minY <= this.selectionArea.maxY; minY++) {
					var pixelCoord = new Coord(minX, minY);
					var pixelValue = this.canvas.getPixel(pixelCoord).getValue();
					this.canvas.stackPixel(pixelCoord, pixelValue != null? pixelValue : " ");
				}
			}
		}
		this.changed = true;
	}
	selectShape (coord: Coord){
		if (this.mouseStatus == "down") {
				this.endPointsInfo = this.canvas.detectEndPoints(this.startCoord);
				this.selectedBox = this.detectBox(coord);
				this.detectConnectedBoxes(this.selectedBox);
				return;
		}
		if (this.action != "select-shape" && this.action != "select-shape-moving" && this.action != "select-shape-finalized") return;
		if (this.mouseStatus == "leave") {
			this.endPointsInfo = null;
			this.selectedBox = null;
			this.canvas.rollback();
			return;
		}
		if (this.mouseStatus == "up") {
			this.canvas.commit();
			return
		};
		// box not detected
		if (this.selectedBox == null) return;
		// move box
		this.canvas.rollback();
		this.drawConnections(this.selectedBox,window.zeroCoord,"");
		this.canvas.moveArea(this.selectedBox.box,coord.substract(this.startCoord));
		this.drawConnections(this.selectedBox,coord.substract(this.startCoord),"-");
		this.changed = true;
	}
	detectBox(coord:Coord){
		var boxPoints = this.canvas.detectBox(coord);
		if (boxPoints == null) return null;
		var box = this.canvas.getBox(boxPoints);
		var endPoints = this.canvas.getEndPoints(boxPoints);
		// for (var point in boxPoints){ this.canvas.stackPixel(boxPoints[point],'-');	} // debug
		// this.canvas.stackPixel(box.min,'+'); this.canvas.stackPixel(box.max,'+'); // debug
		// for (var point in endPoints){ this.canvas.stackPixel(endPoints[point],'+');	} // debug
		return new BoxInfo(boxPoints, box, endPoints);
	}
	detectConnectedBoxes(boxInfo:BoxInfo | null){
		if (boxInfo == null || boxInfo.connectors.length == 0) return; // no T or + connections
		var connectors = boxInfo.connectors;
		var connections = boxInfo.connections;
		for (var i in connectors){
			var start = connectors[i];
			for (var j in window.contextCoords){
				var dir = window.contextCoords[j];
				var next = start.add(dir);
				if (boxInfo.box.contains(next)) continue;
				var linePoints = this.canvas.getLinePoints(start, dir)
				/*for (var k in linePoints){
					this.canvas.stackPixel(linePoints[k],'?');
				}*/
				if (linePoints == null) continue; // error somewhere!
				connections.push(new Connection(linePoints));
			}
		}
	}
	detectBox_with_endPoints(coord: Coord){
		// detect corner endpoints & connection endpoints
		var cornerEndPoints = [];
		var connectionEndPoints = [];
		if (this.endPointsInfo.length >= 2){
			for (var endPointIdx in this.endPointsInfo){
				var endPointInfo = this.endPointsInfo[endPointIdx];
				if (endPointInfo.isCorner()){
					cornerEndPoints.push(endPointInfo);
				} else if (endPointInfo.context.length >= 3){
					connectionEndPoints.push(endPointInfo);
				}
				if (endPointInfo.childEndpoints.length > 0){
					for (var endPointIdx2 in endPointInfo.childEndpoints){
						var endPointInfo2 = endPointInfo.childEndpoints[endPointIdx2];
						if (endPointInfo2.context.length >= 3){
							connectionEndPoints.push(endPointInfo2);
						}
					}
				}
			}
		}
		// we need at least 2 corners to start detecting the box
		if (cornerEndPoints.length < 2) return;
		var epCorner1 = cornerEndPoints[0], epCorner2 = cornerEndPoints[1];
		// get child corners
		var childCorners1 = epCorner1.getCorners(), childCorners2 = epCorner2.getCorners();
		if (!childCorners1 || !childCorners2 || childCorners1.length == 0 || childCorners2.length == 0) return;
		// we need both childs to be in the same axis
		if (!childCorners1[0].position.hasSameAxis(childCorners2[0].position)) return;
		// test whether the clicked coord its in a corner
		var startCoordIsCorner = epCorner1.isHorizontal != epCorner2.isHorizontal;
		// test if both childs are the opposite corner
		if (startCoordIsCorner && childCorners1[0].position.equals(childCorners2[0].position)){
			console.log("Detected box type 1");
			return new BoxInfo(new Box(null, this.startCoord,childCorners1[0].position),connectionEndPoints);
		}
		// test whether the user click on a side of the box
		if (!startCoordIsCorner && this.canvas.isDrawCharArea(new Box(childCorners1[0].position,childCorners2[0].position))){
			console.log("Detected box type 2");
			return new BoxInfo(new Box(null, epCorner1.position, childCorners2[0].position),connectionEndPoints);
		}
		return null;
	}
	detectConnectedBoxes_with_endpoints(boxInfo: BoxInfo | null){
		if (boxInfo == null) return;
		var connectorEndPoints = boxInfo.connectors;
		var possibleBoxEndpoints = [];
		for (var endPointIdx in connectorEndPoints){
			var endPoint = connectorEndPoints[endPointIdx];
			// TODO: handle tables
			if (endPoint.context.length == 3){
				var tDirection = this.getTDirection(endPoint.context);
				var possibleBoxConnection = this.canvas.getLinePoints(endPoint.position, tDirection);
				if (possibleBoxConnection != null){
					boxInfo.connections.push(new Connection(possibleBoxConnection));
				}
			}
		}
	}
	getTDirection(pixelContext:PixelContext){
		if (pixelContext.length != 3) throw new Error("This is not a T connected pixel");
		if (!pixelContext.left) return rightCoord;
		if (!pixelContext.right) return leftCoord;
		if (!pixelContext.top) return bottomCoord;
		if (!pixelContext.bottom) return topCoord;
	}

  drawConnections(boxInfo: BoxInfo, coordDiff: Coord, value: string) {
		if (boxInfo == null || boxInfo.connections.length == 0) return;
		for (var i in boxInfo.connections){
			var connection = boxInfo.connections[i];
			var horizontalLength = connection.getDirection().add(rightCoord).getLength();
			var horizontalLength2 = connection.getEndDirection().add(rightCoord).getLength();
			var dir = horizontalLength == 0 || Math.abs(horizontalLength) >= 2;
			var dir2 = horizontalLength2 == 0 || Math.abs(horizontalLength2) >= 2;
			var lineType = null;
			if (dir && dir2) lineType = "horizontal-horizontal";
			if (!dir && !dir2) lineType = "vertical-vertical";
			if (dir && !dir2) lineType = "horizontal-vertical";
			if (!dir && dir2) lineType = "vertical-horizontal";
			this.canvas.drawLine(connection.points[0].add(coordDiff), connection.points[connection.points.length-1], lineType, value);
		}
	}
}

// ------------------------------------------------- TOOLS DECORATORS ---------------------------------------------- //

class ClearCanvasTool extends CanvasTool {
  canvas: CanvasDecorator;
	constructor(toolId:string, canvas: ClearCanvasTool['canvas']){
		super(toolId);
		this.canvas = canvas;
	}
	click(){
		this.canvas.getGrid().clear();
		this.canvas.commit();
	}
}

class EditTextTool extends CanvasTool {
  canvas: CanvasDecorator & DrawableCanvas ;
  mouseCoord: JQuery.Event | null = null;
  startCoord: Coord | null = null;
  currentText: string | null = null;

  constructor(toolId: string, canvas: EditTextTool['canvas']){
		super(toolId);
		this.canvas = canvas;
	 	this.init();
	}
	init(){
		$("#text-input").keyup((event) => {
			if (event.keyCode == KeyEvent.DOM_VK_ESCAPE){
				this.close();
				return;
			}
			this.refresh();
		});
		$("#text-input").keypress((eventObject) =>{
			this.refresh();
		});
		$("#text-input").change(()=> {
			this.refresh();
		});
		$("#text-input").blur(()=> {
			// TODO: close on blur, but count that ok button is also trigerring blur
			// this.close();
		});
		$("#text-input-close").click(()=> {
			this.close();
		});
		$("#text-input-OK").click(()=> {
			this.refresh();
			this.canvas.getGrid().commit();
			this.close();
		});
	}
	mouseDown(eventObject: JQuery.Event) {
		this.mouseCoord = eventObject;
	}
	cellDown(startCoord: Coord) {
		// guess where the text exactly starts
		this.startCoord = this.canvas.getTextStart(startCoord);
		// show widget 50 pixels up
		$("#text-widget").css({"left":this.mouseCoord.clientX,"top":Math.max(0,this.mouseCoord.clientY-50)});
		// get current text
		this.currentText = this.canvas.getText(this.startCoord);
		// initialize widget
		$("#text-input").val(this.currentText != null? this.currentText : "");
		// show widget & set focus
		$("#text-widget").show(400, function() {
			$("#text-input").focus();
	  });
	}
	refresh() {
		var newValue = $("#text-input").val();
		this.canvas.rollback();
		if (this.currentText != null){
			this.canvas.getGrid().import(this.currentText.replace(/./g," "),this.startCoord);
		}
		try{
			this.canvas.getGrid().import(newValue,this.startCoord);
		}catch(e){
			console.log(e.stack);
		}
		this.canvas.setChanged(true);
	}
	close() {
		$("#text-input").val("");
		$("#text-widget").hide();
		this.canvas.getGrid().rollback();
	}
	cursor() {
  	return "text";
	}
}

class EndPointInfo {
	class = "EndPointInfo";
	position: Coord;
	context: PixelContext;
	isHorizontal:boolean;
	startWithArrow:boolean;
	endWithArrow:boolean;
	endWithArrow2:boolean | undefined;
	childEndpoints: EndPointInfo[] | null;

	constructor(position: Coord,context: PixelContext,isHorizontal:boolean,startWithArrow:boolean, endWithArrow:boolean, endWithArrow2?:boolean){
	  this.position = position;
		this.context = context;
	  this.isHorizontal = isHorizontal;
	  this.startWithArrow = startWithArrow;
	  this.endWithArrow = endWithArrow;
	  this.endWithArrow2 = endWithArrow2;
		this.childEndpoints = null;
	}
	isCorner(){
		return this.context.length == 2 && this.context.bottom != this.context.top && this.context.left != this.context.rigth;
	}
	getCorners(){
		if (this.childEndpoints == null) return null;
		var cornerEndPoints = [];
		for (var endPointIdx in this.childEndpoints){
			if (this.childEndpoints[endPointIdx].isCorner()){
				cornerEndPoints.push(this.childEndpoints[endPointIdx]);
			}
		}
		return cornerEndPoints;
	}
	toString(){
		return "EndPointInfo: position '"+this.position+"', context '"+this.context+"', isHorizontal '"+this.isHorizontal
		+"', startWithArrow '"+this.startWithArrow+"', endWithArrow '"+this.endWithArrow+"', endWithArrow2 '"+this.endWithArrow2
		+"', childEndpoints '"+this.childEndpoints+"'";
	}
}

class BoxInfo {
	points: Coord[]
	box: Box
	connectors: Coord[]
	connections: Connection[]
	constructor(points: Coord[], box:Box,connectors: Coord[]){
		this.points = points;
		this.box = box;
		this.connectors = connectors;
		this.connections = [];
	}
}

class Connection {
  points: Coord[]
	constructor(points: Coord[]){
		this.points = points;
	}
	getDirection(){
		return this.points[1].substract(this.points[0]);
	}
	getEndDirection(){
		return this.points[this.points.length-1].substract(this.points[this.points.length-2]);
	}
}

/**
 * This is the function to draw boxes. Basically it needs 2 coordinates: startCoord and endCoord.
 */
class BoxDrawerTool extends CanvasTool {
  canvas: CanvasDecorator & DrawableCanvas & PointerDecorator;
  startCoord: Coord | null = null;
  endCoord: Coord | null = null;
  mouseStatus: string | null = null;
  mode: string | null = null;
  endPointsInfo: EndPointInfo[] | null = null;

	constructor(toolId: string, canvas: BoxDrawerTool['canvas']) {
		super(toolId);
		this.canvas = canvas;
	}
	cellDown(coord: Coord) {
		this.mouseStatus = "down";
		this.startCoord = coord;
		this.endPointsInfo = this.canvas.detectEndPoints(coord);
	}
	cellMove(coord: Coord) {
		// reset previous resizing data
		this.canvas.rollback();

		if (this.startCoord == null) {
			if (this.mouseStatus == null && this.mode == null){
				if (this.canvas.isDrawChar(this.canvas.getPixel(this.canvas.getPointerCell()))){
					this.endPointsInfo = this.canvas.detectEndPoints(coord);
					if (this.endPointsInfo != null){
						if (this.endPointsInfo.length == 2 && this.endPointsInfo[0].context.length == 1 && this.endPointsInfo[1].context.length == 1
							&& this.endPointsInfo[0].position.hasSameAxis(this.endPointsInfo[1].position)){
							var ep1 = this.endPointsInfo[0], ep2 = this.endPointsInfo[1];
							console.log("Highlighting line from '"+ep1.position+"' to '"+ep2.position+"'...");
							this.canvas.drawLine(ep1.position, ep2.position, ep1.isHorizontal, "+", true);
						}
					}
				}
			}
			return;
		};

		this.endCoord = coord;

		// update mouse status
		if (this.mouseStatus == "down"){
			this.mouseStatus = "moving";
		}
		else if (this.mouseStatus == "up"){
			this.mouseStatus = "hover";
		}

		// guess action
		if (this.mouseStatus == "moving"){
			if (this.mode == null){
				if (this.canvas.isDrawChar(this.canvas.getPixel(this.canvas.getSelectedCell()))){
						this.mode = "resizing";
				}	else {
						this.mode = "boxing";
				}
			}
		} else {
			this.mode = null;
		}

		// check whether the user is drawing a box or resizing it
		if (this.mode == "resizing" && this.endPointsInfo != null){
			// debug
			// console.log("Resizing..."+ this.endPointsInfo.length);

			// what we are doing?
			var action = null;
			// detect whether we are moving a line or doing something else
			if (this.endPointsInfo.length == 2 && this.endPointsInfo[0].context.length == 1 && this.endPointsInfo[1].context.length == 1
				&& this.endPointsInfo[0].position.hasSameAxis(this.endPointsInfo[1].position)){
				action = "moving-line";
			} else if (this.endPointsInfo.length == 2 && this.endPointsInfo[0].context.length == 2 && this.endPointsInfo[1].context.length == 2
				&& this.endPointsInfo[0].childEndpoints.length > 0 && this.endPointsInfo[1].childEndpoints.length > 0
				&& this.endPointsInfo[0].childEndpoints[0].position.hasSameAxis(this.endPointsInfo[1].childEndpoints[0].position)){
				if (this.endPointsInfo[0].childEndpoints[0].position.equals(this.endPointsInfo[1].childEndpoints[0].position)){
					action = "resizing-box";
				} else{
					action = "resizing-side";
				}
			}

			if (action == "moving-line"){
				console.log("Moving line from '"+this.startCoord+"' to '"+coord.substract(this.startCoord)+"'...");
				var ep1 = this.endPointsInfo[0], ep2 = this.endPointsInfo[1];
				this.canvas.drawLine(ep1.position, ep2.position, ep1.isHorizontal, "", true);
				this.canvas.drawLine(ep1.position.add(coord.substract(this.startCoord)), ep2.position.add(coord.substract(this.startCoord)), ep1.isHorizontal, "-", false);
				// this.canvas.moveArea(new Box(ep1.position,ep2.position), coord.substract(this.startCoord));
			}	else if (action == "resizing-side"){
				// delete the lines we are resizing ("" so its no drawn as uncommited change)
				this.canvas.drawLine(this.startCoord, this.endPointsInfo[0].childEndpoints[0].position, this.endPointsInfo[0].isHorizontal, "", true);
				this.canvas.drawLine(this.startCoord, this.endPointsInfo[1].childEndpoints[0].position, this.endPointsInfo[1].isHorizontal, "", true);
				// draw lines at new position, displacing only over 1 coordinate if moving a side
				var sideCoord = this.endPointsInfo[0].isHorizontal? new Coord(this.startCoord.x, coord.y) : new Coord(coord.x, this.startCoord.y);
				this.canvas.drawLine(sideCoord, this.endPointsInfo[0].childEndpoints[0].position, this.endPointsInfo[0].isHorizontal, "+", false);
				this.canvas.drawLine(sideCoord, this.endPointsInfo[1].childEndpoints[0].position, this.endPointsInfo[1].isHorizontal, "+", false);
			}	else if (action == "resizing-box"){
				// delete the lines we are resizing ("" so its no drawn as uncommited change)
			  this.canvas.drawLine(this.startCoord, this.endPointsInfo[0].childEndpoints[0].position, this.endPointsInfo[0].isHorizontal, "", true);
				this.canvas.drawLine(this.startCoord, this.endPointsInfo[1].childEndpoints[0].position, this.endPointsInfo[1].isHorizontal, "", true);
				// draw lines at new position
				this.canvas.drawLine(coord, this.endPointsInfo[0].childEndpoints[0].position, this.endPointsInfo[0].isHorizontal, "+", false);
				this.canvas.drawLine(coord, this.endPointsInfo[1].childEndpoints[0].position, this.endPointsInfo[1].isHorizontal, "+", false);

				// draw arrows in case
			  /*for (endPointIdx in endPointsInfo) {
			    if (this.endPointsInfo[endPointIdx].startWithArrow) this.canvas.stackPixel(coord, "^");
					if (this.endPointsInfo[endPointIdx].endWithArrow) this.canvas.stackPixel(this.endPointsInfo[endPointIdx].position, "^");
			    this.endPointsInfo[endPointIdx].endWithArrow2 && this.canvas.stackPixel(new Coord(this.endPointsInfo[endPointIdx].isHorizontal ?
			      this.endPointsInfo[endPointIdx].position.x : coord.x, this.endPointsInfo[endPointIdx].isHorizontal ? coord.y : this.endPointsInfo[endPointIdx].position.y), "^");
			  }*/
			}
			this.canvas.setChanged(true);
		}	else if (this.mode == "boxing"){
			// reset stack so we start drawing box every time the user moves the mouse
			this.canvas.getGrid().rollback();
			// draw horizontal line first, then vertical line
			this.canvas.drawLine(this.startCoord, coord, true, '+', false);
			// draw vertical line first, then horizontal line
			this.canvas.drawLine(this.startCoord, coord, false, '+', false);
			// update canvas
			this.canvas.setChanged(true)
		}
	}
	cellUp(coord: Coord) {
		// When the user releases the mouse, we know the second coordinate so we draw the box
		this.startCoord = null;

		if (this.mode == "boxing"){
			// user has the mouse-up (normal situation)
		} else if (this.mode == "resizing"){
			// user has finished resizing
		} else{
			// if user is leaving the canvas, reset stack
			this.canvas.getGrid().rollback();
		}
		// perform changes
		this.canvas.getGrid().commit();

		// update status
		this.mouseStatus = null;
		this.mode = null;

		// update canvas
		this.canvas.setChanged(true);
	}
	mouseLeave() {
		// If the mouse leaves the canvas, we dont want to draw nothing
		this.canvas.getGrid().rollback();
		this.mouseStatus = "out";
	}
	cursor() {
		return "crosshair";
	}
}

class LineTool extends CanvasTool {
	canvas: CanvasDecorator & DrawableCanvas
	startCoord: Coord | null = null;
	mouseStatus: string | null = null;

	constructor(toolId: string, canvas: LineTool['canvas']){
		super(toolId);
		this.canvas = canvas;
		this.startCoord = null;
		this.mouseStatus = null;
	}
	cellDown(coord: Coord) {
		this.mouseStatus = "down";
		this.startCoord = coord;
	}
	cellMove(coord: Coord) {
		if (this.mouseStatus == "down"){
			this.canvas.rollback();
			this.canvas.drawLine(this.startCoord, coord, "best", "-");
		}
	}
	cellUp(){
		// perform changes
		this.canvas.getGrid().commit();
		// update status
		this.mouseStatus = "up";
		// update canvas
		this.canvas.setChanged(true);
	}
}

/**
 * This tool allows exporting the grid text so user can copy/paste from there
 */
class ExportASCIITool extends CanvasTool {
	canvas: CanvasDecorator
	canvasWidget: JQuery
	exportWidget: JQuery
	mode: number

 	constructor(toolId: string, canvas: ExportASCIITool['canvas'], canvasWidgetSelectorId: string, widgetSelectorId: string){
		super(toolId);
		this.canvas = canvas;
		this.canvasWidget = $(canvasWidgetSelectorId);
		this.exportWidget = $(widgetSelectorId);
		this.mode = 0;
		this.init();
	}
	init(){
		$(this.widget).hide();
		$("#dialog-textarea").keyup((event)=> {
			if (event.keyCode == KeyEvent.DOM_VK_ESCAPE){
				if (this.mode == 1){
					this.close();
					return;
				}
				return;
			}
		});
		/*$("#dialog-widget-close").click(function() {
			this.close();
		}.bind(this));*/
	}
	click(){
		if (this.mode == 1){
			this.close();
			return;
		}
		$("#dialog-textarea").val(this.canvas.getGrid().export());
		$(this.canvasWidget).hide();
		this.mode = 1;
    $(this.exportWidget).show();
    /*$("#dialog-textarea").focus(function(){
			var $this = $(this);
	    $this.select();
		});*/
  }
  close() {
		$(this.exportWidget).hide();
		$(this.canvasWidget).show();
		$("#dialog-textarea").val("");
		this.mode = 0;
	}
}
