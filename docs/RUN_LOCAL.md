# Run the application locally (with ontology editor)

## 1. Build the server

From the repo root (use the `.bat` launcher on Windows so sbt runs without "Select an application"):

```bash
# Windows (PowerShell or CMD)
.\build\sbt.bat "server/compile" "server/packageBin"

# Linux / macOS / WSL / Git Bash
./build/sbt "server/compile" "server/packageBin"
```

## 2. Start the backend

The API runs on port **8081**; a transcoder on **8080** forwards to it. The UI is configured to proxy to `http://localhost:8080`.

**Option A – Run via sbt (keeps server in foreground):**

```bash
.\build\sbt.bat "server/run -p 8080"
```

Leave this terminal open. In another terminal, do step 3.

**Option B – Run with Java (Windows):**  
If the classpath is too long, use the args file (from repo root after building):

```powershell
# Recreate the args file (classpath + main class)
$cp = Get-Content -Path "server\target\classpath" -Raw
"-cp`n$cp`nio.unitycatalog.server.UnityCatalogServer`n-p`n8080" | Set-Content -Path "server\target\run-args.txt" -NoNewline
java @server\target\run-args.txt
```

## 3. Build and run the UI

In a **new terminal**:

```bash
cd ui
npm install
npm start
```

(If `yarn.lock` is valid, you can use `yarn install` and `yarn start` instead.)

Then open **http://localhost:3000** in your browser. The dev server proxies API calls to the backend.

To see the **ontology editor**: go to a catalog → schema → **Ontologies** tab, then open or create an ontology.

## Sample education ontology (optional)

To see a **pre-populated ontology** (Student–School–Class–Degree with relationships attend, take, in) in the app, use either method below.

### Method 1: Seed via API (recommended – server must be running)

With the **server already running**, from the repo root run:

```powershell
.\scripts\seed-education-ontology.ps1
```

This creates `education_sample` in the same DB the server is using. Then in the app: **Catalogs** → **unity** → **default** → **Ontologies** → **education_sample**. If catalog `unity` or schema `default` don't exist yet, create them in the UI first (or use Method 2).

### Method 2: Populate test DB (server must be stopped)

1. **Stop the server** if it is running (so the DB file is not locked).

2. **From the repo root**, run the populator (this uses the same DB file as the server, `etc/db/h2db`, and creates catalog `unity`, schema `default`, and ontology `education_sample`):

   ```bash
   .\build\sbt.bat "server/populateTestDB"
   ```

   You should see `Created sample ontology: unity.default.education_sample` in the output.

3. **Start the server again**, then refresh the app. Go to **Catalogs** → **unity** → **default** → **Ontologies** tab. You should see **education_sample**; click it to open the graph and node/relationship tables.

If you still don’t see the ontology, use **Method 1** (seed script) with the server running instead.

## Ports

| Service        | Port | Notes                    |
|----------------|------|--------------------------|
| UI dev server  | 3000 | Open this in the browser |
| Backend proxy  | 8080 | UI proxy target          |
| Backend API    | 8081 | Used by transcoder      |
