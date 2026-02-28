document.addEventListener("DOMContentLoaded", (ploy ) => {

  // ===== SEARCH BUTTON =====
  const btn = document.getElementById("searchBtn");
  if (btn) btn.addEventListener("click", searchMed);

  // Enter key for search
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchMed();
    });
  }

  // ===== LOGIN ENTER SUPPORT =====
  const user = document.getElementById("username");
  const pass = document.getElementById("password");

  [user, pass].forEach(el => {
    if (el) {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") login();
      });
    }
  });

  // ===== PASSWORD TOGGLE =====
  const show = document.querySelector('.show-pass');
  if (show && pass) {
    show.addEventListener('click', (e) => {
      e.preventDefault();
      togglePassword();
    });
  }
});


// ================= LOGIN =================
async function login(){
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  msg.innerText = "";

  if(!username || !password){
    msg.innerText = "Enter username and password";
    return;
  }

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.role === "admin") {
      sessionStorage.setItem("user", JSON.stringify(data));
      window.location = "admin.html";
    } 
    else if (data.role === "staff") {
      sessionStorage.setItem("user", JSON.stringify(data));
      window.location = "dashboard.html";
    } 
    else {
      msg.innerText = data.message || "Invalid credentials";
    }

  } catch (err) {
    msg.innerText = "Server error. Please try again.";
  }
}

// ================= ROLE VERIFICATION =================
function getCurrentUser() {
  const userStr = sessionStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

function verifyRole(requiredRole) {
  const user = getCurrentUser();
  if (!user || user.role !== requiredRole) {
    window.location = "index.html";
    return false;
  }
  return user;
}

function logout() {
  sessionStorage.removeItem("user");
  window.location = "index.html";
}


// ================= PASSWORD TOGGLE =================
function togglePassword(){
  const pass = document.getElementById('password');
  const btn = document.querySelector('.show-pass');
  if(!pass || !btn) return;

  const reveal = pass.type === 'password';
  pass.type = reveal ? 'text' : 'password';
  btn.innerText = reveal ? 'Hide' : 'Show';
}


// ====== REGISTER STAFF ======
function toggleRegister(show){
  // hide any other flows first
  hideAllForms();
  const login = document.getElementById('loginForm');
  const reg = document.getElementById('registerForm');
  const title = document.getElementById('formTitle');
  if(!login || !reg || !title) return;
  if(show){
    login.style.display = 'none';
    reg.style.display = 'block';
    title.innerText = 'Staff Registration';
  } else {
    login.style.display = 'block';
    reg.style.display = 'none';
    title.innerText = 'Sign In';
  }
}

async function registerStaff(){
  const username = document.getElementById('reg_username').value.trim();
  const password = document.getElementById('reg_password').value;
  const confirm = document.getElementById('reg_confirm').value;
  const msg = document.getElementById('registerMsg');
  if(msg) msg.innerText = '';

  if(!username || !password){
    if(msg) msg.innerText = 'Enter username and password';
    return;
  }
  if(password !== confirm){
    if(msg) msg.innerText = 'Passwords do not match';
    return;
  }

  try{
    const res = await fetch('/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, password, role: 'staff' })
    });

    const data = await res.json();
    if(!res.ok){
      if(msg) msg.innerText = data.message || 'Registration failed';
      return;
    }

    if(msg) msg.innerText = 'Registration successful — you can now sign in.';
    // auto-switch to login after short delay
    setTimeout(()=> toggleRegister(false), 1200);

  }catch(err){
    if(msg) msg.innerText = 'Server error — try again';
  }
}

// ===== FORGOT/RESET PASSWORD =====
function hideAllForms(){
  ['loginForm','registerForm','forgotForm','resetForm'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.style.display = 'none';
  });
  const title = document.getElementById('formTitle');
  if(title) title.innerText = 'Sign In';
}

