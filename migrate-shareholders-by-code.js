// migrate-shareholders-by-code.js
const fs = require('fs');
const path = require('path');

// Parse date từ format "1-Mar-21" sang "2021-03-01"
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0]);
  const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  const month = monthMap[parts[1]] || '01';
  let year = parseInt(parts[2]);
  
  // Convert 2-digit year to 4-digit
  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }
  
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
}

// Parse ownership rate (convert comma to dot)
function parseOwnership(ownershipStr) {
  if (!ownershipStr) return 0;
  // Replace comma with dot for decimal
  const cleaned = ownershipStr.toString().replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Đọc và parse CompanyMGT.md tab ShareHolders
function parseShareHolders(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Tìm dòng bắt đầu Tab SharedHolders
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (trimmedLine === 'Tab SharedHolders' || 
        trimmedLine.toLowerCase().includes('shareholders')) {
      startIndex = i;
      console.log(`Found tab at line ${i + 1}: "${trimmedLine}"`);
      break;
    }
  }
  
  if (startIndex === -1) {
    throw new Error('Không tìm thấy Tab SharedHolders');
  }
  
  // Lấy header (dòng tiếp theo)
  const header = lines[startIndex + 1].split('\t');
  
  // Lấy dữ liệu cho đến khi gặp tab khác hoặc hết file
  const shareholders = [];
  let idCounter = 1;
  
  for (let i = startIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Dừng nếu gặp tab khác hoặc dòng rỗng
    if (line.startsWith('Tab') || line === '') break;
    
    const columns = line.split('\t');
    if (columns.length < 8) {
      console.warn(`Skipping invalid line ${i + 1}: ${line}`);
      continue; // Skip invalid lines
    }
    
    const shareholder = {
      ID: idCounter++,
      Code: columns[0] || '', // Code
      PersonaOrg: columns[1] || '', // Cổ Đông
      MSTCCCDHC: columns[2] || '', // MST/CCCD/HC
      LoaiCD: columns[3] || '', // Loại CD (Cá nhân/Tổ chức)
      Ownership: parseOwnership(columns[4]), // Tỷ lệ sở hữu (%)
      From: parseDate(columns[5]) || null, // Ngày bắt đầu
      To: parseDate(columns[6]) || null, // Ngày kết thúc
      TrangThai: columns[7] || 'Active' // Trạng thái
    };
    
    shareholders.push(shareholder);
  }
  
  return shareholders;
}

// Main function
function migrate() {
  try {
    const inputFile = path.join(__dirname, 'CompanyMGT.md');
    const outputFile = path.join(__dirname, 'src', 'ShareHolders.json');
    
    console.log('Reading CompanyMGT.md Tab SharedHolders...');
    const shareholders = parseShareHolders(inputFile);
    console.log(`Found ${shareholders.length} shareholders`);
    
    console.log('Writing to ShareHolders.json...');
    fs.writeFileSync(outputFile, JSON.stringify(shareholders, null, 2), 'utf-8');
    
    console.log('Migration completed!');
    console.log(`✓ Migrated ${shareholders.length} shareholders`);
    console.log(`✓ File saved as: src/ShareHolders.json`);
    console.log(`✓ Using Code instead of CompanyID for lookup`);
    
    // Preview first few shareholders
    if (shareholders.length > 0) {
      console.log('\nPreview of first 3 shareholders:');
      shareholders.slice(0, 3).forEach((sh, idx) => {
        console.log(`${idx + 1}.`, JSON.stringify(sh, null, 2));
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

