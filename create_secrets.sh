#!/usr/bin/env bash
# Creates a GCP Secret Manager secret for every non-empty variable in .env,
# adds the current value as the latest version, and grants secretAccessor to
# the specified service account.
set -euo pipefail

# Prevent gcloud from picking up venv's protobuf (causes MessageMapContainer crash)
export CLOUDSDK_PYTHON=/usr/bin/python3

SERVICE_ACCOUNT="714132495755-compute@developer.gserviceaccount.com"
ENV_FILE="${1:-.env.production}"
#PROJECT="$(gcloud config get-value project --quiet)"
PROJECT="alpha-499407"

if [[ -z "$PROJECT" ]]; then
  echo "ERROR: no active GCP project. Run: gcloud config set project PROJECT_ID" >&2
  exit 1
fi

echo "Project : $PROJECT"
echo "SA      : $SERVICE_ACCOUNT"
echo "Env file: $ENV_FILE"
echo "---"

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  # Must match KEY=...
  if [[ ! "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    continue
  fi

  key="${BASH_REMATCH[1]}"
  value="${BASH_REMATCH[2]}"

  # Strip surrounding double-quotes
  value="${value#\"}"
  value="${value%\"}"

  if [[ -z "$value" ]]; then
    echo "SKIP  $key  (empty value)"
    continue
  fi

  secret_name="$key"

  echo -n "[$key] "

  # Create secret (idempotent — ignore AlreadyExists)
  if gcloud secrets describe "$secret_name" --project="$PROJECT" &>/dev/null; then
    echo -n "exists, adding version... "
  else
    gcloud secrets create "$secret_name" \
      --replication-policy="automatic" \
      --project="$PROJECT" \
      --quiet
    echo -n "created, adding version... "
  fi

  # Add secret version
  printf '%s' "$value" | gcloud secrets versions add "$secret_name" \
    --data-file=- \
    --project="$PROJECT" \
    --quiet

  # Grant secretAccessor to service account
  gcloud secrets add-iam-policy-binding "$secret_name" \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT" \
    --quiet &>/dev/null

  echo "done"
done < "$ENV_FILE"

echo "---"
echo "All secrets processed."
