# Azure Frontend Deployment Fix

## Problem

Azure App Service deployment repeatedly stops during:

```text
Running 'npm run build'...
> next build
Creating an optimized production build ...
```

The deployment is using Microsoft Oryx:

```text
oryx build ... --platform nodejs --platform-version 22
```

This means Azure is installing dependencies and building the Next.js app on the App Service/Kudu deployment machine.

## Most Likely Cause

The Next.js production build can stay silent for several minutes while optimizing assets and generating output. Azure Kudu/Oryx may treat that silence as an idle command and fail/stop the deployment, especially on smaller App Service plans.

The warnings shown before the stop are not the direct failure:

- `baseline-browser-mapping` warning is informational.
- `middleware` deprecation warning is not fatal.
- `npm audit` vulnerabilities do not stop the build.
- `next@16.0.7` security warning should be fixed, but it is not the reason the build stops at this exact line.

## Recommended Azure App Settings

Add these settings in:

```text
Azure Portal -> App Service -> Configuration -> Application settings
```

```text
SCM_COMMAND_IDLE_TIMEOUT = 1800
NODE_OPTIONS = --max-old-space-size=4096
NEXT_TELEMETRY_DISABLED = 1
```

Why:

- `SCM_COMMAND_IDLE_TIMEOUT=1800` gives Oryx up to 30 minutes before treating a silent build command as idle.
- `NODE_OPTIONS=--max-old-space-size=4096` gives the Next.js build more memory headroom.
- `NEXT_TELEMETRY_DISABLED=1` removes telemetry output and network behavior during build.

After saving, restart the App Service and deploy again.

## Recommended Runtime Stack

The current Azure build is using Node 22:

```text
Using Node version:
v22.22.2
```

For production App Service stability, use Node 20 LTS unless the app specifically requires Node 22.

Set it in:

```text
Azure Portal -> App Service -> Configuration -> General settings -> Stack settings
```

Recommended:

```text
Runtime stack: Node
Major version: Node 20 LTS
```

Then save and restart.

## Azure CLI Alternative

Replace resource group and app name as needed:

```bash
az webapp config appsettings set \
  --resource-group <resource-group-name> \
  --name Monetizemate \
  --settings SCM_COMMAND_IDLE_TIMEOUT=1800 NODE_OPTIONS=--max-old-space-size=4096 NEXT_TELEMETRY_DISABLED=1
```

```bash
az webapp config set \
  --resource-group <resource-group-name> \
  --name Monetizemate \
  --linux-fx-version "NODE|20-lts"
```

```bash
az webapp restart \
  --resource-group <resource-group-name> \
  --name Monetizemate
```

## Better Long-Term Deployment Option

Avoid building on Azure App Service. Build the frontend before deployment and deploy the built output.

Reason:

- Oryx currently runs `npm install` every deployment.
- Logs show dependency installation alone takes around 5-6 minutes.
- Next.js production optimization can be memory-heavy.
- App Service deployment machines are not ideal CI builders.

Preferred long-term flow:

```text
GitHub Actions / Azure DevOps
        |
        v
npm ci
npm run build
        |
        v
Deploy built artifact to Azure
```

## How To Get the Real Failure Details

If deployment still fails, open Kudu logs:

```text
https://<app-name>.scm.azurewebsites.net/api/vfs/LogFiles/kudu/trace/
```

Also check:

```text
/tmp/build-debug.log
/tmp/oryx-build.log
```

The Azure Portal Deployment Center often shows only the last visible command, not the actual failure line.

