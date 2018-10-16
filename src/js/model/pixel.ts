//------------------------------------------------- PIXEL CLASS -----------------------------------------------------//

class Pixel {
	class = "Pixel";
	// value of the pixel (drawchar or text)
	value: string | null = null;
	// temp value while the user is still using the tool
	tempValue: string | null = null;

	getValue() {
		return this.tempValue != null? this.tempValue : this.value;
	}
	clear() {
		this.value = null;
		this.tempValue = null;
	}
	isEmpty() {
		return this.value == null && this.tempValue == null;
	}
}
