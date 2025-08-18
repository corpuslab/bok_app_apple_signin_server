// server.js
// Apple Sign In server for Flutter app

const express = require("express");
const AppleAuth = require("apple-auth");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();

// CORS 설정 추가
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 헬스체크 엔드포인트
app.get("/", (req, res) => {
  res.json({ 
    status: "Apple Sign In Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// The callback route used for Android, which will send the callback parameters from Apple into the Android app.
// This is done using a deeplink, which will cause the Chrome Custom Tab to be dismissed and providing the parameters from Apple back to the app.
app.post("/callbacks/sign_in_with_apple", (request, response) => {
  const redirect = `intent://callback?${new URLSearchParams(
    request.body
  ).toString()}#Intent;package=${
    process.env.ANDROID_PACKAGE_IDENTIFIER
  };scheme=signinwithapple;end`;

  console.log(`Redirecting to ${redirect}`);

  response.redirect(307, redirect);
});

// Endpoint for the app to login or register with the `code` obtained during Sign in with Apple
//
// Use this endpoint to exchange the code (which must be validated with Apple within 5 minutes) for a session in your system
app.post("/sign_in_with_apple", async (request, response) => {
  try {
    // 환경 변수 검증
    const requiredEnvVars = ['BUNDLE_ID', 'SERVICE_ID', 'TEAM_ID', 'KEY_ID', 'KEY_CONTENTS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      return response.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    const auth = new AppleAuth(
      {
        // use the bundle ID as client ID for native apps, else use the service ID for web-auth flows
        // https://forums.developer.apple.com/thread/118135
        client_id:
          request.query.useBundleId === "true"
            ? process.env.BUNDLE_ID
            : process.env.SERVICE_ID,
        team_id: process.env.TEAM_ID,
        redirect_uri: process.env.REDIRECT_URI || `${process.env.RENDER_EXTERNAL_URL || 'https://your-app-name.onrender.com'}/callbacks/sign_in_with_apple`,
        key_id: process.env.KEY_ID
      },
      process.env.KEY_CONTENTS.replace(/\|/g, "\n"),
      "text"
    );

    console.log("Request query:", request.query);

    const accessToken = await auth.accessToken(request.query.code);

    const idToken = jwt.decode(accessToken.id_token);

    const userID = idToken.sub;

    console.log("ID Token:", idToken);

    // `userEmail` and `userName` will only be provided for the initial authorization with your app
    const userEmail = idToken.email;
    const userName = `${request.query.firstName || ''} ${request.query.lastName || ''}`.trim();

    // 👷🏻‍♀️ TODO: Use the values provided create a new session for the user in your system
    const sessionID = `NEW SESSION ID for ${userID} / ${userEmail} / ${userName}`;

    console.log(`sessionID = ${sessionID}`);

    response.json({ 
      success: true,
      sessionId: sessionID,
      userId: userID,
      userEmail: userEmail,
      userName: userName
    });
  } catch (error) {
    console.error("Apple Sign In Error:", error);
    response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// listen for requests :)
const PORT = process.env.PORT || 3000;
const listener = app.listen(PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
  console.log("Environment:", process.env.NODE_ENV || 'development');
});
