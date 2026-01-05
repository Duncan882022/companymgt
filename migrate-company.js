// migrate-company.js
const fs = require('fs');
const path = require('path');

// Parse date từ format "11-Feb-96" sang "1996-02-11"
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

// Đọc và parse CompanyMGT.md
function parseCompanyMGT(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Tìm dòng bắt đầu Tab Company
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'Tab Company') {
      startIndex = i;
      break;
    }
  }
  
  if (startIndex === -1) {
    throw new Error('Không tìm thấy Tab Company');
  }
  
  // Lấy header (dòng tiếp theo)
  const header = lines[startIndex + 1].split('\t');
  
  // Lấy dữ liệu cho đến khi gặp tab khác hoặc hết file
  const companies = [];
  for (let i = startIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Dừng nếu gặp tab khác
    if (line.startsWith('Tab')) break;
    if (line === '') continue;
    
    const columns = line.split('\t');
    if (columns.length < 3) continue; // Skip invalid lines
    
    const company = {
      ID: parseInt(columns[0]) || 0,
      ParentID: parseInt(columns[1]) || 0,
      Name: columns[2] || '',
      Code: columns[3] || '',
      MST: columns[4] || '',
      LoaiHinh: columns[5] || '',
      VonDieuLe: columns[6] ? parseInt(columns[6].replace(/,/g, '')) : 0,
      TinhTrangNiemYet: columns[7] || '',
      NguoiDaiDienInside: columns[8] || '',
      NguoiDaiDienOutside: columns[9] || '',
      NgayThanhLap: parseDate(columns[10]) || null,
      DKKD: parseDate(columns[11]) || null,
      TrangThai: columns[12] || '',
      NganhNgheKinhDoanh: columns[13] || ''
    };
    
    companies.push(company);
  }
  
  return companies;
}

// Main function
function migrate() {
  try {
    const inputFile = path.join(__dirname, 'CompanyMGT.md');
    const outputFile = path.join(__dirname, 'src', 'vicownership.json');
    const newFileName = path.join(__dirname, 'src', 'Company.json');
    
    console.log('Reading CompanyMGT.md...');
    const companies = parseCompanyMGT(inputFile);
    console.log(`Found ${companies.length} companies`);
    
    console.log('Writing to vicownership.json...');
    fs.writeFileSync(outputFile, JSON.stringify(companies, null, 2), 'utf-8');
    
    console.log('Renaming vicownership.json to Company.json...');
    fs.renameSync(outputFile, newFileName);
    
    console.log('Migration completed!');
    console.log(`✓ Migrated ${companies.length} companies`);
    console.log(`✓ File saved as: src/Company.json`);
    
    // Preview first company
    if (companies.length > 0) {
      console.log('\nPreview of first company:');
      console.log(JSON.stringify(companies[0], null, 2));
    }
  } catch (error) {
    console.error('Error during migration:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrate();


