var state = {
    loggedIn: false,
    email: null,
    picture: null
};

function decodeJwtResponse(jwt) {
    // Split the JWT token into its three parts
    var parts = jwt.split(".");

    // The first part is the header, which we can decode using the atob() function
    var header = JSON.parse(atob(parts[0]));

    // The second part is the payload, which we can also decode using the atob() function
    var payload = JSON.parse(atob(parts[1]));

    // Return the decoded header and payload as an object
    return {header: header, payload: payload};
}

// This function is called when the user signs in with Google
function onSignIn(response) {
    console.log("User signed in");
    console.log(response);
    const responsePayload = decodeJwtResponse(response.credential);

    console.log(responsePayload);
    const email = responsePayload.payload.email;

    // Set the loggedIn flag to true
    state.loggedIn = true;
    // Update the state object
    state.email = email;
    // Update the state object with the user's profile picture
    state.picture = responsePayload.payload.picture;

    // Enable the chat log
    var log = document.getElementById("chat-log");
    log.style.visibility = "visible";

    // Enable the chat form
    var form = document.getElementById("chat-form");
    // form.style.display = "block";
    form.style.visibility = "visible";

    // Fetch chat history
    $.ajax({
        url: "https://fetch-chat-history-4xeslgq7aq-ez.a.run.app",
        type: "POST",
        data: {
            email: email
        },
        success: function (response) {
            console.log(response);
            response.forEach(function (message) {
                addChatMessage(message.text,message.sender === "Eliza");
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            if (jqXHR.status === 403) {
                // Show an error message to the user
                alert("Sorry, you are not allowed to use this app. Please contact the administrator for more information.");
            }
        }
    });

}
// Get the input element
const input = document.getElementById("chat-input");

// Add an event listener for the keydown event on the input element
input.addEventListener("keydown", event => {
  // Check if the user pressed the cmd+enter key combination
  if (event.key === "Enter" && event.metaKey) {
    // Prevent the default behavior of the enter key
    event.preventDefault();

    // Insert a newline character in the input field
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + "\n" + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start + 1;
  }
});


function onSignOut() {
    // Set the loggedIn flag to false
    state.loggedIn = false;

    // Disconnect the user from Google Identity Services for Web
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.disconnect().then(function () {
        // Update the UI to show the login button
        var loginButton = document.getElementById("google-sign-in-button");
        loginButton.style.display = "block";
    });
}

function addChatMessage(messageText, isBot) {
    // Show the response message in the chat log
    // Create a new div element to represent the chat message
    const chatMessage = document.createElement("div");

    // Add a class to the chat message element
    chatMessage.classList.add(isBot ? "response-message" : "chat-message");

    if (!isBot) {
        // Add the user's profile picture to the chat message element
        const profilePicture = document.createElement("img");
        profilePicture.src = state.picture;
        profilePicture.classList.add("profile-picture");
        chatMessage.appendChild(profilePicture);
    }

    // Add the chat message text to the chat message element
    const msgDiv = document.createElement("div");
    msgDiv.innerHTML = messageText;
    msgDiv.classList.add(isBot ? "response-message-text" : "chat-message-text");
    chatMessage.appendChild(msgDiv);

    if (isBot) {
        // Add the bot's profile picture to the chat message
        const botPicture = document.createElement("img");
        botPicture.classList.add("profile-picture");
        botPicture.src = "static/images/bot.png";
        chatMessage.appendChild(botPicture);
    }

    // Add the chat message element to the chat log
    const chatLog = document.getElementById("chat-log");
    chatLog.appendChild(chatMessage);

    // Scroll the chat log to the bottom
    chatLog.scrollTop = chatLog.scrollHeight;
}


// This function is called when the user submits the chat form
function onFormSubmit() {
    // Prevent the form from being submitted
    this.event.preventDefault();
    console.log("Form submitted");
    // Get the user's message
    const input = document.getElementById("chat-input");
    const message = input.value.trim();

    if (!message) {
        // Add the error class to the input field
        input.classList.add("error");
        return;
    }
    // Remove the error class from the input field
    input.classList.remove("error");

    // Clear the text field
    input.value = "";

    // Add the user's message to the chat log
    addChatMessage(message);
    const url = "https://eliza-bot-4xeslgq7aq-uc.a.run.app"
    // const url = "http://localhost:5000/sms"
    // Send the message to the backend
    $.ajax({
        // https://eliza-bot-4xeslgq7aq-uc.a.run.app
        url: url,
        type: "POST",
        data: {
            message: message,
            email: state.email
        },
        success: function (response) {
            console.log(response);
            // Show the response message in the chat log
            addChatMessage(response.message, true);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (jqXHR.status === 403) {
                // Show an error message to the user
                alert("Sorry, you are not allowed to use this app. Please contact the administrator for more information.");
            }
        }
    });
}

