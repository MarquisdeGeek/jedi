var FORTH_TRUE = -1;
var FORTH_FALSE = 0;

// TODO: This method of implement the library doesn't allow you to call one Word from inside the function of another.
// It's not an issue for a project of this size/scope, but might be an interest amendment.
ForthLibrary = function(state) {
	// Standard stack ops
	state.addWord("drop", function(s) { s.pop(); });
	state.addWord("swap", function(s) { var one = s.pop(); var two = s.pop(); s.push(one); s.push(two); });
	state.addWord("nip", function(s) { var one = s.pop(); var two = s.pop(); s.push(one); });
	state.addWord("over", function(s) { var one = s.pop(); var two = s.pop(); s.push(two); s.push(one); s.push(two); });
	state.addWord("rot", function(s) { var one = s.pop(); var two = s.pop(); var three = s.pop(); s.push(two); s.push(one); s.push(three); });
	state.addWord("dup", function(s) { var one = s.pop(); s.push(one); s.push(one); });	// "0 pick"
	state.addWord("?dup", function(s) { var one = s.pop(); s.push(one); if (one != 0) { s.push(one); } });
	state.addWord("2dup", function(s) { var one = s.pop(); var two = s.pop();  s.push(two); s.push(one); s.push(two); s.push(one); });
	state.addWord("pick", function(s) { var n = s.pop(); var data = s.getFrom(n); s.push(data);	});

	// Binary op
	state.addWord("+", function(s) { var one = s.pop(); var two = s.pop(); s.push(one+two);	});
	state.addWord("*", function(s) { var one = s.pop(); var two = s.pop(); s.push(one*two);	});
	state.addWord("-", function(s) { var one = s.pop(); var two = s.pop(); s.push(two-one);	});
	state.addWord("/", function(s) { var one = s.pop(); var two = s.pop(); s.push(two/one);	});
	state.addWord("mod", function(s) { var one = s.pop(); var two = s.pop(); s.push(two%one);	});
	state.addWord("/mod", function(s) { var one = s.pop(); var two = s.pop(); s.push(two%one); s.push(Math.floor(two/one)); });
	state.addWord("*/", function(s) { var divisor = s.pop(); var rhs = s.pop(); var lhs = s.pop(); s.push(Math.floor((lhs*rhs)/divisor)); });

	// Unary
	state.addWord("abs", function(s) { var one = s.pop(); s.push(one>=0?one:-one);	});
	state.addWord("negate", function(s) { var one = s.pop(); s.push(-one);	});
	
	// Misc maths
	state.addWord("min", function(s) { var one = s.pop(); var two = s.pop(); s.push(one<two?one:two); });
	state.addWord("max", function(s) { var one = s.pop(); var two = s.pop(); s.push(one>two?one:two); });
	// TODO: Bitwise ops
	
	// Output
	state.addWord(".", function(s, sys) { var output = s.pop(); sys.write(output);  sys.write(" "); });
	state.addWord('."', function(s, sys) { s.enterPrintMode(sys); });
	state.addWord("cr", function(s, sys) { sys.write("\n"); });
	state.addWord("space", function(s, sys) { sys.write(" "); });
	state.addWord("spaces", function(s, sys) { var i=s.pop(); sys.write(Array(i+1).join(" ")); });
	state.addWord("emit", function(s, sys) { sys.write(String.fromCharCode(s.pop())); });

	// Return stack
	state.addWord(">r", function(s) { var one = s.pop(); s.pushReturn(one);	});
	state.addWord("r>", function(s) { var one = s.popReturn(); s.push(one);	});
	state.addWord("i", function(s) { var one = s.popReturn(); s.pushReturn(one);  s.push(one); });
	state.addWord("r@", function(s) { var one = s.popReturn(); s.pushReturn(one); s.push(one);	});

	// Comparators
	state.addWord("0=", function(s) { var result = s.popReturn(); s.push(result == 0 ? FORTH_TRUE : FORTH_FALSE); });
	state.addWord("0<", function(s) { var result = s.popReturn(); s.push(result < 0 ? FORTH_TRUE : FORTH_FALSE); });
	state.addWord("0>", function(s) { var result = s.popReturn(); s.push(result > 0 ? FORTH_TRUE : FORTH_FALSE); });
	state.addWord("<",  function(s) { var rhs = s.popReturn(); var lhs = s.popReturn(); s.push(lhs < rhs ? FORTH_TRUE : FORTH_FALSE); });
	state.addWord(">",  function(s) { var rhs = s.popReturn(); var lhs = s.popReturn(); s.push(lhs > rhs ? FORTH_TRUE : FORTH_FALSE); });
	state.addWord("<=", function(s) { var rhs = s.popReturn(); var lhs = s.popReturn(); s.push(lhs <= rhs ? FORTH_TRUE : FORTH_FALSE); });
	state.addWord(">=", function(s) { var rhs = s.popReturn(); var lhs = s.popReturn(); s.push(lhs >= rhs ? FORTH_TRUE : FORTH_FALSE); });
	state.addWord("=",  function(s) { var rhs = s.popReturn(); var lhs = s.popReturn(); s.push(lhs == rhs ? FORTH_TRUE : FORTH_FALSE); });
	state.addWord("<>", function(s) { var rhs = s.popReturn(); var lhs = s.popReturn(); s.push(lhs != rhs ? FORTH_TRUE : FORTH_FALSE); });

	// Loops and conditions
	// There are two cases here:
	//    1 if ." Working" then ;
	//    1 if ." Working" else ." failed" then ;
	state.addWord("if", function(s) { var condition = s.pop(); if (!condition) { s.forwardToElseOrThen(); } });
	state.addWord("else", function(s) { s.forwardToElseOrThen(); });
	state.addWord("then", function(s) {});	// capture for -if-else-then
	state.addWord(":", function(s, sys) { s.enterCompileMode(sys);  });
	state.addWord(";", function(s) { });	// capture for end of compilation
	
	state.addWord("do", function(s) { var index = s.pop(); var limit = s.pop();  s.pushAddress(); s.pushReturn(limit); s.pushReturn(index); });
	state.addWord("loop", function(s) { var index = s.popReturn(); var limit = s.popReturn(); var addr = s.popReturn();
		if (++index < limit) {
			s.jumpToAddress(addr);
			s.pushAddress(addr); 
			s.pushReturn(limit); s.pushReturn(index);
		}
	 });
	state.addWord("+loop", function(s) { var index = s.popReturn(); var limit = s.popReturn(); var increment = s.pop(); var addr = s.popReturn();
		if (index != limit) {	// TODO: Offer protection if the limit isn't reached exactly
			index += increment;
			s.jumpToAddress(addr);
			s.pushAddress(addr); 
			s.pushReturn(limit); s.pushReturn(index);
		}
	 });

	// utility
	state.addWord("true", function(s) { s.push(FORTH_TRUE);	});
	state.addWord("false", function(s){ s.push(FORTH_FALSE); });
	state.addWord("1+", function(s) { var one = s.pop(); s.push(one+1);	});	// could be implemented as 1 +
	state.addWord("1-", function(s) { var one = s.pop(); s.push(one-1);	});
	state.addWord("2+", function(s) { var one = s.pop(); s.push(one+2);	});
	state.addWord("2-", function(s) { var one = s.pop(); s.push(one-2);	});
	state.addWord("2*", function(s) { var one = s.pop(); s.push(one*2);	});
	state.addWord("2/", function(s) { var one = s.pop(); s.push(one/2);	});
	
	// Internal helper/debug
	state.addWord("dump", function(s,sys) { sys.write(s.dump()); });
	state.addWord(".s", function(s,sys) { sys.write(s.dump()); });
	state.addWord("vlist", function(s,sys) { sys.write(s.vlist()); });
	state.addWord("trace", function(s,sys) { s.trace(s.pop());	});
	
	//
}

