# LLM Text Classification Website

This project is a small website that classifies user text into one of these categories:

- `feedback`
- `support_ticket`
- `content_tagging`
- `other`

## What feature it provides

The site includes a form where you paste text (for example customer feedback, support tickets, or content snippets). When you submit, the backend calls a local LLM and returns a single category label.

## API/service used

This app uses **Ollama** running locally at:

- `http://localhost:11434`
- Model: `gemma4:e2b`
- Endpoint called by the app: `POST /api/generate`

No cloud account or API key is required.

## How to run

### 1) Install Ollama

Install from https://ollama.com/download

### 2) Pull the model

```bash
ollama pull gemma4:e2b
```

### 3) Start Ollama

```bash
ollama serve
```

### 4) Start this website

```bash
npm start
```

The app runs at:

- `http://localhost:3000`

### 5) Use the classifier

Open the app in your browser, submit text, and the page will show the predicted category.
