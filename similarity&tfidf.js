const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region:'us-east-1'});


var sampleCount = [];
var counts = {};
var keys = [];
var simValues = [];
var sampleDic = {}; //sample dictionary to store user token and entry tokens
var entries = []; 
var tokenized_array = [];

var userEntry = ['for', 'question','should','print','greeting','message','screen','xcode','console'];
tokenized_array.push(userEntry); //add user entry first 


exports.handler = function(event, context, callback){ 
    var params = { // params has only question text with the stated course id
        ExpressionAttributeValues:{
            ":courseid" :  "27330",
        },
        ProjectionExpression: "questionText, courseid", 
        FilterExpression: "contains (courseid, :courseid)",
        TableName: "questionsDatabase"
    };
    
    
   
    docClient.scan(params, function(err, data) {
        if (err) {
            callback(err,null);
        } else {
            for (var i  = 0; i < data.Items.length; i++)
            {
               // console.log(data.Items[i].questionText); // prints in cloud watch logs all question texts contain inside data.Items
                entries.push(data.Items[i].questionText); //push all database entries into entries array so we can use this for the similarity function 
            
            }
           
            for(var i = 0; i < entries.length; i++) { //get tokens of each entry and store in tokenized_array 
                tokenized_array.push(entries[i].split(" "));
                
            }
            console.log(tokenized_array);
            
           

            simValues = jaccardSimilarity(tokenized_array);
            
          
            for (i = 0; i < simValues.length; i++) {
                //console.log("simValues of " + i + ": " + simValues[i]);
            }
            
            var maxSimValue = 0;
            var tempValue = 0;
            for (var i = 0; i < simValues.length; i++)
            {
                for (var j = 1; j < simValues.length; j++)
                {
                    if (simValues[i] < simValues[j] && tempValue < simValues[j])
                    {
                        tempValue = simValues[j]
                        maxSimValue = j;
            
                    }
                }
            }
           
            tf_idf(tokenized_array);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
            
            }
    
  
            
            let response = {
                statusCode: 200,
              
                
            }
            
            
            
            callback(null, response);
        }
    });
   
};



// trying to calculate tfidf values for each token in both user's input and entries in database 

function tf_idf(tokenized_array) { // pass in an array that has both the user's tokenized input at index 0 and all entries tokenized afterwards
    var tokens = [];
    for (var i = 0; i < tokenized_array.length; i++) {
        for (var j = 0; j < tokenized_array[i].length; j++)
        {
            tokens.push(tokenized_array[i][j]);
        }
         // store all words from every entry and user input
    }
    for (var i = 0; i < tokens.length; i++) {
        var word = tokens[i].toLowerCase();
        if (sampleCount[word] == undefined) // if word does not exist yet
        {
            sampleCount[word] = {
                tf: 1, //change term freq to 1
                df: 0 // how many documents its in (in our case, entries)
            };
            keys.push(word); // add word
        }
        else {
            sampleCount[word].tf = sampleCount[word].tf + 1; // if word is found, add a count
        }
    }

    var otherCounts = [];
    for (var j = 0; j < tokenized_array.length; j++) {
        var tempCounts = {};
        var tokens = tokenized_array[j];
        for (var k = 0; k < tokens.length; k++) {
            var w = tokens[k].toLowerCase();
            if (tempCounts[w] == undefined) {
                tempCounts[w] = true;
            }
        }

        otherCounts.push(tempCounts);
    }

    for (var i = 0; i < keys.length; i++) {
        var word = keys[i];
        for (var j = 0; j < otherCounts.length; j++) {
            var tempCounts = otherCounts[j];
            if (tempCounts[word]) {
                sampleCount[word].df++;
            }
        }

    }

    for (var i = 0; i < keys.length; i++) {
        var word = keys[i];

        var wordobj = sampleCount[word];
        wordobj.tfidf = wordobj.tf * Math.log(tokenized_array.length / wordobj.df);

    }

    keys.sort(compare); // has most frequent terms first

    function compare(a, b) { // compares the freq of terms
        var countA = sampleCount[a].tfidf;
        var countB = sampleCount[b].tfidf;
        return countB - countA;
    }

    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
       
    }
    return sampleCount;

}

// jaccard similarity function

function jaccardSimilarity(tokenized_array) // using sets , currently passing in data(entries from tables that aren't tokenized)
{

    var index = 0;
    var aSet = new Set(); // user set with each element as a tokenized word
    for (var i = 0; i < tokenized_array[0].length; i++)
    {
        aSet.add(tokenized_array[0][i]);
    }
    
   

       
        for (var i = 1; i < tokenized_array.length; i++)
        {
            var bSet = new Set();
            for (var j = 0; j< tokenized_array[i].length; j++)
            {
                bSet.add(tokenized_array[i][j]);
            }
            var intersectSet = new Set();
            var tempSet = new Set();
            tempSet = intersection(aSet, bSet);
            if(tempSet.size < 1)
            {
                simValues[index] = 0;
                index++;
            }
            else
            {
                intersectSet.add(tempSet);
                
                var tempSimValue = (intersectSet.size) / (aSet.size + bSet.size - intersectSet.size);
              
                simValues[index] = tempSimValue;
                index++;
            }
            
        }
       
        

    
    return simValues;


}


function intersection(setA, setB) {
    let _intersection = new Set();
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
}





