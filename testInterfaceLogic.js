let sessionUUID = sessionStorage.getItem('sessionUUID');

// If there's no UUID in the session storage, generate a new one
if (!sessionUUID) {
    sessionUUID = uuidv4();
    sessionStorage.setItem('sessionUUID', sessionUUID);
}




var questions = [];
var answers = [];

var currentQuestion = 0;
var exitAttemtpts = 0;




document.addEventListener("DOMContentLoaded", function() {
    fetchQuestions();
});

// At the start, the introContainer should be visible
document.getElementById("introContainer").style.display = "block";
document.getElementById("introContainer").style.opacity = "1";

// The questionContainer should be hidden initially
document.getElementById("questionContainer").style.display = "none";
document.getElementById("questionContainer").style.opacity = "0";




document.getElementById("beginButton").addEventListener("click", function() {
    // Start the fade out of introContainer
    document.getElementById("introContainer").style.display = "none";
    
    updateQuestion();
    // After the fade out completes, hide the introContainer and show the questionContainer
    setTimeout(function() {
        
        document.getElementById("questionContainer").style.display = "block";
        document.getElementById("questionContainer").style.opacity = "1";
    }, 500); // 500ms matches the transition duration in your CSS
    
});


document.getElementById("backButton").addEventListener("click", function() {
    if (currentQuestion > 0) {
        // Store the current answer and go to the previous question
        answers[currentQuestion] = document.getElementById("answer").value;
        currentQuestion--;
        updateQuestion();
    }
});


document.getElementById("nextButton").addEventListener("click", function() {

    // Check if the current question is not the last question
    if (currentQuestion < questions.length - 1) {
        // Store the current answer and go to the next question
        answers[currentQuestion] = document.getElementById("answer").value;
        currentQuestion++;
        updateQuestion();
    }
});

document.getElementById("submitButton").addEventListener("click", function(){
        // Store the current answer
    answers[currentQuestion] = document.getElementById("answer").value;

    // Hide the question container and display the results container
    document.getElementById("questionContainer").style.display = "none";
    document.getElementById("resultsContainer").style.display = "block";

    // Inform the user that their answers are being processed
    document.getElementById("results").innerText = "Your answers are being evaluated. It should take 10-15sec";

    submitAnswers();
    
    
})





document.getElementById("resultsExitButton").addEventListener("click", function(){
    if (exitAttemtpts == 0){
        document.getElementById("callToActionText").innerText = "Are you sure? It is free anyways";
        exitAttemtpts++;
        
    }
    else if (exitAttemtpts > 0) {
        window.location.href = "https://www.neonlearner.com/";
    }
    
});



document.getElementById("callToActionButton").addEventListener("click", function(){
    
    document.getElementById("resultsContainer").style.display = "none";
    
    document.getElementById("emailContainer").style.display = "block";
    document.getElementById("emailContainer").style.opacity = "1";
});


document.getElementById("submitEmail").addEventListener("click", function() {
    if (document.getElementById("privacyConsent").checked) {
        var userName = document.getElementById("userName").value;
        var userEmail = document.getElementById("userEmail").value;

        
        sendEmail(userName, userEmail);
        
    } else {
        alert("Please agree to our Privacy Policy before submitting your data.");
    }
});


document.getElementById("exitButton").addEventListener("click", function() {
    window.location.href = "https://www.neonlearner.com/";
})







function updateQuestion() {
    // Hide the question container
    document.getElementById("questionContainer").style.opacity = 0;
    document.getElementById("questionContainer").style.display = "block";

    // After a delay, update the question and answer display and show the question container
    setTimeout(function() {
        // Update the question text
        document.getElementById("question").innerText = questions[currentQuestion];
        let displayQuestionNumber = currentQuestion + 1 ;
        document.getElementById("questionNumber").innerText = "Question: " + displayQuestionNumber + "/" + questions.length;

        // Update the answer input field
        document.getElementById("answer").value = answers[currentQuestion];

        // Show or hide the back button depending on the current question
        document.getElementById("backButton").style.display = currentQuestion === 0 ? "none" : "inline-block";

        // Show or hide the next button depending on the current question
        document.getElementById("nextButton").style.display = currentQuestion === questions.length - 1 ? "none" : "inline-block";

        //
                // Show or hide the submit button depending on the current question
        document.getElementById("submitButton").style.display = currentQuestion === questions.length - 1 ? "inline-block" : "none";

        // Show the question container
        document.getElementById("questionContainer").style.opacity = 1;
    }, 500);

}


