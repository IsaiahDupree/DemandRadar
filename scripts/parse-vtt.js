const fs = require('fs');
const path = require('path');

const vttDir = path.join(__dirname, '../docs/hookd-videos');
const files = fs.readdirSync(vttDir).filter(f => f.endsWith('.vtt'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(vttDir, file), 'utf8');
  
  // Extract clean text from VTT
  const lines = content.split('\n');
  const textLines = [];
  let lastLine = '';
  
  lines.forEach(line => {
    // Skip metadata and timestamps
    if (line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:')) return;
    if (/^\d{2}:\d{2}/.test(line)) return;
    if (line.trim() === '') return;
    
    // Remove VTT formatting tags
    let cleanLine = line.replace(/<[^>]+>/g, '').trim();
    
    // Skip if same as last line (duplicates from VTT format)
    if (cleanLine && cleanLine !== lastLine) {
      textLines.push(cleanLine);
      lastLine = cleanLine;
    }
  });
  
  // Remove remaining duplicates and join
  const uniqueLines = [...new Set(textLines)];
  const transcript = uniqueLines.join(' ').replace(/\s+/g, ' ');
  
  // Save as text file
  const outFile = file.replace('.vtt', '.txt');
  fs.writeFileSync(path.join(vttDir, outFile), transcript);
  console.log(`Saved: ${outFile} (${transcript.length} chars)`);
});
