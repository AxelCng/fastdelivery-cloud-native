/* ═══════════════════════════════════════════════════════════════
   FastDelivery Perú — Aplicación Principal
   Lógica de la SPA: navegación, API calls, renderizado, modales
   ═══════════════════════════════════════════════════════════════ */

// ─── Configuración de API ──────────────────────────────────────
// En Docker, Nginx hace proxy pass; en desarrollo local, usa el gateway
const API_BASE = '/api';

// ─── Estado de la aplicación ───────────────────────────────────
const state = {
  products: [],
  inventory: [],
  orders: [],
  currentSection: 'dashboard',
  editingId: null,
  editingType: null,
};

// ─── Utilidades ────────────────────────────────────────────────

/** Muestra una notificación toast */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/** Formatea una fecha ISO a formato legible */
function formatDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Formatea un precio en soles */
function formatPrice(price) {
  return `S/ ${Number(price).toFixed(2)}`;
}

/** Traduce status a texto en español */
function translateStatus(status) {
  const map = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    in_transit: 'En tránsito',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return map[status] || status;
}

// ─── API Service Layer ─────────────────────────────────────────

async function apiGet(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`GET ${endpoint}:`, error);
    showToast(`Error al obtener datos: ${error.message}`, 'error');
    return { success: false, data: [] };
  }
}

async function apiPost(endpoint, data) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  } catch (error) {
    console.error(`POST ${endpoint}:`, error);
    showToast(`Error al crear: ${error.message}`, 'error');
    return { success: false };
  }
}

async function apiPut(endpoint, data) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  } catch (error) {
    console.error(`PUT ${endpoint}:`, error);
    showToast(`Error al actualizar: ${error.message}`, 'error');
    return { success: false };
  }
}

async function apiDelete(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`DELETE ${endpoint}:`, error);
    showToast(`Error al eliminar: ${error.message}`, 'error');
    return { success: false };
  }
}

// ─── Navigation ────────────────────────────────────────────────

function navigateTo(section) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.section === section);
  });

  // Update sections
  document.querySelectorAll('.content-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === `section-${section}`);
  });

  // Update title
  const titles = {
    dashboard: 'Dashboard',
    products: 'Catálogo de Productos',
    inventory: 'Control de Inventario',
    orders: 'Gestión de Pedidos',
  };
  document.getElementById('pageTitle').textContent = titles[section] || section;
  state.currentSection = section;

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

// ─── Data Loading ──────────────────────────────────────────────

async function loadProducts() {
  const res = await apiGet('/products');
  state.products = res.data || [];
  renderProductsTable();
}

async function loadInventory() {
  const res = await apiGet('/inventory');
  state.inventory = res.data || [];
  renderInventoryTable();
}

async function loadOrders() {
  const res = await apiGet('/orders');
  state.orders = res.data || [];
  renderOrdersTable();
}

async function loadAllData() {
  await Promise.all([loadProducts(), loadInventory(), loadOrders()]);
  updateDashboard();
  checkServicesHealth();
}

// ─── Dashboard ─────────────────────────────────────────────────

function updateDashboard() {
  document.getElementById('statProducts').textContent = state.products.length;
  document.getElementById('statInventory').textContent = state.inventory.length;
  document.getElementById('statOrders').textContent = state.orders.length;

  const pendingCount = state.orders.filter((o) => o.status === 'pending').length;
  document.getElementById('statPending').textContent = pendingCount;

  // Animate stat numbers
  document.querySelectorAll('.stat-value').forEach((el) => {
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'fadeSlideIn 0.5s ease-out';
  });

  renderOrdersChart();
  renderRecentOrders();
}

function renderOrdersChart() {
  const container = document.getElementById('ordersChart');
  const statuses = ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'];
  const total = state.orders.length || 1;

  container.innerHTML = statuses
    .map((status) => {
      const count = state.orders.filter((o) => o.status === status).length;
      const pct = Math.round((count / total) * 100);
      return `
      <div class="chart-bar-item">
        <span class="chart-bar-label">${translateStatus(status)}</span>
        <div class="chart-bar-track">
          <div class="chart-bar-fill ${status}" style="width: ${Math.max(pct, 5)}%">${pct}%</div>
        </div>
        <span class="chart-bar-count">${count}</span>
      </div>
    `;
    })
    .join('');
}

