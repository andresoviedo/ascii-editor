namespace util {
	
	export class UnicodeChars {

		public static LATIN_PLUS_SIGN = "+";
		public static LATIN_HYPHEN_MINUS = "-";
		public static LATIN_VERTICAL_LINE = "|";
		public static BOX_HORIZONTAL="─";
		public static BOX_VERTICAL="│";
		public static BOX_CROSS="┼";
		public static BOX_CORNER_TOP_LEFT="┌";
		public static BOX_CORNER_TOP_RIGHT="┐";
		public static BOX_CORNER_BOTTOM_LEFT="└";
		public static BOX_CORNER_BOTTOM_RIGHT="┘";
		public static BOX_HORIZONTAL_LIGHT_UP="┴";
		public static BOX_HORIZONTAL_LIGHT_DOWN="┬";
		public static BOX_VERTICAL_LIGHT_RIGHT="├";
		public static BOX_VERTICAL_LIGHT_LEFT="┤";
	
		public static CHARS : string[] = []
		public static BOX_CHARS : string[] = []

		
	
		static initialize(){
			let allChars : string[] = [];
			let boxChars : string[] = [];
			for (let field in Object.getOwnPropertyNames(this)){
				let char : string = (<any>UnicodeChars)[field];
				allChars.push(char);
				if (field.indexOf("BOX") == 0){
					boxChars.push(char);
				}
			}
			UnicodeChars.CHARS = allChars;
			UnicodeChars.BOX_CHARS = boxChars;
		}
	
		static isChar(char : string){
			return UnicodeChars.CHARS.indexOf(char) != -1;
		}
	
		static isBoxChar = function(char : string){
			return UnicodeChars.BOX_CHARS.indexOf(char) != -1;
		}
	}

	UnicodeChars.initialize();

	export const UC = UnicodeChars;
} 

