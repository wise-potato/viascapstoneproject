// Node.js 10.x
//consAlexalexa = require('ask-sdk');
//const request = require('request');
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region:'us-east-1'});
var sampleCount = [];
var counts = {};
var keys = [];
var tfidf_count = [];
var simValues = [];
var sampleDic = {}; //sample dictionary to store user token and entry tokens
var entries = []; 
var tempEntries = [];
var tokenized_array = [];
var maxSimValue = 0;
var tempValue = 0;
var answerEntry = "The editing done must be done in detail view controller";

    var noIntent = "";
    var yesIntent = "";  
    var highestSimValueEntry = "";
exports.handler = (event, context, callback) => {
     var params = { // params has only question text with the stated course id
                    ExpressionAttributeValues:{
                        ":courseid" :  "27330",
                        //":courseid" :  "70707",
                    },
                    ProjectionExpression: "questionText, courseid, answerText", 
                    FilterExpression: "contains (courseid, :courseid)",
                    TableName: "questionsDatabase"
                    };
    try {
        const eventType= event.request.type;
        if (eventType === 'LaunchRequest') {
            callback(null, buildResponse("Welcome to your discussion board. What is your question? \n(Please preface your question with 'My question is')", false));
            //callback(null, buildResponse("Welcome to your discussion board. What is your question?"), false);
            
        }
        else if (eventType === 'IntentRequest') {
            if (event.request.intent.name === 'QuestionIntent') {
             
                const intentName = event.request.intent;
                const questionPresent = intentName && intentName.slots && intentName.slots.QuestionText && intentName.slots.QuestionText.value;
    
                if (questionPresent) {
                    const intentValue= event.request.intent.slots.QuestionText.value;
                    const stopwords = ['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now'];
                    const questionText = intentValue.toLowerCase();
                   // const questionText = "when i want to save my image how do i save it as nd;
                    var arr =[];
                    let tokens = (remove_punc(questionText)).split(" ");
                    console.log("tokens: ", tokens);
                    for (var i = 0; i < tokens.length; i++) {
                        var word = tokens[i].split(".").join("");
                        if (!stopwords.includes(tokens[i])) {
                        arr.push(word);
                        }
                    }
                    
               //callback(null, buildResponse("your tokenized array is " + arr, false));

                   // scans the database to get all the entries related to that course id
                    docClient.scan(params, function(err, data) 
                    {
                         if (err) {
                            callback(err,null);
                        } else
                        {
                            tokenized_array.push(arr);
                              for (var i  = 0; i < data.Items.length; i++)
                                {
                                    tempEntries.push(data.Items[i].questionText); //push all database entries into entries array so we can use this for the similarity function 
                                    
                                
                                }
                             
                                for (var i = 0; i < tempEntries.length; i++)
                                {
                                    entries.push(tempEntries[i].split(" "));
                                }
                                console.log("entries:");
                                console.log(entries);
                                for (var k = 0; k < entries.length; k++)
                                {
                                    var tempArr = [];
                                    var tokens = [];
                                    for (var j = 0; j < entries[k].length; j++)
                                    {
                                        tokens.push(entries[k][j]);
                                    }
                                    
                                        console.log("tokens: ", tokens);
                                        for (var i = 0; i < tokens.length; i++) {
                                            var word = tokens[i].split(".").join("");
                                            if (!stopwords.includes(tokens[i])) {
                                            tempArr.push(word);
                                            }
                                        }
                                        tokenized_array.push(tempArr);
                                }
                                 console.log("tokenized_array");
                                console.log(tokenized_array);
                                
                                // used to test to see if entries are being logged correctly
                                //console.log(entries);
                                /*for(var i = 0; i < entries.length; i++) { //get tokens of each entry and store in tokenized_array 
                                    tokenized_array.push(entries[i].split(" "));
                                    
                                }*/
                               
                                simValues = jaccardSimilarity(tokenized_array);
                                console.log("tfidf:");
                                tf_idf(tokenized_array);
                                for (var i = 0; i < keys.length; i++) {
                                    var key = keys[i];
                                    console.log(key + " " + sampleCount[key].tfidf);
                                }
                                console.log("max sim value: ", maxSimValue);
                                checktfidf(tokenized_array,sampleCount);
                                console.log("testing");
                                console.log(tfidf_count);
                                //callback(null, buildResponse("your max sim value is " + maxSimValue, false));
                                console.log("simValues:");
                                //console.log(simValues);
                                for (i = 0; i < simValues.length; i++) {
                                    console.log("simValues of " + i + ": " + simValues[i]);
                                }
                                
                                maxSimValue = 0;
                                tempValue = 0;
                                var temptfidf_count = 0;
                                for (var i = 1; i < simValues.length; i++)
                                {
                                    for (var j = 2; j < simValues.length; j++)
                                    {
                                        if (simValues[i] < simValues[j] && tempValue < simValues[j] && temptfidf_count < tfidf_count[j])
                                        {
                                            tempValue = simValues[j];
                                            temptfidf_count = tfidf_count[j];
                                            maxSimValue = j;
                                  
                                        }
                                    }
                                }
                                //printing out the entry with highest simvalue to user's input
                                if (tempValue == 0)
                                {
                                    console.log("no entry was found");
                                }
                                else
                                {
                                    console.log("Entry with the highest simValue: ");
                                    highestSimValueEntry = data.Items[maxSimValue].questionText;
                                    console.log(highestSimValueEntry);
                                    //callback(null, buildResponse(data.Items[maxSimValue].questionText, false));
                                    answerEntry = data.Items[maxSimValue].answerText;
                                    console.log(answerEntry);
                                
                                }
                                console.log(typeof(tempValue));
                               // console.log(tempValue);
                                
                                
                        }
                    });
                    
                    //here the function will go 
                    console.log("arr:");
                    console.log(arr);
                    
                    
                    //
                    
                    //callback(null, buildResponse("your question in tokens are: " + arr, false));
                    var questionFound = true;//This is only used for testing
                    
                    if (questionFound == true) {
                        //callback (null, buildResponse("I have found a answer to your question : " + answer + "\n does it answer your question?",false))
                        yesIntent = "Thank you, ask another";
                        noIntent = "Sorry, send to unanswered?";
                       callback (null, buildResponse("I have found an answer to your question : " + answerEntry + "\n Does it answer your question?",false));
                       //callback (null, buildResponse("I have found an answer to your question : " + highestSimValueEntry + "\n Does it answer your question?",false));
                    }else if (tempValue > .05)
                    {
                        yesIntent = "Thank you, ask another";
                        noIntent = "Sorry, send to unanswered?";
                        callback (null, buildResponse("I may have found an answer to your question : " + answerEntry + "\n Does it answer your question?",false));
                    }
                    else if (tempValue > .025)
                    {
                        yesIntent = "Thank you, ask another";
                        noIntent = "Sorry, send to unanswered?";
                        callback (null, buildResponse("I may have found an answer to your question, although I am not sure : " + answerEntry + "\n Does it answer your question?",false));
                    }
                    else {
                        yesIntent = "Sent to unanswered, ask another";
                        noIntent = "Sorry, would you like to ask another";
                        callback (null, buildResponse("Sorry, the answer to your question was not found, would you like to send it to the unanswered page? answerEntry: " + highestSimValueEntry + "\n tempValue: " + tempValue ,false));
                    }
                    
                    
                } else {
                    callback(null, buildResponse("Sorry, I did not get it, can you ask the question again", true));

                }
            } else if (event.request.intent.name === 'AMAZON.HelpIntent') {
                callback(null, buildResponse("Ask me a question about the course, and I'll try my best to answer.", false));
                
                
            } else if (event.request.intent.name === 'AMAZON.CancelIntent' || event.request.intent.name === 'AMAZON.StopIntent') {
                callback(null, cancelResponse("Goodbye!"));

            } else if (event.request.intent.name === 'AMAZON.YesIntent') {
                //callback(null, buildResponse("yes.Okay", true));
                if (yesIntent == "Thank you, ask another")
                {
                    yesIntent = "what is your question";
                    noIntent = "goodbye";
                    callback(null, buildResponse("Great! Would you like to ask another question?", false));
                    
                }
                else if(yesIntent == "what is your question")
                {
                    callback(null, buildResponse("What is your question?", false));
                }
                else if(yesIntent == "Sent to unanswered, ask another")
                {
                    yesIntent = "what is your question";
                    noIntent = "goodbye";
                     callback(null, buildResponse("Your question was sent to unanswered page. Would you like to ask another question?", false));
                }
                else
                {
                   callback(null, buildResponse("yes.Okay", true)); 
                }
                
                
            } else if (event.request.intent.name === 'AMAZON.NoIntent') {
                //callback(null, buildResponse("No.Okay", true));
                if(noIntent === "Sorry, send to unanswered?")
                {
                    yesIntent = "Sent to unanswered, ask another";
                    noIntent = "Sorry, would you like to ask another";
                     callback(null, buildResponse("Sorry, would you like to send it to the unanswered page?", false));
                }
                else if (noIntent == "Sorry, would you like to ask another")
                {
                    noIntent = "goodbye";
                    yesIntent = "what is your question";
                    callback(null, buildResponse("I apologize for not being able to answer your question, would you like to ask another?", false));
                }
                else if(noIntent == "goodbye")
                {
                    callback(null, buildResponse("I hope I was able to help. Goodbye.", false));
                }
                else
                {
                   callback(null, buildResponse("No.Okay", true)); 
                }
          

            } else {
            callback(null, buildResponse("Sorry, i don't understand, please repeat your question",false));
            }
       } 
       else if (eventType === 'SessionEndedRequest') {
            callback(null, buildResponse('Session Ended', true));
       }
    } catch (e) {
        context.fail(`Exception: ${e}`);
    }
};

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

    // trying to print
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
       //console.log(key + " " + sampleCount[key].tfidf);
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
    
     // entry set
     //console.log("aSet");
    //console.log(aSet);

       
        for (var i = 1; i < tokenized_array.length; i++)
        {
            var bSet = new Set();
            for (var j = 0; j< tokenized_array[i].length; j++)
            {
                bSet.add(tokenized_array[i][j]);
            }
            //console.log("bSet");
            //console.log(bSet);
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
               // console.log("bSet");
               // console.log(bSet);
               //console.log("intersectSetSize");
               //console.log(intersectSet.size);
                var tempSimValue = (intersectSet.size) / (aSet.size + bSet.size - intersectSet.size);
                //console.log(bSet.size);
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
function checktfidf (tokenized_array,sampleCount)
{
   
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        for (var j = 1; j < tokenized_array.length; j++)
        {
            var count = 0;
            for (var k = 0 ; k < tokenized_array[j].length; k++)
            {
                if (key == tokenized_array[j][k] && sampleCount[key].tfidf > 2)
                {
                    count++;
                }
            }
            if (tfidf_count[j] == null)
            {
                tfidf_count[j] = count;
            }
            else
            {
                tfidf_count[j] = tfidf_count[j] + count;
            }
           

        }

    }
}


