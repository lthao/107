
/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
"var"		      return 'var';
"function"	      return 'function';
"eval"		      return 'eval';
"domain" 	      return 'domain'
"codomain"            return 'codomain'
\"([^"\\]|(\\(.|\n)))*\" { yytext=yytext.substring(1, yytext.length-1); return 'STRING'; }
";"		      return ';';
"|"		      return '|';
"\\T"		      return '\\T';
"\\F"		      return '\\F';
"("		      return '('
")"		      return ')'
"\\{"		      return '\\{'
"\\}"		      return '\\}'
","		      return ','
":"		      return ':'
"\\times"             return '\\times'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"\\cdot"              return '\\cdot'
"^"                   return '^'
"="		      return '='
"<"		      return '<'
">"		      return '>'
"\\ge"		      return '\\ge'
"\\le"		      return '\\le'
"["                   return '['
"]"                   return ']'
"\\emptyset"	      return '\\emptyset'
"\\cup" 	      return '\\cup'
"\\cap" 	      return '\\cap'
"\\powset" 	      return '\\powset'
"\\ldots"	      return '\\ldots'
"\\in"		      return '\\in'
"\\subseteq" 	      return '\\subseteq'
"\\supseteq" 	      return '\\supseteq'
"\\subset" 	      return '\\subset'
"\\supset" 	      return '\\supset'
"\\ldots"	      return '\\ldots'
"\\vee"		      return '\\vee'
"\\implies"	      return '\\implies'
"\\bicond"	      return '\\bicond'
"\\xor"		      return '\\xor'
"\\wedge"	      return '\\wedge'
"\\neg"		      return '\\neg'
"\\forall"	      return '\\forall'
"\\exists"	      return '\\exists'
"\\relation"	      return '\\relation'
"\\to"		      return '\\to'
"\\mapsto"	      return '\\mapsto'
"\\lambda"	      return '\\lambda'
"if"		      return 'if'
"then"		      return 'then'
"else"		      return 'else'
"endif"		      return 'endif'
"."		      return '.'

[0-9]+("."[0-9]+)?\b  return 'NUMBER'
[a-zA-Z]([a-zA-Z0-9])*	return 'SYMBOL'

<<EOF>>               return 'EOF'
.                     {
		      // print("illegal char");  return 'INVALID_CHAR';
		      return "INVALID_CHAR";
		      }

/lex

/* operator associations and precedence */

%left    LAMBDA
%nonassoc '\\relation'
%nonassoc '\\implies'
%left ''\\bicond', ''\\xor'
%left '\\vee', 
%left '\\wedge'
%left '\\neg'
%left '\\subseteq' '\\supseteq' '\\subset' '\\supset'
%left '\\backslash'
%left '\\cup'
%left '\\cap' 
%left '\\times'
%left '\\in'
%nonassoc '\\forall' '\\exists'
%left '\\ldots'
%left '<' '>' '\\le' '\\ge' '='
%left '+' '-'
%left '\\cdot' '/'
%right '^'
%left UMINUS
%left '('
%left '.'


%start all

%% /* language grammar */

all
    : commands EOF { return $1; }
    ;

commands
    : commands command {
    //  console.log("command = ", $2);
    	$$ = $1; $$.push($2);
	   }
    | /* empty */ { $$ = []; }
    ;

command
    : 'var' SYMBOL '=' e ';' { $$ = ['var', $2, $4 ];  }
    | 'function' SYMBOL args e ';' 
      { $$ = ['var', $2, ['\\lambda', $3, $4 ]]; }
    | 'eval' e ';' { $$ = $2; }
    ;