function renderRecentOrders() {
  const container = document.getElementById('recentOrdersList');
  const recent = state.orders.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = '<p class="empty-message">No hay pedidos aún</p>';
    return;
  }

  container.innerHTML = recent
    .map(
      (order) => `
    <div class="recent-order-item">
      <div class="recent-order-info">
        <span class="recent-order-name">${order.customerName}</span>
        <span class="recent-order-date">${formatDate(order.createdAt)}</span>
      </div>
      <span class="badge badge-${order.status}">${translateStatus(order.status)}</span>
    </div>
  `
    )
    .join('');
}

async function checkServicesHealth() {
  const services = [
    { id: 'service-gateway', url: '/health', label: 'API Gateway' },
  ];

  // The gateway health check also validates upstream availability
  for (const svc of services) {
    const badge = document.querySelector(`#${svc.id} .service-badge`);
    try {
      const res = await fetch(svc.url);
      if (res.ok) {
        badge.textContent = 'Online';
        badge.className = 'service-badge online';
      } else {
        badge.textContent = 'Offline';
        badge.className = 'service-badge offline';
      }
    } catch {
      badge.textContent = 'Offline';
      badge.className = 'service-badge offline';
    }
  }

  // Check individual services via their API endpoints
  const apiServices = [
    { id: 'service-products', url: `${API_BASE}/products` },
    { id: 'service-inventory', url: `${API_BASE}/inventory` },
    { id: 'service-orders', url: `${API_BASE}/orders` },
  ];

  for (const svc of apiServices) {
    const badge = document.querySelector(`#${svc.id} .service-badge`);
    try {
      const res = await fetch(svc.url);
      if (res.ok) {
        badge.textContent = 'Online';
        badge.className = 'service-badge online';
      } else {
        badge.textContent = 'Offline';
        badge.className = 'service-badge offline';
      }
    } catch {
      badge.textContent = 'Offline';
      badge.className = 'service-badge offline';
    }
  }
}

