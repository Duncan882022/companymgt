import React, { useState, useMemo } from 'react';
import shareholdersData from '../ShareHolders.json';
import companyMembersData from '../CompanyMembers.json';
import lsdkkdData from '../lsdkkd.json';
import ddkdData from '../DDKD.json';

function CompanyDetail({ company, allCompanies, threshold }) {
  const [activeTab, setActiveTab] = useState('direct');

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

  // Get related parties (company members from current company + all subsidiaries)
  const relatedParties = useMemo(() => {
    if (!company || !company.Code) return [];
    
    const parties = [];
    const processedMembers = new Set(); // Track processed members by Name + Identity
    const processedCompanies = new Set(); // Track processed companies by ID
    
    // 1. Add direct subsidiaries as organizations
    directSubsidiaries.forEach(subsidiary => {
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
      // Only include indirect subsidiaries with >= 50% ownership
      if (subsidiary.effectiveOwnership < 50) return;
      
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
    
    // 3. Add company members from current company
    companyMembers.forEach(member => {
      const key = `${company.Code}_${member.Name}_${member.CCCD}`;
      if (!processedMembers.has(key)) {
        processedMembers.add(key);
        parties.push({
          Code: company.Code,
          Name: member.Name,
          Loai: 'Cá Nhân',
          MoiQuanHe: member.ChucVu,
          Identity: member.CCCD,
          CompanyName: company.Name,
          Type: 'member',
          Level: 'Công ty hiện tại'
        });
      }
    });
    
    // 4. Add company members from direct subsidiaries (get ALL direct subsidiaries, not filtered by threshold) - only active companies
    const allDirectSubsidiaries = allCompanies.filter(c => c && c.ParentID === company.ID && c.ParentID !== 0 && c.TrangThai === 'Đang hoạt động');
    allDirectSubsidiaries.forEach(subsidiary => {
      if (subsidiary && subsidiary.Code) {
        const subMembers = companyMembersData.filter(m => m.Code === subsidiary.Code);
        subMembers.forEach(member => {
          const key = `${subsidiary.Code}_${member.Name}_${member.CCCD}`;
          if (!processedMembers.has(key)) {
            processedMembers.add(key);
            parties.push({
              Code: subsidiary.Code,
              Name: member.Name,
              Loai: 'Cá Nhân',
              MoiQuanHe: member.ChucVu,
              Identity: member.CCCD,
              CompanyName: subsidiary.Name,
              Type: 'member',
              Level: 'Công ty con trực tiếp'
            });
          }
        });
      }
    });
    
    // 5. Add company members from indirect subsidiaries (only >= 50% ownership)
    equityInterestSubsidiaries.forEach(subsidiary => {
      // Only include indirect subsidiaries with >= 50% ownership
      if (subsidiary.effectiveOwnership < 50) return;
      
      // Skip if already processed as direct subsidiary
      const isDirect = directSubsidiaries.some(ds => ds.ID === subsidiary.ID);
      if (isDirect) return;
      
      // Find the company object - only active companies
      const subsidiaryCompany = allCompanies.find(c => c && c.ID === subsidiary.ID && c.TrangThai === 'Đang hoạt động');
      if (!subsidiaryCompany || !subsidiaryCompany.Code) return;
      
      const subMembers = companyMembersData.filter(m => m.Code === subsidiaryCompany.Code);
      subMembers.forEach(member => {
        const key = `${subsidiaryCompany.Code}_${member.Name}_${member.CCCD}`;
        if (!processedMembers.has(key)) {
          processedMembers.add(key);
          parties.push({
            Code: subsidiaryCompany.Code,
            Name: member.Name,
            Loai: 'Cá Nhân',
            MoiQuanHe: member.ChucVu,
            Identity: member.CCCD,
            CompanyName: subsidiaryCompany.Name,
            Type: 'member',
            Level: 'Công ty con gián tiếp'
          });
        }
      });
    });
    
    return parties.sort((a, b) => {
      // Sort by Type first (company before member), then by Level, then by Name
      const typeOrder = { 'company': 1, 'member': 2 };
      const typeDiff = (typeOrder[a.Type] || 99) - (typeOrder[b.Type] || 99);
      if (typeDiff !== 0) return typeDiff;
      
      const levelOrder = { 'Công ty hiện tại': 1, 'Công ty con trực tiếp': 2, 'Công ty con gián tiếp': 3 };
      const levelDiff = (levelOrder[a.Level] || 99) - (levelOrder[b.Level] || 99);
      if (levelDiff !== 0) return levelDiff;
      
      return a.Name.localeCompare(b.Name);
    });
  }, [company, companyMembers, directSubsidiaries, equityInterestSubsidiaries, allCompanies]);

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
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Tên Thành Viên</th>
                      <th>Chức Vụ</th>
                      <th>CCCD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyMembers.map(member => (
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
                      </tr>
                    ))}
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
                    </tr>
                  </thead>
                  <tbody>
                    {shareholders.map(sh => {
                      const statusClass = sh.isActive ? 'status-active' : 'status-inactive';
                      const statusText = sh.isActive ? 'Active' : 'Inactive';
                      
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
            {relatedParties.length > 0 ? (
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
                  • Tổ chức: Công ty con trực tiếp và công ty con gián tiếp (≥50%)
                  <br />
                  • Thành viên: Thành viên của công ty hiện tại, công ty con trực tiếp và công ty con gián tiếp
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Bên Liên Quan</th>
                      <th>Loại</th>
                      <th>Mối quan hệ</th>
                      <th>MST/CCCD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedParties.map((party, idx) => (
                      <tr key={idx}>
                        <td>
                          <div>
                            <strong>{party.Name}</strong>
                            {party.CompanyName && party.CompanyName !== company.Name && (
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
                                background: party.Level === 'Công ty hiện tại' ? '#e8f5e9' :
                                          party.Level === 'Công ty con trực tiếp' ? '#fff3e0' : '#e3f2fd',
                                color: party.Level === 'Công ty hiện tại' ? '#2e7d32' :
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
                      </tr>
                    ))}
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
    </div>
  );
}

export default CompanyDetail;

