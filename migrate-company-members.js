// migrate-company-members.js
const fs = require('fs');
const path = require('path');

// Đọc và parse CompanyMGT.md tab CompanyMembers
function parseCompanyMembers(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Tìm dòng bắt đầu TabCompanyMembers
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    // Tìm dòng chứa "CompanyMembers" hoặc "TabCompanyMembers"
    if (trimmedLine === 'TabCompanyMembers' || 
        trimmedLine.toLowerCase().includes('companymembers') ||
        (trimmedLine.startsWith('Tab') && trimmedLine.toLowerCase().includes('member'))) {
      startIndex = i;
      console.log(`Found tab at line ${i + 1}: "${trimmedLine}"`);
      break;
    }
  }
  
  if (startIndex === -1) {
    // Debug: in ra một số dòng để kiểm tra
    console.log('Debug: First 20 lines:');
    lines.slice(0, 20).forEach((line, idx) => {
      console.log(`${idx + 1}: "${line.trim()}"`);
    });
    throw new Error('Không tìm thấy TabCompanyMembers');
  }
  
  // Lấy header (dòng tiếp theo)
  const header = lines[startIndex + 1].split('\t');
  
  // Lấy dữ liệu cho đến khi gặp tab khác hoặc hết file
  const members = [];
  let idCounter = 1;
  
  for (let i = startIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Dừng nếu gặp tab khác
    if (line.startsWith('Tab')) break;
    if (line === '') continue;
    
    const columns = line.split('\t');
    if (columns.length < 3) continue; // Skip invalid lines
    
    const member = {
      ID: idCounter++,
      Code: columns[0] || '',
      Name: columns[1] || '',
      ChucVu: columns[2] || '',
      CCCD: columns[3] || ''
    };
    
    members.push(member);
  }
  
  return members;
}

// Main function
function migrate() {
  try {
    const inputFile = path.join(__dirname, 'CompanyMGT.md');
    const outputFile = path.join(__dirname, 'src', 'CompanyMembers.json');
    
    console.log('Reading CompanyMGT.md TabCompanyMembers...');
    const members = parseCompanyMembers(inputFile);
    console.log(`Found ${members.length} company members`);
    
    console.log('Writing to CompanyMembers.json...');
    fs.writeFileSync(outputFile, JSON.stringify(members, null, 2), 'utf-8');
    
    console.log('Migration completed!');
    console.log(`✓ Migrated ${members.length} company members`);
    console.log(`✓ File saved as: src/CompanyMembers.json`);
    
    // Preview first few members
    if (members.length > 0) {
      console.log('\nPreview of first 3 members:');
      members.slice(0, 3).forEach((member, idx) => {
        console.log(`${idx + 1}.`, JSON.stringify(member, null, 2));
      });
    }
  } catch (error) {
    console.error('Error during migration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrate();