// ─── Products Table ────────────────────────────────────────────

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');

  if (state.products.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty-message">No hay productos registrados</td></tr>';
    return;
  }

  tbody.innerHTML = state.products
    .map(
      (p) => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.category}</td>
      <td>${formatPrice(p.price)}</td>
      <td>${formatDate(p.createdAt)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon edit" onclick="editProduct('${p._id}')" title="Editar">✏️</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

// ─── Inventory Table ───────────────────────────────────────────

function renderInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');

  if (state.inventory.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="empty-message">No hay registros de inventario</td></tr>';
    return;
  }

  tbody.innerHTML = state.inventory
    .map((item) => {
      const isLow = item.quantity <= item.minStock;
      return `
      <tr>
        <td><strong>${item.productName}</strong></td>
        <td>${item.quantity}</td>
        <td>${item.minStock}</td>
        <td>${item.warehouse}</td>
        <td><span class="badge ${isLow ? 'badge-low' : 'badge-ok'}">${isLow ? 'Stock Bajo' : 'OK'}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-icon edit" onclick="editInventory('${item._id}')" title="Editar">✏️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

// ─── Orders Table ──────────────────────────────────────────────

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');

  if (state.orders.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty-message">No hay pedidos registrados</td></tr>';
    return;
  }

  tbody.innerHTML = state.orders
    .map(
      (order) => `
    <tr>
      <td><strong>${order.customerName}</strong></td>
      <td>${order.customerAddress}</td>
      <td>${order.items ? order.items.length : 0}</td>
      <td>${formatPrice(order.totalAmount || 0)}</td>
      <td><span class="badge badge-${order.status}">${translateStatus(order.status)}</span></td>
      <td>${formatDate(order.createdAt)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon edit" onclick="editOrder('${order._id}')" title="Editar">✏️</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

// ─── Modal Management ──────────────────────────────────────────

function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  state.editingId = null;
  state.editingType = null;
}

// ─── Product Forms ─────────────────────────────────────────────

function showProductForm(product = null) {
  state.editingType = 'product';
  state.editingId = product ? product._id : null;

  const title = product ? 'Editar Producto' : 'Nuevo Producto';
  const html = `
    <div class="form-group">
      <label for="productName">Nombre del Producto</label>
      <input type="text" id="productName" placeholder="Ej: Hamburguesa clásica" value="${product ? product.name : ''}" required>
    </div>
    <div class="form-group">
      <label for="productDescription">Descripción</label>
      <textarea id="productDescription" placeholder="Descripción del producto...">${product ? product.description : ''}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="productPrice">Precio (S/)</label>
        <input type="number" id="productPrice" step="0.01" min="0" placeholder="0.00" value="${product ? product.price : ''}">
      </div>
      <div class="form-group">
        <label for="productCategory">Categoría</label>
        <input type="text" id="productCategory" placeholder="Ej: Comida rápida" value="${product ? product.category : ''}">
      </div>
    </div>
    <div class="form-group">
      <label for="productImage">URL de Imagen</label>
      <input type="text" id="productImage" placeholder="https://..." value="${product ? product.imageUrl || '' : ''}">
    </div>
  `;
  openModal(title, html);
}

function editProduct(id) {
  const product = state.products.find((p) => p._id === id);
  if (product) showProductForm(product);
}

async function saveProduct() {
  const data = {
    name: document.getElementById('productName').value.trim(),
    description: document.getElementById('productDescription').value.trim(),
    price: parseFloat(document.getElementById('productPrice').value) || 0,
    category: document.getElementById('productCategory').value.trim(),
    imageUrl: document.getElementById('productImage').value.trim(),
  };

  if (!data.name || !data.category || !data.price) {
    showToast('Por favor completa los campos obligatorios', 'warning');
    return;
  }

  let result;
  if (state.editingId) {
    result = await apiPut(`/products/${state.editingId}`, data);
  } else {
    result = await apiPost('/products', data);
  }

  if (result.success) {
    showToast(
      state.editingId ? 'Producto actualizado' : 'Producto creado',
      'success'
    );
    closeModal();
    await loadProducts();
    updateDashboard();
  }
}

// ─── Inventory Forms ───────────────────────────────────────────

function showInventoryForm(item = null) {
  state.editingType = 'inventory';
  state.editingId = item ? item._id : null;

  const title = item ? 'Editar Inventario' : 'Nuevo Registro de Inventario';
  
  let productSelectHtml = '';
  if (!item) {
    const productOptions = state.products
      .map((p) => `<option value="${p._id}" data-name="${p.name}">${p.name}</option>`)
      .join('');
      
    productSelectHtml = `
      <div class="form-group">
        <label for="invProductSelect">Seleccionar Producto</label>
        <select id="invProductSelect" onchange="onInventoryProductChange(this)">
          <option value="" disabled selected>Seleccione producto...</option>
          ${productOptions}
        </select>
      </div>
    `;
  }

  const html = `
    ${productSelectHtml}
    <div class="form-row">
      <div class="form-group">
        <label for="invProductId">ID del Producto</label>
        <input type="text" id="invProductId" placeholder="ID del producto" value="${item ? item.productId : ''}" readonly style="background-color: var(--bg-card); cursor: not-allowed;">
      </div>
      <div class="form-group">
        <label for="invProductName">Nombre del Producto</label>
        <input type="text" id="invProductName" placeholder="Nombre del producto" value="${item ? item.productName : ''}" readonly style="background-color: var(--bg-card); cursor: not-allowed;">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="invQuantity">Cantidad</label>
        <input type="number" id="invQuantity" min="0" placeholder="0" value="${item ? item.quantity : '0'}">
      </div>
      <div class="form-group">
        <label for="invMinStock">Stock Mínimo</label>
        <input type="number" id="invMinStock" min="0" placeholder="10" value="${item ? item.minStock : '10'}">
      </div>
    </div>
    <div class="form-group">
      <label for="invWarehouse">Almacén</label>
      <input type="text" id="invWarehouse" placeholder="Ej: Almacén Principal" value="${item ? item.warehouse : 'Almacén Principal'}">
    </div>
  `;
  openModal(title, html);
}

// Handler de cambio de producto en Inventario
window.onInventoryProductChange = function(selectEl) {
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  if (selectedOption && selectedOption.value) {
    document.getElementById('invProductId').value = selectEl.value;
    document.getElementById('invProductName').value = selectedOption.dataset.name;
  } else {
    document.getElementById('invProductId').value = '';
    document.getElementById('invProductName').value = '';
  }
};

function editInventory(id) {
  const item = state.inventory.find((i) => i._id === id);
  if (item) showInventoryForm(item);
}

async function saveInventory() {
  const data = {
    productId: document.getElementById('invProductId').value.trim(),
    productName: document.getElementById('invProductName').value.trim(),
    quantity: parseInt(document.getElementById('invQuantity').value) || 0,
    minStock: parseInt(document.getElementById('invMinStock').value) || 10,
    warehouse: document.getElementById('invWarehouse').value.trim(),
  };

  if (!data.productId || !data.productName) {
    showToast('Por favor selecciona un producto y completa los campos obligatorios', 'warning');
    return;
  }

  let result;
  if (state.editingId) {
    result = await apiPut(`/inventory/${state.editingId}`, data);
  } else {
    result = await apiPost('/inventory', data);
  }

  if (result.success) {
    showToast(
      state.editingId ? 'Inventario actualizado' : 'Registro de inventario creado',
      'success'
    );
    closeModal();
    await loadInventory();
    updateDashboard();
  }
}

// ─── Order Forms ───────────────────────────────────────────────

function showOrderForm(order = null) {
  state.editingType = 'order';
  state.editingId = order ? order._id : null;

  const title = order ? 'Editar Pedido' : 'Nuevo Pedido';

  let itemsHtml = '';
  if (order && order.items) {
    order.items.forEach((item, idx) => {
      itemsHtml += createOrderItemHtml(idx, item);
    });
  } else {
    itemsHtml = createOrderItemHtml(0);
  }

  const statusSelect = order
    ? `
    <div class="form-group">
      <label for="orderStatus">Estado</label>
      <select id="orderStatus">
        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendiente</option>
        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmado</option>
        <option value="in_transit" ${order.status === 'in_transit' ? 'selected' : ''}>En tránsito</option>
        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Entregado</option>
        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
      </select>
    </div>
  `
    : '';

  const html = `
    <div class="form-group">
      <label for="orderCustomer">Nombre del Cliente</label>
      <input type="text" id="orderCustomer" placeholder="Nombre completo" value="${order ? order.customerName : ''}">
    </div>
    <div class="form-group">
      <label for="orderAddress">Dirección de Entrega</label>
      <input type="text" id="orderAddress" placeholder="Dirección completa" value="${order ? order.customerAddress : ''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="orderPhone">Teléfono</label>
        <input type="text" id="orderPhone" placeholder="999 999 999" value="${order ? order.customerPhone || '' : ''}">
      </div>
      ${statusSelect ? `<div>${statusSelect}</div>` : ''}
    </div>
    <div class="form-group">
      <label>Ítems del Pedido</label>
      <div id="orderItemsContainer">${itemsHtml}</div>
      <button type="button" class="btn btn-secondary btn-sm" onclick="addOrderItem()" style="margin-top: 0.5rem;">+ Agregar ítem</button>
    </div>
  `;
  openModal(title, html);
}

function createOrderItemHtml(index, item = null) {
  const options = state.products
    .map(
      (p) =>
        `<option value="${p._id}" data-name="${p.name}" data-price="${p.price}" ${
          item && item.productId === p._id ? 'selected' : ''
        }>${p.name} (S/ ${p.price.toFixed(2)})</option>`
    )
    .join('');

  return `
    <div class="order-item-row form-row" style="margin-bottom: 0.5rem; align-items: end;">
      <div class="form-group" style="margin-bottom:0; flex: 2;">
        <select class="item-product-select" onchange="onOrderProductChange(this)" style="width: 100%;" required>
          <option value="" disabled ${!item ? 'selected' : ''}>Seleccione producto...</option>
          ${options}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0; flex: 0.8;">
        <input type="number" class="item-qty" placeholder="Cant." min="1" value="${item ? item.quantity : '1'}" style="width:100%">
      </div>
      <div class="form-group" style="margin-bottom:0; flex: 1.2;">
        <input type="number" class="item-price" placeholder="Precio" step="0.01" min="0" value="${item ? item.unitPrice : ''}" readonly style="width:100%; background-color: var(--bg-card); cursor: not-allowed;">
      </div>
    </div>
  `;
}

// Handler de cambio de producto en Pedidos
window.onOrderProductChange = function(selectEl) {
  const row = selectEl.closest('.order-item-row');
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  if (selectedOption && selectedOption.value) {
    const price = selectedOption.dataset.price;
    row.querySelector('.item-price').value = parseFloat(price).toFixed(2);
  } else {
    row.querySelector('.item-price').value = '';
  }
};

function addOrderItem() {
  const container = document.getElementById('orderItemsContainer');
  const idx = container.querySelectorAll('.order-item-row').length;
  container.insertAdjacentHTML('beforeend', createOrderItemHtml(idx));
}

function editOrder(id) {
  const order = state.orders.find((o) => o._id === id);
  if (order) showOrderForm(order);
}

async function saveOrder() {
  const items = [];
  const rows = document.querySelectorAll('.order-item-row');
  rows.forEach((row) => {
    const selectEl = row.querySelector('.item-product-select');
    if (selectEl && selectEl.value) {
      const selectedOption = selectEl.options[selectEl.selectedIndex];
      const name = selectedOption.dataset.name;
      const qty = parseInt(row.querySelector('.item-qty').value) || 1;
      const price = parseFloat(row.querySelector('.item-price').value) || 0;
      items.push({
        productId: selectEl.value,
        productName: name,
        quantity: qty,
        unitPrice: price,
      });
    }
  });

  const data = {
    customerName: document.getElementById('orderCustomer').value.trim(),
    customerAddress: document.getElementById('orderAddress').value.trim(),
    customerPhone: document.getElementById('orderPhone').value.trim(),
    items,
  };

  const statusEl = document.getElementById('orderStatus');
  if (statusEl) data.status = statusEl.value;

  if (!data.customerName || !data.customerAddress || items.length === 0) {
    showToast('Completa cliente, dirección y al menos un ítem', 'warning');
    return;
  }

  let result;
  if (state.editingId) {
    result = await apiPut(`/orders/${state.editingId}`, data);
  } else {
    result = await apiPost('/orders', data);
  }

  if (result.success) {
    showToast(
      state.editingId ? 'Pedido actualizado' : 'Pedido creado',
      'success'
    );
    closeModal();
    await loadOrders();
    updateDashboard();
  }
}

// ─── Event Listeners ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Set current date
  document.getElementById('headerDate').textContent = new Date().toLocaleDateString(
    'es-PE',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  // Navigation
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.section);
    });
  });

  // Mobile menu toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Refresh button
  document.getElementById('btnRefreshAll').addEventListener('click', () => {
    showToast('Actualizando datos...', 'info');
    loadAllData();
  });

  // New buttons
  document.getElementById('btnNewProduct').addEventListener('click', () => showProductForm());
  document.getElementById('btnNewInventory').addEventListener('click', () => showInventoryForm());
  document.getElementById('btnNewOrder').addEventListener('click', () => showOrderForm());

  // Modal controls
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Modal save — delegates based on editing type
  document.getElementById('modalSave').addEventListener('click', () => {
    if (state.editingType === 'product') saveProduct();
    else if (state.editingType === 'inventory') saveInventory();
    else if (state.editingType === 'order') saveOrder();
  });

  // Keyboard: Escape to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Load initial data
  loadAllData();
});
