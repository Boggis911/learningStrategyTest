const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const SES = new AWS.SES();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    // API KEY
});
const openai = new OpenAIApi(configuration);

// Sender email


exports.handler = async (event) => {
    // Parse the request body
    const body = JSON.parse(event.body);
    const requestType = body.requestType;
    const sessionUUID = body.sessionUUID;
    console.log("EVENT INFO: ", event);
    
    const clientIpAddress = event.requestContext.http.sourceIp;
    const currentTime = Date.now();

    try {
        
        const oneHourAgo = Date.now() - (60 * 60 * 1000); 
        if(requestType != "getQuestions" && requestType != "evaluateAnswers" && requestType != "sendEmail"){
            throw new Error("ERROR, wrong request type");
        }
        
        
        const uuidFormat = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
        if (!sessionUUID) {
        throw new Error("ERROR: No sessionUUID provided.");
        }
        else if (typeof sessionUUID !== 'string' ||!uuidFormat.test(sessionUUID)) {
            throw new Error("ERROR: Invalid sessionUUID format.");
        }
        
      
        if (Object.keys(body).length > 3) {
            throw new Error("Too many items in the request body.");
        }
        
 
       '
        if (requestType == "evaluateAnswers") {
            if (!Array.isArray(body.answers) || body.answers.length > 1500) {
                throw new Error("Invalid answers format or exceeds character limit.");
            }
        } else if (requestType == "sendEmail") {
            if (!body.data || typeof body.data.name !== 'string' || body.data.name.length > 40 || typeof body.data.email !== 'string' || body.data.email.length > 60) {
                throw new Error("Invalid data format or exceeds character limit.");
            }
        }

        
        
        
        
        
            const queryParams = {
        TableName: "mytable",
        KeyConditionExpression: "#pk = :pkValue",
        FilterExpression: "#timestampAttribute >= :oneHourAgo",
        ExpressionAttributeNames: {
            "#pk": "IPAddress",
            "#timestampAttribute": "Timestamp"
        },
        ExpressionAttributeValues: {
            ":pkValue": clientIpAddress,
            ":oneHourAgo": oneHourAgo
        }
    };
    
        const queryResults = await dynamoDB.query(queryParams).promise();
        if(!queryResults.Items){
            console.log("first time loggingIn");
        }
        else if (queryResults.Items.length > 20) {
            throw new Error("Too many requests from this IP");
        }


  
    
    } catch (error) {
        console.log("SECURITY ERROR: ", error);
        
        return {
            statusCode: 500,
            body: "Error"
        };
    }

    

if (requestType === 'typeX') {
    
    let questions =[];
        try {
        
        const scanParams = {
            TableName: 'myTable',
            FilterExpression: 'testName = :testNameValue',
            ExpressionAttributeValues: {
                ':testNameValue': 'SOL'
            }
        };
        
        const scanResponse = await dynamoDB.scan(scanParams).promise();

       
        if (scanResponse.Items && scanResponse.Items.length > 0) {
            questions = scanResponse.Items;
            
            // Sort the questions by 'question' key
            questions.sort((a, b) => a.number - b.number);
        } else {
            console.log("No items found for the given scan parameters.");
        }
    } catch (error) {
        console.error("An error occurred during the DynamoDB scan operation:", error);
        return {
            statusCode: 500,
            body: 'Failed to scan DynamoDB table'
        };
    }

    // Create a new array to hold the sorted question information
    const sortedQuestionInformation = questions.map((question) => {
        return question.question;
    });

    // Log the sorted question information
    sortedQuestionInformation.forEach((info, index) => {
        console.log(`Question ${index + 1}: ${info}`);
    });

    // Return the question information
    return {
        statusCode: 200,
        body: JSON.stringify(sortedQuestionInformation)
    };
}



else if (requestType === 'typeX') {
    // Extract the five values from the request body
    console.log("BODY", body);

    const userAnswers = body.answers;

   
    if (userAnswers.some(answer => !answer)) {
        return {
            statusCode: 400,
            body: 'Invalid input'
        };
    }


    // Get model answers (system instructions) for the questions
    
    const scanParams = {
        TableName: 'myTable',
        FilterExpression: 'testName = :testNameValue',
        ExpressionAttributeValues:{
            ':testNameValue': 'SOL'
        }
    };
    let databaseItems =[];
    
    try{
        const scanResponse = await dynamoDB.scan(scanParams).promise();
        
        if (scanResponse.Items){
            databaseItems = scanResponse.Items;
        } else{
            console.log("an ERROR in scanResponse when trying to scan dynamoDB with scanParams in evaluateAnswers section");
            console.log("scanResponse: ", scanResponse);
        }
        

        // Sort the questions by 'question' key
        databaseItems.sort((a, b) => a.number - b.number);
    } catch (error) {
        console.error("an ERROR when scanning dynamoDB in evaluateAnswers section", error);
        
        return{
            statusCode:500,
            body:'Failed to scan DynamoDB table in evaluateAnswers section'
        };

    }
    const topics = databaseItems.map(item => item.systemInstructions);
    console.log("MODEL ANSWERS ", topics);

    let openaiResponseArray = []; 
    // Evaluate answers using OpenAI
    try{
        for (let i = 0; i < userAnswers.length; i++) {
            let userAnswer = userAnswers[i];
            if (userAnswer == "" || userAnswer == " "){
                userAnswer = "not provided: assign score 1";
            }
            const topic = topics[i];
            
            const systemInstruction = `Imagine you are an inspector. Mark user effectiveness based on smart study techniques from 0 to 10 regarding this topic by only giving a number. 
            TOPIC: ${topic}. Give 5 for vague answers `;
    
            const chatCompletion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userAnswer }
                ],
                temperature: 0,
                max_tokens: 30,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });
    
            const openaiResponse = chatCompletion.data.choices[0].message.content;
            openaiResponseArray.push(openaiResponse);
            console.log(`OpenAI Response for question ${i + 1}: ${openaiResponse}`);
        }
    }catch (error){
        console.error("an ERROR when waiting for chatGPT response in evaluateAnswers section", error);
        
        return{
            statusCode: 500,
            body: "Failed to receive chatGPT response"
        };
    }
    
    var numbers = [];
    var fullInfoNumbers = [];

