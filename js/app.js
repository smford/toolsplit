/**
 * Home Depot Tool Price Hack & Deal Finder Engine
 * Client-Side Filtering, Searching, Clickable Compact Table Rows, and Verified Promo Status
 */

document.addEventListener('DOMContentLoaded', () => {
  let currentBrand = 'all';
  let searchQuery = '';
  let activeSort = 'savings_amount';
  let activeCategory = 'all';
  let activeView = 'table';

  // DOM Elements
  const dealsGrid = document.getElementById('deals-grid');
  const dealsTableBody = document.getElementById('deals-table-body');
  const dealsTableContainer = document.getElementById('deals-table-container');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const sortSelect = document.getElementById('sort-select');
  const brandPills = document.querySelectorAll('.brand-pill');
  const tagFilters = document.querySelectorAll('.tag-filter');
  const viewBtns = document.querySelectorAll('.view-btn');
  const emptyState = document.getElementById('empty-state');
  const activeCountEl = document.getElementById('stat-active-deals');
  const themeToggle = document.getElementById('theme-toggle');

  // Modal Elements
  const dealModal = document.getElementById('deal-modal');
  const dealModalTitle = document.getElementById('deal-modal-title');
  const dealModalBody = document.getElementById('deal-modal-body');
  const calcModal = document.getElementById('calc-modal');
  const openCalcBtn = document.getElementById('open-calc-btn');
  const guideModal = document.getElementById('guide-modal');
  const openGuideBtn = document.getElementById('open-guide-btn');
  const guideBannerBtn = document.getElementById('guide-banner-btn');
  const guideOpenCalcBtn = document.getElementById('guide-open-calc-btn');

  // Custom Calculator Inputs
  const calcP1Msrp = document.getElementById('calc-p1-msrp');
  const calcP2Msrp = document.getElementById('calc-p2-msrp');
  const calcPromo = document.getElementById('calc-promo');
  const calcResultBox = document.getElementById('calc-results');

  // Global Deals Dataset
  const deals = window.DEALS_DATA || [];

  // Theme Management
  function initTheme() {
    const savedTheme = localStorage.getItem('hth_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) {
      themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('hth_theme', newTheme);
      themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
  }

  function getBrandClass(brand) {
    const b = (brand || '').toLowerCase();
    if (b.includes('milwaukee')) return 'milwaukee';
    if (b.includes('dewalt')) return 'dewalt';
    if (b.includes('ridgid') || b.includes('rigid')) return 'rigid';
    if (b.includes('makita')) return 'makita';
    return 'milwaukee';
  }

  // Filter & Search Logic
  function getFilteredDeals() {
    return deals.filter(deal => {
      if (currentBrand !== 'all') {
        const brandNorm = deal.brand.toLowerCase();
        const targetNorm = currentBrand.toLowerCase();
        if (targetNorm === 'rigid' && !brandNorm.includes('rigid') && !brandNorm.includes('ridgid')) {
          return false;
        } else if (targetNorm !== 'rigid' && !brandNorm.includes(targetNorm)) {
          return false;
        }
      }

      if (activeCategory !== 'all') {
        if (deal.category.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (deal.title || '').toLowerCase().includes(q);
        const matchBrand = (deal.brand || '').toLowerCase().includes(q);
        const matchSystem = (deal.system || '').toLowerCase().includes(q);
        
        const pName = (deal.primary_item.name || '').toLowerCase().includes(q);
        const pModel = (deal.primary_item.model_number || '').toLowerCase().includes(q);
        const pSku = (deal.primary_item.homedepot_sku || '').toLowerCase().includes(q);

        const sName = (deal.secondary_item.name || '').toLowerCase().includes(q);
        const sModel = (deal.secondary_item.model_number || '').toLowerCase().includes(q);
        const sSku = (deal.secondary_item.homedepot_sku || '').toLowerCase().includes(q);

        if (!matchTitle && !matchBrand && !matchSystem && !pName && !pModel && !pSku && !sName && !sModel && !sSku) {
          return false;
        }
      }

      return true;
    });
  }

  function sortDeals(items) {
    return items.sort((a, b) => {
      switch (activeSort) {
        case 'savings_amount':
          return b.savings_amount - a.savings_amount;
        case 'savings_percent':
          return b.savings_percent - a.savings_percent;
        case 'lowest_hacked_price':
          return a.prorated_primary_price - b.prorated_primary_price;
        case 'promo_price_asc':
          return a.promo_price - b.promo_price;
        default:
          return 0;
      }
    });
  }

  function highlightText(text, query) {
    if (!query || !query.trim()) return text;
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="highlight-match">$1</mark>');
  }

  function renderDeals() {
    const filtered = sortDeals(getFilteredDeals());
    
    if (activeCountEl) {
      activeCountEl.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      dealsGrid.style.display = 'none';
      dealsTableContainer.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    if (activeView === 'table') {
      dealsTableContainer.style.display = 'block';
      dealsGrid.style.display = 'none';
      renderTable(filtered);
    } else {
      dealsTableContainer.style.display = 'none';
      dealsGrid.style.display = 'grid';
      renderGrid(filtered);
    }
  }

  // Render Table View (High Information Density, Minimal Scroll)
  function renderTable(items) {
    dealsTableBody.innerHTML = items.map((deal, idx) => {
      const brandClass = getBrandClass(deal.brand);

      const pTitle = highlightText(deal.primary_item.name, searchQuery);
      const pModel = highlightText(deal.primary_item.model_number, searchQuery);
      const pSku = highlightText(deal.primary_item.homedepot_sku, searchQuery);

      const sTitle = highlightText(deal.secondary_item.name, searchQuery);
      const sModel = highlightText(deal.secondary_item.model_number, searchQuery);
      const sSku = highlightText(deal.secondary_item.homedepot_sku, searchQuery);

      return `
        <tr class="deal-table-row" data-id="${deal.id}" tabindex="0" title="Click row to view full deal breakdown">
          <td><strong style="color: var(--text-dim); font-size: 0.9rem;">#${idx + 1}</strong></td>
          <td>
            <span class="brand-badge ${brandClass}">${deal.brand}</span>
          </td>
          <td>
            <a href="${deal.primary_item.url}" target="_blank" rel="noopener noreferrer" class="table-product-link" title="Open ${deal.primary_item.name} on HomeDepot.com">
              ${pTitle} ↗
            </a>
            <div class="table-product-meta">
              Model: <strong>${pModel}</strong> • SKU: <strong>${pSku}</strong>
            </div>
          </td>
          <td>
            <a href="${deal.secondary_item.url}" target="_blank" rel="noopener noreferrer" class="table-product-link" title="Open ${deal.secondary_item.name} on HomeDepot.com" style="font-weight: 500; font-size: 0.9rem;">
              ${sTitle} ↗
            </a>
            <div class="table-refund-meta">
              Refund Value: <strong>$${deal.prorated_secondary_price.toFixed(2)}</strong> (Model: ${sModel})
            </div>
          </td>
          <td>
            <span class="table-hacked-price">
              $${deal.prorated_primary_price.toFixed(2)}
            </span>
          </td>
          <td>
            <span class="table-orig-price">
              $${deal.primary_item.msrp.toFixed(2)}
            </span>
          </td>
          <td>
            <span class="table-savings-val">
              Save $${deal.savings_amount.toFixed(2)} (${deal.savings_percent}%)
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm open-deal-details" data-id="${deal.id}" title="View detailed breakdown">
              Breakdown 🔍
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach click listeners to Table Rows
    document.querySelectorAll('.deal-table-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) {
          if (e.target.closest('.open-deal-details')) {
            const id = e.target.closest('.open-deal-details').getAttribute('data-id');
            openDealModal(id);
          }
          return;
        }
        const id = row.getAttribute('data-id');
        openDealModal(id);
      });

      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            const id = row.getAttribute('data-id');
            openDealModal(id);
          }
        }
      });
    });
  }

  // Render Grid View
  function renderGrid(items) {
    dealsGrid.innerHTML = items.map(deal => {
      const brandClass = getBrandClass(deal.brand);

      const pTitle = highlightText(deal.primary_item.name, searchQuery);
      const pModel = highlightText(deal.primary_item.model_number, searchQuery);
      const pSku = highlightText(deal.primary_item.homedepot_sku, searchQuery);

      const sTitle = highlightText(deal.secondary_item.name, searchQuery);
      const sModel = highlightText(deal.secondary_item.model_number, searchQuery);
      const sSku = highlightText(deal.secondary_item.homedepot_sku, searchQuery);

      return `
        <article class="deal-card" data-brand="${brandClass}" data-id="${deal.id}">
          <div class="card-header">
            <span class="brand-badge ${brandClass}">
              ${deal.brand}
            </span>
            <span class="savings-pill">
              Save $${deal.savings_amount.toFixed(2)} (${deal.savings_percent}%)
            </span>
          </div>

          <h3 class="card-title">${deal.title}</h3>
          <div class="card-system-tag">
            <span>⚡ ${deal.system}</span>
            <span>•</span>
            <span>🏷️ ${deal.category}</span>
            <span>•</span>
            <span style="color: var(--accent-emerald); font-weight: 700;">● Active on HomeDepot.com</span>
          </div>

          <div class="items-pair-container">
            <div class="item-row">
              <div class="item-info">
                <span class="item-tag">Keep Primary Tool</span>
                <span class="item-name" title="${deal.primary_item.name}">${pTitle}</span>
                <span class="item-model-sku">Model: ${pModel} | SKU: ${pSku}</span>
              </div>
              <div class="item-pricing">
                <div class="item-hacked-price">$${deal.prorated_primary_price.toFixed(2)}</div>
                <div class="item-orig-msrp">$${deal.primary_item.msrp.toFixed(2)}</div>
              </div>
            </div>

            <div class="pair-divider">
              <span class="pair-plus">+</span>
            </div>

            <div class="item-row">
              <div class="item-info">
                <span class="item-tag">Return Secondary / Gift</span>
                <span class="item-name" title="${deal.secondary_item.name}">${sTitle}</span>
                <span class="item-model-sku">Model: ${sModel} | SKU: ${sSku}</span>
              </div>
              <div class="item-pricing">
                <div class="item-hacked-price">$${deal.prorated_secondary_price.toFixed(2)}</div>
                <div class="item-orig-msrp">$${deal.secondary_item.msrp.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div class="hack-math-box">
            <div class="hack-math-row">
              <span class="hack-math-label">Checkout Price:</span>
              <span class="hack-math-value">$${deal.promo_price.toFixed(2)}</span>
            </div>
            <div class="hack-math-row">
              <span class="hack-math-label">Combined MSRP:</span>
              <span class="hack-math-value" style="text-decoration: line-through; color: var(--text-dim);">$${deal.total_msrp.toFixed(2)}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-secondary btn-sm open-deal-details" data-id="${deal.id}">
              🔍 Breakdown
            </button>
            <a href="${deal.promo_url || deal.primary_item.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              Promo Hub ↗
            </a>
          </div>
        </article>
      `;
    }).join('');

    document.querySelectorAll('.open-deal-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openDealModal(id);
      });
    });
  }

  // Open Deal Breakdown Modal with Direct Product & Promo Links
  function openDealModal(dealId) {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const p = deal.primary_item;
    const s = deal.secondary_item;

    dealModalTitle.textContent = deal.title;
    dealModalBody.innerHTML = `
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.25rem;">
        <span class="brand-badge ${getBrandClass(deal.brand)}">${deal.brand}</span>
        <span class="badge-date">⚡ ${deal.system}</span>
        <span class="savings-pill">Total Savings: $${deal.savings_amount.toFixed(2)} (${deal.savings_percent}%)</span>
        <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.18); color: var(--accent-emerald); padding: 0.25rem 0.6rem; border-radius: 9999px; font-weight: 700;">
          ● Active on HomeDepot.com
        </span>
      </div>

      <!-- Campaign Banner Notice -->
      <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 0.625rem; padding: 0.75rem; font-size: 0.875rem;">
        <strong>Campaign:</strong> ${deal.promo_campaign || 'Home Depot Tool Savings Event'}
        <div style="margin-top: 0.3rem;">
          <a href="${deal.promo_url || p.url}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue); font-weight: 700; text-decoration: underline;">
            Open Home Depot ${deal.brand} Promotional Savings Hub ↗
          </a>
        </div>
      </div>

      <!-- Direct Home Depot Links Section -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <h4 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-blue); font-weight: 700;">
          🔗 Direct Home Depot Product Links
        </h4>
        
        <!-- Primary Tool Direct Link -->
        <div class="modal-product-card">
          <div class="modal-product-info">
            <span class="modal-product-tag">Primary Tool to Keep</span>
            <div class="modal-product-title">${p.name}</div>
            <div class="modal-product-meta">Model: <strong>${p.model_number}</strong> | SKU: <strong>${p.homedepot_sku}</strong></div>
            <div style="margin-top: 0.25rem;">
              <span style="color: var(--accent-emerald); font-weight: 800; font-family: var(--font-mono); font-size: 1.05rem;">Hacked Price: $${deal.prorated_primary_price.toFixed(2)}</span>
              <span style="text-decoration: line-through; color: var(--text-dim); font-size: 0.85rem; margin-left: 0.4rem;">MSRP $${p.msrp.toFixed(2)}</span>
            </div>
          </div>
          <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="flex-shrink: 0;">
            Open Tool ↗
          </a>
        </div>

        <!-- Secondary Item Direct Link -->
        <div class="modal-product-card">
          <div class="modal-product-info">
            <span class="modal-product-tag" style="color: var(--accent-amber);">Bonus / Free Item to Return</span>
            <div class="modal-product-title">${s.name}</div>
            <div class="modal-product-meta">Model: <strong>${s.model_number}</strong> | SKU: <strong>${s.homedepot_sku}</strong></div>
            <div style="margin-top: 0.25rem;">
              <span style="color: var(--accent-rose); font-weight: 800; font-family: var(--font-mono); font-size: 1.05rem;">Refund Value: $${deal.prorated_secondary_price.toFixed(2)}</span>
              <span style="text-decoration: line-through; color: var(--text-dim); font-size: 0.85rem; margin-left: 0.4rem;">MSRP $${s.msrp.toFixed(2)}</span>
            </div>
          </div>
          <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="flex-shrink: 0;">
            Open Bonus ↗
          </a>
        </div>
      </div>

      <!-- Step-by-step hack instructions -->
      <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 0.625rem; padding: 0.85rem;">
        <h4 style="font-size: 0.85rem; margin-bottom: 0.35rem; color: var(--accent-emerald); font-weight: 700;">📋 How to Trigger & Execute the Hack</h4>
        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted);">${deal.hack_instructions}</p>
      </div>

      <!-- Receipt math summary -->
      <div class="calc-results-box">
        <h4 style="font-size: 0.8rem; margin-bottom: 0.5rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">
          Receipt Prorated Calculation
        </h4>
        
        <div style="display: flex; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
          <span>1. Keep Primary Tool (${p.name}):</span>
          <span style="font-family: var(--font-mono); color: var(--accent-emerald); font-size: 0.95rem;"><strong>$${deal.prorated_primary_price.toFixed(2)}</strong></span>
        </div>

        <div style="display: flex; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
          <span>2. Return Secondary Item (${s.name}):</span>
          <span style="font-family: var(--font-mono); color: var(--accent-rose); font-size: 0.95rem;"><strong>$${deal.prorated_secondary_price.toFixed(2)}</strong> (Refund)</span>
        </div>

        <div style="display: flex; justify-content: space-between; padding: 0.4rem 0 0 0; font-size: 0.95rem;">
          <span><strong>Total Paid at Checkout:</strong></span>
          <span style="font-family: var(--font-mono); font-weight: 800;">$${deal.promo_price.toFixed(2)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${p.homedepot_sku}'); alert('Copied Primary SKU: ${p.homedepot_sku}');">
          📋 Copy Primary SKU (${p.homedepot_sku})
        </button>
        <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${s.homedepot_sku}'); alert('Copied Bonus SKU: ${s.homedepot_sku}');">
          📋 Copy Bonus SKU (${s.homedepot_sku})
        </button>
      </div>
    `;

    dealModal.showModal();
  }

  // Interactive Live Prorated Return Calculator
  function runLiveCalculator() {
    const p1 = parseFloat(calcP1Msrp.value) || 0;
    const p2 = parseFloat(calcP2Msrp.value) || 0;
    const promo = parseFloat(calcPromo.value) || 0;

    const totalMsrp = p1 + p2;
    if (totalMsrp <= 0 || promo <= 0) {
      calcResultBox.innerHTML = `<p style="color: var(--text-dim); text-align: center; font-size: 0.85rem;">Enter valid dollar amounts above.</p>`;
      return;
    }

    const dFactor = promo / totalMsrp;
    const proratedP1 = (p1 * dFactor).toFixed(2);
    const proratedP2 = (promo - parseFloat(proratedP1)).toFixed(2);
    const savings = (totalMsrp - promo).toFixed(2);
    const savingsPct = ((savings / totalMsrp) * 100).toFixed(1);

    calcResultBox.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Combined Baseline MSRP:</span>
          <span style="font-family: var(--font-mono); font-size: 0.95rem;">$${totalMsrp.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Total Savings:</span>
          <span style="font-family: var(--font-mono); color: var(--accent-emerald); font-weight: 700;">$${savings} (${savingsPct}%)</span>
        </div>
        <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 0.2rem 0;" />
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><strong>Keep Item 1 Price:</strong></span>
          <strong style="font-family: var(--font-mono); color: var(--accent-emerald); font-size: 1.15rem;">$${proratedP1}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><strong>Return Item 2 Refund Value:</strong></span>
          <strong style="font-family: var(--font-mono); color: var(--accent-rose); font-size: 1.15rem;">$${proratedP2}</strong>
        </div>
      </div>
    `;
  }

  if (calcP1Msrp && calcP2Msrp && calcPromo) {
    [calcP1Msrp, calcP2Msrp, calcPromo].forEach(el => el.addEventListener('input', runLiveCalculator));
  }

  if (openCalcBtn && calcModal) {
    openCalcBtn.addEventListener('click', () => {
      runLiveCalculator();
      calcModal.showModal();
    });
  }

  if (guideModal) {
    if (openGuideBtn) {
      openGuideBtn.addEventListener('click', () => guideModal.showModal());
    }
    if (guideBannerBtn) {
      guideBannerBtn.addEventListener('click', () => guideModal.showModal());
    }
    if (guideOpenCalcBtn && calcModal) {
      guideOpenCalcBtn.addEventListener('click', () => {
        guideModal.close();
        runLiveCalculator();
        calcModal.showModal();
      });
    }
  }

  // Modal Close Listeners (with backdrop click)
  document.querySelectorAll('dialog.custom-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                          rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        modal.close();
      }
    });

    modal.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => modal.close());
    });
  });

  // Event Listeners for Filters & Search
  brandPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      brandPills.forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentBrand = e.currentTarget.getAttribute('data-brand');
      renderDeals();
    });
  });

  tagFilters.forEach(tag => {
    tag.addEventListener('click', (e) => {
      tagFilters.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeCategory = e.currentTarget.getAttribute('data-category');
      renderDeals();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      searchClear.style.display = searchQuery ? 'block' : 'none';
      renderDeals();
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClear.style.display = 'none';
      renderDeals();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderDeals();
    });
  }

  viewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      viewBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeView = e.currentTarget.getAttribute('data-view');
      renderDeals();
    });
  });

  // Initialize
  initTheme();
  renderDeals();
});
