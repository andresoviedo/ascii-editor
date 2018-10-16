class UnicodeChars {
	LATIN_PLUS_SIGN = "+";
	LATIN_HYPHEN_MINUS = "-";
	LATIN_VERTICAL_LINE = "|";
	BOX_HORIZONTAL="─";
	BOX_VERTICAL="│";
	BOX_CROSS="┼";
	BOX_CORNER_TOP_LEFT="┌";
	BOX_CORNER_TOP_RIGHT="┐";
	BOX_CORNER_BOTTOM_LEFT="└";
	BOX_CORNER_BOTTOM_RIGHT="┘";
	BOX_HORIZONTAL_LIGHT_UP="┴";
	BOX_HORIZONTAL_LIGHT_DOWN="┬";
	BOX_VERTICAL_LIGHT_RIGHT="├";
	BOX_VERTICAL_LIGHT_LEFT="┤";

	CHARS: string[];
	BOX_CHARS: string[];

	constructor(){
		let allChars = [];
		let boxChars = [];
		for (let field in this){
			if (this.hasOwnProperty(field)) {
				let char = String(this[field]);
				allChars.push(char);
				if (field.startsWith("BOX")){
					boxChars.push(char);
				}
			}
		}
		this.CHARS = allChars;
		this.BOX_CHARS = boxChars;
	}

  isChar(char: string | null) {
		return this.CHARS.indexOf(char) != -1;
	}

	isBoxChar(char: string) {
		return this.BOX_CHARS.indexOf(char) != -1;
	}
}

var UC = new UnicodeChars();

