var k;
String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
var output = document.getElementById("displayElement");
var input = "(+ (- 4 5) 5)";
input = document.getElementById("interpreter").value;
TreeNode = function(){
    this.nodes = [];
    this.value = 0;
    this.env = {
                "upperenv":null, 
               }
}
Lambda = function(){
    this.parameters = [];
    this.body = null;
}
function Tokenize(finput){
    var curChar = '';
    var state = 'x';
    var curDepth = 0;
    var curStr = '';
    var tokens = [];
    var trimmedInput = finput.trim().replace(/\r?\n|\r/gm,' ').replace(/ {2,}/gm,' ');  
    if(trimmedInput[0] === '(')trimmedInput = trimmedInput.substring(1, trimmedInput.length);
    if(trimmedInput[trimmedInput.length-1] === ')')trimmedInput = trimmedInput.substring(0, trimmedInput.length - 1);
    trimmedInput += ' ';
    for(var i = 0;i<trimmedInput.length;i++){
        curChar = trimmedInput[i];
        if(trimmedInput[i] === '(')curDepth++;
        if(trimmedInput[i] === ')')curDepth--;
        curStr += trimmedInput[i];
        if(curDepth > 0)continue;
        if(trimmedInput[i] === ' '){
            tokens.push(curStr.substring(0, curStr.length - 1));
            curStr = '';
            continue;
        }  
    }
    if(curDepth > 0)alert("Error: " + tokens);
    return tokens;
}
k = new TreeNode();
function CreateParseTree(finput,root){
    var tokens = Tokenize(finput);
    root.value = tokens[0];
    if(tokens.length  > 1){
        for(var i = 1;i < tokens.length;i++){
            token = tokens[i];
            if(token === '')continue;
            var newNode = new TreeNode();
            newNode.env.upperenv = root.env;
            root.nodes.push(newNode);
            CreateParseTree(token,newNode);
        }
    }
    return root;
}
function FixEnvPointers(froot){
     for(var i = 0;i < froot.nodes.length;i++){
        froot.nodes[i].env.upperenv = froot.env;
        FixEnvPointers(froot.nodes[i]);
     }
}
function CopyTree(froot){
    
    return JSON.parse(JSON.stringify(froot));
}
function getFromEnv(env, key){
    if(env === null)retur   n undefined;
    if(!env.hasOwnProperty(key)){
        return getFromEnv(env.upperenv,key);
    }else{
        return env[key];
    }        
}
var max = 0;
function ExecuteFunction(root,lambda){
    for(var i = 0;i < root.nodes.length;i++){
        executeParseTree(root.nodes[i]);
    }
    var newRoot = CopyTree(lambda.body);
    newRoot.env = Object.assign({},root.env);
    for(var i = 0;i < lambda.parameters.length;i++){
      parameterName = lambda.parameters[i];
      newRoot.env[parameterName] = root.nodes[i].value;
    }
    FixEnvPointers(newRoot);
    document.getElementById("displayElement2").innerHTML += PrintTree(newRoot);
    max++;
    return executeParseTree(newRoot);
}
function CreateFunctionOn(root){
    var newFunction = new Lambda();
    for(var i = 0;i < root.nodes[0].nodes.length;i++){  
        newFunction.parameters.push(root.nodes[0].nodes[i].value);
    }
    newFunction.body = root.nodes[1];
    newFunction.body.env.upperenv = null;
    return newFunction;
}
function executeParseTree(root){
   
    if(root.value instanceof Lambda){
        return ExecuteFunction(root,root.value);
    }
    switch(root.value){
        case '+':
            var sum = 0;
            for(var i = 0;i < root.nodes.length;i++){
                var node = root.nodes[i];
                sum += parseFloat(executeParseTree(node));
            }
            root.value = sum.toString();
        break;
        case '-':
            var difference = executeParseTree(root.nodes[0]);
            for(var i = 1;i < root.nodes.length;i++){
                var nodevalue = executeParseTree(root.nodes[i]);
                difference -= parseFloat(nodevalue);
            }
            
            root.value = difference.toString();
        break;
        case 'div':
            var quotient = executeParseTree(root.nodes[0]);
            for(var i = 1;i < root.nodes.length;i++){
                var node = root.nodes[i];
                quotient /= parseFloat(executeParseTree(node));
            }
            root.value = quotient.toString();
        break;
        case '*':
            var product = 1;
            for(var i = 0;i < root.nodes.length;i++){
                var nodevalue = executeParseTree(root.nodes[i]);
                product *= nodevalue;
            }
            root.value = product.toString();
        break;
        case 'lambda':
            if(root.nodes.length > 1){                
                    var newFunction = CreateFunctionOn(root);
                    newFunction.parameters.unshift(root.nodes[0].value);
                    root.value = newFunction;                        
            }
        break;
        case '<':
            if(root.nodes.length > 1){
                if(parseFloat(executeParseTree(root.nodes[0])) < parseFloat(executeParseTree(root.nodes[1]))){
                    root.value = true;
                }else{
                   root.value = false; 
                }
            }
        break;
        case '>':
            if(root.nodes.length > 1){
                if(parseFloat(executeParseTree(root.nodes[0])) > parseFloat(executeParseTree(root.nodes[1]))){
                    root.value = true;
                }else{
                   root.value = false; 
                }
            }
        break;
        case '=':
            if(root.nodes.length > 1){
                if(parseFloat(executeParseTree(root.nodes[0])) == parseFloat(executeParseTree(root.nodes[1]))){
                    root.value = true;
                }else{
                   root.value = false; 
                }
            }
        break;
        case '!=':
            if(root.nodes.length > 1){
                if(parseFloat(executeParseTree(root.nodes[0])) != parseFloat(executeParseTree(root.nodes[1]))){
                    root.value = true;
                }else{
                   root.value = false; 
                }
            }
        break;
        case 'not':
            if(root.nodes.length > 0){
                if(executeParseTree(root.nodes[0]) === true){
                   root.value = false;
                }else{
                   root.value = true; 
                }
            }
        break;
        case 'or':
            root.value = false;
            for(var i = 0;i < root.nodes.length;i++){
                if(executeParseTree(root.nodes[i]) === true){
                    root.value = true;
                    break;
                }
            }
        break;
        case 'and':
            root.value = true;
            for(var i = 0;i < root.nodes.length;i++){
                if(executeParseTree(root.nodes[i]) === false){
                    root.value = false;
                    break;
                }
            }
        break;
        case 'if':
            if(root.nodes.length > 2){
                if(executeParseTree(root.nodes[0]) === true){
                    root.value = executeParseTree(root.nodes[1]);
                }else{
                    root.value = executeParseTree(root.nodes[2]); 
                }
            }
        break;
        case 'begin':
            for(var i = 0;i < root.nodes.length;i++){
                root.value = executeParseTree(root.nodes[i]);
            }
        break;
        case 'print':
            root.value = '';
            for(var i = 0;i < root.nodes.length;i++){
                root.value += "<p>" + executeParseTree(root.nodes[i]) + "</p>";
            }
        break;
        case 'define':
            root.value = '';
            if(root.nodes.length > 1){
                if(root.nodes.length > 2){
                    newNode = Object.assign({},root.nodes[1]);
                    newNode.value = "begin";
                    
                    newNode.nodes = []; 
                    for(var i = 1;i < root.nodes.length;i++){
                        newNode.nodes.push(root.nodes[i]);
                        root.nodes[i].env.upperenv = newNode.env;
                    }
                    root.nodes = [root.nodes[0],newNode];
                }
                if(root.nodes[0].nodes.length > 0){
                    var newFunction = CreateFunctionOn(root);
                    var functionName = root.nodes[0].value;
                    root.value = newFunction;
                    root.env.upperenv[functionName] = newFunction;
                }else{
                    var variableName = root.nodes[0].value;
                    root.env['upperenv'][variableName] = executeParseTree(root.nodes[1]);
                    root.value = newFunction;
                }
               
            }
        break;
        
        default:
            var value = getFromEnv(root.env,root.value);
            //This is a utter hack:
            if(root.value.includes('(') && root.value.includes(')')){
                    newRoot = new TreeNode();
                    root.value = executeParseTree(CreateParseTree(root.value,newRoot));
                    return executeParseTree(root);
            }
            if(value === undefined){ 
                    console.log("dddf");
                 console.log(root.value);
            }else{
                if(value instanceof Lambda){
                   root.value = ExecuteFunction(root,value); 
                   var t = 0;
                }else{
                    root.value = value;
                }
            }
        break;
    }
    
    return root.value;
}
function PrintTree(froot){
    strOut = "<b>'" + froot.value + "'</b>";
    if(froot.nodes.length > 0){
        strOut += " -> {<blockquote>";
        var node = froot.nodes[0];
        strOut += PrintTree(node);
        for(var i = 1;i < froot.nodes.length;i++){
            node = froot.nodes[i];
            strOut += "," + PrintTree(node);
        }
        strOut += "}</blockquote>";
    }
    return strOut;
}
function executeCode(fid,foutputID){

    var finput = "(print " + document.getElementById(fid).value + ")";
    
    var output = document.getElementById(foutputID);
    //var regexp = /\(.*\)/g;
    var globalEnv = {upperenv:null};
    //fcommands = finput.match(regexp);
    output.innerHTML = '';
    document.getElementById("displayElement2").innerHTML = '';
    
    //alert(fcommands);
    //for(var i = 0;i < fcommands.length;i++){
      //  var curLine = fcommands[i];
        var k = new TreeNode();
        k.env.upperenv = globalEnv;
        k = CreateParseTree(finput,k);
        output.innerHTML += "<p>" + PrintTree(k) + "</p>";
        output.innerHTML += "<p>" + executeParseTree(k) + "</p>";
    //}
}

//k = CreateParseTree(input,k);
//output.innerHTML = "<p>" + PrintTree(k) + "</p>";