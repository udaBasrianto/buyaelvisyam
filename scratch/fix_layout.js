const fs = require('fs');
const path = 'c:/laragon/www/blogs/src/pages/IndexV2.tsx';
let content = fs.readFileSync(path, 'utf8');

// Looking for the pattern near the end of the sidebar
const pattern = /\{settings\.newsletter_button_text \|\| "Subscribe"\}\s*<\/button>\s*<\/div>\s*\}\)\s*<\/aside>/;
const replacement = `{settings.newsletter_button_text || "Subscribe"}
                      </button>
                    </div>
                  )}
                </div>
              </aside>`;

if (content.match(pattern)) {
    content = content.replace(pattern, replacement);
    fs.writeFileSync(path, content);
    console.log('Fixed!');
} else {
    // Try a more relaxed pattern
    const pattern2 = /\}\)\s*<\/aside>/;
    const replacement2 = `)}
                </div>
              </aside>`;
    content = content.replace(pattern2, replacement2);
    fs.writeFileSync(path, content);
    console.log('Fixed with fallback!');
}
