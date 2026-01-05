// migrate-lsdkkd.js
const fs = require('fs');
const path = require('path');

// Parse date from format like "6/3/08" or "29/9/2009" to "YYYY-MM-DD"
function parseDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return null;
  
  const trimmed = dateStr.trim();
  const parts = trimmed.split('/');
  
  if (parts.length !== 3) return null;
  
  let day = parseInt(parts[0]);
  let month = parseInt(parts[1]);
  let year = parseInt(parts[2]);
  
  // Handle 2-digit years (assume 2000s)
  if (year < 100) {
    year = 2000 + year;
  }
  
  // Validate
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Đọc và parse CompanyMGT.md phần Lịch sử đăng ký KD
function parseLSDKKD(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Tìm dòng header "Code	Lần	Thời gian	Chi tiết	Loại"
  let startIndex = -1;
  console.log(`Total lines: ${lines.length}`);
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    // Tìm dòng header có chứa "Code", "Lần", "Thời gian", "Chi tiết", "Loại"
    if (trimmedLine.includes('Code') && 
        trimmedLine.includes('Lần') && 
        trimmedLine.includes('Thời gian')) {
      // Kiểm tra thêm "Chi tiết" và "Loại" để chắc chắn
      if (trimmedLine.includes('Chi tiết') && trimmedLine.includes('Loại')) {
        startIndex = i;
        console.log(`Found header at line ${i + 1}: "${trimmedLine.substring(0, 100)}"`);
        break;
      }
    }
  }
  
  if (startIndex === -1) {
    // Debug: in ra các dòng có chứa "Code" và "Lần"
    console.log('Debug: Lines with "Code" and "Lần":');
    lines.forEach((line, idx) => {
      if (line.includes('Code') && line.includes('Lần')) {
        console.log(`${idx + 1}: "${line.trim().substring(0, 100)}"`);
      }
    });
    throw new Error('Không tìm thấy phần Lịch sử đăng ký KD');
  }
  
  // Lấy header
  const header = lines[startIndex].split('\t');
  
  // Lấy dữ liệu cho đến khi hết file
  const records = [];
  let idCounter = 1;
  
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Dừng nếu gặp dòng trống hoặc dòng không hợp lệ
    if (line === '') continue;
    if (line.startsWith('#')) break;
    
    const columns = line.split('\t');
    if (columns.length < 4) continue; // Skip invalid lines
    
    const record = {
      ID: idCounter++,
      Code: columns[0] || '',
      Lan: parseInt(columns[1]) || 0,
      ThoiGian: parseDate(columns[2]) || null,
      ThoiGianDisplay: columns[2] || '', // Giữ nguyên format gốc để hiển thị
      ChiTiet: columns[3] || '',
      Loai: columns[4] || ''
    };
    
    records.push(record);
  }
  
  return records;
}

// Main function
function migrate() {
  try {
    const inputFile = path.join(__dirname, 'CompanyMGT.md');
    const outputFile = path.join(__dirname, 'src', 'lsdkkd.json');
    
    console.log('Reading CompanyMGT.md Lịch sử đăng ký KD...');
    const records = parseLSDKKD(inputFile);
    console.log(`Found ${records.length} records`);
    
    console.log('Writing to lsdkkd.json...');
    fs.writeFileSync(outputFile, JSON.stringify(records, null, 2), 'utf-8');
    
    console.log('Migration completed!');
    console.log(`✓ Migrated ${records.length} records`);
    console.log(`✓ File saved as: src/lsdkkd.json`);
    
    // Preview first few records
    if (records.length > 0) {
      console.log('\nPreview of first 3 records:');
      records.slice(0, 3).forEach((record, idx) => {
        console.log(`${idx + 1}.`, JSON.stringify(record, null, 2));
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

