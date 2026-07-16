export interface StandaloneConfig {
  deploymentUrl: string;
  assistantId: string;
  langsmithApiKey?: string;
}

const CONFIG_KEY = "deep-agent-config";

function envDefaults(): StandaloneConfig | null {
  const deploymentUrl = process.env.NEXT_PUBLIC_DEPLOYMENT_URL ?? "";
  const assistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID ?? "";
  if (!deploymentUrl || !assistantId) return null;
  return { deploymentUrl, assistantId };
}

function resolveDeploymentUrl(url: string): string {
  // Allow a relative path (e.g. "/api/langgraph") so the proxy route works
  // without knowing the Cloud Run service URL at build time.
  if (url.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${url}`;
  }
  return url;
}

export function getConfig(): StandaloneConfig | null {
  if (typeof window === "undefined") return envDefaults();

  const envUrl       = process.env.NEXT_PUBLIC_DEPLOYMENT_URL ?? "";
  const envAssistant = process.env.NEXT_PUBLIC_ASSISTANT_ID   ?? "";

  let stored: StandaloneConfig | null = null;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) stored = JSON.parse(raw) as StandaloneConfig;
  } catch {
    // ignore malformed storage
  }

  // localStorage wins — user's explicit settings override build-time defaults.
  const deploymentUrl = stored?.deploymentUrl || envUrl       || "";
  const assistantId   = stored?.assistantId   || envAssistant || "";
  if (!deploymentUrl || !assistantId) return null;

  return {
    deploymentUrl:   resolveDeploymentUrl(deploymentUrl),
    assistantId,
    langsmithApiKey: stored?.langsmithApiKey,
  };
}

export function saveConfig(config: StandaloneConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
