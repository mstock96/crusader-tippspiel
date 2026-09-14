const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

// 1. Update main.tsx
const mainTsxPath = path.join(srcDir, 'main.tsx');
let mainTsx = fs.readFileSync(mainTsxPath, 'utf8');
if (!mainTsx.includes('import { Notifications }')) {
    mainTsx = mainTsx.replace(
        "import { MantineProvider } from '@mantine/core';",
        "import { MantineProvider } from '@mantine/core';\nimport { Notifications } from '@mantine/notifications';"
    );
    mainTsx = mainTsx.replace(
        "<MantineProvider>",
        "<MantineProvider>\n            <Notifications />"
    );
    fs.writeFileSync(mainTsxPath, mainTsx);
    console.log("Updated main.tsx");
}

// 2. Replace alerts in components
const componentsDir = path.join(srcDir, 'components');
walk(componentsDir, (filepath) => {
    if (!filepath.endsWith('.tsx') && !filepath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filepath, 'utf8');
    if (!content.includes('alert(')) return;
    
    // Add import if not present
    if (!content.includes("from '@mantine/notifications'")) {
        // Find last import statement
        const importRegex = /^import .* from .*;/gm;
        let lastMatch;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            lastMatch = match;
        }
        if (lastMatch) {
            const insertPos = lastMatch.index + lastMatch[0].length;
            content = content.slice(0, insertPos) + "\nimport { notifications } from '@mantine/notifications';" + content.slice(insertPos);
        } else {
            content = "import { notifications } from '@mantine/notifications';\n" + content;
        }
    }

    // Replace alerts using regex
    // We want to match: alert("some string" + var) or alert(`some string`)
    // Because it might be split across lines or concatenated, let's use a simpler regex or replace them manually.
    
    let changed = false;
    
    // A regex to match alert(...) 
    // it will match alert( followed by anything up to the closing ) that is balanced. Node doesn't have recursive regex, 
    // but the alerts in this project are quite simple. Let's just use string replacement if possible or a greedy regex 
    // within the line, since all alerts are on a single line!
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes('alert(')) {
            // Find what is inside alert( ... )
            const alertMatch = line.match(/alert\((.*)\);/);
            if (alertMatch) {
                const inner = alertMatch[1];
                let color = 'red';
                if (inner.toLowerCase().includes('erfolgreich')) {
                     color = 'green';
                }
                const replacement = `notifications.show({ message: ${inner}, color: "${color}" });`;
                lines[i] = line.replace(/alert\((.*)\);/, replacement);
                changed = true;
            } else {
                // maybe without semicolon
                const alertMatchNoSemi = line.match(/alert\((.*)\)/);
                if (alertMatchNoSemi) {
                    const inner = alertMatchNoSemi[1];
                    let color = 'red';
                    if (inner.toLowerCase().includes('erfolgreich')) {
                         color = 'green';
                    }
                    const replacement = `notifications.show({ message: ${inner}, color: "${color}" })`;
                    lines[i] = line.replace(/alert\((.*)\)/, replacement);
                    changed = true;
                }
            }
        }
    }
    
    if (changed) {
        fs.writeFileSync(filepath, lines.join('\n'));
        console.log("Updated", filepath);
    }
});