function buildResponse(response, shouldEndSession) {
    return {
        version: '1.0',
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: response,
                
            },
        },
        shouldEndSession: shouldEndSession,
    };
} 

function cancelResponse(response) {
    return {
        version: '1.0',
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: response,
            },
        },
        shouldEndSession: true,
    };
} 
                
                
function remove_punc(str) {
  str = str.replace(/ain't/g, "am not");
  str = str.replace(/can't/g, "cannot");
  str = str.replace(/aren't/g, "are not");
  str = str.replace(/didn't/g, "did not");
  str = str.replace(/doesn't/g, "does not");
  str = str.replace(/don't/g, "do not");
  str = str.replace(/won't/g, "will not");
  str = str.replace(/weren't/g, "were not");
  str = str.replace(/shouldn't/g, "should not");
  str = str.replace(/wouldn't/g, "would not");
  str = str.replace(/haven't/g, "have not");
  str = str.replace(/hadn't/g, "had not");
  str = str.replace(/hasn't/g, "has not");
  str = str.replace(/couldn't/g, "could not");
  str = str.replace(/wasn't/g, "was not");
  str = str.replace(/isn't/g, "is not");
  str = str.replace(/'ll/g, "");
  str = str.replace(/'s/g, "");
  str = str.replace(/'m/g, "");
  str = str.replace(/'ve/g, "");
  str = str.replace(/'d/g, "");
  str = str.replace(/'re/g, "");
  str = str.replace(/[^A-Za-z0-9 ]/g, "");
  //str = str.replace(/is/g, "");

  return str;
}



 
