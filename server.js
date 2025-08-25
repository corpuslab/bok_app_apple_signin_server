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

// GET 요청으로 애플 로그인 시작
app.get("/auth/apple", (req, res) => {
  try {
    const auth = new AppleAuth(
      {
        client_id: process.env.SERVICE_ID || 'com.corpuslab.bok.signin',
        team_id: process.env.TEAM_ID,
        redirect_uri: `${process.env.RENDER_EXTERNAL_URL || 'https://bok-app-apple-signin-server.onrender.com'}/callbacks/sign_in_with_apple`,
        key_id: process.env.KEY_ID
      },
      process.env.KEY_CONTENTS ? process.env.KEY_CONTENTS.replace(/\|/g, "\n") : null,
      "text"
    );

    const authorizationUrl = auth.loginURL();
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Apple Auth Error:", error);
    res.status(500).json({ error: "Apple authentication setup failed" });
  }
});

// The callback route used for Android, which will send the callback parameters from Apple into the Android app.
// This is done using a deeplink, which will cause the Chrome Custom Tab to be dismissed and providing the parameters from Apple back to the app.
app.post("/callbacks/sign_in_with_apple", (request, response) => {
  try {
    console.log("Received callback request body:", request.body);
    
    const redirect = `intent://callback?${new URLSearchParams(
      request.body
    ).toString()}#Intent;package=${
      process.env.ANDROID_PACKAGE_IDENTIFIER || 'com.corpuslab.bok'
    };scheme=signinwithapple;end`;

    console.log(`Redirecting to ${redirect}`);

    response.redirect(307, redirect);
  } catch (error) {
    console.error("Callback Error:", error);
    response.status(500).json({ error: "Callback processing failed" });
  }
});

// GET 요청으로도 callback 처리 (애플에서 직접 호출할 수 있음)
app.get("/callbacks/sign_in_with_apple", (request, response) => {
  try {
    console.log("Received GET callback request query:", request.query);
    
    const redirect = `intent://callback?${new URLSearchParams(
      request.query
    ).toString()}#Intent;package=${
      process.env.ANDROID_PACKAGE_IDENTIFIER || 'com.corpuslab.bok'
    };scheme=signinwithapple;end`;

    console.log(`Redirecting to ${redirect}`);

    response.redirect(307, redirect);
  } catch (error) {
    console.error("GET Callback Error:", error);
    response.status(500).json({ error: "GET callback processing failed" });
  }
});

// Endpoint for the app to login or register with the `code` obtained during Sign in with Apple
app.post("/sign_in_with_apple", async (request, response) => {
  try {
    // 환경 변수 검증 (선택적)
    const requiredEnvVars = ['SERVICE_ID', 'TEAM_ID', 'KEY_ID', 'KEY_CONTENTS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('Missing environment variables:', missingVars);
      // 환경변수가 없어도 기본값으로 작동하도록 수정
    }

    const auth = new AppleAuth(
      {
        client_id: process.env.SERVICE_ID || 'com.corpuslab.bok.signin',
        team_id: process.env.TEAM_ID,
        redirect_uri: `${process.env.RENDER_EXTERNAL_URL || 'https://bok-app-apple-signin-server.onrender.com'}/callbacks/sign_in_with_apple`,
        key_id: process.env.KEY_ID
      },
      process.env.KEY_CONTENTS ? process.env.KEY_CONTENTS.replace(/\|/g, "\n") : null,
      "text"
    );

    console.log("Request query:", request.query);

    const accessToken = await auth.accessToken(request.query.code);
    const idToken = jwt.decode(accessToken.id_token);
    const userID = idToken.sub;

    console.log("ID Token:", idToken);

    const userEmail = idToken.email;
    const userName = `${request.query.firstName || ''} ${request.query.lastName || ''}`.trim();

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