function submitAnswers() {
    
    document.getElementById("results").innerText = "";
    document.getElementById("loader").style.display = "block";

    // Send a POST request to the backend to evaluate the answers.
    fetch(MY_API", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestType: "evaluateAnswers", answers: answers, sessionUUID: sessionUUID })
    })
    .then(response => {
        
        if (!response.ok) {
            document.getElementById("loader").style.display = "none";
            document.getElementById("scoreComment");
            let scoreComment = document.getElementById("scoreComment");
            scoreComment.style.display = "block";
            scoreComment.innerText = "There was an error when calculating results. Try again later";
            
            throw new Error("Network response was not ok");
            
        }
        
        document.getElementById("loader").style.display = "none";
        return response.json(); // Parse the response body as JSON
        
    })
    .then(data => {


    // Calculate the result score
        let resultScore = data.score*10 ;
    
        // Ensure resultScore is within specific bounds
        if (resultScore < 20) resultScore = 20;
        if (resultScore > 95) resultScore = 95;
    
        // Update the progress bar based on the result score
        let progressBar = document.getElementById("progressBar");
    
        progressBar.style.width = resultScore + '%';

// Display score as a percentage
        document.getElementById("percentage").innerText = Math.round(resultScore) + '%';


        // Provide feedback based on the result score
        let comment;
        if (resultScore < 40) {
            comment = "Your current learning strategies reveal that you're studying longer than necessary. Download your full results for helpful study tips.";
            progressBar.style.backgroundColor = '#f44336'; // Red
        } else if (resultScore < 70) {
            comment = "Your learning strategies are decent, but with effective techniques, you could save a lot of time.";
            progressBar.style.backgroundColor = '#ffeb3b'; // Yellow
        } else {
            comment = "Wow! Your learning strategies are top-notch. You clearly know how to study effectively.";
            progressBar.style.backgroundColor = '#4caf50'; // Green
        }


        // Display the comment
        let scoreComment = document.getElementById("scoreComment");
        scoreComment.style.display = "block";
        scoreComment.innerText = comment;
        //display Call to Action
        
        setTimeout(function() {
    
        let callToActionText = document.getElementById("callToActionText");
        callToActionText.style.display = "block";
        callToActionText.innerText = "Would you like to download full analysis?";
        
        document.getElementById("resultsExitButton").style.display = "inline-block";
        document.getElementById("callToActionButton").style.display = "inline-block";
    
    
        }, 1000);



    })
    .catch(error => {
        // Handle any errors that occurred during the fetch
        console.error('Error submitting answers:', error);
    });
}





function fetchQuestions() {
    // Send a POST request to the backend to retrieve the list of questions.
    fetch("MY_API", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestType: "getQuestions", sessionUUID: sessionUUID })
    })
    .then(response => {
        
        if (!response.ok) {
            document.getElementById("intoContainerErrorParagraph").innerText = "There was an error when loading the questions. Try again later";
            throw new Error("Network response was not ok");
        }
        return response.json(); // Parse the response body as JSON
    })
    .then(data => {
        // Store the received questions in the questions array
        questions = data;

        // Initialize the answers array with empty strings for each question
        for (let i=0; i<questions.length; i++){
            answers.push(" ");
        }
        document.getElementById("beginButton").style.opacity = "1";

    })
    .catch(error => {
        // Handle any errors that occurred during the fetch
        console.error('Error fetching questions:', error);
    });
}

function sendEmail(userName, userEmail) {
    let data = {name: userName, email: userEmail};
    
    document.getElementById("emailContainer").style.display = "none";
    
    
    fetch("MY_API",{
    method: "Post",
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({requestType: "sendEmail", data:data, sessionUUID: sessionUUID})
    
    })
    
    .then(response => {
            
            document.getElementById("exitContainer").style.display = "block";
            document.getElementById("exitContainer").style.opacity = 1;
            
            if (response.ok) {
                document.getElementById("exitContainerText").innerText = "Success! Your email is on the way"
                
                
                
            } else{
                document.getElementById("exitContainerText").innerText = "There was an error while processing your details. Try again later"
                throw new Error("Network response was not ok");
            }
            
        })

    
}
