import React, { useState, useMemo, useEffect } from 'react';
import shareholdersData from '../ShareHolders.json';
import companyMembersData from '../CompanyMembers.json';
import lsdkkdData from '../lsdkkd.json';
import ddkdData from '../DDKD.json';
import relatedPersonsDataOriginal from '../RelatedPersons.json';

// Load RelatedPersons from localStorage if available, otherwise use original data
const getRelatedPersonsData = () => {
  try {
    const stored = localStorage.getItem('relatedPersonsData');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading RelatedPersons from localStorage:', error);
  }
  return relatedPersonsDataOriginal;
};

// Initialize relatedPersonsData
let relatedPersonsData = getRelatedPersonsData();

// Component for adding new relative
function AddRelativeForm({ memberKey, member, shareholder, companyCode, onClose, onSave, onUpdateRelatedPersons }) {
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Vợ',
    identity: ''
  });

  const relationshipOptions = ['Vợ', 'Chồng', 'Cha', 'Mẹ', 'Con', 'Anh', 'Chị', 'Em'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.identity.trim()) {
      // Get current RelatedPersons data from localStorage or original
      const currentData = getRelatedPersonsData();
      
      // Find max ID
      const maxId = currentData.length > 0 
        ? Math.max(...currentData.map(item => item.ID || 0))
        : 0;
      
      // Determine if this is a member or shareholder
      const personName = member ? member.Name : (shareholder ? shareholder.PersonaOrg : '');
      const personCCCD = member ? member.CCCD : (shareholder ? shareholder.MSTCCCDHC : '');
      
      // Create new relative entry
      const newRelative = {
        ID: maxId + 1,
        Code: companyCode,
        PersonName: personName,
        PersonCCCD: personCCCD,
        RelatedPersonName: formData.name.trim(),
        RelatedPersonCCCD: formData.identity.trim(),
        Relationship: formData.relationship
      };
      
      // Add to current data
      const updatedData = [...currentData, newRelative];
      
      // Save to localStorage
      try {
        localStorage.setItem('relatedPersonsData', JSON.stringify(updatedData));
        // Update the module-level variable so it's available immediately
        relatedPersonsData = updatedData;
        // Update state in parent component
        if (onUpdateRelatedPersons) {
          onUpdateRelatedPersons(updatedData);
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        alert('Lỗi khi lưu dữ liệu. Vui lòng thử lại.');
        return;
      }
      
      // Also save to onSave callback for immediate display
      onSave(formData);
      setFormData({ name: '', relationship: 'Vợ', identity: '' });
      
      alert('Đã thêm người thân thành công!');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #e0e0e0',
          paddingBottom: '12px'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            ➕ Thêm người thân cho {member ? member.Name : (shareholder ? shareholder.PersonaOrg : '')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Tên người thân: *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Nhập tên người thân"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Mối quan hệ: *
            </label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              {relationshipOptions.map(rel => (
                <option key={rel} value={rel}>{rel}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              CCCD: *
            </label>
            <input
              type="text"
              value={formData.identity}
              onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Nhập số CCCD"
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#9e9e9e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Lưu
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#fff3cd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#856404'
        }}>
          <strong>Lưu ý:</strong> Dữ liệu này chỉ được lưu tạm thời trong phiên làm việc hiện tại. 
          Để lưu vĩnh viễn, vui lòng cập nhật vào file RelatedPersons.json.
        </div>
      </div>
    </div>
  );
}

function CompanyDetail({ company, allCompanies, threshold }) {
  const [activeTab, setActiveTab] = useState('direct');
  const [selectedPersonForRelatives, setSelectedPersonForRelatives] = useState(null);
  const [showAddRelativeForm, setShowAddRelativeForm] = useState(null); // Store member key
  const [tempRelatives, setTempRelatives] = useState([]); // Store temporarily added relatives
  const [relatedPersonsDataState, setRelatedPersonsDataState] = useState(() => getRelatedPersonsData());

  // Close popups when tab changes
  useEffect(() => {
    setSelectedPersonForRelatives(null);
    setShowAddRelativeForm(null);
  }, [activeTab]);

  // Update relatedPersonsData when state changes
  useEffect(() => {
    relatedPersonsData = relatedPersonsDataState;
  }, [relatedPersonsDataState]);

  // Helper: Normalize name for comparison (trim and lowercase)
  const normalizeName = (name) => {
    if (!name) return '';
    return name.toString().trim().toLowerCase();
  };

  // Helper: Normalize CCCD for comparison (convert to string and trim)
  const normalizeCCCD = (cccd) => {
    if (!cccd) return '';
    return cccd.toString().trim();
  };

  // Helper: Check if two persons are the same (by name and CCCD)
  const isSamePerson = (name1, cccd1, name2, cccd2) => {
    const normName1 = normalizeName(name1);
    const normCCCD1 = normalizeCCCD(cccd1);
    const normName2 = normalizeName(name2);
    const normCCCD2 = normalizeCCCD(cccd2);
    
    // Both name and CCCD must match (if both are provided)
    const nameMatch = normName1 && normName2 && normName1 === normName2;
    const cccdMatch = normCCCD1 && normCCCD2 && normCCCD1 === normCCCD2;
    
    // Match if both name and CCCD match (preferred), or if CCCD matches (stronger than name)
    return (nameMatch && cccdMatch) || (cccdMatch && normCCCD1 && normCCCD2);
  };

  // Helper: Get ownership rate from ShareHolders data (using Code for lookup)
  const getOwnershipRate = (parentCompanyId, childCompanyId) => {
    try {
      // Find shareholder record where parent company owns child company
      const parentCompany = allCompanies.find(c => c.ID === parentCompanyId);
      const childCompany = allCompanies.find(c => c.ID === childCompanyId);
      if (!parentCompany || !childCompany) return 0;
      
      // Lookup by Code instead of CompanyID
      const shareholder = shareholdersData.find(sh => 
        sh && sh.Code === childCompany.Code && 
        (sh.PersonaOrg === parentCompany.Name || sh.PersonaOrg === parentCompany.Code)
      );
      return shareholder ? shareholder.Ownership : 0;
    } catch (error) {
      console.error('Error in getOwnershipRate:', error);
      return 0;
    }
  };

  // Helper: Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateString; // Return original if error
    }
  };

  // Helper: Check if shareholder is active
  // Logic: Active if today <= To, Inactive if today > To
  const isShareholderActive = (shareholder) => {
    if (!shareholder.To) return true; // Nếu không có To date, mặc định là Active
    const toDate = new Date(shareholder.To);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);
    // Active nếu ngày hiện tại <= To, Inactive nếu ngày hiện tại > To
    return today <= toDate;
  };

  // Get direct subsidiaries (using ParentID instead of Parents array)
  const directSubsidiaries = useMemo(() => {
    if (!company || !company.ID || !allCompanies) return [];
    return allCompanies
      .filter(c => c && c.ParentID === company.ID && c.ParentID !== 0 && c.TrangThai === 'Đang hoạt động')
      .map(c => {
        // Get ownership rate from ShareHolders
        const ownership = getOwnershipRate(company.ID, c.ID);
        
        // Phân loại theo chuẩn mực
        let controlType = '';
        if (ownership > 50) {
          controlType = 'Công ty con (Subsidiary - IFRS 10)';
        } else if (ownership >= 20) {
          controlType = 'Công ty liên kết (Associate - IAS 28)';
        } else {
          controlType = 'Đầu tư không kiểm soát (Investment)';
        }
        
        return {
        ...c,
        ownershipType: 'Trực Tiếp',
          effectiveOwnership: ownership,
          controlType: controlType
        };
      })
      .filter(c => c.effectiveOwnership >= threshold); // Apply threshold filter
  }, [company, allCompanies, threshold]);

  // Helper: Find all companies that a parent company owns (by looking up in ShareHolders by Code)
  // This includes both direct children (ParentID) and companies owned via ShareHolders
  const getOwnedCompanies = (parentCompany) => {
    if (!parentCompany || !allCompanies) return [];
    const ownedCompanies = [];
    
    // Method 1: Find by ParentID (direct children) - only active companies
    const directChildren = allCompanies.filter(c => c && c.ParentID === parentCompany.ID && c.ParentID !== 0 && c.TrangThai === 'Đang hoạt động');
    directChildren.forEach(child => {
      const ownership = getOwnershipRate(parentCompany.ID, child.ID);
      if (ownership > 0) {
        ownedCompanies.push({ company: child, ownership });
      }
    });
    
    // Method 2: Find by ShareHolders lookup (companies where parent is a shareholder)
    // Look for all shareholders where PersonaOrg matches parent company Name or Code
    const shareholders = shareholdersData.filter(sh => 
      sh && (sh.PersonaOrg === parentCompany.Name || sh.PersonaOrg === parentCompany.Code)
    );
    
    shareholders.forEach(sh => {
      // Find the company with matching Code - only active companies
      const ownedCompany = allCompanies.find(c => c && c.Code === sh.Code && c.TrangThai === 'Đang hoạt động');
      if (ownedCompany && ownedCompany.ID !== parentCompany.ID) {
        // Check if not already added via ParentID method
        const alreadyAdded = ownedCompanies.some(oc => oc.company.ID === ownedCompany.ID);
        if (!alreadyAdded && sh.Ownership > 0) {
          ownedCompanies.push({ company: ownedCompany, ownership: sh.Ownership });
        }
      }
    });
    
    return ownedCompanies;
  };

  // Calculate equity interest subsidiaries (sum all paths)
  const equityInterestSubsidiaries = useMemo(() => {
    const allPaths = [];
    const queue = [];
    
    // Get companies with direct ownership >50% to exclude from equity interest calculation
    const directSubsidiariesOver50 = new Set(
      directSubsidiaries
        .filter(sub => sub.effectiveOwnership > 50)
        .map(sub => sub.Name)
    );

    // Start with companies owned by the current company (using getOwnedCompanies)
    const directOwned = getOwnedCompanies(company);
    directOwned.forEach(({ company: child, ownership }) => {
      const ownershipRate = ownership / 100;
      
      // Add direct relationship as a path
      const directPathString = `${company.Name} → ${child.Name} (${(ownershipRate * 100).toFixed(1)}%)`;
      allPaths.push({
        companyId: child.ID,
        company: child,
        ownershipType: 'Trực Tiếp',
        effectiveOwnership: ownershipRate * 100,
        path: [company.Name, child.Name],
        pathIds: [company.ID, child.ID],
        pathWithRates: [
          { name: company.Name, rate: null },
          { name: child.Name, rate: ownershipRate }
        ],
        pathString: directPathString,
        isDirect: true
      });
      
      queue.push({
        company: child,
        path: [company.Name, child.Name],
        pathIds: [company.ID, child.ID],
        pathWithRates: [
          { name: company.Name, rate: null },
          { name: child.Name, rate: ownershipRate }
        ],
        cumulativeOwnership: ownershipRate
      });
    });

    // BFS to find all indirect subsidiaries through all possible paths
    while (queue.length > 0) {
      const current = queue.shift();
      // Use getOwnedCompanies to find all companies owned by current company (not just by ParentID)
      const ownedCompanies = getOwnedCompanies(current.company);

      ownedCompanies.forEach(({ company: child, ownership }) => {
        // Check for circular reference (avoid infinite loops)
        if (current.pathIds.includes(child.ID)) {
          return; // Skip this path if it creates a cycle
        }

        const childOwnershipRate = ownership / 100;
        
        const newOwnership = current.cumulativeOwnership * childOwnershipRate;
        const newPath = [...current.path, child.Name];
        const newPathIds = [...current.pathIds, child.ID];
        const newPathWithRates = [
          ...current.pathWithRates,
          { name: child.Name, rate: childOwnershipRate }
        ];

          // Create detailed ownership string
          const pathString = newPathWithRates
            .map((step, index) => {
              if (index === 0) return step.name;
              return `${step.name} (${(step.rate * 100).toFixed(1)}%)`;
            })
            .join(' → ');

        // Add all indirect paths (length > 2 means at least one intermediate company)
        if (newPath.length > 2) {
          allPaths.push({
            companyId: child.ID,
            company: child,
            ownershipType: 'Gián Tiếp',
            effectiveOwnership: newOwnership * 100,
            path: newPath,
            pathIds: newPathIds,
            pathWithRates: newPathWithRates,
            pathString: pathString
          });
        }

        // Continue searching from this child if ownership is meaningful (>= 1%)
        if (newOwnership * 100 >= 1) {
          queue.push({
            company: child,
            path: newPath,
            pathIds: newPathIds,
            pathWithRates: newPathWithRates,
            cumulativeOwnership: newOwnership
          });
        }
      });
    }

    // Group by company Name and SUM all paths (equity interest)
    const companyMap = new Map();
    
    allPaths.forEach(pathData => {
      const companyName = pathData.company.Name;
      
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, {
          ...pathData.company,
          ownershipType: 'Gián Tiếp',
          paths: [],
          allIds: new Set(),
          totalEquity: 0
        });
      }
      
      const companyData = companyMap.get(companyName);
      companyData.allIds.add(pathData.companyId);
      companyData.paths.push({
        pathString: pathData.pathString,
        ownership: pathData.effectiveOwnership,
        isDirect: pathData.isDirect || false
      });
      // Sum all paths for equity interest
      companyData.totalEquity += pathData.effectiveOwnership;
    });

    // Convert map to array and filter by threshold (show all >= threshold, not just >= 50%)
    return Array.from(companyMap.values())
      .filter(item => !directSubsidiariesOver50.has(item.Name)) // Exclude companies with direct ownership >50%
      .filter(item => item.totalEquity >= threshold) // Show all >= threshold
      .map(item => {
        // Phân loại theo chuẩn mực dựa trên tổng equity interest:
      let controlType = '';
        if (item.totalEquity > 50) {
        controlType = 'Công ty con (Subsidiary - IFRS 10)';
        } else if (item.totalEquity >= 20) {
        controlType = 'Công ty liên kết (Associate - IAS 28)';
      } else {
        controlType = 'Đầu tư không kiểm soát (Investment)';
      }
      
      return {
        ...item,
          effectiveOwnership: item.totalEquity, // Tổng equity interest
        controlType: controlType,
        pathCount: item.paths.length,
        hasMultiplePaths: item.paths.length > 1,
        ID: item.ID || Array.from(item.allIds)[0]
      };
      });
  }, [company, allCompanies, threshold, directSubsidiaries]);

  // Get shareholders for this company (using Code for lookup)
  const shareholders = useMemo(() => {
    if (!company || !company.Code) return [];
    return shareholdersData
      .filter(sh => sh.Code === company.Code)
      .map(sh => ({
        ...sh,
        isActive: isShareholderActive(sh)
      }))
      .sort((a, b) => b.Ownership - a.Ownership);
  }, [company]);

  // Get company members for this company
  const companyMembers = useMemo(() => {
    if (!company || !company.Code) return [];
    return companyMembersData.filter(m => m.Code === company.Code);
  }, [company]);

  // Get all subsidiaries (direct + indirect) for collecting company members
  // This includes ALL subsidiaries regardless of threshold, just for member collection
  const getAllSubsidiaries = useMemo(() => {
    if (!company || !allCompanies) return [];
    
    const allSubsidiaryIds = new Set();
    const visited = new Set();
    const queue = [];
    
    // Start with direct children (without threshold filter) - only active companies
    const directChildren = allCompanies.filter(c => c && c.ParentID === company.ID && c.ParentID !== 0 && c.TrangThai === 'Đang hoạt động');
    directChildren.forEach(child => {
      if (!visited.has(child.ID)) {
        visited.add(child.ID);
        allSubsidiaryIds.add(child.ID);
        queue.push(child);
      }
    });
    
    // Also add companies owned via ShareHolders (direct ownership)
    const directOwned = getOwnedCompanies(company);
    directOwned.forEach(({ company: child }) => {
      if (child && child.ID && !visited.has(child.ID)) {
        visited.add(child.ID);
        allSubsidiaryIds.add(child.ID);
        queue.push(child);
      }
    });
    
    // BFS to find all indirect subsidiaries (without threshold filter)
    while (queue.length > 0) {
      const current = queue.shift();
      const ownedCompanies = getOwnedCompanies(current);
      
      ownedCompanies.forEach(({ company: child }) => {
        if (child && child.ID && !visited.has(child.ID)) {
          visited.add(child.ID);
          allSubsidiaryIds.add(child.ID);
          queue.push(child);
        }
      });
    }
    
    // Convert to array of company objects - only active companies
    return Array.from(allSubsidiaryIds)
      .map(id => allCompanies.find(c => c && c.ID === id && c.TrangThai === 'Đang hoạt động'))
      .filter(c => c != null);
  }, [company, allCompanies]);

  // Get related parties (individuals and organizations with ownership >= 10%)
  const relatedParties = useMemo(() => {
    if (!company || !company.Code) return [];
    
    const parties = [];
    const processedMembers = new Set(); // Track processed members by Code_Name_CCCD
    const processedCompanies = new Set(); // Track processed companies by ID
    const ownershipThreshold = 10; // Minimum ownership percentage
    
    // 1. Add direct subsidiaries as organizations (only >= 10% ownership)
    directSubsidiaries.forEach(subsidiary => {
      if (subsidiary.effectiveOwnership < ownershipThreshold) return;
      if (subsidiary.ID && !processedCompanies.has(subsidiary.ID)) {
        processedCompanies.add(subsidiary.ID);
        parties.push({
          Code: subsidiary.Code,
          Name: subsidiary.Name,
          Loai: 'Tổ chức',
          MoiQuanHe: `Công ty con trực tiếp (${subsidiary.effectiveOwnership.toFixed(1)}%)`,
          Identity: subsidiary.MST || subsidiary.Code,
          CompanyName: subsidiary.Name,
          Type: 'company',
          Level: 'Công ty con trực tiếp',
          Ownership: subsidiary.effectiveOwnership
        });
      }
    });
    
    // 2. Add indirect subsidiaries as organizations (only >= 50% ownership)
    equityInterestSubsidiaries.forEach(subsidiary => {
      if (subsidiary.effectiveOwnership < 50) return; // Only >= 50%
      
      // Skip if already processed as direct subsidiary
      const isDirect = directSubsidiaries.some(ds => ds.ID === subsidiary.ID);
      if (isDirect) return;
      
      // Skip if already processed
      if (subsidiary.ID && processedCompanies.has(subsidiary.ID)) return;
      
      // Find the company object - only active companies
      const subsidiaryCompany = allCompanies.find(c => c && c.ID === subsidiary.ID && c.TrangThai === 'Đang hoạt động');
      if (!subsidiaryCompany || !subsidiaryCompany.Code) return;
      
      processedCompanies.add(subsidiary.ID);
      parties.push({
        Code: subsidiaryCompany.Code,
        Name: subsidiaryCompany.Name,
        Loai: 'Tổ chức',
        MoiQuanHe: `Công ty con gián tiếp (${subsidiary.effectiveOwnership.toFixed(1)}%)`,
        Identity: subsidiaryCompany.MST || subsidiaryCompany.Code,
        CompanyName: subsidiaryCompany.Name,
        Type: 'company',
        Level: 'Công ty con gián tiếp',
        Ownership: subsidiary.effectiveOwnership
      });
    });
    
    // 3. Add parent companies (direct and indirect, ownership >= 10%)
    // 3a. Direct parent company (via ParentID)
    if (company.ParentID && company.ParentID !== 0) {
      const directParent = allCompanies.find(c => c && c.ID === company.ParentID && c.TrangThai === 'Đang hoạt động');
      if (directParent) {
        const ownership = getOwnershipRate(directParent.ID, company.ID);
        if (ownership >= ownershipThreshold && !processedCompanies.has(directParent.ID)) {
          processedCompanies.add(directParent.ID);
          parties.push({
            Code: directParent.Code,
            Name: directParent.Name,
            Loai: 'Tổ chức',
            MoiQuanHe: `Công ty mẹ trực tiếp (${ownership.toFixed(1)}%)`,
            Identity: directParent.MST || directParent.Code,
            CompanyName: directParent.Name,
            Type: 'company',
            Level: 'Công ty mẹ',
            Ownership: ownership
          });
        }
      }
    }
    
    // 3b. Parent companies from ShareHolders (organizations that own this company)
    // If ownership > 50%, it's a parent company (not just a shareholder)
    const parentShareholders = shareholdersData.filter(sh => 
      sh && sh.Code === company.Code && sh.LoaiCD === 'Tổ chức' && sh.Ownership > 50
    );
    parentShareholders.forEach(sh => {
      // Find the parent company
      const parentCompany = allCompanies.find(c => 
        c && c.TrangThai === 'Đang hoạt động' && 
        (c.Name === sh.PersonaOrg || c.Code === sh.PersonaOrg)
      );
      
      if (!parentCompany) return; // Skip if not found
      
      // Check if this is already a subsidiary (shouldn't happen, but safety check)
      const isSubsidiary = directSubsidiaries.some(ds => ds.ID === parentCompany.ID) || 
                          equityInterestSubsidiaries.some(es => es.ID === parentCompany.ID && es.effectiveOwnership >= ownershipThreshold);
      if (isSubsidiary) return; // Skip if already added as subsidiary
      
      // Check if already processed as parent
      if (processedCompanies.has(parentCompany.ID)) return;
      
      processedCompanies.add(parentCompany.ID);
      parties.push({
        Code: company.Code,
        Name: parentCompany.Name,
        Loai: 'Tổ chức',
        MoiQuanHe: `Công ty mẹ (${sh.Ownership.toFixed(1)}%)`,
        Identity: parentCompany.MST || parentCompany.Code,
        CompanyName: company.Name,
        Type: 'company',
        Level: 'Công ty mẹ',
        Ownership: sh.Ownership
      });
    });
    
    // 3c. Add other organizations from ShareHolders (not subsidiaries, not parents, ownership 10-50%)
    // Only show as "Cổ đông" if ownership is between 10% and 50%
    // If ownership > 50%, it's already shown as "Công ty mẹ" in step 3b
    const otherShareholders = shareholdersData.filter(sh => 
      sh && sh.Code === company.Code && sh.LoaiCD === 'Tổ chức' && 
      sh.Ownership >= ownershipThreshold && sh.Ownership <= 50
    );
    otherShareholders.forEach(sh => {
      // Find the organization
      const orgCompany = allCompanies.find(c => 
        c && c.TrangThai === 'Đang hoạt động' && 
        (c.Name === sh.PersonaOrg || c.Code === sh.PersonaOrg)
      );
      
      if (!orgCompany) {
        // If not found in companies, it's an external organization
        const key = `${company.Code}_${sh.PersonaOrg}_${sh.MSTCCCDHC}`;
        if (!processedCompanies.has(key)) {
          processedCompanies.add(key);
          parties.push({
            Code: company.Code,
            Name: sh.PersonaOrg,
            Loai: 'Tổ chức',
            MoiQuanHe: `Cổ đông (${sh.Ownership.toFixed(1)}%)`,
            Identity: sh.MSTCCCDHC || 'N/A',
            CompanyName: company.Name,
            Type: 'organization',
            Level: 'Công ty hiện tại',
            Ownership: sh.Ownership
          });
        }
        return;
      }
      
      // Check if this is already a subsidiary or parent
      const isSubsidiary = directSubsidiaries.some(ds => ds.ID === orgCompany.ID) || 
                          equityInterestSubsidiaries.some(es => es.ID === orgCompany.ID && es.effectiveOwnership >= ownershipThreshold);
      const isParent = processedCompanies.has(orgCompany.ID);
      
      if (isSubsidiary || isParent) return; // Skip if already added
      
      const key = `${company.Code}_${sh.PersonaOrg}_${sh.MSTCCCDHC}`;
      if (!processedCompanies.has(key)) {
        processedCompanies.add(key);
        parties.push({
          Code: company.Code,
          Name: sh.PersonaOrg,
          Loai: 'Tổ chức',
          MoiQuanHe: `Cổ đông (${sh.Ownership.toFixed(1)}%)`,
          Identity: orgCompany.MST || orgCompany.Code,
          CompanyName: company.Name,
          Type: 'organization',
          Level: 'Công ty hiện tại',
          Ownership: sh.Ownership
        });
      }
    });
    
    // 4. Add individuals from ShareHolders (ownership >= 10%) - these are shareholders
    // Add ALL shareholders, even if they are also company members (they will appear twice: as shareholder and as member)
    const individualShareholders = shareholdersData.filter(sh => 
      sh && sh.Code === company.Code && sh.LoaiCD === 'Cá nhân' && 
      sh.Ownership >= ownershipThreshold && sh.TrangThai === 'Active' && isShareholderActive(sh)
    );
    individualShareholders.forEach(sh => {
      // Use a unique key for shareholders (different from company members key)
      // Normalize name and CCCD to ensure consistent key generation
      const normalizedName = sh.PersonaOrg ? sh.PersonaOrg.trim() : '';
      const normalizedCCCD = sh.MSTCCCDHC ? sh.MSTCCCDHC.toString().trim() : '';
      const key = `${company.Code}_SHAREHOLDER_${normalizedName}_${normalizedCCCD}`;
      
      if (!processedMembers.has(key)) {
        processedMembers.add(key);
        parties.push({
          Code: company.Code,
          Name: normalizedName,
          Loai: 'Cá Nhân',
          MoiQuanHe: `Cổ đông (${sh.Ownership.toFixed(1)}%)`, // Show ownership % for shareholders
          Identity: normalizedCCCD || 'N/A',
          CompanyName: company.Name,
          Type: 'member',
          Level: 'Công ty hiện tại',
          Ownership: sh.Ownership
        });
      }
    });
    
    // 4.5. Add ALL company members from parent companies (MANDATORY)
    // Get all parent companies that were added in step 3
    const parentCompanies = [];
    if (company.ParentID && company.ParentID !== 0) {
      const directParent = allCompanies.find(c => c && c.ID === company.ParentID && c.TrangThai === 'Đang hoạt động');
      if (directParent && processedCompanies.has(directParent.ID)) {
        parentCompanies.push(directParent);
      }
    }
    // Also get parent companies from ShareHolders (ownership > 50%)
    parentShareholders.forEach(sh => {
      const parentCompany = allCompanies.find(c => 
        c && c.TrangThai === 'Đang hoạt động' && 
        (c.Name === sh.PersonaOrg || c.Code === sh.PersonaOrg)
      );
      if (parentCompany && processedCompanies.has(parentCompany.ID)) {
        const alreadyAdded = parentCompanies.some(p => p.ID === parentCompany.ID);
        if (!alreadyAdded) {
          parentCompanies.push(parentCompany);
        }
      }
    });
    
    // Add members from all parent companies
    parentCompanies.forEach(parentCompany => {
      if (parentCompany && parentCompany.Code) {
        const parentMembers = companyMembersData.filter(m => m.Code === parentCompany.Code);
        parentMembers.forEach(member => {
          // Check if this member is also a shareholder (to show ownership if >= 10%)
          const shareholder = shareholdersData.find(sh => {
            if (!sh || sh.Code !== parentCompany.Code || sh.LoaiCD !== 'Cá nhân') return false;
            
            // Use helper function to check if same person
            return isSamePerson(sh.PersonaOrg, sh.MSTCCCDHC, member.Name, member.CCCD);
          });
          
          // Add ALL members (mandatory), chỉ hiển thị chức vụ (không hiển thị % sở hữu)
          const key = `${parentCompany.Code}_${member.Name}_${member.CCCD}`;
          if (!processedMembers.has(key)) {
            processedMembers.add(key);
            parties.push({
              Code: parentCompany.Code,
              Name: member.Name,
              Loai: 'Cá Nhân',
              MoiQuanHe: member.ChucVu, // Chỉ hiển thị chức vụ, không hiển thị % sở hữu
              Identity: member.CCCD,
              CompanyName: parentCompany.Name,
              Type: 'member',
              Level: 'Công ty mẹ',
              Ownership: 0 // Không có % sở hữu cho thành viên công ty
            });
          }
        });
      }
    });
    
    // 5. Add ALL company members from current company (MANDATORY - from "Người Quản Lý" tab)
    // This is required, regardless of ownership percentage
    // Người quản lý không có tỉ lệ sở hữu, chỉ có cổ đông mới có tỉ lệ sở hữu
    companyMembers.forEach(member => {
      const key = `${company.Code}_${member.Name}_${member.CCCD}`;
      // Skip if already added in step 4 (individuals from ShareHolders with ownership >= 10%)
      if (processedMembers.has(key)) return;
      
          // Check if this member is also a shareholder (to show ownership if >= 10%)
          const shareholder = shareholdersData.find(sh => {
            if (!sh || sh.Code !== company.Code || sh.LoaiCD !== 'Cá nhân') return false;
            
            // Use helper function to check if same person
            return isSamePerson(sh.PersonaOrg, sh.MSTCCCDHC, member.Name, member.CCCD);
          });
      
      // Add ALL members (mandatory), chỉ hiển thị chức vụ (không hiển thị % sở hữu)
      processedMembers.add(key);
      parties.push({
        Code: company.Code,
        Name: member.Name,
        Loai: 'Cá Nhân',
        MoiQuanHe: member.ChucVu, // Chỉ hiển thị chức vụ, không hiển thị % sở hữu
        Identity: member.CCCD,
        CompanyName: company.Name,
        Type: 'member',
        Level: 'Công ty hiện tại',
        Ownership: 0 // Không có % sở hữu cho thành viên công ty
      });
    });
    
    // 6. Add ALL company members from direct subsidiaries (MANDATORY - only if subsidiary has ownership >= 10%)
    const allDirectSubsidiaries = allCompanies.filter(c => 
      c && c.ParentID === company.ID && c.ParentID !== 0 && c.TrangThai === 'Đang hoạt động'
    );
    allDirectSubsidiaries.forEach(subsidiary => {
      // Check if this subsidiary has ownership >= 10%
      const subsidiaryOwnership = directSubsidiaries.find(ds => ds.ID === subsidiary.ID);
      if (!subsidiaryOwnership || subsidiaryOwnership.effectiveOwnership < ownershipThreshold) return;
      
      if (subsidiary && subsidiary.Code) {
        const subMembers = companyMembersData.filter(m => m.Code === subsidiary.Code);
        subMembers.forEach(member => {
          // Check if this member is also a shareholder (to show ownership if >= 10%)
          const shareholder = shareholdersData.find(sh => {
            if (!sh || sh.Code !== subsidiary.Code || sh.LoaiCD !== 'Cá nhân') return false;
            
            // Use helper function to check if same person
            return isSamePerson(sh.PersonaOrg, sh.MSTCCCDHC, member.Name, member.CCCD);
          });
          
          // Add ALL members (mandatory), chỉ hiển thị chức vụ (không hiển thị % sở hữu)
          const key = `${subsidiary.Code}_${member.Name}_${member.CCCD}`;
          if (!processedMembers.has(key)) {
            processedMembers.add(key);
            parties.push({
              Code: subsidiary.Code,
              Name: member.Name,
              Loai: 'Cá Nhân',
              MoiQuanHe: member.ChucVu, // Chỉ hiển thị chức vụ, không hiển thị % sở hữu
              Identity: member.CCCD,
              CompanyName: subsidiary.Name,
              Type: 'member',
              Level: 'Công ty con trực tiếp',
              Ownership: 0 // Không có % sở hữu cho thành viên công ty
            });
          }
        });
      }
    });
    
    // 7. Add ALL company members from indirect subsidiaries (MANDATORY - only >= 50% subsidiary ownership)
    // Skip subsidiaries with ownership < 50% (they are not shown in step 2)
    equityInterestSubsidiaries.forEach(subsidiary => {
      if (subsidiary.effectiveOwnership < 50) return; // Only >= 50%
      
      // Skip if already processed as direct subsidiary
      const isDirect = directSubsidiaries.some(ds => ds.ID === subsidiary.ID);
      if (isDirect) return;
      
      // Find the company object - only active companies
      const subsidiaryCompany = allCompanies.find(c => c && c.ID === subsidiary.ID && c.TrangThai === 'Đang hoạt động');
      if (!subsidiaryCompany || !subsidiaryCompany.Code) return;
      
      const subMembers = companyMembersData.filter(m => m.Code === subsidiaryCompany.Code);
      subMembers.forEach(member => {
        // Check if this member is also a shareholder (to show ownership if >= 10%)
        const shareholder = shareholdersData.find(sh => {
          if (!sh || sh.Code !== subsidiaryCompany.Code || sh.LoaiCD !== 'Cá nhân') return false;
          
          // Use helper function to check if same person
          return isSamePerson(sh.PersonaOrg, sh.MSTCCCDHC, member.Name, member.CCCD);
        });
        
        // Add ALL members (mandatory), chỉ hiển thị chức vụ (không hiển thị % sở hữu)
        const key = `${subsidiaryCompany.Code}_${member.Name}_${member.CCCD}`;
        if (!processedMembers.has(key)) {
          processedMembers.add(key);
          parties.push({
            Code: subsidiaryCompany.Code,
            Name: member.Name,
            Loai: 'Cá Nhân',
            MoiQuanHe: member.ChucVu, // Chỉ hiển thị chức vụ, không hiển thị % sở hữu
            Identity: member.CCCD,
            CompanyName: subsidiaryCompany.Name,
            Type: 'member',
            Level: 'Công ty con gián tiếp',
            Ownership: 0 // Không có % sở hữu cho thành viên công ty
          });
        }
      });
    });
    
           // 8. Add relatives (RelatedPersons) of company members from CURRENT COMPANY ONLY
           // Only show relatives of members from the current company (not parent or subsidiaries)
           const currentCompanyMembers = parties.filter(p => 
             p.Type === 'member' && p.Ownership === 0 && p.Level === 'Công ty hiện tại'
           );
           
           currentCompanyMembers.forEach(member => {
             // Find relatives of this member in RelatedPersons.json
             // Match by Code and PersonCCCD
             const relatives = relatedPersonsDataState.filter(rp => 
               rp && rp.Code === member.Code && 
               isSamePerson(rp.PersonName, rp.PersonCCCD, member.Name, member.Identity)
             );
      
      relatives.forEach(relative => {
        // Create a unique key for the relative to avoid duplicates
        const relativeKey = `${member.Code}_RELATIVE_${relative.RelatedPersonName}_${relative.RelatedPersonCCCD}`;
        
        // Check if this relative is already added (might be a member or shareholder themselves)
        const alreadyAdded = parties.some(p => 
          isSamePerson(p.Name, p.Identity, relative.RelatedPersonName, relative.RelatedPersonCCCD)
        );
        
        if (!alreadyAdded) {
          parties.push({
            Code: member.Code,
            Name: relative.RelatedPersonName,
            Loai: 'Cá Nhân',
            MoiQuanHe: `${relative.Relationship} của ${member.Name}`, // e.g., "Vợ của Nguyễn Văn Quang"
            Identity: relative.RelatedPersonCCCD,
            CompanyName: member.CompanyName,
            Type: 'relative',
            Level: member.Level, // Same level as the member (Công ty mẹ, Công ty hiện tại, etc.)
            Ownership: 0 // Relatives don't have ownership
          });
        }
      });
    });
    
    // 9. Add relatives (RelatedPersons) of shareholders (>= 10% ownership) from CURRENT COMPANY ONLY
    // Only show relatives of shareholders from the current company
    const currentCompanyShareholders = parties.filter(p => 
      p.Type === 'member' && p.Ownership >= ownershipThreshold && 
      p.MoiQuanHe && p.MoiQuanHe.includes('Cổ đông') &&
      p.Level === 'Công ty hiện tại'
    );
    
           currentCompanyShareholders.forEach(shareholder => {
             // Find relatives of this shareholder in RelatedPersons.json
             // Match by Code and PersonCCCD (MSTCCCDHC)
             const relatives = relatedPersonsDataState.filter(rp => 
               rp && rp.Code === shareholder.Code && 
               isSamePerson(rp.PersonName, rp.PersonCCCD, shareholder.Name, shareholder.Identity)
             );
      
      relatives.forEach(relative => {
        // Create a unique key for the relative to avoid duplicates
        const relativeKey = `${shareholder.Code}_RELATIVE_${relative.RelatedPersonName}_${relative.RelatedPersonCCCD}`;
        
        // Check if this relative is already added (might be a member or shareholder themselves)
        const alreadyAdded = parties.some(p => 
          isSamePerson(p.Name, p.Identity, relative.RelatedPersonName, relative.RelatedPersonCCCD)
        );
        
        if (!alreadyAdded) {
          parties.push({
            Code: shareholder.Code,
            Name: relative.RelatedPersonName,
            Loai: 'Cá Nhân',
            MoiQuanHe: `${relative.Relationship} của ${shareholder.Name}`, // e.g., "Vợ của Nguyễn Hồng Sơn"
            Identity: relative.RelatedPersonCCCD,
            CompanyName: shareholder.CompanyName,
            Type: 'relative',
            Level: shareholder.Level, // Same level as the shareholder
            Ownership: 0 // Relatives don't have ownership
          });
        }
      });
    });
    
    // Filter: only return parties with ownership >= 10%
    // EXCEPT: company members from current company, parent, and subsidiaries (mandatory, always show)
    // EXCEPT: relatives of company members and shareholders (mandatory, always show)
    const filteredParties = parties.filter(party => {
      // Always show company members from current company, parent, and subsidiaries (mandatory)
      // These are added from CompanyMembers.json and have Ownership = 0
      if (party.Type === 'member' && party.Ownership === 0 && (
        party.Level === 'Công ty mẹ' ||
        party.Level === 'Công ty hiện tại' || 
        party.Level === 'Công ty con trực tiếp' || 
        party.Level === 'Công ty con gián tiếp'
      )) {
        return true;
      }
      
      // Always show relatives of company members and shareholders (mandatory)
      // These are added from RelatedPersons.json and have Ownership = 0
      if (party.Type === 'relative') {
        return true;
      }
      
      // For companies and organizations, use Ownership field
      if (party.Type === 'company' || party.Type === 'organization') {
        return party.Ownership >= ownershipThreshold;
      }
      
      // For shareholders (individuals from ShareHolders with ownership >= 10%), use Ownership field
      // These have Ownership > 0 and MoiQuanHe contains "Cổ đông"
      if (party.Type === 'member' && party.Ownership >= ownershipThreshold) {
        return true;
      }
      
      return false;
    });
    
    return filteredParties.sort((a, b) => {
      // Sort by Type first (company/organization before member, then relative), then by Level, then by Ownership (desc), then by Name
      const typeOrder = { 'company': 1, 'organization': 1, 'member': 2, 'relative': 3 };
      const typeDiff = (typeOrder[a.Type] || 99) - (typeOrder[b.Type] || 99);
      if (typeDiff !== 0) return typeDiff;
      
      // Sort by level (Công ty mẹ first, then current company, then subsidiaries)
      const levelOrder = { 
        'Công ty mẹ': 1, 
        'Công ty hiện tại': 2, 
        'Công ty con trực tiếp': 3, 
        'Công ty con gián tiếp': 4 
      };
      const levelDiff = (levelOrder[a.Level] || 99) - (levelOrder[b.Level] || 99);
      if (levelDiff !== 0) return levelDiff;
      
      // Sort by ownership (descending)
      const ownershipDiff = (b.Ownership || 0) - (a.Ownership || 0);
      if (ownershipDiff !== 0) return ownershipDiff;
      
      return a.Name.localeCompare(b.Name);
    });
  }, [company, companyMembers, directSubsidiaries, equityInterestSubsidiaries, allCompanies, relatedPersonsDataState]);

  // Group relatives by person and create map for quick lookup
  const relativesByPerson = useMemo(() => {
    const map = new Map();
    
    // Get all relatives from relatedParties
    const relatives = relatedParties.filter(p => p.Type === 'relative');
    
    relatives.forEach(relative => {
      // Extract person name from MoiQuanHe (e.g., "Vợ của Nguyễn Văn Quang" -> "Nguyễn Văn Quang")
      const match = relative.MoiQuanHe.match(/của (.+)$/);
      if (match) {
        const personName = match[1].trim();
        
        // Find the person in relatedParties to get their Identity
        const person = relatedParties.find(p => 
          p.Name === personName && 
          p.Code === relative.Code &&
          p.Type !== 'relative'
        );
        
        if (person) {
          // Use person's Identity to create key (match with table row)
          const key = `${person.Code}_${person.Name}_${person.Identity}`;
          
          if (!map.has(key)) {
            map.set(key, {
              personName: personName,
              personCode: person.Code,
              personIdentity: person.Identity,
              relatives: []
            });
          }
          
          map.get(key).relatives.push({
            name: relative.Name,
            relationship: relative.MoiQuanHe.split(' của ')[0], // Extract relationship (Vợ, Chồng, etc.)
            identity: relative.Identity,
            fullRelationship: relative.MoiQuanHe
          });
        }
      }
    });
    
    return map;
  }, [relatedParties]);

  // Filter out relatives from main table (they will be shown in popup)
  const relatedPartiesWithoutRelatives = useMemo(() => {
    return relatedParties.filter(p => p.Type !== 'relative');
  }, [relatedParties]);

  // Create map of relatives for members in "Người Quản Lý" tab
  const membersRelativesMap = useMemo(() => {
    const map = new Map();
    
    if (!company || !company.Code) return map;
    
    companyMembers.forEach(member => {
      // Normalize key: ensure CCCD is converted to string and trimmed
      const normalizedCCCD = member.CCCD ? member.CCCD.toString().trim() : '';
      const key = `${company.Code}_${member.Name}_${normalizedCCCD}`;
      
      // Find relatives of this member in RelatedPersons.json
      // Match by Code, PersonName (or Name), and PersonCCCD (or CCCD)
      const relatives = relatedPersonsDataState.filter(rp => {
        if (!rp || rp.Code !== company.Code) return false;
        
        // Use helper function to check if same person
        return isSamePerson(rp.PersonName, rp.PersonCCCD, member.Name, member.CCCD);
      });
      
      // Also include tempRelatives (temporarily added)
      const tempRelativesForMember = tempRelatives.filter(tr => 
        tr.memberKey === key
      );
      
      const allRelatives = [
        ...relatives.map(rel => ({
          name: rel.RelatedPersonName,
          relationship: rel.Relationship,
          identity: rel.RelatedPersonCCCD,
          fullRelationship: `${rel.Relationship} của ${member.Name}`,
          isTemp: false
        })),
        ...tempRelativesForMember.map(tr => ({
          name: tr.name,
          relationship: tr.relationship,
          identity: tr.identity,
          fullRelationship: `${tr.relationship} của ${member.Name}`,
          isTemp: true
        }))
      ];
      
      if (allRelatives.length > 0) {
        map.set(key, {
          personName: member.Name,
          personCode: company.Code,
          personIdentity: normalizedCCCD,
          relatives: allRelatives
        });
      }
    });
    
    return map;
  }, [company, companyMembers, tempRelatives, relatedPersonsDataState]);

  // Create map of relatives for shareholders (individuals with ownership >= 10% and active) in "Cổ Đông" tab
  const shareholdersRelativesMap = useMemo(() => {
    const map = new Map();
    
    if (!company || !company.Code) return map;
    
    const ownershipThreshold = 10;
    
    // Get individual shareholders with ownership >= 10% and active
    const individualShareholders = shareholders.filter(sh => 
      sh && sh.LoaiCD === 'Cá nhân' && 
      sh.Ownership >= ownershipThreshold && 
      sh.TrangThai === 'Active' && 
      sh.isActive
    );
    
    individualShareholders.forEach(sh => {
      // Normalize key: ensure MSTCCCDHC is converted to string and trimmed
      const normalizedCCCD = sh.MSTCCCDHC ? sh.MSTCCCDHC.toString().trim() : '';
      const normalizedName = sh.PersonaOrg ? sh.PersonaOrg.trim() : '';
      const key = `${company.Code}_SHAREHOLDER_${normalizedName}_${normalizedCCCD}`;
      
      // Find relatives of this shareholder in RelatedPersons.json
      // Match by Code, PersonName (or PersonaOrg), and PersonCCCD (or MSTCCCDHC)
      const relatives = relatedPersonsDataState.filter(rp => {
        if (!rp || rp.Code !== company.Code) return false;
        
        // Use helper function to check if same person
        return isSamePerson(rp.PersonName, rp.PersonCCCD, normalizedName, normalizedCCCD);
      });
      
      // Also include tempRelatives (temporarily added)
      const tempRelativesForShareholder = tempRelatives.filter(tr => 
        tr.memberKey === key
      );
      
      const allRelatives = [
        ...relatives.map(rel => ({
          name: rel.RelatedPersonName,
          relationship: rel.Relationship,
          identity: rel.RelatedPersonCCCD,
          fullRelationship: `${rel.Relationship} của ${normalizedName}`,
          isTemp: false
        })),
        ...tempRelativesForShareholder.map(tr => ({
          name: tr.name,
          relationship: tr.relationship,
          identity: tr.identity,
          fullRelationship: `${tr.relationship} của ${normalizedName}`,
          isTemp: true
        }))
      ];
      
      if (allRelatives.length > 0) {
        map.set(key, {
          personName: normalizedName,
          personCode: company.Code,
          personIdentity: normalizedCCCD,
          relatives: allRelatives
        });
      }
    });
    
    return map;
  }, [company, shareholders, tempRelatives, relatedPersonsDataState]);

  // Calculate indirect subsidiaries using BFS with multiple path support
  const indirectSubsidiaries = useMemo(() => {
    if (!company || !company.ID || !allCompanies) return [];
    const allPaths = [];
    const queue = [];
    const visited = new Map(); // Track visited companies with their paths to allow multiple paths

    // Start with companies owned by the current company
    const directOwned = getOwnedCompanies(company);
    directOwned.forEach(({ company: child, ownership }) => {
      let ownershipRate = ownership / 100;
      
      // If ownership is 0, still add the path but with 0% (for display purposes)
      // This ensures direct relationships are shown even if ownership data is missing
      
      // Add direct relationship as a path
      const ownershipPercent = ownershipRate * 100;
      const directPathString = ownershipPercent > 0 
        ? `${company.Name} → ${child.Name} (${ownershipPercent.toFixed(1)}%)`
        : `${company.Name} → ${child.Name} (0%)`;
      
      allPaths.push({
        companyId: child.ID,
        company: child,
        ownershipType: 'Trực Tiếp',
        effectiveOwnership: ownershipPercent,
        path: [company.Name, child.Name],
        pathIds: [company.ID, child.ID],
        pathWithRates: [
          { name: company.Name, rate: null },
          { name: child.Name, rate: ownershipRate }
        ],
        pathString: directPathString,
        isDirect: true
      });
      
      // Add to queue for indirect calculation (even if ownership = 0 to explore all paths)
      // But skip if ownership is exactly 0 to avoid unnecessary calculations
      if (ownershipRate > 0 || ownershipRate === 0) {
        // Only add to queue if we want to explore further (ownership > 0)
        // For ownership = 0, we still show the direct path but don't explore further
        if (ownershipRate > 0) {
      queue.push({
        company: child,
        path: [company.Name, child.Name],
        pathIds: [company.ID, child.ID],
        pathWithRates: [
          { name: company.Name, rate: null },
          { name: child.Name, rate: ownershipRate }
        ],
        cumulativeOwnership: ownershipRate
      });
        }
      }
    });

    // BFS to find all indirect subsidiaries through all possible paths
    while (queue.length > 0) {
      const current = queue.shift();
      // Use getOwnedCompanies to find all companies owned by current company (not just by ParentID)
      const ownedCompanies = getOwnedCompanies(current.company);

      ownedCompanies.forEach(({ company: child, ownership }) => {
        // Check for circular reference (avoid infinite loops)
        if (current.pathIds.includes(child.ID)) {
          return; // Skip this path if it creates a cycle
        }

        const childOwnershipRate = ownership / 100;
        
        const newOwnership = current.cumulativeOwnership * childOwnershipRate;
        const newPath = [...current.path, child.Name];
        const newPathIds = [...current.pathIds, child.ID];
        const newPathWithRates = [
          ...current.pathWithRates,
          { name: child.Name, rate: childOwnershipRate }
        ];

        // Create detailed ownership string
        const pathString = newPathWithRates
          .map((step, index) => {
            if (index === 0) return step.name;
            return `${step.name} (${(step.rate * 100).toFixed(1)}%)`;
          })
          .join(' → ');

        // Add all indirect paths (length > 2 means at least one intermediate company)
        if (newPath.length > 2) {
          allPaths.push({
            companyId: child.ID,
            company: child,
            ownershipType: 'Gián Tiếp',
            effectiveOwnership: newOwnership * 100,
            path: newPath,
            pathIds: newPathIds,
            pathWithRates: newPathWithRates,
            pathString: pathString
          });
        }

        // Continue searching from this child if ownership is meaningful (>= 1%)
        if (newOwnership * 100 >= 1) {
          queue.push({
            company: child,
            path: newPath,
            pathIds: newPathIds,
            pathWithRates: newPathWithRates,
            cumulativeOwnership: newOwnership
          });
        }
      });
    }

    // Group by company Name - Theo IFRS 10: Không cộng dồn % từ nhiều nhánh
    // Mỗi nhánh được đánh giá độc lập theo mức độ kiểm soát
    const companyMap = new Map();
    
    allPaths.forEach(pathData => {
      const companyName = pathData.company.Name;
      
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, {
          ...pathData.company,
          ownershipType: pathData.isDirect ? 'Trực Tiếp' : 'Gián Tiếp',
          paths: [],
          allIds: new Set()
        });
      }
      
      const companyData = companyMap.get(companyName);
      companyData.allIds.add(pathData.companyId);
      
      // Update ownershipType if this is a direct path (direct takes priority)
      if (pathData.isDirect) {
        companyData.ownershipType = 'Trực Tiếp';
      }
      
      companyData.paths.push({
        pathString: pathData.pathString,
        ownership: pathData.effectiveOwnership,
        isDirect: pathData.isDirect || false
      });
    });

    // Convert map to array và phân loại theo IFRS 10 & IAS 28
    return Array.from(companyMap.values())
      .map(item => {
      // Lấy nhánh có % cao nhất để xác định mức độ kiểm soát
      const maxOwnership = Math.max(...item.paths.map(p => p.ownership));
      
      // Phân loại theo chuẩn mực:
      // IFRS 10: Control (Subsidiary) khi > 50%
      // IAS 28: Significant Influence (Associate) khi 20-50%
      // < 20%: Chỉ là investment, không có ảnh hưởng đáng kể
        let controlType = '';
      if (maxOwnership > 50) {
          controlType = 'Công ty con (Subsidiary - IFRS 10)';
      } else if (maxOwnership >= 20) {
          controlType = 'Công ty liên kết (Associate - IAS 28)';
        } else {
          controlType = 'Đầu tư không kiểm soát (Investment)';
        }
        
        return {
          ...item,
        effectiveOwnership: maxOwnership, // Lấy % cao nhất, không cộng dồn
          controlType: controlType,
          pathCount: item.paths.length,
          hasMultiplePaths: item.paths.length > 1,
        // Use the first ID for React key
          ID: item.ID || Array.from(item.allIds)[0]
        };
      })
      .filter(item => {
        // Tab "Tất cả các nhánh sở hữu" should show all paths for visibility
        // Only filter out if ownership is negative (shouldn't happen, but safety check)
        return item.effectiveOwnership >= 0;
      });
  }, [company, allCompanies, threshold]);

  // Filter equityInterestSubsidiaries for display in tab (only >= 50%)
  const equityInterestSubsidiariesDisplay = useMemo(() => {
    return equityInterestSubsidiaries.filter(item => item.effectiveOwnership >= 50);
  }, [equityInterestSubsidiaries]);

  // Get all related companies with ownership < 50% (from equity interest only, to have full paths info)
  const relatedCompanies = useMemo(() => {
    if (!company || !allCompanies) return [];
    
    // Only use equityInterestSubsidiaries because it has full paths information
    // Filter for < 50% but >= threshold
    return equityInterestSubsidiaries
      .filter(sub => sub.effectiveOwnership < 50 && sub.effectiveOwnership >= threshold)
      .sort((a, b) => b.effectiveOwnership - a.effectiveOwnership);
  }, [company, allCompanies, equityInterestSubsidiaries, threshold]);

  // Get lịch sử đăng ký kinh doanh for this company
  const lsdkkdRecords = useMemo(() => {
    if (!company || !lsdkkdData) return [];
    return lsdkkdData
      .filter(record => record.Code === company.Code)
      .sort((a, b) => {
        // Sort by Loai first (Công ty before Chi Nhánh/VPĐD), then by Lan
        if (a.Loai !== b.Loai) {
          return a.Loai === 'Công ty' ? -1 : 1;
        }
        return a.Lan - b.Lan;
      });
  }, [company]);

  // Get địa điểm kinh doanh for this company
  const ddkdRecords = useMemo(() => {
    if (!company || !ddkdData) return [];
    return ddkdData
      .filter(record => record.Code === company.Code)
      .sort((a, b) => {
        // Sort by Loai first (Chi nhánh before Địa điểm kinh doanh), then by TinhTrang (Đang hoạt động first)
        if (a.Loai !== b.Loai) {
          return a.Loai === 'Chi nhánh' ? -1 : 1;
        }
        if (a.TinhTrang !== b.TinhTrang) {
          return a.TinhTrang === 'Đang hoạt động' ? -1 : 1;
        }
        return a.TenDDKD.localeCompare(b.TenDDKD);
      });
  }, [company]);

  return (
    <div>
      <h2>{company.Name}</h2>
      
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Người Quản Lý
        </button>
        <button
          className={`tab ${activeTab === 'shareholders' ? 'active' : ''}`}
          onClick={() => setActiveTab('shareholders')}
        >
          Cổ Đông
        </button>
        <button
          className={`tab ${activeTab === 'direct' ? 'active' : ''}`}
          onClick={() => setActiveTab('direct')}
        >
          Công Ty Con
        </button>
        <button
          className={`tab ${activeTab === 'equity' ? 'active' : ''}`}
          onClick={() => setActiveTab('equity')}
        >
          Công Ty Con Gián Tiếp (Equity)
        </button>
        <button
          className={`tab ${activeTab === 'related' ? 'active' : ''}`}
          onClick={() => setActiveTab('related')}
        >
          Công Ty Liên Quan (&lt;50%)
        </button>
        <button
          className={`tab ${activeTab === 'relatedParties' ? 'active' : ''}`}
          onClick={() => setActiveTab('relatedParties')}
        >
          Bên Liên Quan
        </button>
        <button
          className={`tab ${activeTab === 'lsdkkd' ? 'active' : ''}`}
          onClick={() => setActiveTab('lsdkkd')}
        >
          Lịch Sử ĐKKD
        </button>
        <button
          className={`tab ${activeTab === 'ddkd' ? 'active' : ''}`}
          onClick={() => setActiveTab('ddkd')}
        >
          Địa Điểm Kinh Doanh
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'members' && (
          <div>
            {companyMembers.length > 0 ? (
              <>
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '12px', 
                  background: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  <strong>📋 Thông Tin Thành Viên:</strong>
                  <br />
                  • Hiển thị tất cả thành viên của công ty
                  <br />
                  • Bao gồm các chức vụ: Tổng Giám đốc, Phó Tổng Giám đốc, Giám đốc, v.v.
                  <br />
                  • Nhấn nút "Xem người thân" để xem danh sách người thân của từng thành viên
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Tên Thành Viên</th>
                      <th>Chức Vụ</th>
                      <th>CCCD</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyMembers.map(member => {
                      // Normalize key: ensure CCCD is converted to string and trimmed
                      const normalizedCCCD = member.CCCD ? member.CCCD.toString().trim() : '';
                      const memberKey = `${company.Code}_${member.Name}_${normalizedCCCD}`;
                      const hasRelatives = membersRelativesMap.has(memberKey);
                      
                      return (
                        <tr key={member.ID}>
                          <td>
                            <strong>{member.Name}</strong>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: member.ChucVu.includes('Tổng Giám đốc') ? '#e8f5e9' : 
                                         member.ChucVu.includes('Phó') ? '#fff3e0' : '#f5f5f5',
                              color: member.ChucVu.includes('Tổng Giám đốc') ? '#2e7d32' : 
                                     member.ChucVu.includes('Phó') ? '#e65100' : '#666'
                            }}>
                              {member.ChucVu}
                            </span>
                          </td>
                          <td>
                            <code style={{ 
                              background: '#f5f5f5', 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {member.CCCD || 'N/A'}
                            </code>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {hasRelatives && (
                                <button
                                  onClick={() => {
                                    setSelectedPersonForRelatives(memberKey);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#2196f3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = '#1976d2'}
                                  onMouseLeave={(e) => e.target.style.background = '#2196f3'}
                                >
                                  👥 Xem người thân
                                </button>
                              )}
                              <button
                                onClick={() => setShowAddRelativeForm(memberKey)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#4caf50',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#45a049'}
                                onMouseLeave={(e) => e.target.style.background = '#4caf50'}
                              >
                                ➕ Thêm người thân
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>Không có thành viên</h3>
                <p>Không tìm thấy thành viên nào cho công ty này</p>
              </div>
            )}
            
            {/* Form popup for adding new relative */}
            {showAddRelativeForm && (
              <AddRelativeForm
                memberKey={showAddRelativeForm}
                member={companyMembers.find(m => {
                  const normalizedCCCD = m.CCCD ? m.CCCD.toString().trim() : '';
                  return `${company.Code}_${m.Name}_${normalizedCCCD}` === showAddRelativeForm;
                })}
                companyCode={company.Code}
                onClose={() => setShowAddRelativeForm(null)}
                onSave={(relativeData) => {
                  setTempRelatives([...tempRelatives, {
                    memberKey: showAddRelativeForm,
                    ...relativeData
                  }]);
                  setShowAddRelativeForm(null);
                }}
                onUpdateRelatedPersons={setRelatedPersonsDataState}
              />
            )}
          </div>
        )}

        {activeTab === 'direct' && (
          <div>
            {directSubsidiaries.length > 0 ? (
              <>
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '12px', 
                  background: '#e8f5e9', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#2e7d32'
                }}>
                  <strong>📋 Chuẩn Mực Áp Dụng:</strong>
                  <br />
                  • <strong>IFRS 10 (Control):</strong> Công ty con khi sở hữu trực tiếp <strong>&gt;50%</strong>
                  <br />
                  • <strong>IAS 28 (Significant Influence):</strong> Công ty liên kết khi <strong>20-50%</strong>
                  <br />
                  • <strong>Investment:</strong> Đầu tư không có ảnh hưởng đáng kể khi <strong>&lt;20%</strong>
                  <br />
                  <br />
                  <strong>📊 Hiển thị:</strong> Công ty được sở hữu trực tiếp (không qua trung gian) với tỷ lệ ≥ {threshold}%
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Tên Công Ty</th>
                      <th>MST</th>
                      <th>Loại Hình</th>
                      <th>Vốn Điều Lệ</th>
                      <th>Trạng Thái</th>
                      <th>Phân Loại Theo Chuẩn Mực</th>
                      <th>Tỷ Lệ Sở Hữu Trực Tiếp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directSubsidiaries.map(sub => {
                      // Màu sắc theo mức độ kiểm soát
                      let ownershipColor = '#666';
                      if (sub.effectiveOwnership > 50) ownershipColor = '#4caf50'; // Subsidiary
                      else if (sub.effectiveOwnership >= 20) ownershipColor = '#ff9800'; // Associate
                      else ownershipColor = '#9e9e9e'; // Investment
                      
                      // Format vốn điều lệ
                      const formatCurrency = (value) => {
                        if (!value) return 'N/A';
                        return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
                      };
                      
                      return (
                        <tr key={sub.ID}>
                          <td>
                            <strong>{sub.Name}</strong>
                          </td>
                          <td>{sub.MST || 'N/A'}</td>
                          <td>{sub.LoaiHinh || 'N/A'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(sub.VonDieuLe)}
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: sub.TrangThai === 'Đang hoạt động' ? '#e8f5e9' : '#ffebee',
                              color: sub.TrangThai === 'Đang hoạt động' ? '#2e7d32' : '#c62828'
                            }}>
                              {sub.TrangThai || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div style={{ 
                              padding: '6px 12px',
                              background: sub.effectiveOwnership > 50 ? '#e8f5e9' : 
                                         sub.effectiveOwnership >= 20 ? '#fff3e0' : '#f5f5f5',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              color: ownershipColor,
                              display: 'inline-block'
                            }}>
                              {sub.controlType}
                              </div>
                        </td>
                          <td>
                            <strong style={{ color: ownershipColor, fontSize: '18px' }}>
                              {sub.effectiveOwnership.toFixed(2)}%
                            </strong>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📂</div>
                <h3>Không có công ty con trực tiếp</h3>
                <p>Không tìm thấy công ty nào với sở hữu trực tiếp ≥ {threshold}%</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shareholders' && (
          <div>
            {shareholders.length > 0 ? (
              <>
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '12px', 
                  background: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  <strong>📋 Thông Tin Cổ Đông:</strong>
                  <br />
                  • Hiển thị tất cả cổ đông của công ty
                  <br />
                  • Trạng thái: "Active" nếu ngày hiện tại ≤ Ngày kết thúc và TrangThai = "Active"
                  <br />
                  • Tự động phân bổ lại % nếu có cổ đông inactive
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Cổ Đông</th>
                      <th>MST/CCCD/HC</th>
                      <th>Loại CD</th>
                      <th>Tỷ Lệ Sở Hữu (%)</th>
                      <th>Từ Ngày</th>
                      <th>Đến Ngày</th>
                      <th>Trạng Thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareholders.map(sh => {
                      const statusClass = sh.isActive ? 'status-active' : 'status-inactive';
                      const statusText = sh.isActive ? 'Active' : 'Inactive';
                      
                      // Check if this is an individual shareholder with ownership >= 10% and active
                      const isEligibleForRelatives = sh.LoaiCD === 'Cá nhân' && 
                                                     sh.Ownership >= 10 && 
                                                     sh.TrangThai === 'Active' && 
                                                     sh.isActive;
                      
                      // Create key for shareholder
                      const normalizedCCCD = sh.MSTCCCDHC ? sh.MSTCCCDHC.toString().trim() : '';
                      const normalizedName = sh.PersonaOrg ? sh.PersonaOrg.trim() : '';
                      const shareholderKey = `${company.Code}_SHAREHOLDER_${normalizedName}_${normalizedCCCD}`;
                      const hasRelatives = isEligibleForRelatives && shareholdersRelativesMap.has(shareholderKey);
                      
                      return (
                        <tr key={sh.ID}>
                          <td>
                            <strong>{sh.PersonaOrg}</strong>
                          </td>
                          <td>{sh.MSTCCCDHC || 'N/A'}</td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: sh.LoaiCD === 'Cá nhân' ? '#e3f2fd' : '#fff3e0',
                              color: sh.LoaiCD === 'Cá nhân' ? '#1565c0' : '#e65100'
                            }}>
                              {sh.LoaiCD || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontSize: '18px', color: '#667eea' }}>
                              {sh.Ownership.toFixed(2)}%
                            </strong>
                          </td>
                          <td>{formatDate(sh.From)}</td>
                          <td>{formatDate(sh.To)}</td>
                          <td>
                            <span className={`status-badge ${statusClass}`}>
                              {statusText}
                            </span>
                          </td>
                          <td>
                            {isEligibleForRelatives && (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {hasRelatives && (
                                  <button
                                    onClick={() => setSelectedPersonForRelatives(shareholderKey)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#2196f3',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#1976d2'}
                                    onMouseLeave={(e) => e.target.style.background = '#2196f3'}
                                  >
                                    👥 Xem người thân
                                  </button>
                                )}
                                <button
                                  onClick={() => setShowAddRelativeForm(shareholderKey)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = '#45a049'}
                                  onMouseLeave={(e) => e.target.style.background = '#4caf50'}
                                >
                                  ➕ Thêm người thân
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>Không có cổ đông</h3>
                <p>Không tìm thấy cổ đông nào cho công ty này</p>
              </div>
            )}
          </div>
        )}

        {/* Tab "Tất Cả Các Nhánh Sở Hữu" đã được ẩn */}
        {false && activeTab === 'indirect' && (
          <div>
            {indirectSubsidiaries.length > 0 ? (
              <>
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '12px', 
                  background: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  <strong>📋 Chuẩn Mực Áp Dụng:</strong>
                  <br />
                  • <strong>IFRS 10 (Control):</strong> Công ty con khi sở hữu <strong>&gt;50%</strong>
                  <br />
                  • <strong>IAS 28 (Significant Influence):</strong> Công ty liên kết khi sở hữu <strong>20-50%</strong>
                  <br />
                  • <strong>Investment:</strong> Đầu tư không có ảnh hưởng đáng kể khi <strong>&lt;20%</strong>
                  <br />
                  <br />
                  <strong>📊 Hiển thị:</strong> Công ty có nhánh sở hữu cao nhất ≥ {threshold}%
                  <br />
                  • Hiển thị tất cả các nhánh (bao gồm cả trực tiếp và gián tiếp)
                  <br />
                  • Nhánh có badge <span style={{ background: '#4caf50', color: 'white', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>Trực tiếp</span> là sở hữu trực tiếp
                  <br />
                  • Các nhánh khác là sở hữu gián tiếp qua công ty trung gian
                  <br />
                  <br />
                  <strong>⚠️ Lưu ý:</strong> Khi có nhiều nhánh, hệ thống lấy <strong>nhánh cao nhất</strong> để xác định mức độ kiểm soát và lọc theo ngưỡng. KHÔNG cộng dồn các nhánh.
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Tên Công Ty</th>
                      <th>Code</th>
                      <th>MST</th>
                      <th>Loại Hình</th>
                      <th>Vốn Điều Lệ</th>
                      <th>Trạng Thái</th>
                      <th>Phân Loại Theo Chuẩn Mực</th>
                      <th>% Sở Hữu Cao Nhất</th>
                      <th>Số Nhánh</th>
                      <th>Chi Tiết Các Nhánh Sở Hữu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indirectSubsidiaries.map(sub => {
                      // Màu sắc theo mức độ kiểm soát
                      let ownershipColor = '#666';
                      if (sub.effectiveOwnership > 50) ownershipColor = '#4caf50'; // Subsidiary
                      else if (sub.effectiveOwnership >= 20) ownershipColor = '#ff9800'; // Associate
                      else ownershipColor = '#9e9e9e'; // Investment
                      
                      // Format vốn điều lệ
                      const formatCurrency = (value) => {
                        if (!value) return 'N/A';
                        return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
                      };
                      
                      return (
                        <tr key={sub.ID}>
                          <td>
                            <strong>{sub.Name}</strong>
                          </td>
                          <td>{sub.MST || 'N/A'}</td>
                          <td>{sub.LoaiHinh || 'N/A'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(sub.VonDieuLe)}
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: sub.TrangThai === 'Đang hoạt động' ? '#e8f5e9' : '#ffebee',
                              color: sub.TrangThai === 'Đang hoạt động' ? '#2e7d32' : '#c62828'
                            }}>
                              {sub.TrangThai || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div style={{ 
                              padding: '6px 12px',
                              background: sub.effectiveOwnership > 50 ? '#e8f5e9' : 
                                         sub.effectiveOwnership >= 20 ? '#fff3e0' : '#f5f5f5',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              color: ownershipColor
                            }}>
                              {sub.controlType}
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: ownershipColor, fontSize: '18px' }}>
                              {sub.effectiveOwnership.toFixed(2)}%
                            </strong>
                            {sub.hasMultiplePaths && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                (Cao nhất trong {sub.pathCount} nhánh)
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              background: sub.pathCount > 1 ? '#ff9800' : '#4caf50',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              fontSize: '13px'
                            }}>
                              {sub.pathCount}
                            </span>
                          </td>
                          <td>
                            {sub.paths
                              .sort((a, b) => b.ownership - a.ownership) // Sắp xếp từ cao xuống thấp
                              .map((pathInfo, idx) => (
                                <div key={idx} style={{ marginBottom: idx < sub.paths.length - 1 ? '12px' : '0' }}>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: '#666', 
                                    marginBottom: '4px',
                                    fontWeight: 'bold'
                                  }}>
                                    Nhánh {idx + 1}: {pathInfo.ownership.toFixed(2)}%
                                    {idx === 0 && sub.pathCount > 1 && ' ⭐ (Cao nhất)'}
                                    {pathInfo.isDirect && (
                                      <span style={{
                                        marginLeft: '8px',
                                        background: '#4caf50',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px'
                                      }}>
                                        Trực tiếp
                                      </span>
                                    )}
                                  </div>
                                  <div className="ownership-path">{pathInfo.pathString}</div>
                                </div>
                              ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔗</div>
                <h3>Không có công ty con</h3>
                <p>Không tìm thấy công ty nào với nhánh sở hữu cao nhất ≥ {threshold}%</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'equity' && (
          <div>
            {equityInterestSubsidiariesDisplay.length > 0 ? (
              <>
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '12px', 
                  background: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  <strong>📋 Chuẩn Mực Áp Dụng:</strong>
                  <br />
                  • <strong>IFRS 10 (Control):</strong> Công ty con khi tổng equity interest <strong>&gt;50%</strong>
                  <br />
                  • <strong>IAS 28 (Significant Influence):</strong> Công ty liên kết khi <strong>20-50%</strong>
                  <br />
                  • <strong>Investment:</strong> Đầu tư không có ảnh hưởng đáng kể khi <strong>&lt;20%</strong>
                  <br />
                  <br />
                  <strong>📊 Phương pháp tính:</strong> <strong>CỘNG DỒN</strong> tất cả các nhánh sở hữu (Equity Interest)
                  <br />
                  • Tổng equity interest = Nhánh 1 + Nhánh 2 + Nhánh 3 + ...
                  <br />
                  • Chỉ hiển thị công ty có tổng equity interest <strong>≥ 50%</strong>
                  <br />
                  • <strong>Không hiển thị</strong> công ty đã sở hữu trực tiếp &gt;50% (đã là subsidiary rồi)
                  <br />
                  <br />
                  <strong>⚠️ Lưu ý:</strong> Theo IAS 27/IFRS 10, equity interest được tính bằng <strong>tổng tất cả các nhánh</strong>, khác với việc xác định mức độ kiểm soát (control) chỉ dựa vào nhánh cao nhất.
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Tên Công Ty</th>
                      <th>MST</th>
                      <th>Loại Hình</th>
                      <th>Vốn Điều Lệ</th>
                      <th>Trạng Thái</th>
                      <th>Phân Loại Theo Chuẩn Mực</th>
                      <th>Tổng Equity Interest (%)</th>
                      <th>Số Nhánh</th>
                      <th>Chi Tiết Các Nhánh Sở Hữu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equityInterestSubsidiariesDisplay.map(sub => {
                      // Màu sắc theo mức độ kiểm soát
                      let ownershipColor = '#666';
                      if (sub.effectiveOwnership > 50) ownershipColor = '#4caf50'; // Subsidiary
                      else if (sub.effectiveOwnership >= 20) ownershipColor = '#ff9800'; // Associate
                      else ownershipColor = '#9e9e9e'; // Investment
                      
                      // Format vốn điều lệ
                      const formatCurrency = (value) => {
                        if (!value) return 'N/A';
                        return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
                      };
                      
                      return (
                        <tr key={sub.ID}>
                          <td>
                            <strong>{sub.Name}</strong>
                          </td>
                          <td>{sub.MST || 'N/A'}</td>
                          <td>{sub.LoaiHinh || 'N/A'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(sub.VonDieuLe)}
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: sub.TrangThai === 'Đang hoạt động' ? '#e8f5e9' : '#ffebee',
                              color: sub.TrangThai === 'Đang hoạt động' ? '#2e7d32' : '#c62828'
                            }}>
                              {sub.TrangThai || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div style={{ 
                              padding: '6px 12px',
                              background: sub.effectiveOwnership > 50 ? '#e8f5e9' : 
                                         sub.effectiveOwnership >= 20 ? '#fff3e0' : '#f5f5f5',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              color: ownershipColor
                            }}>
                              {sub.controlType}
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: ownershipColor, fontSize: '18px' }}>
                              {sub.effectiveOwnership.toFixed(2)}%
                            </strong>
                            {sub.hasMultiplePaths && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                (Tổng từ {sub.pathCount} nhánh)
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              background: sub.pathCount > 1 ? '#ff9800' : '#4caf50',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              fontSize: '13px'
                            }}>
                              {sub.pathCount}
                            </span>
                          </td>
                          <td>
                            {sub.paths
                              .sort((a, b) => b.ownership - a.ownership) // Sắp xếp từ cao xuống thấp
                              .map((pathInfo, idx) => (
                                <div key={idx} style={{ marginBottom: idx < sub.paths.length - 1 ? '12px' : '0' }}>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: '#666', 
                                    marginBottom: '4px',
                                    fontWeight: 'bold'
                                  }}>
                                    Nhánh {idx + 1}: {pathInfo.ownership.toFixed(2)}%
                                    {pathInfo.isDirect ? (
                                      <span style={{
                                        marginLeft: '8px',
                                        background: '#4caf50',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px'
                                      }}>
                                        Trực tiếp
                                      </span>
                                    ) : (
                                      <span style={{
                                        marginLeft: '8px',
                                        background: '#ff9800',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px'
                                      }}>
                                        Gián tiếp
                                      </span>
                                    )}
                                  </div>
                                  <div className="ownership-path">{pathInfo.pathString}</div>
                                </div>
                              ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔗</div>
                <h3>Không có công ty con gián tiếp</h3>
                <p>Không tìm thấy công ty nào với tổng equity interest ≥ 50%</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'related' && (
          <div>
            {relatedCompanies.length > 0 ? (
              <>
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '12px', 
                  background: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  <strong>📋 Chuẩn Mực Áp Dụng:</strong>
                  <br />
                  • <strong>IFRS 10 (Control):</strong> Công ty con khi tổng equity interest <strong>&gt;50%</strong>
                  <br />
                  • <strong>IAS 28 (Significant Influence):</strong> Công ty liên kết khi <strong>20-50%</strong>
                  <br />
                  • <strong>Investment:</strong> Đầu tư không có ảnh hưởng đáng kể khi <strong>&lt;20%</strong>
                  <br />
                  <br />
                  <strong>📊 Phương pháp tính:</strong> <strong>CỘNG DỒN</strong> tất cả các nhánh sở hữu (Equity Interest)
                  <br />
                  • Tổng equity interest = Nhánh 1 + Nhánh 2 + Nhánh 3 + ...
                  <br />
                  • Chỉ hiển thị công ty có tổng equity interest <strong>&lt;50%</strong> nhưng <strong>≥ {threshold}%</strong>
                  <br />
                  • <strong>Không hiển thị</strong> công ty đã sở hữu trực tiếp &gt;50% (đã là subsidiary rồi)
                  <br />
                  <br />
                  <strong>⚠️ Lưu ý:</strong> Theo IAS 27/IFRS 10, equity interest được tính bằng <strong>tổng tất cả các nhánh</strong>, khác với việc xác định mức độ kiểm soát (control) chỉ dựa vào nhánh cao nhất.
      </div>
                <table>
                  <thead>
                    <tr>
                      <th>Tên Công Ty</th>
                      <th>MST</th>
                      <th>Loại Hình</th>
                      <th>Vốn Điều Lệ</th>
                      <th>Trạng Thái</th>
                      <th>Phân Loại Theo Chuẩn Mực</th>
                      <th>Tổng Equity Interest (%)</th>
                      <th>Số Nhánh</th>
                      <th>Chi Tiết Các Nhánh Sở Hữu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedCompanies.map(sub => {
                      // Màu sắc theo mức độ kiểm soát
                      let ownershipColor = '#666';
                      if (sub.effectiveOwnership > 50) ownershipColor = '#4caf50'; // Subsidiary
                      else if (sub.effectiveOwnership >= 20) ownershipColor = '#ff9800'; // Associate
                      else ownershipColor = '#9e9e9e'; // Investment
                      
                      // Format vốn điều lệ
                      const formatCurrency = (value) => {
                        if (!value) return 'N/A';
                        return new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ';
                      };
                      
                      return (
                        <tr key={sub.ID}>
                          <td>
                            <strong>{sub.Name}</strong>
                          </td>
                          <td>{sub.MST || 'N/A'}</td>
                          <td>{sub.LoaiHinh || 'N/A'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(sub.VonDieuLe)}
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: sub.TrangThai === 'Đang hoạt động' ? '#e8f5e9' : '#ffebee',
                              color: sub.TrangThai === 'Đang hoạt động' ? '#2e7d32' : '#c62828'
                            }}>
                              {sub.TrangThai || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div style={{ 
                              padding: '6px 12px',
                              background: sub.effectiveOwnership > 50 ? '#e8f5e9' : 
                                         sub.effectiveOwnership >= 20 ? '#fff3e0' : '#f5f5f5',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              color: ownershipColor
                            }}>
                              {sub.controlType}
    </div>
                          </td>
                          <td>
                            <strong style={{ color: ownershipColor, fontSize: '18px' }}>
                              {sub.effectiveOwnership.toFixed(2)}%
                            </strong>
                            {sub.hasMultiplePaths && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                (Tổng từ {sub.pathCount} nhánh)
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              background: sub.pathCount > 1 ? '#ff9800' : '#4caf50',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              fontSize: '13px'
                            }}>
                              {sub.pathCount || 1}
                            </span>
                          </td>
                          <td>
                            {sub.paths && sub.paths.length > 0 ? (
                              sub.paths
                                .sort((a, b) => b.ownership - a.ownership) // Sắp xếp từ cao xuống thấp
                                .map((pathInfo, idx) => (
                                  <div key={idx} style={{ marginBottom: idx < sub.paths.length - 1 ? '12px' : '0' }}>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: '#666', 
                                      marginBottom: '4px',
                                      fontWeight: 'bold'
                                    }}>
                                      Nhánh {idx + 1}: {pathInfo.ownership.toFixed(2)}%
                                      {pathInfo.isDirect ? (
                                        <span style={{
                                          marginLeft: '8px',
                                          background: '#4caf50',
                                          color: 'white',
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          fontSize: '11px'
                                        }}>
                                          Trực tiếp
                                        </span>
                                      ) : (
                                        <span style={{
                                          marginLeft: '8px',
                                          background: '#ff9800',
                                          color: 'white',
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          fontSize: '11px'
                                        }}>
                                          Gián tiếp
                                        </span>
                                      )}
                                    </div>
                                    <div className="ownership-path">{pathInfo.pathString}</div>
                                  </div>
                                ))
                            ) : (
                              <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                                Không có thông tin nhánh
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔗</div>
                <h3>Không có công ty con gián tiếp</h3>
                <p>Không tìm thấy công ty nào với tổng equity interest &lt;50% và ≥ {threshold}%</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'relatedParties' && (
          <div>
            {relatedPartiesWithoutRelatives.length > 0 ? (
              <>
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '12px', 
                  background: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  <strong>📋 Bên Liên Quan:</strong>
                  <br />
                  • Hiển thị tất cả cá nhân và tổ chức có tỉ lệ sở hữu từ <strong>10% trở lên</strong>
                  <br />
                  • Tổ chức: Công ty mẹ, công ty con trực tiếp, công ty con gián tiếp, và các tổ chức khác (cổ đông)
                  <br />
                  • Cá nhân: Thành viên và cổ đông cá nhân có tỉ lệ sở hữu ≥ 10%
                  <br />
                  • Nhấn nút "Xem người thân" để xem danh sách người thân của từng cá nhân
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Bên Liên Quan</th>
                      <th>Loại</th>
                      <th>Mối quan hệ</th>
                      <th>MST/CCCD</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedPartiesWithoutRelatives.map((party, idx) => {
                      // Check if this person has relatives
                      // For shareholders, use the shareholder key format
                      let personKey;
                      let hasRelatives = false;
                      
                      // Check if this is a shareholder (has Ownership > 0 and MoiQuanHe contains "Cổ đông")
                      const isShareholder = party.Ownership > 0 && party.MoiQuanHe && party.MoiQuanHe.includes('Cổ đông');
                      
                      if (isShareholder && party.Loai === 'Cá Nhân') {
                        // Use shareholder key format
                        const normalizedName = party.Name ? party.Name.trim() : '';
                        const normalizedCCCD = party.Identity ? party.Identity.toString().trim() : '';
                        personKey = `${party.Code}_SHAREHOLDER_${normalizedName}_${normalizedCCCD}`;
                        hasRelatives = shareholdersRelativesMap.has(personKey);
                      } else {
                        // Use regular member key format
                        const normalizedCCCD = party.Identity ? party.Identity.toString().trim() : '';
                        personKey = `${party.Code}_${party.Name}_${normalizedCCCD}`;
                        hasRelatives = relativesByPerson.has(personKey) || membersRelativesMap.has(personKey);
                      }
                      
                      return (
                        <tr key={idx}>
                          <td>
                            <div>
                              <strong>{party.Name}</strong>
                              {party.CompanyName && party.CompanyName !== company.Name && party.Loai !== 'Tổ chức' && (
                                <div style={{ 
                                  fontSize: '11px', 
                                  color: '#666', 
                                  marginTop: '2px',
                                  fontStyle: 'italic'
                                }}>
                                  {party.CompanyName}
                                </div>
                              )}
                              {party.Level && (
                                <span style={{
                                  marginLeft: '8px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  background: party.Level === 'Công ty mẹ' ? '#f3e5f5' :
                                            party.Level === 'Công ty hiện tại' ? '#e8f5e9' :
                                            party.Level === 'Công ty con trực tiếp' ? '#fff3e0' : '#e3f2fd',
                                  color: party.Level === 'Công ty mẹ' ? '#7b1fa2' :
                                         party.Level === 'Công ty hiện tại' ? '#2e7d32' :
                                         party.Level === 'Công ty con trực tiếp' ? '#e65100' : '#1565c0'
                                }}>
                                  {party.Level}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: party.Loai === 'Tổ chức' ? '#2196f3' : '#9e9e9e',
                              color: 'white'
                            }}>
                              {party.Loai || 'N/A'}
                            </span>
                          </td>
                          <td>{party.MoiQuanHe || 'N/A'}</td>
                          <td>
                            <code style={{ 
                              background: '#f5f5f5', 
                              padding: '4px 8px', 
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {party.Identity || 'N/A'}
                            </code>
                          </td>
                          <td>
                            {party.Loai === 'Cá Nhân' && (
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {hasRelatives && (
                                  <button
                                    onClick={() => setSelectedPersonForRelatives(personKey)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#2196f3',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#1976d2'}
                                    onMouseLeave={(e) => e.target.style.background = '#2196f3'}
                                  >
                                    👥 Xem người thân
                                  </button>
                                )}
                                {/* Show "Thêm người thân" button for shareholders with ownership >= 10% and active */}
                                {isShareholder && party.Ownership >= 10 && party.TrangThai === 'Active' && (
                                  <button
                                    onClick={() => setShowAddRelativeForm(personKey)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#4caf50',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#45a049'}
                                    onMouseLeave={(e) => e.target.style.background = '#4caf50'}
                                  >
                                    ➕ Thêm người thân
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>Không có bên liên quan</h3>
                <p>Không tìm thấy bên liên quan nào cho công ty này</p>
              </div>
            )}
            
          </div>
        )}

        {activeTab === 'lsdkkd' && (
          <div>
            {lsdkkdRecords.length > 0 ? (
              <>
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '12px', 
                  background: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  <strong>📋 Lịch Sử Đăng Ký Kinh Doanh:</strong>
                  <br />
                  • Hiển thị tất cả các lần đăng ký kinh doanh của công ty
                  <br />
                  • Bao gồm cả công ty và chi nhánh/văn phòng đại diện
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Lần</th>
                      <th>Thời gian</th>
                      <th>Chi tiết</th>
                      <th>Loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lsdkkdRecords.map(record => (
                      <tr key={record.ID}>
                        <td>
                          <strong>{record.Lan}</strong>
                        </td>
                        <td>
                          {record.ThoiGian ? formatDate(record.ThoiGian) : record.ThoiGianDisplay}
                        </td>
                        <td style={{ maxWidth: '600px', wordWrap: 'break-word' }}>
                          {record.ChiTiet}
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: record.Loai === 'Công ty' ? '#4caf50' : '#ff9800',
                            color: 'white'
                          }}>
                            {record.Loai}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <h3>Không có lịch sử đăng ký kinh doanh</h3>
                <p>Không tìm thấy lịch sử đăng ký kinh doanh nào cho công ty này</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ddkd' && (
          <div>
            {ddkdRecords.length > 0 ? (
              <>
                <div style={{ 
                  marginBottom: '15px', 
                  padding: '12px', 
                  background: '#e3f2fd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  <strong>📍 Địa Điểm Kinh Doanh:</strong>
                  <br />
                  • Hiển thị tất cả địa điểm kinh doanh và chi nhánh của công ty
                  <br />
                  • Bao gồm thông tin địa chỉ, người đứng đầu, và tình trạng hoạt động
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Tên ĐKKD</th>
                      <th>Đơn vị chủ quản</th>
                      <th>Mã số đăng ký</th>
                      <th>Địa chỉ</th>
                      <th>Người đứng đầu</th>
                      <th>Vị trí</th>
                      <th>Loại</th>
                      <th>Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ddkdRecords.map(record => (
                      <tr key={record.ID}>
                        <td>
                          <strong>{record.TenDDKD}</strong>
                        </td>
                        <td>{record.DonViChuQuan || 'N/A'}</td>
                        <td>
                          <code style={{ 
                            background: '#f5f5f5', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {record.MaSoDangKy || 'N/A'}
                          </code>
                        </td>
                        <td style={{ maxWidth: '400px', wordWrap: 'break-word' }}>
                          {record.DiaChi || 'N/A'}
                        </td>
                        <td>{record.NguoiDungDau || 'N/A'}</td>
                        <td>{record.ViTri || 'N/A'}</td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: record.Loai === 'Chi nhánh' ? '#2196f3' : '#9c27b0',
                            color: 'white'
                          }}>
                            {record.Loai}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: record.TinhTrang === 'Đang hoạt động' ? '#4caf50' : '#f44336',
                            color: 'white'
                          }}>
                            {record.TinhTrang}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📍</div>
                <h3>Không có địa điểm kinh doanh</h3>
                <p>Không tìm thấy địa điểm kinh doanh nào cho công ty này</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Popup/Modal for showing relatives - Outside tabs so it works for both tabs */}
      {selectedPersonForRelatives && (() => {
        const hasInRelativesByPerson = relativesByPerson.has(selectedPersonForRelatives);
        const hasInMembersRelativesMap = membersRelativesMap.has(selectedPersonForRelatives);
        const hasInShareholdersRelativesMap = shareholdersRelativesMap.has(selectedPersonForRelatives);
        
        // Get relatives data from any of the maps
        const relativesData = hasInRelativesByPerson
          ? relativesByPerson.get(selectedPersonForRelatives)
          : hasInMembersRelativesMap
          ? membersRelativesMap.get(selectedPersonForRelatives)
          : hasInShareholdersRelativesMap
          ? shareholdersRelativesMap.get(selectedPersonForRelatives)
          : null;
        
        if (!relativesData) {
          return null;
        }
        
        return (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setSelectedPersonForRelatives(null)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px 8px 0 0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ 
                  margin: 0, 
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: '600',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}>
                  👥 Người thân của <span style={{ fontWeight: '700' }}>{relativesData.personName}</span>
                </h2>
                <button
                  onClick={() => setSelectedPersonForRelatives(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  ×
                </button>
              </div>
              
              <div>
                {relativesData.relatives.length > 0 ? (
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    background: '#ffffff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff'
                      }}>
                        <th style={{ 
                          padding: '16px 20px', 
                          textAlign: 'left', 
                          borderBottom: 'none',
                          fontSize: '14px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Tên
                        </th>
                        <th style={{ 
                          padding: '16px 20px', 
                          textAlign: 'left', 
                          borderBottom: 'none',
                          fontSize: '14px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Mối quan hệ
                        </th>
                        <th style={{ 
                          padding: '16px 20px', 
                          textAlign: 'left', 
                          borderBottom: 'none',
                          fontSize: '14px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          CCCD
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {relativesData.relatives.map((relative, idx) => (
                        <tr 
                          key={idx} 
                          style={{ 
                            borderBottom: idx < relativesData.relatives.length - 1 ? '1px solid #e8e8e8' : 'none',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8f9ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                          }}
                        >
                          <td style={{ 
                            padding: '16px 20px',
                            fontSize: '15px',
                            color: '#2c3e50'
                          }}>
                            <strong style={{ 
                              fontWeight: '600',
                              color: '#1a1a1a'
                            }}>
                              {relative.name}
                            </strong>
                            {relative.isTemp && (
                              <span style={{
                                marginLeft: '10px',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                color: 'white',
                                boxShadow: '0 2px 4px rgba(255, 152, 0, 0.3)'
                              }}>
                                Mới
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: '600',
                              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                              color: 'white',
                              display: 'inline-block',
                              boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
                            }}>
                              {relative.relationship}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <code style={{ 
                              background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)', 
                              padding: '8px 14px', 
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#2c3e50',
                              border: '1px solid #ddd',
                              display: 'inline-block',
                              fontFamily: 'Monaco, "Courier New", monospace',
                              letterSpacing: '0.5px'
                            }}>
                              {relative.identity || 'N/A'}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                    Không có người thân nào được ghi nhận
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Form popup for adding new relative - Outside tabs */}
      {showAddRelativeForm && (() => {
        // Check if this is a shareholder key (contains _SHAREHOLDER_)
        const isShareholderKey = showAddRelativeForm.includes('_SHAREHOLDER_');
        
        let member = null;
        let shareholder = null;
        
        if (isShareholderKey) {
          // Find shareholder
          shareholder = shareholders.find(sh => {
            const normalizedCCCD = sh.MSTCCCDHC ? sh.MSTCCCDHC.toString().trim() : '';
            const normalizedName = sh.PersonaOrg ? sh.PersonaOrg.trim() : '';
            const key = `${company.Code}_SHAREHOLDER_${normalizedName}_${normalizedCCCD}`;
            return key === showAddRelativeForm;
          });
        } else {
          // Find member
          member = companyMembers.find(m => {
            const normalizedCCCD = m.CCCD ? m.CCCD.toString().trim() : '';
            return `${company.Code}_${m.Name}_${normalizedCCCD}` === showAddRelativeForm;
          });
        }
        
        return (
          <AddRelativeForm
            memberKey={showAddRelativeForm}
            member={member}
            shareholder={shareholder}
            companyCode={company.Code}
            onClose={() => setShowAddRelativeForm(null)}
            onSave={(relativeData) => {
              setTempRelatives([...tempRelatives, {
                memberKey: showAddRelativeForm,
                ...relativeData
              }]);
              setShowAddRelativeForm(null);
            }}
            onUpdateRelatedPersons={setRelatedPersonsDataState}
          />
        );
      })()}
    </div>
  );
}

export default CompanyDetail;