e
    : '\\T' { $$ = ['\\T']; }
    | '\\F' { $$ = ['\\F']; }
    | e '\\vee' e
        {$$ = ['\\vee', $1, $3];}
    | e '\\implies' e
        {$$ = ['\\implies', $1, $3];}
    | e '\\bicond' e
        {$$ = ['\\vee', $1, $3];}
    | e '\\xor' e
        {$$ = ['\\vee', $1, $3];}
    | e '\\wedge' e
        {$$ = ['\\wedge', $1, $3];}
    | '\\neg' e
        {$$ = ['\\neg', $1];}
    | '\\forall' vardecllist ':' e 
        {$$ = [ '\\forall', $2, $4 ]; }
    | '\\exists' vardecllist ':' e 
	{$$ = [ '\\exists', $2, $4 ]; }
    | e '=' e
    	{$$ = [ '=', $1, $3 ]; }
    | e '\\le' e
    	{$$ = [ '\\le', $1, $3 ]; }
    | e '\\ge' e
    	{$$ = [ '\\ge', $1, $3 ]; }
    | e '<' e
    	{$$ = [ '<', $1, $3 ]; }
    | e '>' e
    	{$$ = [ '>', $1, $3 ]; }
    | e '+' e
        {$$ = ['+', $1, $3];}
    | e '-' e
        {$$ = ['-', $1, $3];}
    | e '\\cdot' e
        {$$ = ['\\cdot', $1, $3];}
    | e '/' e
        {$$ = ['/', $1, $3];}	
    | e '^' e
        {$$ = ['^', $1, $3];}	
    | '-' e %prec UMINUS
        {$$ = ['-', $2] ;}
    | e '\\cup' e
        {$$ = ['\\cup', $1, $3];}
    | e '\\cap' e
        {$$ = ['\\cap', $1, $3];}
    | e '\\times' e
        {$$ = ['\\times', $1, $3];}
    | e '\\backslash' e
        {$$ = ['\\backslash', $1, $3];}
    | '\\powset' '{' e '}'
        {$$ = ['\\powset', $1, $3];}
    | '[' e '\\ldots' e ']' 
	{ $$ = [ '\\ldots', $2, $4 ]; }
    | '\\emptyset'
        {$$ = ['\\emptyset'];}
    | e '\\in' e 
	{$$ = [ '\\in', $1, $3 ]; }	
    | e '\\subseteq' e
        {$$ = ['\\subseteq', $1, $3];}
    | e '\\supseteq' e
        {$$ = ['\\supseteq', $1, $3];}
    | e '\\subset' e
        {$$ = ['\\subset', $1, $3];}
    | e '\\supset' e
        {$$ = ['\\supset', $1, $3]; }
    | '\\{' e '|' vardecllist ':' e '\\}'
       {
          $$ = ['comprehension', $2, $4, $6];
      }
    | '\\relation' e '\\to' e ':' e
      {
	$$ = ['\\relation', $2, $4, $6 ];
      }
    | '\\{' exprlist '\\}'
       { $2.unshift('Set');
         $$ = $2;
	 }
    | e '.' e { $$ = ["getfield", $1, $3]; }
    | e '(' exprlist ')' 
      { $3.unshift('call', $1);
        $$ = $3;
      }
    | e '(' ')' 
      { $$ = [ 'call', $1]; }
    | '[' recorddecllist ']'
       { $$ = $2; }
    | '(' tupleexprlist ')' 
       { $2.unshift('Tuple');
       	 $$ = $2;
	 }
    | '(' e ')'
        {$$ = $2 ;}		// FIXME: preserve parentheses?
    | NUMBER
        {$$ = ['Number', parseInt($1)] ;}  // FIXME: In future, rationals? bignums? FP?
    | SYMBOL
        {$$ = ['Symbol', $1] ;}
    | STRING
        { $$ = ['String', $1]; }
    | '\\lambda' args e %prec LAMBDA
      { $$ = [ '\\lambda', $2, $3 ]; }
    | 'if' e 'then' e 'else' e 'endif' { $$ = ['ite', $2, $4, $6 ]; }
    | 'if' e 'then' e 'endif' { throw new Error("if-then must have else."); }
    ;

exprlist
    : e  { $$ = [ $1]; }
    | exprlist ',' e
     { $1.push($3);
       $$ = $1;
     }
    ;

tupleexprlist
    : e ',' e  { $$ = [$1, $3]; }
    | tupleexprlist ',' e
      {
        $1.push($3);
        $$ = $1;
      }
    ;

vardecl
    : SYMBOL '\\in' e { $$ = [ 'vardecl', ['Symbol', $1], $3 ]; }
    ;

vardecllist1
    : vardecllist1 ',' vardecl { $$ = $1; $$.push($3); }
    | vardecl  { $$ = [ $1 ]; }
    ;

vardecllist
    : vardecllist1 { $$ = $1; $$.unshift("vardecllist"); }
    ;

recorddecl
    : SYMBOL '\\mapsto' e { $$ = ["\\mapsto", $1, $3]; }
    ;

recorddecllist1
    : recorddecllist1 ',' recorddecl { $$ = $1; $$.push($3); }
    | recorddecl { $$ = [ $1 ]; }
    ;

recorddecllist
    : recorddecllist1 { $$ = $1; $$.unshift("recordfields"); }
    ;

symlist
    : symlist ',' SYMBOL { $$ = $1; $$.push($3); }
    | SYMBOL { $$ = [ $1 ] ; }
    ;

args
    : '(' symlist ')' { $$ = $2; $$.unshift('args'); }
    | '(' ')' { $$ = ['args']; }
    ;


