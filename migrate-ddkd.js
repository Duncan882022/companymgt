// migrate-ddkd.js
const fs = require('fs');
const path = require('path');

// Đọc và parse CompanyMGT.md phần Địa Điểm kinh doanh
function parseDDKD(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Tìm dòng header "Code	Đơn vị chủ quản	Tên ĐKKD	Mã số đăng ký	Địa chỉ	Người đứng đầu	Vị trí	Loại	Tình trạng"
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    // Tìm dòng header có chứa "Code", "Đơn vị chủ quản", "Tên ĐKKD"
    if (trimmedLine.includes('Code') && 
        trimmedLine.includes('Đơn vị chủ quản') && 
        trimmedLine.includes('Tên ĐKKD')) {
      startIndex = i;
      console.log(`Found header at line ${i + 1}: "${trimmedLine.substring(0, 100)}"`);
      break;
    }
  }
  
  if (startIndex === -1) {
    throw new Error('Không tìm thấy phần Địa Điểm kinh doanh');
  }
  
  // Lấy header
  const header = lines[startIndex].split('\t');
  console.log('Header:', header);
  
  // Lấy dữ liệu cho đến khi hết file
  const records = [];
  let idCounter = 1;
  
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Dừng nếu gặp dòng trống hoặc dòng không hợp lệ
    if (line === '') continue;
    if (line.startsWith('#')) break;
    
    const columns = line.split('\t');
    if (columns.length < 8) continue; // Skip invalid lines
    
    const record = {
      ID: idCounter++,
      Code: columns[0] || '',
      DonViChuQuan: columns[1] || '',
      TenDDKD: columns[2] || '',
      MaSoDangKy: columns[3] || '',
      DiaChi: columns[4] || '',
      NguoiDungDau: columns[5] || '',
      ViTri: columns[6] || '',
      Loai: columns[7] || '',
      TinhTrang: columns[8] || ''
    };
    
    records.push(record);
  }
  
  return records;
}

// Main function
function migrate() {
  try {
    const inputFile = path.join(__dirname, 'CompanyMGT.md');
    const outputFile = path.join(__dirname, 'src', 'DDKD.json');
    
    console.log('Reading CompanyMGT.md Địa Điểm kinh doanh...');
    const records = parseDDKD(inputFile);
    console.log(`Found ${records.length} records`);
    
    console.log('Writing to DDKD.json...');
    fs.writeFileSync(outputFile, JSON.stringify(records, null, 2), 'utf-8');
    
    console.log('Migration completed!');
    console.log(`✓ Migrated ${records.length} records`);
    console.log(`✓ File saved as: src/DDKD.json`);
    
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

