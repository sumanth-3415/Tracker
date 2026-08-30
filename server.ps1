# TrackMate - Zero-Dependency Multi-Device Web Server (TcpListener)
$port = 3000
$ipAddress = [System.Net.IPAddress]::Any
$listener = New-Object System.Net.Sockets.TcpListener($ipAddress, $port)

# Detect local Wi-Fi / LAN IP addresses
$localIP = "localhost"
$ipList = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | 
          Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and $_.IPAddressToString -notlike "127.*" -and $_.IPAddressToString -notlike "169.254*" }

if ($ipList) {
    $localIP = $ipList[0].IPAddressToString
}

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  TrackMate Multi-Device Server is LIVE!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  Laptop / PC URL : http://localhost:$port/" -ForegroundColor Yellow
    Write-Host "  Mobile Phone URL: http://${localIP}:$port/" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "(Make sure your phone and laptop are on the same Wi-Fi)`n"

    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $requestLine = $reader.ReadLine()

        if (-not [string]::IsNullOrWhiteSpace($requestLine)) {
            $tokens = $requestLine.Split(" ")
            if ($tokens.Length -ge 2) {
                $rawPath = $tokens[1].TrimStart("/")
                if ([string]::IsNullOrWhiteSpace($rawPath) -or $rawPath -eq "/") {
                    $rawPath = "index.html"
                }
                if ($rawPath.Contains("?")) {
                    $rawPath = $rawPath.Substring(0, $rawPath.IndexOf("?"))
                }

                $filePath = Join-Path $PSScriptRoot $rawPath

                if (Test-Path $filePath -PathType Leaf) {
                    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                    $mime = switch ($ext) {
                        ".html" { "text/html; charset=utf-8" }
                        ".css"  { "text/css; charset=utf-8" }
                        ".js"   { "application/javascript; charset=utf-8" }
                        ".json" { "application/json; charset=utf-8" }
                        ".svg"  { "image/svg+xml" }
                        ".png"  { "image/png" }
                        ".ico"  { "image/x-icon" }
                        default { "application/octet-stream" }
                    }

                    $bytes = [System.IO.File]::ReadAllBytes($filePath)
                    $header = "HTTP/1.1 200 OK`r`nContent-Type: " + $mime + "`r`nContent-Length: " + $bytes.Length + "`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($bytes, 0, $bytes.Length)
                } else {
                    $notFound = "HTTP/1.1 404 Not Found`r`nContent-Length: 13`r`nConnection: close`r`n`r`n404 Not Found"
                    $notFoundBytes = [System.Text.Encoding]::ASCII.GetBytes($notFound)
                    $stream.Write($notFoundBytes, 0, $notFoundBytes.Length)
                }
            }
        }
        $stream.Flush()
        $client.Close()
    }
} finally {
    $listener.Stop()
}
