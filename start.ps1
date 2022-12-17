Set-Variable "TZ" "Europe/Paris" -Scope Script
Set-Variable "CONF_DIR" "$PSScriptRoot\conf" -Scope Script
# read field main in package.json
$main = Get-Content -Path "$PSScriptRoot\package.json" -Raw | ConvertFrom-Json | Select-Object -ExpandProperty main

ts-node $main