$content = Get-Content 'c:\laragon\www\blogs\src\pages\IndexV2.tsx'
$newLines = @(
'                  {settings.newsletter_link ? (',
'                    <a ',
'                      href={settings.newsletter_link} ',
'                      target="_blank" ',
'                      rel="noopener noreferrer"',
'                      className="block w-full bg-white text-primary font-black py-3 rounded-xl text-center text-xs uppercase hover:bg-opacity-90 transition-all shadow-lg"',
'                    >',
'                      {settings.newsletter_button_text || "GABUNG SEKARANG"}',
'                    </a>',
'                  ) : (',
'                    <div className="space-y-3">',
'                      <input ',
'                        type="email" ',
'                        placeholder="your@email.com" ',
'                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder:text-white/40"',
'                      />',
'                      <button className="w-full bg-white text-primary font-black py-2 rounded-xl text-xs uppercase hover:bg-opacity-90 transition-all">',
'                        {settings.newsletter_button_text || "Subscribe"}',
'                      </button>',
'                    </div>',
'                  )}'
)
$before = $content[0..220]
$after = $content[232..($content.Length-1)]
$total = $before + $newLines + $after
$total | Set-Content 'c:\laragon\www\blogs\src\pages\IndexV2.tsx'