// Extract the numbers from the openaiResponses and add them to the numbers array
    for (let i = 0; i < openaiResponseArray.length; i++) {
        // Extract the number from the response string using a regular expression
        let number = 1;
        let fullInfoNumber = 1;
        var matchedNumbers = openaiResponseArray[i].match(/[\d\.]+/g);
        if (matchedNumbers) { // If there is a match
            number = parseFloat(matchedNumbers[0]);
            if(number == 0){
                number = 1;
            }
        }else{
            number = 1;
        }
        
        if (number <=4){
            fullInfoNumber = 1;
        } else if (5<=number && number<=7){
            fullInfoNumber = 5;
        } else {
            fullInfoNumber = 8;
        }
        
        if (!isNaN(number)) { // If parsed number is a number
            numbers.push(number);
            fullInfoNumbers.push(fullInfoNumber);
        }
    }
    
    
    // Calculate the average of the numbers
    var total = 0;
    for (var i = 0; i < numbers.length; i++) {
        total += numbers[i];
    }
    var average = numbers.length > 0 ? total / numbers.length : 0;
    let modifiedAverage = (average-1.5)*1.5; // since chatgpt almost never gives results higher than 8
    
    console.log("Numbers: ", numbers);
    console.log("Average: ", average);



    let answers = {};
    let fullInfoParagraphs = [];

    userAnswers.forEach((answer, index) => {
        answers['question' + (index + 1)] = answer;
    });
    
    
    //Question databse contains maped values that have 1, 5, 8 as indexes
    //Go to learningStrategiesTestQuestionsTable and pick the information based on fullInfoNumbers
    
    try{
        for(var counter=0; counter < fullInfoNumbers.length; counter++){
            var fullInfoNumber = fullInfoNumbers[counter]
            const getParams = {
                TableName: 'learningStrategiesTestQuestionsTable',
                Key: {
                    'testName': 'SOLFullInfo',
                    'number': counter+1,
                }
            };
            
            
            const getParamsResult = await dynamoDB.get(getParams).promise();
            
            if(getParamsResult.Item.map[fullInfoNumber]){
                fullInfoParagraphs.push(getParamsResult.Item.map[fullInfoNumber]);
            } else {
                console.log("There was an issue when fetching maped values with fullInfoNumber");
            }
            
        }
    } catch (error){
        console.error("an ERROR when getParams from dynamoDB in evaluateAnswers section ", error);
        
        return{
            statusCode: 500,
            body: "failed to evaluate answers"
        };
    }
    

    
    
    const putParams = {
        TableName: 'MyTable',
        Item: {
            'IPAddress': clientIpAddress,
            'SessionID':sessionUUID,
            'Timestamp': currentTime,
            'Answers': answers,
            "AIResponse": openaiResponseArray,
            "FullInfo": fullInfoParagraphs,
            "Average": average
        }
    };
    
    try{
        // Store the item in DynamoDB
        await dynamoDB.put(putParams).promise();
    } catch (error){
        console.error("an ERROR when putParams in learningStrategiesTestTable in evaluateAnswers section", error)
    }
    
    if (average){
         // Return a successful response
        console.log("ANSWERS were submitted successfully");
        return {
            statusCode: 200,
            body: JSON.stringify({
                "score": modifiedAverage
                })
         
        };
    } else {
        console.log("an ERROR with average score calculation");
        return{
            statusCode: 500,
            body: "an ERROR with average score calculation"
        };
    }
    
}