function showForgotForm(){
  hideAllForms();
  const form = document.getElementById('forgotForm');
  if(form) form.style.display = 'block';
  const title = document.getElementById('formTitle');
  if(title) title.innerText = 'Forgot Password';
}

function toggleReset(show){
  hideAllForms();
  const form = document.getElementById('resetForm');
  if(form) form.style.display = show ? 'block' : 'none';
  const title = document.getElementById('formTitle');
  if(title) title.innerText = show ? 'Reset Password' : 'Sign In';
}

async function sendOTP(){
  const username = document.getElementById('forgot_username').value.trim();
  const msgEl = document.getElementById('forgotMsg');
  if(msgEl) msgEl.innerText = '';
  if(!username){
    if(msgEl) msgEl.innerText = 'Provide your username';
    return;
  }

  try{
    const res = await fetch('/forgot-password',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if(!res.ok){
      if(msgEl) msgEl.innerText = data.message || 'Error';
      return;
    }

    // show otp to user for now (in production this would go to email/sms)
    if(msgEl) msgEl.innerText = data.message + (data.otp ? ` (OTP: ${data.otp})` : '');
    // switch to reset form
    setTimeout(() => {
      document.getElementById('reset_username').value = username;
      toggleReset(true);
    }, 1500);

  }catch(err){
    if(msgEl) msgEl.innerText = 'Server error';
  }
}

async function resetPassword(){
  const username = document.getElementById('reset_username').value.trim();
  const otp = document.getElementById('reset_otp').value.trim();
  const newPass = document.getElementById('reset_password').value;
  const msgEl = document.getElementById('resetMsg');
  if(msgEl) msgEl.innerText = '';

  if(!username || !otp || !newPass){
    if(msgEl) msgEl.innerText = 'All fields required';
    return;
  }

  try{
    const res = await fetch('/reset-password',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, otp, newPassword: newPass })
    });
    const data = await res.json();
    if(!res.ok){
      if(msgEl) msgEl.innerText = data.message || 'Failed';
      return;
    }

    if(msgEl) msgEl.innerText = data.message || 'Password updated';
    setTimeout(() => {
      hideAllForms();
    }, 2000);

  }catch(err){
    if(msgEl) msgEl.innerText = 'Server error';
  }
}



async function searchMed(){

  const searchBox = document.getElementById("search");
  const resultDiv = document.getElementById("result");

  const query = searchBox.value.trim();

  if(!query){
    resultDiv.innerHTML = "<p>❗ Please enter a medicine name</p>";
    return;
  }

  resultDiv.innerHTML = "🔍 Searching...";

  try {

    const r = await fetch("/search/" + encodeURIComponent(query));
    const data = await r.json();

    if(!data || data.length === 0){
      resultDiv.innerHTML = "<p>❌ Medicine not found</p>";
      clearHighlights();
      return;
    }

    // Show first match
    const med = data[0];

    resultDiv.innerHTML = `
      <div style="padding:10px;">
        <h4>${med.name}</h4>
        <p><b>Price:</b> ₹${med.price}</p>
        <p><b>Stock:</b> ${med.quantity}</p>
        <p><b>Location:</b> 
          <span class="badge">${med.rack}-${med.shelf}</span>
        </p>
      </div>
    `;

    highlightRack(med.rack, med.shelf);

  } catch (err){
    resultDiv.innerHTML = "<p>⚠ Server error</p>";
  }
}


