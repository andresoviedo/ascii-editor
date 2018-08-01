function UnicodeChars(){
	this.LATIN_PLUS_SIGN = "+";
	this.LATIN_HYPHEN_MINUS = "-";
	this.LATIN_VERTICAL_LINE = "|";
	this.BOX_HORIZONTAL="─";
	this.BOX_VERTICAL="│";
	this.BOX_CROSS="┼";
	this.BOX_CORNER_TOP_LEFT="┌";
	this.BOX_CORNER_TOP_RIGHT="┐";
	this.BOX_CORNER_BOTTOM_LEFT="└";
	this.BOX_CORNER_BOTTOM_RIGHT="┘";
	this.BOX_HORIZONTAL_LIGHT_UP="┴";
	this.BOX_HORIZONTAL_LIGHT_DOWN="┬";
	this.BOX_VERTICAL_LIGHT_RIGHT="├";
	this.BOX_VERTICAL_LIGHT_LEFT="┤";
	
	this.init();
}

UnicodeChars.prototype.init = function(){
	var allChars = [];
	var boxChars = [];
	for (field in this){
		if (this.hasOwnProperty(field)) {
			char = this[field];
			allChars.push(char);
			if (field.startsWith("BOX")){
				boxChars.push(char);
			}
		}
	}
	this.CHARS = allChars;
	this.BOX_CHARS = boxChars;
}

UnicodeChars.prototype.isChar = function(char){
	return this.CHARS.indexOf(char) != -1;
}

UnicodeChars.prototype.isBoxChar = function(char){
	return this.BOX_CHARS.indexOf(char) != -1;
}

var UC = UnicodeChars = new UnicodeChars();

