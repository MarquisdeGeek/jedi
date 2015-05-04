// Jedi Forth - Marquis de Geek - Steven Goodwin - 2015
ForthState = function() {
	this.dataStack = [];	// aka parameter stack
	this.returnStack = [];
	this.wordStack = [];
	//
	this.processMethodStack = [this.interpretWord];
	this.trace(0);
	//
	this.evaluationCode = [];	// code list
	this.evaluationIndex = 0;
	this.evaluationCompiledWord = null;	// when in compile mode, which word is being compiled
}
// TODO: If stacks are exhausted, then throw an exception
ForthState.prototype.push = function(value) {
	this.dataStack.push(value);
}

ForthState.prototype.pop = function(value) {
	return this.dataStack.pop();
}

ForthState.prototype.pushReturn = function(value) {
	this.returnStack.push(value);
}

ForthState.prototype.popReturn = function(value) {
	return this.returnStack.pop();
}

ForthState.prototype.trace = function(switchOn) {
	this.traceOn = switchOn;
}

ForthState.prototype.vlist = function() {
	var stack =  this.wordStack;
	var o = "";

	for(var i=stack.length;i>0;) {
		o += stack[--i].word + " ";
	}
	return o;
}

ForthState.prototype.dump = function() {
	// TODO: Remind myself which way around these go
	//for(var i=stack.length;i>0;) {
	fns = function(stack) {
		var o = '';
		for(var i=0;i<stack.length;++i) {
			o += stack[i] + " ";
		}
		return o;
	}

	var o = "( ";
	o += "\\ " + fns(this.dataStack);
	o +=" R: " + fns(this.returnStack);
	o += "-- )";
	return o;
}

ForthState.prototype.addWord = function(name, fn) {
	this.wordStack.push({ "word" : name, "method" : fn, "compile" : []});
	return this.wordStack[this.wordStack.length-1];
}

ForthState.prototype.getWord = function(name) {
	// TODO: Consider an option to allow case sensitive words
	// https://www.complang.tuwien.ac.at/forth/gforth/Docs-html/Case-insensitivity.html
	name = name.toLowerCase();
	for(var i=0;i<this.wordStack.length;++i) {
		if (this.wordStack[i].word === name) {	// todo: consider regex, so numbers can be processed automagically
			return this.wordStack[i];
		}
	}
	return undefined;
}

ForthState.prototype.evaluateNext = function() {
	++this.evaluationIndex;
}

ForthState.prototype.isEvaluationComplete = function() {
	return this.evaluationIndex >= this.evaluationCode.length ? true : false;
}

ForthState.prototype.getEvaluationWord = function(offset) {
	return this.evaluationCode[this.evaluationIndex + (offset ? offset : 0)].toLowerCase();
}

ForthState.prototype.applyEvaluationCode = function(line) {
	var r = line.trim().split(/\s+/);
	this.evaluationCode = this.evaluationCode.concat(r);
}

ForthState.prototype.addCompiledArgument = function(value) {
	this.evaluationCompiledWord.compile.push(value);
}
		
ForthState.prototype.pushAddress = function() {
	this.pushReturn(this.evaluationIndex);
}
			
ForthState.prototype.jumpToAddress = function(addr) {
	this.evaluationIndex = addr;
}

// Skip to the next instance of the word 'else', of (if that's not found) 'then'
// This covers both if-then and if-else-then. It relies on ';' in the std parser.
ForthState.prototype.forwardToElseOrThen = function() {
	var i = this.evaluationIndex + 1;	// +1 because we want the next 'else'
	
	do {
		if (this.evaluationCode[i].toLowerCase() == "else" || this.evaluationCode[i].toLowerCase() == "then") {
			this.evaluationIndex = i;	// WARNING:  this relies on the .next() method being called, to avoid re-calling the method
			return;
		}
		++i;
	} while(i<this.evaluationCode.length);
	// TODO: handle the case when IF has been pushed on the evaluation stack, but there isn't an else/then on it, yet.
}

ForthState.prototype.pushProcessMethod = function(newHandler) {
	this.processMethodStack.push(newHandler);
}

ForthState.prototype.popProcessMethod = function() {
	this.processMethodStack.pop();
}

ForthState.prototype.evaluateWord = function(word, sys) {
	return this.processMethodStack[this.processMethodStack.length-1].call(this, word, sys);
}

ForthState.prototype.enterCompileMode = function(sys) {

	this.pushProcessMethod(this.compileWord);
	
	this.evaluationCompiledWord = this.addWord(this.getEvaluationWord(1), function(state, sys) {
		// This insert the array of compiled items into the code stream immediately following the word call.
		// It's not realistic, because Forth words are generally compiled, but it ensures that do-loop works because
		// the iterator points back to an entry into the evaluationCode array.
		state.evaluationCode.splice.apply(state.evaluationCode, [state.evaluationIndex+1, 0].concat(this.compile));	
	});
	
	this.evaluateNext();	// skip the ':'. We rely on the standard 'interpret' to skip the next() one (i.e. the name)
}

ForthState.prototype.enterPrintMode = function(sys) {
	this.pushProcessMethod(this.printTokens);
}

ForthState.prototype.interpretWord = function(word, sys) {
	var wordDef	= this.getWord(word);

	if (wordDef !== undefined) {
		wordDef["method"](this, sys);	

	} else if ( /^-{0,1}\d+$/.test(word) ) {	// is integer?
		this.push(parseInt(word, 10));
	} else {
		return false;
	}
	
	this.traceOn && sys.write(this.dump());	// this might be the only time I use this 'trick'

	return true;
}

ForthState.prototype.printTokens = function(word, sys) {
	if (word.slice(-1) == '"') {
		word = word.slice(0, -1);
		this.popProcessMethod();
	}
	sys.write(word + " ");
	return true;
}

ForthState.prototype.compileWord = function(word, sys/*unused*/) {
	// We don't really _compile_ the code, but store the words
	// in an array, so they can be interpreted later.
	var wordDef	= this.getWord(word);

	if ( word === ';' ) {	// switch back to previous mode (usually interpret)
		this.popProcessMethod();
	} else {
		this.addCompiledArgument(word);
	}

	return true;
}
	
ForthState.prototype.evaluate = function(line, sys) {
	sys = sys || new IOSystem();

	this.applyEvaluationCode(line);
	
	var word;
	do {
		word = this.getEvaluationWord();
		
		if (!this.evaluateWord(word, sys)) {
			this.evaluateNext();	// skip the broken word, as it's on the stack and must be ignored from now on
			return { "success" : false , "error" : "Unknown word : " + word };	// no word recognized
		}
		
		this.evaluateNext();
	} while(!this.isEvaluationComplete());

	return { "success" : true, "output" : sys.output };
}
