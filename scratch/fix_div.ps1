$content = Get-Content 'c:\laragon\www\blogs\src\pages\IndexV2.tsx'
$line242 = $content[241]
if ($line242 -match '^\s*}\)\s*$') {
    $before = $content[0..241]
    $after = $content[242..($content.Length-1)]
    $total = $before + '                </div>' + $after
    $total | Set-Content 'c:\laragon\www\blogs\src\pages\IndexV2.tsx'
}