// ================= HIGHLIGHT RACK =================
function highlightRack(rack, shelf){

  clearHighlights();

  const boxId = rack.trim() + shelf.trim();  // R1 + S3 → R1S3
  const slot = document.getElementById(boxId);

  if(slot){
    slot.classList.add("highlight");

    // automatic scrolling disabled to keep UI static
    // slot.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}


// remove previous highlight
function clearHighlights(){
  document.querySelectorAll(".slot")
    .forEach(el => el.classList.remove("highlight"));
}


// ================= LOW STOCK =================
async function checkStock(){

  const alertBox = document.getElementById("alert");

  try {

    const r = await fetch("/low-stock");
    const data = await r.json();

    if(!data || data.length === 0){
      alertBox.innerHTML = "✅ All stock levels are healthy";
      return;
    }

    alertBox.innerHTML = `
      <div style="color:#dc2626;font-weight:bold;">
        ⚠ Low Stock Alert
      </div>
      <ul>
        ${data.map(m => `<li>${m.name} (${m.quantity})</li>`).join("")}
      </ul>
    `;

    // popup notification
    alert("⚠ Low stock medicines detected!");

  } catch (err){
    alertBox.innerHTML = "⚠ Unable to fetch stock data";
  }
}

// ================= BILLING: SEARCH MEDICINE =================


// ================= INVENTORY MANAGEMENT (admin) =================

async function loadInventory() {
  const list = document.getElementById('inventoryList');
  if (!list) return;
  list.innerHTML = 'Loading…';
  try {
    const res = await fetch('/medicines');
    const meds = await res.json();
    renderInventoryTable(meds);
  } catch (err) {
    list.innerHTML = '<p>Error loading inventory</p>';
  }
}

function renderInventoryTable(meds) {
  const list = document.getElementById('inventoryList');
  if (!list) return;
  if (meds.length === 0) {
    list.innerHTML = '<p>No medicines found</p>';
    return;
  }
  let html = '<table style="width:100%;border-collapse:collapse;">';
  html += '<tr style="background:#f3f4f6;font-weight:bold;">'
       +'<th style="padding:10px;">Name</th>'
       +'<th style="padding:10px;">Company</th>'
       +'<th style="padding:10px;">Price</th>'
       +'<th style="padding:10px;">Quantity</th>'
       +'<th style="padding:10px;">Location</th>'
       +'<th style="padding:10px;">Actions</th>'
       +'</tr>';
  meds.forEach(m => {
    const loc = (m.rack||'') + '-' + (m.shelf||'');
    html += `<tr style="border-bottom:1px solid #ddd;">
      <td style="padding:10px;">${m.name}</td>
      <td style="padding:10px;">${m.company||''}</td>
      <td style="padding:10px;">${m.price||0}</td>
      <td style="padding:10px;">${m.quantity||0}</td>
      <td style="padding:10px;">${loc}</td>
      <td style="padding:10px;"><button class="secondary-btn" onclick="promptRestock('${m._id}','${m.name}',${m.quantity||0})">Add Stock</button></td>
     </tr>`;
  });
  html += '</table>';
  list.innerHTML = html;
}

function promptRestock(id,name,current) {
  const amt = prompt(`Add stock for ${name}. Current: ${current}\nEnter amount:`,'');
  if(!amt) return;
  const n = parseInt(amt);
  if(isNaN(n) || n<=0) {
    alert('Invalid amount');
    return;
  }
  restockMedicine(id,n);
}

async function restockMedicine(id, amount) {
  try {
    const res = await fetch(`/medicines/${id}/increase`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || 'Failed to add stock');
      return;
    }
    loadInventory();
    loadDashboard(); // update totals
  } catch(err){
    alert('Server error');
  }
}

function showAddMedicineForm(){
  document.getElementById('addMedPanel').style.display = 'block';
}
function hideAddMedicineForm(){
  document.getElementById('addMedPanel').style.display = 'none';
  document.getElementById('addMedMsg').innerText = '';
  document.getElementById('addMedForm').reset();
}

async function submitNewMedicine(e){
  e.preventDefault();
  const name = document.getElementById('med_name').value.trim();
  const company = document.getElementById('med_company').value.trim();
  const price = parseFloat(document.getElementById('med_price').value) || 0;
  const quantity = parseInt(document.getElementById('med_quantity').value) || 0;
  const rack = document.getElementById('med_rack').value.trim();
  const shelf = document.getElementById('med_shelf').value.trim();
  const msg = document.getElementById('addMedMsg');
  try{
    const res = await fetch('/medicines', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, company, price, quantity, rack, shelf })
    });
    const data = await res.json();
    if(!res.ok) {
      msg.innerText = data.message || 'Failed to add';
      return;
    }
    msg.innerText = 'Medicine added';
    loadInventory();
    loadDashboard();
    setTimeout(hideAddMedicineForm,1200);
  }catch(err){
    msg.innerText = 'Server error';
  }
}

