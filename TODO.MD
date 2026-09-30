# TODO CHECKLIST

## ✅ DONE

- [x] Split by service (CLI, Backend, Frontend)
- [x] Docker compose 3 services
- [x] Concat files tool
- [x] Separate esbuild tsconfig package.json
- [x] toolDescriptions with props
- [x] add coverage report and some tests
- [x] BE calls cli tool
- [X] openapi autogen
- [x] use jules as coding agent for tests/small fixes

## 🔄 TO BE DONE

- [x] Save document with file structure (done by Artem)
- [x] Sockets (live log streaming, MVP)
- [ ] continuesly save results (upd prompt)
- [ ] RETRY IF COPILOT API FAIL
- [ ] frontend src + buld during docker steps

---

# FRONTEND

dribble modern ui ux -> vite react\vue tailwind
DASHBOARD

```
+--------------------------------------------------------------------------------------+
|                            Developer Repo Analysis Tool                              |
+--------------------------------------------------------------------------------------+
| Input Section                                                                        |
|                                                                                      |
| +-----------------------------------------+    +-----------------------------------+ |
| | Repositories                            |    | Prompts                          | |
| | [+] Add repository link                 |    | [+] Enter AI prompt              | |
| | [repo1-url]                             |    | [Write your AI instructions...]  | |
| | [repo2-url]                             |    |                                   | |
| +-----------------------------------------+    +-----------------------------------+ |
|                                                                                      |
| +-----------------------------------------+                                          |
| | Configurations                          |                                          |
| | [>] Optional AI / System Configurations                                         [+]|
| | [Default settings]                                                                   |
| +-----------------------------------------+                                          |
|                                                                                      |
|                                 [ Submit ]   [ Reset ]               ^ Action Bar   |
+--------------------------------------------------------------------------------------+
| Main Zone                                                                           |
|                                                                                      |
| +-----------------------------------------------------+ +--------------------------+ |
| |                        Markdown Preview             | |        Real-Time Logs    | |
| |-----------------------------------------------------| |--------------------------| |
| | # Project Title                                     | | Log Line 1 ✅          🕒 | |
| | ## Description                                      | | Log Line 2 ✅          🕒 | |
| | - Feature 1                                         | | Log Line 3              | |
| | - Feature 2                                         | | Log Line ...(scrollable)| |
| |                                                     | |--------------------------| |
| | ## Code Overview                                    | | Alert ⚠: Issue detected | |
| | - Code snippet: `function helloWorld() {...}`       | |--------------------------| |
| |                                                     |                              |
| | ## Installation Steps                               |                              |
| | 1. Clone the Repository                             |                              |
| | 2. Run `npm install`                                |                              |
| +-----------------------------------------------------+                              |
|                                                                                      |
+--------------------------------------------------------------------------------------+

Legend:
- "Input Section": Contains collapsible inputs for repositories, prompts, and configurations.
- "Main Zone": Markdown Preview occupies most space for high-priority readability.
- "Real-Time Logs": Compact space providing live feedback next to the Markdown Preview.
- "Action Buttons": Available at the bottom of the Input Section for user interactions.

```

smooth animations

You are tasked with designing a modern, single-page web app using given design mockup art to represent UI/UX layout. The tool is for developers to analyze a list of repositories, input AI prompts and system configurations, and generate documentation file.

side bar (expandable/hideable) to the left config (repos, prompts, optional settings) part and @run main button
center - markdown document (sourced from json) + zoom-slider 1x 2x 3x
side bar (expandable/hideable) to the top right Real-Time Logs (use minimal space but ensure live feedback is clear)
side bar (expandable/hideable) bottom right -> ai chat. 1 question about main doc - 1 answer. no scroll no history

# BACKEND

sockets - rxjs reactive stoud logs
support chat. send doc as context plus question - recieve answer. no history (yet lol)
return json of generated MDs

```
{
  "metadata": {
    "title": "AI-Powered Documentation Tool",
    "description": "An advanced AI-driven tool designed to generate markdown documentation from repositories.",
    "author": "Development Team XYZ",
    "version": "1.0.0",
    "date_created": "2023-10-10"
  },
  "document": [
    {
      "title": "# Introduction",
      "content": {
        "1x": "This tool helps generate documentation automatically.",
        "2x": "This tool enables the automated generation of clear, concise documentation from any repository, improving team productivity.",
        "3x": "This AI-powered documentation tool leverages intelligent parsing and natural language processing to analyze repository structures, integrate business goals, and generate comprehensive documentation with minimal manual effort."
      }
    },
    {
      "title": "## Features",
      "content": {
        "1x": "- Fast\n- Reliable",
        "2x": "- **Fast**: Quickly generates documentation without manual intervention.\n- **Reliable**: Produces consistent, high-quality output across different repositories.",
        "3x": "- **Fast**: The tool processes repositories and generates documentation within seconds, reducing the time spent on manual writing.\n- **Reliable**: It ensures uniform quality by adhering to natural language best practices and project-specific style guidelines.\n- **Configurable**: Users can tweak AI parameters (e.g., token counts, temperature) to customize the documentation depth as required."
      }
    },
    {
      "title": "## Technical Overview",
      "content": {
        "1x": "Runs on Node.js and uses GPT-3.",
        "2x": "The system relies on a Node.js server, integrates with the OpenAI GPT API, and uses a modular architecture for flexibility.",
        "3x": "### Frameworks and Architecture\n- **Backend**: Built with Node.js and uses Express.js for routing.\n- **AI Integration**: Connects to OpenAI’s GPT models for natural language processing. Includes prompt engineering logic for optimization.\n- **Modular Design**: Includes separate services for repository parsing, AI interaction, and markdown rendering.\n\n### Deployment\nThe system is containerized with Docker and deployable in both on-premise and cloud environments (e.g., AWS, Azure)."
      }
    },
    {
      "title": "## Conclusion",
      "content": {
        "1x": "Easy-to-use and effective.",
        "2x": "The tool is user-friendly and provides an efficient way to generate documentation, adapting to the needs of both technical and non-technical users.",
        "3x": "This documentation tool empowers development teams by automating repetitive tasks, enabling them to focus on innovation while delivering high-caliber documentation. Its versatility ensures seamless adoption across business and technical domains."
      }
    }
  ]
}
```

# AGENT

rxjs stdout support
support chat. send doc as context plus question - recieve answer. no history (yet lol)
context: document not input, prompt: question, result - answer

# ??? ORCHESTRA ???

manipulate agent workflow
