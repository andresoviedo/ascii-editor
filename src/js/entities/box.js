//--------------------------------------------- DRAW CLASSES ------------------------------------------------------- //

/**
 * Calculates the mins and max given 2 coordinates
 */
function Box(coordA, coordB) {
	this.class = 'Box';
	this.minX = Math.min(coordA.x, coordB.x);
	this.minY = Math.min(coordA.y, coordB.y);
	this.maxX = Math.max(coordA.x, coordB.x);
	this.maxY = Math.max(coordA.y, coordB.y);
	this.min = new Coord(this.minX, this.minY);
	this.max = new Coord(this.maxX, this.maxY);
	this.midX = Math.floor((this.maxX + this.minX) / 2)
	this.midY = Math.floor((this.maxY + this.minY) / 2)
	this.mid = new Coord(this.midX, this.midY);
}

Box.prototype = {
	contains : function(coord){
		return coord && coord.x >= this.minX && coord.x <= this.maxX && coord.y >= this.minY && coord.y <= this.maxY;
	}
	, add : function(coord){
		return new Box(this.min.add(coord),this.max.add(coord));
	}
	, squareSize : function(){
		// +1 because boxes include bounds
		return (this.maxX-this.minX+1)*(this.maxY-this.minY+1);
	}
	, toString : function(){
		return "Box: ('"+this.min+"'->'"+this.max+"', mid:"+this.mid+")";
	}
}
