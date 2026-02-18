# Creates the education_sample ontology via the API (server must be running on port 8080).
# Run from repo root: .\scripts\seed-education-ontology.ps1

$baseUrl = "http://localhost:8080/api/2.1/unity-catalog"
$body = @{
  name             = "education_sample"
  catalog_name     = "unity"
  schema_name      = "default"
  comment          = "Sample ontology: students attend school, take classes; classes belong to a degree."
  node_classes     = @(
    @{ name = "Student"; parent_class = $null; properties = @() },
    @{ name = "School"; parent_class = $null; properties = @() },
    @{ name = "Class"; parent_class = $null; properties = @() },
    @{ name = "Degree"; parent_class = $null; properties = @() }
  )
  relationship_types = @(
    @{ name = "attend"; source_class = "Student"; target_class = "School"; properties = @() },
    @{ name = "take"; source_class = "Student"; target_class = "Class"; properties = @() },
    @{ name = "in"; source_class = "Class"; target_class = "Degree"; properties = @() }
  )
} | ConvertTo-Json -Depth 10 -Compress

try {
  $response = Invoke-RestMethod -Uri "$baseUrl/ontologies" -Method Post -Body $body -ContentType "application/json"
  Write-Host "Created ontology: unity.default.education_sample" -ForegroundColor Green
  Write-Host "Open in app: Catalogs -> unity -> default -> Ontologies -> education_sample"
} catch {
  if ($_.Exception.Response.StatusCode -eq 409) {
    Write-Host "Ontology unity.default.education_sample already exists. Open it in the app." -ForegroundColor Yellow
  } else {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Ensure the server is running (e.g. java @server\target\run-args.txt) and unity.default exists."
    exit 1
  }
}
