// import { Ollama } from 'ollama';

const vscode = require('vscode');
const { Ollama } = require('ollama');
// import * as vscode from 'vscode';

function activate(context) {
    console.log('Congratulations, your extension "vs-code-ai" is now active!');

    const disposable = vscode.commands.registerCommand(
        'vs-code-ai.startchat',
        function () {
            const panel = vscode.window.createWebviewPanel(
                'vs-code-ai',
                'VS CODE AI',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            panel.webview.html = getWebviewContent();
            panel.webview.onDidReceiveMessage(async (message) => {
                let userPrompt = '';
                let responseText = '';
                if (message.command == 'chat') {
                    userPrompt = message.text;
                }

                try {
                    const ollamaClient = new Ollama();
                    const streamResponse = await ollamaClient.chat({
                        model: 'deepseek-r1:1.5b',
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true,
                    });

                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({
                            command: 'chatResponse',
                            text: responseText,
                        });
                    }
                } catch (error) {
                    panel.webview.postMessage({
                        command: 'chatResponse',
                        text: `Error: ${String(error)}`,
                    });
                    console.log(error);
                }
            });
        }
    );

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VS CODE AI</title>
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #1e1e1e;
                color: white;
                text-align: center;
                padding: 20px;
                justify-content:center;
                align-items:center;
                display:flex;
                flex-direction:column;
            }

            h2 {
                color: #00bcd4;
                font-size: 24px;
            }

            #prompt {
                width: 90%;
                max-width: 600px;
                height: 100px;
                background: #333;
                color: white;
                border: 1px solid #00bcd4;
                border-radius: 8px;
                padding: 10px;
                font-size: 16px;
                resize: none;
                outline: none;
            }

            #askBtn {
                background-color: #00bcd4;
                color: white;
                border: none;
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 10px;
                border-radius: 6px;
                transition: 0.3s;
            }

            #askBtn:hover {
                background-color: #008c9e;
            }

            #response {
                margin-top: 20px;
                width: 90%;
                max-width: 600px;
                background: #292929;
                border-radius: 8px;
                padding: 15px;
                font-size: 16px;
                min-height: 100px;
                text-align: left;
                overflow-y: auto;
                border: 1px solid #444;
            }

            /* Style the rendered markdown */
            #response h1, #response h2, #response h3 {
                color: #00bcd4;
            }
            #response code {
                background: #333;
                color: #00ff00;
                padding: 2px 4px;
                border-radius: 4px;
            }
            #response pre {
                background: #333;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
            }
            #response blockquote {
                border-left: 4px solid #00bcd4;
                padding-left: 10px;
                color: #ccc;
                font-style: italic;
            }

            /* Smooth scrolling for response box */
            ::-webkit-scrollbar {
                width: 8px;
            }
            ::-webkit-scrollbar-track {
                background: #333;
            }
            ::-webkit-scrollbar-thumb {
                background: #00bcd4;
                border-radius: 10px;
            }
        </style>
    </head>

    <body>
        <h2>🤖 OFFLINE AI Chat</h2>
        <textarea id="prompt" placeholder="Type your question here..."></textarea>
        <br>
        <button id="askBtn">Ask AI</button>
        <div id="response">🤖 AI Response will appear here...</div>

        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('askBtn').addEventListener('click', () => {
                console.log("Button clicked");
                const text = document.getElementById('prompt').value;
                vscode.postMessage({ command: "chat", text });
            });

            window.addEventListener("message", (event) => {
                const { command, text } = event.data;
                if (command == "chatResponse") {
                    document.getElementById('response').innerHTML = marked.parse(text);
                }
            });
        </script>

    </body>
    </html>
    `;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
