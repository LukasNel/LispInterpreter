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
    var trimmedInput = finput.trim().replace(/\r?\n|\r/gm,' ');  
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
    if(env === null)return undefined;
    if(!env.hasOwnProperty(key)){
        return getFromEnv(env.upperenv,key);
    }else{
        return env[key];
    }        
}
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
    console.log("envir");
    console.log(newRoot.env);
    document.getElementById("displayElement2").innerHTML += PrintTree(newRoot);
    console.log(newRoot);
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
    switch(root.value){
        case '+':
            var sum = 0;
            for(var i = 0;i < root.nodes.length;i++){
                var node = root.nodes[i];
                sum += parseInt(executeParseTree(node));
            }
            root.value = sum.toString();
        break;
        case '-':
            var difference = executeParseTree(root.nodes[0]);
            for(var i = 1;i < root.nodes.length;i++){
                var nodevalue = executeParseTree(root.nodes[i]);
                difference -= parseInt(nodevalue);
            }
            
            root.value = difference.toString();
        break;
        case 'div':
            var quotient = executeParseTree(root.nodes[0]);
            for(var i = 1;i < root.nodes.length;i++){
                var node = root.nodes[i];
                quotient /= parseInt(executeParseTree(node));
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
                if(root.nodes[0].nodes.length > 0){
                    var newFunction = new Lambda();
                    newFunction.parameters.push(root.nodes[0].nodes[i].value);
                    for(var i = 0;i < root.nodes[0].nodes.length;i++){  
                        newFunction.parameters.push(root.nodes[0].nodes[i].value);
                    }
                    root.nodes[1].env.upperenv = null;
                    newFunction.body = root.nodes[1];
                    root.value = newFunction;
                }          
            }
        break;
        case 'define':
            root.value = '';
            if(root.nodes.length > 1){
                if(root.nodes[0].nodes.length > 0){
                    /*var functionName = root.nodes[0].value;
                    root.env.upperenv[functionName] = new Lambda();
                    for(var i = 0;i < root.nodes[0].nodes.length;i++){  
                        root.env.upperenv[functionName].parameters.push(root.nodes[0].nodes[i].value);
                    }
                    root.nodes[1].env.upperenv = null;
                    root.env.upperenv[functionName].body = root.nodes[1];
                    console.log(root.env.upperenv[functionName].body);        
                    console.log(root.env.upperenv[functionName].parameters);
                    root.value = functionName;*/
                    var newFunction = CreateFunctionOn(root);
                    var functionName = root.nodes[0].value;
                    root.value = functionName;
                    root.env.upperenv[functionName] = newFunction;
                }else{
                    var variableName = root.nodes[0].value;
                    root.env['upperenv'][variableName] = executeParseTree(root.nodes[1]);
                    root.value = variableName;
                }
               
            }
        break;
        
        default:
            var value = getFromEnv(root.env,root.value);
           
            var testValue = getFromEnv(root.env,value);
            if(testValue === undefined){}else{
                value = testValue;
            }
            if(value === undefined){            
            }else{
                if(value instanceof Lambda){
                   root.value = ExecuteFunction(root,value); 
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

    var finput = document.getElementById(fid).value;
    var output = document.getElementById(foutputID);
    var regexp = /\(.*\)/g;
    var globalEnv = {upperenv:null};
    fcommands = finput.match(regexp);
    output.innerHTML = '';
    document.getElementById("displayElement2").innerHTML = '';
    alert(fcommands);
    for(var i = 0;i < fcommands.length;i++){
        var curLine = fcommands[i];
        var k = new TreeNode();
        k.env.upperenv = globalEnv;
        k = CreateParseTree(curLine,k);
        output.innerHTML += "<p>" + PrintTree(k) + "</p>";
        output.innerHTML += "<p>" + executeParseTree(k) + "</p>";
    }
}

//k = CreateParseTree(input,k);
//output.innerHTML = "<p>" + PrintTree(k) + "</p>";