import React, { useState, useMemo, useEffect, useRef } from 'react';
import './App.css';
import companiesData from './Company.json';
import shareholdersData from './ShareHolders.json';
import CompanyDetail from './components/CompanyDetail';

function App() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  // Theo IFRS 10 & IAS 28: Control >50%, Significant Influence 20-50%
  // Đặt mặc định 15% để hiển thị tất cả trường hợp
  const [indirectOwnershipThreshold, setIndirectOwnershipThreshold] = useState(15);

  // Available search criteria definitions
  const availableCriteria = [
    { id: 'name', label: 'Name', type: 'text', placeholder: 'Tìm theo tên công ty...' },
    { id: 'code', label: 'Mã', type: 'text', placeholder: 'Tìm theo mã...' },
    { id: 'vonDieuLe', label: 'Vốn điều lệ', type: 'range', fromField: 'vonDieuLeFrom', toField: 'vonDieuLeTo' },
    { id: 'namThanhLap', label: 'Năm thành lập', type: 'range', fromField: 'namThanhLapFrom', toField: 'namThanhLapTo' },
    { id: 'dkkd', label: 'ĐKKD', type: 'range', fromField: 'dkkdFrom', toField: 'dkkdTo' },
    { id: 'loaiHinh', label: 'Loại hình', type: 'select' },
    { id: 'nguoiDaiDien', label: 'Người đại diện pháp luật', type: 'text', placeholder: 'Tìm theo tên người đại diện...' },
    { id: 'tinhTrangNiemYet', label: 'Tình trạng niêm yết', type: 'select' },
    { id: 'trangThai', label: 'Trạng thái', type: 'select' },
    { id: 'nganhNghe', label: 'Ngành nghề kinh doanh', type: 'text', placeholder: 'Tìm theo ngành nghề...' },
    { id: 'congTyMe', label: 'Công ty mẹ', type: 'text', placeholder: 'Tìm theo công ty mẹ...' },
    { id: 'congTyCon', label: 'Công ty con', type: 'text', placeholder: 'Tìm theo công ty con...' }
  ];

  // Active criteria (criteria that are currently displayed)
  const [activeCriteria, setActiveCriteria] = useState([]);
  
  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Search/Filter states
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    code: '',
    vonDieuLeFrom: '',
    vonDieuLeTo: '',
    namThanhLapFrom: '',
    namThanhLapTo: '',
    dkkdFrom: '',
    dkkdTo: '',
    loaiHinh: '',
    nguoiDaiDien: '',
    tinhTrangNiemYet: '',
    trangThai: '',
    nganhNghe: '',
    congTyMe: '',
    congTyCon: ''
  });

  // Helper: Get ownership rate from ShareHolders data (using Code for lookup)
  const getOwnershipRate = (parentCompanyId, childCompanyId) => {
    try {
      const parentCompany = companiesData.find(c => c.ID === parentCompanyId);
      const childCompany = companiesData.find(c => c.ID === childCompanyId);
      if (!parentCompany || !childCompany) return 0;
      
      // Lookup by Code instead of CompanyID
      const shareholder = shareholdersData.find(sh => 
        sh && sh.Code === childCompany.Code && 
        (sh.PersonaOrg === parentCompany.Name || sh.PersonaOrg === parentCompany.Code)
      );
      return shareholder ? shareholder.Ownership : 0;
    } catch (error) {
      return 0;
    }
  };

  // Helper: Get all parent companies (direct + indirect) with ownership >= 50%
  const getAllParentCompanies = (companyId) => {
    if (!companyId) return [];
    
    const company = companiesData.find(c => c.ID === companyId);
    if (!company) return [];
    
    const parentCompanies = new Map(); // Map<companyId, { company, totalOwnership }>
    const queue = [];
    
    // Helper: Find parent companies that own this company
    const getParentCompanies = (child) => {
      const parents = [];
      
      // Method 1: Find by ParentID
      if (child.ParentID && child.ParentID !== 0) {
        const parent = companiesData.find(c => 
          c && c.ID === child.ParentID && c.TrangThai === 'Đang hoạt động'
        );
        if (parent) {
          const ownership = getOwnershipRate(parent.ID, child.ID);
          if (ownership >= 50) {
            parents.push({ company: parent, ownership });
          }
        }
      }
      
      // Method 2: Find by ShareHolders (companies that own this company via ShareHolders)
      const shareholders = shareholdersData.filter(sh => 
        sh && sh.Code === child.Code && sh.Ownership >= 50
      );
      
      shareholders.forEach(sh => {
        const parent = companiesData.find(c => 
          c && (c.Name === sh.PersonaOrg || c.Code === sh.PersonaOrg) && 
          c.TrangThai === 'Đang hoạt động' && c.ID !== child.ID
        );
        if (parent) {
          const alreadyAdded = parents.some(p => p.company.ID === parent.ID);
          if (!alreadyAdded) {
            parents.push({ company: parent, ownership: sh.Ownership });
          }
        }
      });
      
      return parents;
    };
    
    // Start with direct parents
    const directParents = getParentCompanies(company);
    directParents.forEach(({ company: parent, ownership }) => {
      if (ownership >= 50) {
        parentCompanies.set(parent.ID, { company: parent, totalOwnership: ownership });
        queue.push({ 
          company: parent, 
          pathOwnership: ownership / 100,
          pathIds: [company.ID, parent.ID]
        });
      }
    });
    
    // BFS to find all indirect parent companies and calculate total ownership
    while (queue.length > 0) {
      const current = queue.shift();
      const parents = getParentCompanies(current.company);
      
      parents.forEach(({ company: parent, ownership }) => {
        // Check for circular reference (avoid infinite loops)
        if (current.pathIds && current.pathIds.includes(parent.ID)) {
          return; // Skip this path if it creates a cycle
        }
        
        const parentOwnershipRate = ownership / 100;
        const newOwnership = current.pathOwnership * parentOwnershipRate * 100;
        
        // Update total ownership (sum all paths)
        if (parentCompanies.has(parent.ID)) {
          parentCompanies.get(parent.ID).totalOwnership += newOwnership;
        } else {
          parentCompanies.set(parent.ID, { company: parent, totalOwnership: newOwnership });
        }
        
        // Only continue BFS if ownership is meaningful (>= 1%)
        if (newOwnership >= 1) {
          const newPathIds = current.pathIds ? [...current.pathIds, parent.ID] : [current.company.ID, parent.ID];
          queue.push({ 
            company: parent, 
            pathOwnership: current.pathOwnership * parentOwnershipRate,
            pathIds: newPathIds
          });
        }
      });
    }
    
    // Filter: only return parent companies with total ownership >= 50%
    return Array.from(parentCompanies.values())
      .filter(item => item.totalOwnership >= 50)
      .map(item => item.company);
  };

  // Helper: Get all subsidiaries (direct + indirect) with ownership >= 50%
  const getAllSubsidiaries = (companyId) => {
    if (!companyId) return [];
    
    const company = companiesData.find(c => c.ID === companyId);
    if (!company) return [];
    
    const subsidiaries = new Map(); // Map<companyId, { company, totalOwnership }>
    const queue = [];
    
    // Helper: Find companies owned by a parent company
    const getOwnedCompanies = (parent) => {
      const ownedCompanies = [];
      
      // Method 1: Find by ParentID (direct children)
      const directChildren = companiesData.filter(c => 
        c && c.ParentID === parent.ID && c.ParentID !== 0 && c.TrangThai === 'Đang hoạt động'
      );
      directChildren.forEach(child => {
        const ownership = getOwnershipRate(parent.ID, child.ID);
        if (ownership > 0) {
          ownedCompanies.push({ company: child, ownership });
        }
      });
      
      // Method 2: Find by ShareHolders lookup
      const shareholders = shareholdersData.filter(sh => 
        sh && (sh.PersonaOrg === parent.Name || sh.PersonaOrg === parent.Code)
      );
      
      shareholders.forEach(sh => {
        const ownedCompany = companiesData.find(c => 
          c && c.Code === sh.Code && c.TrangThai === 'Đang hoạt động'
        );
        if (ownedCompany && ownedCompany.ID !== parent.ID) {
          const alreadyAdded = ownedCompanies.some(oc => oc.company.ID === ownedCompany.ID);
          if (!alreadyAdded && sh.Ownership > 0) {
            ownedCompanies.push({ company: ownedCompany, ownership: sh.Ownership });
          }
        }
      });
      
      return ownedCompanies;
    };
    
    // Start with direct ownership - include ALL companies (not just >= 50%)
    // We need to explore all paths to calculate total indirect ownership correctly
    const directOwned = getOwnedCompanies(company);
    directOwned.forEach(({ company: child, ownership }) => {
      // Add to subsidiaries map (will filter >= 50% at the end)
      if (subsidiaries.has(child.ID)) {
        subsidiaries.get(child.ID).totalOwnership += ownership;
      } else {
        subsidiaries.set(child.ID, { company: child, totalOwnership: ownership });
      }
      
      // Add to queue to explore further (even if ownership < 50%)
      // This ensures we can find indirect subsidiaries through paths with < 50% ownership
      if (ownership > 0) {
        queue.push({ 
          company: child, 
          pathOwnership: ownership / 100,
          pathIds: [company.ID, child.ID]
        });
      }
    });
    
    // BFS to find all indirect subsidiaries and calculate total equity interest
    while (queue.length > 0) {
      const current = queue.shift();
      const ownedCompanies = getOwnedCompanies(current.company);
      
      ownedCompanies.forEach(({ company: child, ownership }) => {
        // Check for circular reference (avoid infinite loops)
        if (current.pathIds && current.pathIds.includes(child.ID)) {
          return; // Skip this path if it creates a cycle
        }
        
        const childOwnershipRate = ownership / 100;
        const newOwnership = current.pathOwnership * childOwnershipRate * 100;
        
        // Update total ownership (sum all paths)
        if (subsidiaries.has(child.ID)) {
          subsidiaries.get(child.ID).totalOwnership += newOwnership;
        } else {
          subsidiaries.set(child.ID, { company: child, totalOwnership: newOwnership });
        }
        
        // Only continue BFS if ownership is meaningful (>= 1%)
        if (newOwnership >= 1) {
          const newPathIds = current.pathIds ? [...current.pathIds, child.ID] : [current.company.ID, child.ID];
          queue.push({ 
            company: child, 
            pathOwnership: current.pathOwnership * childOwnershipRate,
            pathIds: newPathIds
          });
        }
      });
    }
    
    // Filter: only return subsidiaries with total ownership >= 50%
    // But also include companies that are reached through any path (even if total < 50%)
    // if they are owned by a direct subsidiary with >= 50% ownership
    const result = Array.from(subsidiaries.values())
      .filter(item => item.totalOwnership >= 50)
      .map(item => item.company);
    
    // Also include indirect subsidiaries that are owned by direct subsidiaries (>= 50%)
    // even if the total indirect ownership < 50%
    const directSubsidiaryIds = new Set(
      Array.from(subsidiaries.values())
        .filter(item => item.totalOwnership >= 50)
        .map(item => item.company.ID)
    );
    
    // Find all companies owned by direct subsidiaries (even if < 50%)
    directSubsidiaryIds.forEach(directSubId => {
      const directSub = companiesData.find(c => c.ID === directSubId);
      if (directSub) {
        const ownedByDirectSub = getOwnedCompanies(directSub);
        ownedByDirectSub.forEach(({ company: child, ownership }) => {
          // Only add if not already in result and ownership > 0
          if (ownership > 0 && !result.some(r => r.ID === child.ID)) {
            result.push(child);
          }
        });
      }
    });
    
    return result;
  };

  // Get unique companies (distinct by name) and sort alphabetically
  const uniqueCompanies = useMemo(() => {
    const companyMap = new Map();
    
    companiesData.forEach(company => {
      if (!companyMap.has(company.Name)) {
        companyMap.set(company.Name, company);
      }
    });
    
    return Array.from(companyMap.values()).sort((a, b) => a.Name.localeCompare(b.Name));
  }, []);

  // Filter companies based on search criteria
  const filteredCompanies = useMemo(() => {
    // If searching by "Công ty mẹ", first find all parent companies matching the search term
    // Then get all their subsidiaries (direct + indirect)
    let companiesToFilter = uniqueCompanies;
    
    if (searchFilters.congTyMe) {
      const searchTerm = searchFilters.congTyMe.toLowerCase();
      // Find all parent companies matching the search term
      const matchingParents = companiesData.filter(c => 
        c && c.TrangThai === 'Đang hoạt động' && 
        c.Name.toLowerCase().includes(searchTerm)
      );
      
      // Get all subsidiaries (direct + indirect) of matching parent companies
      const allSubsidiaryIds = new Set();
      matchingParents.forEach(parent => {
        const subsidiaries = getAllSubsidiaries(parent.ID);
        subsidiaries.forEach(subsidiary => {
          allSubsidiaryIds.add(subsidiary.ID);
        });
      });
      
      // Filter to only show companies that are subsidiaries of matching parents
      companiesToFilter = uniqueCompanies.filter(company => 
        allSubsidiaryIds.has(company.ID)
      );
    }
    
    return companiesToFilter.filter(company => {
      // Name filter
      if (searchFilters.name && !company.Name.toLowerCase().includes(searchFilters.name.toLowerCase())) {
        return false;
      }
      
      // Code filter
      if (searchFilters.code && !company.Code.toLowerCase().includes(searchFilters.code.toLowerCase())) {
        return false;
      }
      
      // Vốn điều lệ range
      const vonDieuLeFrom = searchFilters.vonDieuLeFrom?.trim();
      const vonDieuLeTo = searchFilters.vonDieuLeTo?.trim();
      
      if (vonDieuLeFrom || vonDieuLeTo) {
        const companyVonDieuLe = company.VonDieuLe != null ? Number(company.VonDieuLe) : null;
        
        // Nếu công ty không có vốn điều lệ và có filter, loại bỏ
        if (companyVonDieuLe === null) {
          return false;
        }
        
        if (vonDieuLeFrom) {
          const fromValue = Number(vonDieuLeFrom);
          if (!isNaN(fromValue) && companyVonDieuLe < fromValue) {
            return false;
          }
        }
        
        if (vonDieuLeTo) {
          const toValue = Number(vonDieuLeTo);
          if (!isNaN(toValue) && companyVonDieuLe > toValue) {
            return false;
          }
        }
      }
      
      // Năm thành lập range
      if (company.NgayThanhLap) {
        const year = new Date(company.NgayThanhLap).getFullYear();
        if (searchFilters.namThanhLapFrom && year < Number(searchFilters.namThanhLapFrom)) {
          return false;
        }
        if (searchFilters.namThanhLapTo && year > Number(searchFilters.namThanhLapTo)) {
          return false;
        }
      }
      
      // ĐKKD range
      if (company.DKKD) {
        const dkkdYear = new Date(company.DKKD).getFullYear();
        if (searchFilters.dkkdFrom && dkkdYear < Number(searchFilters.dkkdFrom)) {
          return false;
        }
        if (searchFilters.dkkdTo && dkkdYear > Number(searchFilters.dkkdTo)) {
          return false;
        }
      }
      
      // Loại hình
      if (searchFilters.loaiHinh && company.LoaiHinh !== searchFilters.loaiHinh) {
        return false;
      }
      
      // Người đại diện pháp luật
      const daiDien = `${company.NguoiDaiDienInside || ''} ${company.NguoiDaiDienOutside || ''}`.trim();
      if (searchFilters.nguoiDaiDien && !daiDien.toLowerCase().includes(searchFilters.nguoiDaiDien.toLowerCase())) {
        return false;
      }
      
      // Tình trạng niêm yết
      if (searchFilters.tinhTrangNiemYet && company.TinhTrangNiemYet !== searchFilters.tinhTrangNiemYet) {
        return false;
      }
      
      // Trạng thái
      if (searchFilters.trangThai && company.TrangThai !== searchFilters.trangThai) {
        return false;
      }
      
      // Ngành nghề kinh doanh
      if (searchFilters.nganhNghe && !company.NganhNgheKinhDoanh?.toLowerCase().includes(searchFilters.nganhNghe.toLowerCase())) {
        return false;
      }
      
      // Công ty mẹ filter is handled above, skip here
      
      // Công ty con (tìm công ty con trực tiếp và gián tiếp của công ty này)
      if (searchFilters.congTyCon) {
        const allSubsidiaries = getAllSubsidiaries(company.ID);
        const hasSubsidiary = allSubsidiaries.some(subsidiary => 
          subsidiary.Name.toLowerCase().includes(searchFilters.congTyCon.toLowerCase())
        );
        if (!hasSubsidiary) {
          return false;
        }
      }
      
      return true;
    });
  }, [uniqueCompanies, searchFilters]);

  // Get unique values for combo boxes
  const uniqueLoaiHinh = useMemo(() => {
    const loaiHinhSet = new Set();
    companiesData.forEach(c => {
      if (c.LoaiHinh) loaiHinhSet.add(c.LoaiHinh);
    });
    return Array.from(loaiHinhSet).sort();
  }, []);

  const uniqueTinhTrangNiemYet = useMemo(() => {
    const tinhTrangSet = new Set();
    companiesData.forEach(c => {
      if (c.TinhTrangNiemYet) tinhTrangSet.add(c.TinhTrangNiemYet);
    });
    return Array.from(tinhTrangSet).sort();
  }, []);

  const uniqueTrangThai = useMemo(() => {
    const trangThaiSet = new Set();
    companiesData.forEach(c => {
      if (c.TrangThai) trangThaiSet.add(c.TrangThai);
    });
    return Array.from(trangThaiSet).sort();
  }, []);

  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCriteria = (criteriaId) => {
    if (!activeCriteria.includes(criteriaId)) {
      setActiveCriteria(prev => [...prev, criteriaId]);
    }
    setShowDropdown(false); // Close dropdown after adding
  };

  const removeCriteria = (criteriaId) => {
    setActiveCriteria(prev => prev.filter(id => id !== criteriaId));
    // Clear filter values when removing criteria
    const criteria = availableCriteria.find(c => c.id === criteriaId);
    if (criteria) {
      if (criteria.type === 'range') {
        setSearchFilters(prev => ({
          ...prev,
          [criteria.fromField]: '',
          [criteria.toField]: ''
        }));
      } else {
        setSearchFilters(prev => ({
          ...prev,
          [criteriaId]: ''
        }));
      }
    }
  };

  // Get available criteria that can be added (not already active)
  const availableToAdd = availableCriteria.filter(c => !activeCriteria.includes(c.id));

  // Count total number of subsidiaries across all instances of a company name
  const getSubsidiaryCount = (companyName) => {
    // Get all IDs of companies with this name
    const companyIds = companiesData
      .filter(c => c.Name === companyName)
      .map(c => c.ID);
    
    // Count all children of any of these IDs (using ParentID instead of Parents array)
    return companiesData.filter(c => c.ParentID && companyIds.includes(c.ParentID)).length;
  };

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format currency to Vietnamese format
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Hệ Thống Quản Lý Sở Hữu Công Ty</h1>
          <p>Company Ownership Management System</p>
          <div className="config-section" style={{ display: 'none' }}>
            <label htmlFor="threshold">Ngưỡng Ảnh Hưởng Đáng Kể (IAS 28):</label>
            <input
              id="threshold"
              type="number"
              min="0"
              max="100"
              value={indirectOwnershipThreshold}
              onChange={(e) => setIndirectOwnershipThreshold(Number(e.target.value))}
            />
            <span style={{ fontSize: '12px', marginLeft: '10px' }}>
              (Mặc định: 15% để hiển thị tất cả trường hợp)
            </span>
          </div>
          
          <div className="search-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
              <h3>🔍 Tìm Kiếm & Lọc</h3>
              {availableToAdd.length > 0 && (
                <div className="add-criteria-dropdown" ref={dropdownRef}>
                  <button 
                    className="add-criteria-btn"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <span>➕</span> Thêm tiêu chí
                  </button>
                  {showDropdown && (
                    <div className="dropdown-menu">
                      {availableToAdd.map(criteria => (
                        <div
                          key={criteria.id}
                          className="dropdown-item"
                          onClick={() => addCriteria(criteria.id)}
                        >
                          {criteria.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {activeCriteria.length === 0 ? (
              <div className="no-criteria-message">
                <p>Chưa có tiêu chí tìm kiếm nào. Nhấn "Thêm tiêu chí" để bắt đầu.</p>
              </div>
            ) : (
              <div className="search-grid">
                {activeCriteria.map(criteriaId => {
                  const criteria = availableCriteria.find(c => c.id === criteriaId);
                  if (!criteria) return null;

                  return (
                    <div key={criteriaId} className="search-field">
                      <div className="search-field-header">
                        <label>{criteria.label}</label>
                        <button
                          className="remove-criteria-btn"
                          onClick={() => removeCriteria(criteriaId)}
                          title="Xóa tiêu chí"
                        >
                          ×
                        </button>
                      </div>
                      
                      {criteria.type === 'text' && (
                        <input
                          type="text"
                          placeholder={criteria.placeholder}
                          value={searchFilters[criteriaId] || ''}
                          onChange={(e) => handleFilterChange(criteriaId, e.target.value)}
                        />
                      )}
                      
                      {criteria.type === 'range' && (
                        <div className="range-inputs">
                          <input
                            type="number"
                            placeholder="Từ"
                            value={searchFilters[criteria.fromField] || ''}
                            onChange={(e) => handleFilterChange(criteria.fromField, e.target.value)}
                          />
                          <span>-</span>
                          <input
                            type="number"
                            placeholder="Đến"
                            value={searchFilters[criteria.toField] || ''}
                            onChange={(e) => handleFilterChange(criteria.toField, e.target.value)}
                          />
                        </div>
                      )}
                      
                      {criteria.type === 'select' && criteriaId === 'loaiHinh' && (
                        <select
                          value={searchFilters.loaiHinh || ''}
                          onChange={(e) => handleFilterChange('loaiHinh', e.target.value)}
                        >
                          <option value="">Tất cả</option>
                          {uniqueLoaiHinh.map(loai => (
                            <option key={loai} value={loai}>{loai}</option>
                          ))}
                        </select>
                      )}
                      
                      {criteria.type === 'select' && criteriaId === 'tinhTrangNiemYet' && (
                        <select
                          value={searchFilters.tinhTrangNiemYet || ''}
                          onChange={(e) => handleFilterChange('tinhTrangNiemYet', e.target.value)}
                        >
                          <option value="">Tất cả</option>
                          {uniqueTinhTrangNiemYet.map(tinhTrang => (
                            <option key={tinhTrang} value={tinhTrang}>{tinhTrang}</option>
                          ))}
                        </select>
                      )}
                      
                      {criteria.type === 'select' && criteriaId === 'trangThai' && (
                        <select
                          value={searchFilters.trangThai || ''}
                          onChange={(e) => handleFilterChange('trangThai', e.target.value)}
                        >
                          <option value="">Tất cả</option>
                          {uniqueTrangThai.map(trangThai => (
                            <option key={trangThai} value={trangThai}>{trangThai}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {activeCriteria.length > 0 && (
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setActiveCriteria([]);
                  setSearchFilters({
                    name: '',
                    code: '',
                    vonDieuLeFrom: '',
                    vonDieuLeTo: '',
                    namThanhLapFrom: '',
                    namThanhLapTo: '',
                    dkkdFrom: '',
                    dkkdTo: '',
                    loaiHinh: '',
                    nguoiDaiDien: '',
                    tinhTrangNiemYet: '',
                    trangThai: '',
                    nganhNghe: '',
                    congTyMe: '',
                    congTyCon: ''
                  });
                }}
              >
                <span>🗑️</span> Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        </div>
        
        <div className="content">
          <div className="company-list-fullwidth">
            <h2>
              Danh Sách Công Ty 
              <span className="total-count">({filteredCompanies.length}/{uniqueCompanies.length})</span>
            </h2>
            <div className="table-container">
              <table className="company-table">
                <thead>
                  <tr>
                    <th>Tên công ty</th>
                    <th>Mã</th>
                    <th>MST</th>
                    <th>Loại hình</th>
                    <th>Vốn điều lệ</th>
                    <th>Tình trạng niêm yết</th>
                    <th>Người đại diện trong</th>
                    <th>Người đại diện ngoài</th>
                    <th>Ngày thành lập</th>
                    <th>ĐKKD</th>
                    <th>Trạng thái</th>
                    <th>Ngành nghề kinh doanh</th>
                    <th>Công ty mẹ</th>
                    <th>Số công ty con</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map(company => {
              const subsidiaryCount = getSubsidiaryCount(company.Name);
                    const parentCompany = company.ParentID ? companiesData.find(c => c.ID === company.ParentID) : null;
              return (
                      <tr
                  key={company.ID}
                        className={`company-row ${selectedCompany?.Name === company.Name ? 'active' : ''}`}
                  onClick={() => setSelectedCompany(company)}
                >
                        <td className="company-name-cell">
                  <span className="company-name">{company.Name}</span>
                        </td>
                        <td>{company.Code || 'N/A'}</td>
                        <td>{company.MST || 'N/A'}</td>
                        <td>{company.LoaiHinh || 'N/A'}</td>
                        <td>{formatCurrency(company.VonDieuLe)}</td>
                        <td>{company.TinhTrangNiemYet || 'N/A'}</td>
                        <td>{company.NguoiDaiDienInside || 'N/A'}</td>
                        <td>{company.NguoiDaiDienOutside || 'N/A'}</td>
                        <td>{formatDate(company.NgayThanhLap)}</td>
                        <td>{formatDate(company.DKKD)}</td>
                        <td>{company.TrangThai || 'N/A'}</td>
                        <td>{company.NganhNgheKinhDoanh || 'N/A'}</td>
                        <td>{parentCompany ? parentCompany.Name : 'N/A'}</td>
                        <td>
                  {subsidiaryCount > 0 && (
                    <span className="subsidiary-count">{subsidiaryCount}</span>
                  )}
                        </td>
                      </tr>
              );
            })}
                </tbody>
              </table>
            </div>
          </div>
          
          {selectedCompany && (
            <div className="company-detail-fullwidth">
              <CompanyDetail
                company={selectedCompany}
                allCompanies={companiesData}
                threshold={indirectOwnershipThreshold}
              />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default App;

