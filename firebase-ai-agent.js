const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ESLint } = require("eslint");
const { Octokit } = require("@octokit/rest");
const dotenv = require("dotenv");

dotenv.config();

// Function to execute shell commands
function runCommand(command) {
    return new Promise((resolve, reject) => {
        const process = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
            }
            if (stderr) {
                console.warn(`Warning: ${stderr}`);
            }
            resolve(stdout);
        });
    });
}

// Function to initialize Firebase project
async function initFirebase() {
    console.log("Initializing Firebase project...");
    await runCommand("firebase init");
}

// Function to deploy to Firebase
async function deployFirebase() {
    console.log("Deploying to Firebase...");
    try {
        const output = await runCommand("firebase deploy");
        console.log(output);
    } catch (error) {
        console.error("Deployment failed. Checking logs...");
        await runCommand("firebase functions:log");
    }
}

// Function to create a basic Node.js backend
function createBackend() {
    console.log("Setting up Node.js backend...");
    const backendPath = path.join(__dirname, 'backend');
    if (!fs.existsSync(backendPath)) {
        fs.mkdirSync(backendPath);
    }
    
    const serverCode = `
const express = require('express');
const admin = require('firebase-admin');
const app = express();
admin.initializeApp();

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
`;
    fs.writeFileSync(path.join(backendPath, 'server.js'), serverCode);
    console.log("Backend created at backend/server.js");
}

// Function to create a simple React frontend
function createFrontend() {
    console.log("Setting up React frontend...");
    runCommand("npx create-react-app frontend").then(() => {
        console.log("Frontend created at frontend/");
    });
}

// Function to run ESLint for linting
async function runLinting() {
    console.log("Running ESLint for linting...");
    const eslint = new ESLint({ fix: true });
    const results = await eslint.lintFiles(["backend/**/*.js", "frontend/src/**/*.js"]);
    await ESLint.outputFixes(results);
    console.log("Linting complete.");
}

// Function to handle environment variables
function setupEnv() {
    console.log("Setting up environment variables...");
    const envContent = "FIREBASE_API_KEY=your_firebase_api_key\nPORT=5000\nGITHUB_TOKEN=your_github_token\n";
    fs.writeFileSync(".env", envContent);
    console.log(".env file created.");
}

// Function to automate GitHub commits and pushes
async function pushToGitHub() {
    console.log("Pushing changes to GitHub...");
    await runCommand("git add .");
    await runCommand("git commit -m 'Automated commit' ");
    await runCommand("git push origin main");
    console.log("Changes pushed to GitHub.");
}

// Main function to run the AI agent
async function main() {
    console.log("Welcome to the Firebase AI Agent!");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question("Do you want to initialize Firebase? (yes/no): ", async (answer) => {
        if (answer.toLowerCase() === 'yes') {
            await initFirebase();
        }
        rl.question("Do you want to set up the backend? (yes/no): ", (backendAnswer) => {
            if (backendAnswer.toLowerCase() === 'yes') {
                createBackend();
            }
            rl.question("Do you want to set up the frontend? (yes/no): ", (frontendAnswer) => {
                if (frontendAnswer.toLowerCase() === 'yes') {
                    createFrontend();
                }
                rl.question("Do you want to set up environment variables? (yes/no): ", (envAnswer) => {
                    if (envAnswer.toLowerCase() === 'yes') {
                        setupEnv();
                    }
                    rl.question("Do you want to run linting? (yes/no): ", async (lintAnswer) => {
                        if (lintAnswer.toLowerCase() === 'yes') {
                            await runLinting();
                        }
                        rl.question("Do you want to push changes to GitHub? (yes/no): ", async (gitAnswer) => {
                            if (gitAnswer.toLowerCase() === 'yes') {
                                await pushToGitHub();
                            }
                            rl.question("Do you want to deploy to Firebase? (yes/no): ", async (deployAnswer) => {
                                if (deployAnswer.toLowerCase() === 'yes') {
                                    await deployFirebase();
                                }
                                console.log("All tasks completed.");
                                rl.close();
                            });
                        });
                    });
                });
            });
        });
    });
}

main();
