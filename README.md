# Jedi Forth - Copyright 2015 Steven Goodwin

Released under the GNU GPL, version 3


This is a (very) simple implementation of Forth, using under 230 lines of Javascript. Including comments.

## Why is it called 'Jedi'?

Because it was released on May the 4th 2015!  I'm not apologizing for the bad pun, nor changing the name. (Until Disney sues me!)

## Why?

I just wondered how small I could write an interpreter in Javascript, and still make it something worthwhile.

## What's supported?

* Interpreted mode
* Compiled mode
* Trace debugging
* Conditionals (if-then-else)
* do loop and do +loop
* Print (.") and emit for output (input only via stack)
* A small, but workable, standard library

## What's the vlist?

```
trace vlist dump 2/ 2* 2- 2+ 1- 1+ false true +loop loop do ; then else if 
<> = >= <= > < 0> 0< 0= r@ i r> >r emit spaces space cr ." . max min negate 
abs */ /mod mod / - * + pick 2dup ?dup dup rot over nip swap drop
```

## Examples

### Rocket countdown

```
: countdown   0 SWAP   DO  CR  I  .   -1  +LOOP  ;
```

use with

```
10 countdown
```

### Factorial calculation

```
: factorial 1 + 1 1 rot rot do i * loop ;
```

use with

```
5 factorial
```


### Solving quadratics 

```
: QUADRATIC  >R SWAP ROT R@ *  + R> *  + ;
```

use with

```
2 7 9 3 QUADRATIC
```


## TODO

* Properly support the return stack.
* Support ( comments ) 
* Support \ comments
* Add hex/decimal bases
* Contants : e.g. 13 CONSTANT ENTER-KEY
* Variables : along with @ ! and other memory-based stuff


### Mising words
  exit
  watch out
  begin
  again
  until
  while
  repeat
  case
  of
  endof
  endcase
  .. probably lots of others ..

## Help with Forth

For language guides:

* http://www.forth.org/tutorials.html
* http://galileo.phys.virginia.edu/classes/551.jvn.fall01/primer.htm
* http://www.wulfden.org/downloads/Forth_Resources/SP_ProgrammingForth.pdf
* http://www.forth.com/starting-forth/sf6/sf6.html

For comparisons during development:

* http://home.diphi.com/users/jeffr/forth/jsforth.html

	
	
## Apologies
	Dear FIG - this is not worthy of your time. Sorry!
