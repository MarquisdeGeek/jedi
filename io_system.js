
IOSystem = function() {
	this.output = "";
}

IOSystem.prototype.write = function(line) {
	if (typeof line !== "undefined") {
		this.output += line;
	}
}

IOSystem.prototype.writeLine = function(line) {
	this.write(line + "\n");
}
