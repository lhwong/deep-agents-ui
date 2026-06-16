# 🚀🧠 Deep Agents UI

[Deep Agents](https://github.com/langchain-ai/deepagents) is a simple, open source agent harness that implements a few generally useful tools, including planning (prior to task execution), computer access (giving the able access to a shell and a filesystem), and sub-agent delegation (isolated task execution). This is a UI for interacting with deepagents.

## 🚀 Quickstart

**Install dependencies and run the app**

```bash
git clone https://github.com/langchain-ai/deep-agents-ui.git
cd deep-agents-ui
yarn install
yarn dev
```

**Deploy a Deep Agent**

As an example, see our [Deep Agents quickstarts](https://github.com/langchain-ai/deepagents/tree/main/examples) for examples and run the `deep_research` example.

The `langgraph.json` file has the assistant ID as the key:

```
  "graphs": {
    "research": "./agent.py:agent"
  },
```

Kick off the local LangGraph deployment:

```bash
cd deepagents-quickstarts/deep_research
langgraph dev
```

You will see the local LangGraph deployment log to terminal:

```
╦  ┌─┐┌┐┌┌─┐╔═╗┬─┐┌─┐┌─┐┬ ┬
║  ├─┤││││ ┬║ ╦├┬┘├─┤├─┘├─┤
╩═╝┴ ┴┘└┘└─┘╚═╝┴└─┴ ┴┴  ┴ ┴

- 🚀 API: http://127.0.0.1:2024
- 🎨 Studio UI: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
- 📚 API Docs: http://127.0.0.1:2024/docs
...
```

You can get the Deployment URL and Assistant ID from the terminal output and `langgraph.json` file, respectively:

- Deployment URL: <http://127.0.1:2024>
- Assistant ID: `research`

**Open Deep Agents UI** at [http://localhost:3000](http://localhost:3000) and input the Deployment URL and Assistant ID:

- **Deployment URL**: The URL for the LangGraph deployment you are connecting to
- **Assistant ID**: The ID of the assistant or agent you want to use
- [Optional] **LangSmith API Key**: Your LangSmith API key (format: `lsv2_pt_...`). This may be required for accessing deployed LangGraph applications. You can also provide this via the `NEXT_PUBLIC_LANGSMITH_API_KEY` environment variable.

**Usage**

You can interact with the deployment via the chat interface and can edit settings at any time by clicking on the Settings button in the header.

<img width="2039" height="1495" alt="Screenshot 2025-11-17 at 1 11 27 PM" src="https://github.com/user-attachments/assets/50e1b5f3-a626-4461-9ad9-90347e471e8c" />

As the deepagent runs, you can see its files in LangGraph state.

<img width="2039" height="1495" alt="Screenshot 2025-11-17 at 1 11 36 PM" src="https://github.com/user-attachments/assets/86cc6228-5414-4cf0-90f5-d206d30c005e" />

You can click on any file to view it.

<img width="2039" height="1495" alt="Screenshot 2025-11-17 at 1 11 40 PM" src="https://github.com/user-attachments/assets/9883677f-e365-428d-b941-992bdbfa79dd" />

### Optional: Environment Variables

You can optionally set environment variables instead of using the settings dialog:

```env
NEXT_PUBLIC_LANGSMITH_API_KEY="lsv2_xxxx"
```

**Note:** Settings configured in the UI take precedence over environment variables.

### Usage

You can run your Deep Agents in Debug Mode, which will execute the agent step by step. This will allow you to re-run the specific steps of the agent. This is intended to be used alongside the optimizer.

You can also turn off Debug Mode to run the full agent end-to-end.

### 📚 Resources

If the term "Deep Agents" is new to you, check out these videos!
[What are Deep Agents?](https://www.youtube.com/watch?v=433SmtTc0TA)
[Implementing Deep Agents](https://www.youtube.com/watch?v=TTMYJAw5tiA&t=701s)




# Build and push via Cloud Build
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/alpha-499407/alpha-repo/deep-agents-ui:latest \
  --project alpha-499407

# Deploy to Cloud Run (all auth secrets as runtime env vars)
gcloud run deploy deep-agents-ui \
  --image us-central1-docker.pkg.dev/alpha-499407/alpha-repo/deep-agents-ui:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project alpha-499407 \
  --set-env-vars "AUTH_GOOGLE_ID=...,AUTH_GOOGLE_SECRET=...,AUTH_SECRET=...,AUTH_GITHUB_ID=...,AUTH_GITHUB_SECRET=..."
If NEXT_PUBLIC_LANGSMITH_API_KEY needs to be baked in at build time, pass it as a build arg:


gcloud builds submit \
  --tag ... \
  --project alpha-499407 \
  --substitutions "_LANGSMITH_KEY=lsv2_pt_..." \
  --build-arg "NEXT_PUBLIC_LANGSMITH_API_KEY=$_LANGSMITH_KEY"


gcloud run deploy deep-agents-ui \
  --image us-central1-docker.pkg.dev/alpha-499407/alpha-repo/deep-agents-ui:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project alpha-499407 \
  --set-secrets "\
AUTH_SECRET=AUTH_SECRET:latest,\
AUTH_GOOGLE_ID=AUTH_GOOGLE_ID:latest,\
AUTH_GOOGLE_SECRET=AUTH_GOOGLE_SECRET:latest,\
AUTH_GITHUB_ID=AUTH_GITHUB_ID:latest,\
AUTH_GITHUB_SECRET=AUTH_GITHUB_SECRET:latest"


gcloud run deploy deep-agents-ui \
  --image us-central1-docker.pkg.dev/alpha-499407/alpha-repo/deep-agents-ui:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project alpha-499407 \
  --set-env-vars "AUTH_URL=https://deep-agents-ui-lsvgxdj6ga-uc.a.run.app, \
NEXT_PUBLIC_DEPLOYMENT_URL=https://alpha-team-714132495755.us-central1.run.app, \
NEXT_PUBLIC_ASSISTANT_ID=alpha-team" \
  --set-secrets "\
AUTH_SECRET=AUTH_SECRET:latest,\
AUTH_GOOGLE_ID=AUTH_GOOGLE_ID:latest,\
AUTH_GOOGLE_SECRET=AUTH_GOOGLE_SECRET:latest,\
AUTH_GITHUB_ID=AUTH_GITHUB_ID:latest,\
AUTH_GITHUB_SECRET=AUTH_GITHUB_SECRET:latest"