// ================= BILLING: SEARCH MEDICINE =================
let billingCart = {};

async function searchMedBilling(){
  const searchBox = document.getElementById("billSearch");
  if(!searchBox) return;
  
  const query = searchBox.value.trim();
  
  if(!query){
    alert("Please enter a medicine name");
    return;
  }

  try {
    const res = await fetch("/search/" + encodeURIComponent(query));
    const data = await res.json();
    
    if(!data || data.length === 0){
      alert("Medicine not found");
      return;
    }
    
    const med = data[0];
    // ensure we have a valid id coming from server
    const medId = med._id || med.id;
    if(!medId){
      alert("Received invalid medicine identifier from server");
      return;
    }

    // calculate available quantity after accounting for items already in cart
    const existingQty = billingCart[medId] ? billingCart[medId].quantity : 0;
    const available = med.quantity - existingQty;
    if (available <= 0) {
      alert("No stock available for this medicine");
      return;
    }

    // Prompt for quantity
    const qty = prompt(`Add ${med.name} to cart. Available: ${available}\n(Enter quantity)`, "1");
    
    if(!qty || isNaN(qty) || qty <= 0){
      return;
    }
    
    if(qty > available){
      alert("Insufficient stock");
      return;
    }
    
    // Add to cart using medId as key
    if(!billingCart[medId]){
      billingCart[medId] = {
        name: med.name,
        price: med.price,
        quantity: 0
      };
    }
    
    billingCart[medId].quantity += parseInt(qty);
    
    // Update cart display
    updateCartDisplay();
    
    // Clear search
    searchBox.value = "";
    
  } catch(err){
    alert("Server error");
  }
}

function updateCartDisplay(){
  const cartDiv = document.getElementById("cart");
  if(!cartDiv) return;
  
  const items = Object.values(billingCart);
  
  if(items.length === 0){
    cartDiv.innerHTML = "<p>Cart is empty</p>";
    return;
  }
  
  let total = 0;
  let html = "<table style='width:100%;border-collapse:collapse;'>";
  html += "<tr style='border-bottom:1px solid #ccc;'>";
  html += "<th style='padding:5px;text-align:left;'>Medicine</th>";
  html += "<th style='padding:5px;'>Qty</th>";
  html += "<th style='padding:5px;'>Price</th>";
  html += "<th style='padding:5px;'>Total</th>";
  html += "<th style='padding:5px;'>Action</th></tr>";
  
  items.forEach((item, idx) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    html += "<tr style='border-bottom:1px solid #eee;'>";
    html += `<td style='padding:5px;'>${item.name}</td>`;
    html += `<td style='padding:5px;text-align:center;'>${item.quantity}</td>`;
    html += `<td style='padding:5px;text-align:right;'>₹${item.price}</td>`;
    html += `<td style='padding:5px;text-align:right;'>₹${itemTotal}</td>`;
    html += `<td style='padding:5px;text-align:center;'><button onclick='removeFromCart(${idx})' style='background:#dc2626;color:white;border:none;padding:3px 8px;cursor:pointer;border-radius:3px;'>Remove</button></td>`;
    html += "</tr>";
  });
  
  html += `<tr style='font-weight:bold;border-top:2px solid #000;'><td colspan='3' style='padding:10px;text-align:right;'>Total:</td><td style='padding:10px;text-align:right;'>₹${total}</td><td></td></tr>`;
  html += "</table>";
  
  cartDiv.innerHTML = html;
}