if (requestType === 'sendEmail') {
    const userName = body.data.name;
    const userEmail = body.data.email;

    // Fetch test results from the database

    const resultsParams = {
        TableName: 'myTable',
        Key: {
            'IPAddress': clientIpAddress,
            'SessionID': sessionUUID  
        }
    };
    
    
    let testResults = [];
    try{
        const resultsResponse = await dynamoDB.get(resultsParams).promise();
        
        
        if (resultsResponse.Item.fullInfo){
            testResults = resultsResponse.Item.fullInfo.join('\n');
        }
        else{
            console.log('Item not found');
        }
    } catch (error){
        console.error("ERROR with resultsParams learningStrategiesTestTable scan", error);
        
        return{
            statusCode: 500,
            body: "ERROR with extracting the results"
        }
    }
    

    
    const emailSubject = "Your Test Results from NeonLearner";
    const emailIntroduction = "I hope this message finds you well. As part of our continuous effort to support your academic journey, we've conducted a comprehensive evaluation of your learning strategies based on the recent test you took. Understanding and refining these strategies is crucial for optimizing your study habits and achieving your educational goals."
    const emailOutro1 = "In closing, please remember that these evaluations are tools designed to inform and empower you. It's not just about where you are now, but where you're heading and how best to get there. I encourage you to reflect on the feedback provided and consider how you might integrate these insights into your study routine. If you have any questions or would like to discuss any of the points in detail, please don't hesitate to reach out."
    const emailOutro2 = "Wishing you all the best in your learning journey. \n\n Warm regards, \n Founder of NeonLearner";

    const emailBody = "Hi " + userName + ",\n\n" + 
    emailIntroduction + "\n" + 
    testResults + "\n\n" + 
    emailOutro1 + "\n\n" + 
    emailOutro2;


        
    const emailParams = {
        Source: senderEmail,
        Destination: {
            ToAddresses: [userEmail]
        },
        Message: {
            Subject: {
                Data: emailSubject
            },
            Body: {
                Text: {
                    Data: emailBody
                }
            }
        }
    };
    
    try {
        await SES.sendEmail(emailParams).promise();
 
    
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Email sent successfully'
            })
        };
    } catch (error) {
        console.error("Error sending the email:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error sending the email'
            })
        };
    }




}else {
    // Handle invalid requestType
    return {
        statusCode: 400,
        body: 'Invalid requestType'
    };
}
};
