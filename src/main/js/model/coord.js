//-------------------------------------------------- COORD CLASS  ---------------------------------------------------//

/**
 * A simple pair of coordinates x,y for to use to locate any pixel
 */
function Coord(x, y) {
	this.class = 'Coord';
	this.x = x;
	this.y = y;
}

Coord.prototype = {
	toString : function()	{
			return "Coord["+this.x+","+this.y+"]";
	}
	, add : function(other) {
		return new Coord(this.x + other.x, this.y + other.y);
	}
	, equals : function(other){
		return this.x == other.x && this.y == other.y;
	}
	, substract : function(other){
		return new Coord(this.x - other.x, this.y - other.y);
	}
	, getLength : function() {
	  return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	, clone : function() {
		return new Coord(this.x, this.y);
	}
	, hasSameAxis : function(other) {
		return this.x == other.x || this.y == other.y;
	}
	, isOppositeDir: function(other){
		return this.add(other).getLength() == 0;
	}
}