function removeFromCart(idx){
  const items = Object.values(billingCart);
  let count = 0;
  Object.keys(billingCart).forEach(key => {
    if(count === idx){
      delete billingCart[key];
    }
    count++;
  });
  updateCartDisplay();

  // Call updateBillSummary if it exists (for billing page)
  if(typeof updateBillSummary !== 'undefined'){
    updateBillSummary();
  }
}

// ================= BILLING: CHECKOUT =================
async function checkout(){
  const items = billingCart;
  
  if(Object.keys(items).length === 0){
    alert("Cart is empty");
    return;
  }
  
  try {
    const res = await fetch("/billing", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ items })
    });
    
    if(!res.ok){
      const error = await res.json();
      alert("Error generating bill: " + (error.message || "Unknown error"));
      return;
    }
    
    const data = await res.json();
    
    // Display bill
    displayBill(data, items);
    
    // Clear cart for next bill
    billingCart = {};
    updateCartDisplay();
    
    // Call updateBillSummary if it exists (for billing page)
    if(typeof updateBillSummary !== 'undefined'){
      updateBillSummary();
    }
    
  } catch(err){
    alert("Server error: " + err.message);
  }
}

// Display generated bill with details
function displayBill(billData, items){
  const billInvoiceDiv = document.getElementById("billInvoice");
  const billDetailsDiv = document.getElementById("billDetailsContent");
  
  if(!billInvoiceDiv || !billDetailsDiv) return;
  
  // Store bill data for printing
  window.currentBillData = {
    id: billData.billId,
    items: items,
    total: billData.totalAmount,
    date: new Date().toLocaleString(),
    itemsCount: billData.itemsCount
  };
  
  // Calculate subtotal and tax
  const subtotal = billData.totalAmount;
  const gst = subtotal * 0.05; // 5% GST
  const total = subtotal + gst;
  
  let itemsHTML = "";
  Object.values(items).forEach(item => {
    const itemTotal = item.price * item.quantity;
    itemsHTML += `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:8px; text-align:left;">${item.name}</td>
        <td style="padding:8px; text-align:center;">${item.quantity}</td>
        <td style="padding:8px; text-align:right;">₹${item.price.toFixed(2)}</td>
        <td style="padding:8px; text-align:right;">₹${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  });
  
  billDetailsDiv.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:15px;">
      <div>
        <p><strong>Bill ID:</strong> ${billData.billId}</p>
        <p><strong>Date:</strong> ${window.currentBillData.date}</p>
      </div>
      <div style="text-align:right;">
        <p><strong>Items Count:</strong> ${billData.itemsCount}</p>
        <p><strong>Status:</strong> <span style="color:#16a34a;">✓ Completed</span></p>
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse; margin:15px 0;">
      <thead>
        <tr style="background:#f3f4f6; border-bottom:2px solid #000;">
          <th style="padding:10px; text-align:left;">Medicine Name</th>
          <th style="padding:10px; text-align:center;">Qty</th>
          <th style="padding:10px; text-align:right;">Price</th>
          <th style="padding:10px; text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div style="background:#f9fafb; padding:12px; border-radius:5px; margin:15px 0;">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span>Subtotal:</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <span>GST (5%):</span>
        <span>₹${gst.toFixed(2)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1em; border-top:1px solid #e5e7eb; padding-top:8px;">
        <span>Total Amount:</span>
        <span style="color:#2563eb;">₹${total.toFixed(2)}</span>
      </div>
    </div>

    <p style="font-size:0.9em; color:#666; text-align:center; margin-top:15px;">
      Thank you for shopping at PharmaFlow!<br>
      Please keep this receipt for warranty/return purposes.
    </p>
  `;
  
  // Show bill invoice section
  billInvoiceDiv.classList.add("show");
}

function printBill(){
  if(!window.currentBillData) return;
  window.print();
}

function closeBill(){
  const billInvoiceDiv = document.getElementById("billInvoice");
  if(billInvoiceDiv) {
    billInvoiceDiv.classList.remove("show");
  }
}
