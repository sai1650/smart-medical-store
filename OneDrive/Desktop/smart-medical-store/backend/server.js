const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files (resolve absolute path)
const frontendStatic = path.join(__dirname, '..', 'frontend', 'public');
app.use(express.static(frontendStatic));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smart_medical_store")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.log("❌ MongoDB Connection Error:", err.message);
    console.log("Make sure MongoDB is running: mongod");
  });

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "staff", enum: ["admin", "staff"] },
  name: String,
  email: String,
  phone: String,
  // fields used for password reset via OTP
  resetOTP: Number,
  otpExpiry: Date,
  created_at: { type: Date, default: Date.now }
});

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: String,
  date: Date,
  status: { type: String, enum: ["present", "absent", "leave"], default: "present" },
  check_in: Date,
  check_out: Date,
  created_at: { type: Date, default: Date.now }
});

// Medicine Schema
const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  company: { type: String, index: true },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  rack: String,
  shelf: String,
  created_at: { type: Date, default: Date.now }
});

// Sales Schema
const salesSchema = new mongoose.Schema({
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
  medicine_name: String,
  qty: Number,
  total: Number,
  sold_at: { type: Date, default: Date.now }
});

// Bill Schema
const billSchema = new mongoose.Schema({
  items: Array,
  total_amount: Number,
  created_at: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model("User", userSchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);
const Medicine = mongoose.model("Medicine", medicineSchema);
const Sales = mongoose.model("Sales", salesSchema);
const Bill = mongoose.model("Bill", billSchema);

// ==================== ROUTES ====================

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    
    if (user) {
      res.json(user);
    } else {
      res.json({ message: "Invalid login" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// FORGOT PASSWORD - generate and "send" OTP
app.post("/forgot-password", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      // don't reveal existence of account
      return res.json({ success: true, message: "If that user exists an OTP has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit
    user.resetOTP = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // valid for 5min
    await user.save();

    // In real app we would send email or SMS. For now return it for dev.
    res.json({ success: true, message: "OTP generated", otp });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD using OTP
app.post("/reset-password", async (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;
    if (!username || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ username });
    if (!user || !user.resetOTP || !user.otpExpiry) {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (Number(otp) !== user.resetOTP) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    user.password = newPassword;
    user.resetOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// REGISTER (for staff)
app.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const newUser = new User({
      username,
      password,
      role: role || "staff"
    });

    await newUser.save();
    res.json({ success: true, id: newUser._id });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});

// SEARCH MEDICINE
app.get("/search/:name", async (req, res) => {
  try {
    const name = req.params.name || "";
    const medicines = await Medicine.find({
      name: { $regex: name, $options: "i" }
    }).limit(20);
    
    res.json(medicines);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json([]);
  }
});

// LOW STOCK
app.get("/low-stock", async (req, res) => {
  try {
    const medicines = await Medicine.find({ quantity: { $lte: 20 } }).sort({ quantity: 1 });
    res.json(medicines);
  } catch (err) {
    console.error("Low stock error:", err);
    res.status(500).json([]);
  }
});

// ANALYTICS
app.get("/analytics", async (req, res) => {
  try {
    const totalMedicines = await Medicine.countDocuments();
    const medicines = await Medicine.find();
    let totalStock = 0;
    medicines.forEach(m => totalStock += m.quantity);
    
    // Get total staff
    const totalStaff = await User.countDocuments({ role: "staff" });
    
    // Get sales data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const sales = await Sales.aggregate([
      { $match: { sold_at: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$sold_at" } }, total: { $sum: "$total" } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({ 
      totalMedicines, 
      totalStock,
      totalStaff,
      weeklySales: sales.map(s => s.total),
      weeklyLabels: sales.map(s => s._id)
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ totalMedicines: 0, totalStock: 0, totalStaff: 0 });
  }
});

// DEBUG: show top medicines and types (temporary)
app.get('/debug-stock', async (req, res) => {
  try {
    const totalMedicines = await Medicine.countDocuments();
    const medicines = await Medicine.find().sort({ quantity: -1 }).limit(50);

    // include type info for quantity fields
    const meds = medicines.map(m => ({ id: m._id, name: m.name, quantity: m.quantity, qtyType: typeof m.quantity }));

    res.json({ totalMedicines, topByQuantity: meds });
  } catch (err) {
    console.error('Debug-stock error', err);
    res.status(500).json({ error: 'debug failed' });
  }
});

// BILLING - Generate bill and update stock
app.post("/billing", async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || Object.keys(items).length === 0) {
      return res.status(400).json({ message: "No items in cart" });
    }

    let totalAmount = 0;
    const billItems = [];

    for (const [medId, medicine] of Object.entries(items)) {
      // ensure medId is valid
      if (!medId || medId === 'undefined') {
        console.error("Skipping invalid medicine id in billing", medId);
        continue; // ignore invalid entries
      }

      const qty = medicine.quantity;
      const itemTotal = medicine.price * qty;
      totalAmount += itemTotal;

      // Update medicine quantity
      await Medicine.findByIdAndUpdate(medId, {
        $inc: { quantity: -qty }
      });

      // Record sale
      const sale = new Sales({
        medicine_id: medId,
        medicine_name: medicine.name,
        qty: qty,
        total: itemTotal
      });
      await sale.save();

      billItems.push({
        name: medicine.name,
        qty: qty,
        price: medicine.price,
        total: itemTotal
      });
    }

    // Create bill
    const bill = new Bill({
      items: billItems,
      total_amount: totalAmount
    });
    await bill.save();

    res.json({ success: true, totalAmount, billId: bill._id, itemsCount: billItems.length });
  } catch (err) {
    console.error("Billing error:", err);
    res.status(500).json({ message: "Billing failed" });
  }
});

// FILTER BY COMPANY
app.get("/company/:name", async (req, res) => {
  try {
    const medicines = await Medicine.find({ company: req.params.name });
    res.json(medicines);
  } catch (err) {
    res.status(500).json([]);
  }
});

// ROUTES FOR MEDICINE MANAGEMENT

// Get all medicines (with optional limit)
app.get('/medicines', async (req, res) => {
  try {
    const meds = await Medicine.find().sort({ name: 1 });
    res.json(meds);
  } catch (err) {
    console.error('Fetch medicines error', err);
    res.status(500).json([]);
  }
});

// Create a new medicine record
app.post('/medicines', async (req, res) => {
  try {
    const { name, company, price, quantity, rack, shelf } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name required' });
    }
    const newMed = new Medicine({ name, company, price: price || 0, quantity: quantity || 0, rack, shelf });
    await newMed.save();
    res.json({ success: true, medicine: newMed });
  } catch (err) {
    console.error('Create medicine error', err);
    res.status(500).json({ message: 'Failed to create medicine' });
  }
});

// Increase stock for a medicine by id (body: { amount: <number> })
app.post('/medicines/:id/increase', async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: amount } },
      { new: true }
    );

    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

    res.json({ success: true, medicine });
  } catch (err) {
    console.error('Increase stock error', err);
    res.status(500).json({ message: 'Failed to increase stock' });
  }
});

// ==================== STAFF MANAGEMENT ====================

// GET ALL STAFF (for admin)
app.get("/staff", async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).select("-password");
    res.json(staff);
  } catch (err) {
    res.status(500).json([]);
  }
});

// GET STAFF PROFILE
app.get("/staff/:id/profile", async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select("-password");
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Not found" });
  }
});

// UPDATE STAFF PROFILE
app.put("/staff/:id/profile", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true }
    ).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// ==================== ATTENDANCE ====================

// MARK ATTENDANCE (from admin)
app.post("/attendance/mark", async (req, res) => {
  try {
    const { user_id, status } = req.body;
    
    if (!user_id || !status) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get user info for username
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    let attendance = await Attendance.findOne({
      user_id,
      date: { $gte: today }
    });
    
    if (attendance) {
      // Update existing record
      attendance.status = status;
      attendance.check_in = new Date();
      await attendance.save();
    } else {
      // Create new record
      attendance = new Attendance({
        user_id,
        username: user.username,
        date: today,
        status: status,
        check_in: new Date()
      });
      await attendance.save();
    }
    
    res.json({ success: true, message: "Attendance marked successfully", attendance });
  } catch (err) {
    console.error("Attendance marking error:", err);
    res.status(500).json({ success: false, message: "Failed to mark attendance" });
  }
});

// CHECK IN / MARK ATTENDANCE (from staff - DEPRECATED, now admin only)
app.post("/attendance/checkin", async (req, res) => {
  try {
    const { user_id, username, status } = req.body;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let attendance = await Attendance.findOne({
      user_id,
      date: { $gte: today }
    });
    
    if (attendance) {
      attendance.check_in = new Date();
      attendance.status = status || "present";
      await attendance.save();
    } else {
      attendance = new Attendance({
        user_id,
        username,
        date: today,
        status: status || "present",
        check_in: new Date()
      });
      await attendance.save();
    }
    
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Check-in failed" });
  }
});

// CHECK OUT
app.post("/attendance/checkout", async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOneAndUpdate(
      { user_id, date: { $gte: today } },
      { check_out: new Date() },
      { new: true }
    );
    
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Check-out failed" });
  }
});

// GET TODAY'S ATTENDANCE (for staff - to check if attendance marked)
app.get("/attendance/:user_id/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      user_id: req.params.user_id,
      date: { $gte: today }
    });
    
    if (attendance) {
      res.json({
        marked: true,
        status: attendance.status,
        timestamp: attendance.check_in || new Date()
      });
    } else {
      res.json({
        marked: false,
        status: null,
        timestamp: null
      });
    }
  } catch (err) {
    res.status(500).json({ marked: false });
  }
});

// GET STAFF ATTENDANCE RECORDS
app.get("/attendance/:user_id", async (req, res) => {
  try {
    const records = await Attendance.find({ user_id: req.params.user_id })
      .sort({ date: -1 })
      .limit(30);
    res.json(records);
  } catch (err) {
    res.status(500).json([]);
  }
});

// GET TODAY'S ATTENDANCE REPORT (for admin)
app.get("/attendance-report/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const records = await Attendance.find({
      date: { $gte: today }
    }).sort({ check_in: -1 });
    
    res.json(records);
  } catch (err) {
    res.status(500).json([]);
  }
});

// GET ALL ATTENDANCE (for admin)
app.get("/attendance-report/all", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const records = await Attendance.find({
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });
    
    res.json(records);
  } catch (err) {
    res.status(500).json([]);
  }
});

// ==================== BILLS HISTORY ====================

// GET ALL BILLS
app.get("/bills", async (req, res) => {
  try {
    const bills = await Bill.find().sort({ created_at: -1 }).limit(100);
    res.json(bills);
  } catch (err) {
    res.status(500).json([]);
  }
});

// GET SPECIFIC BILL
app.get("/bills/:id", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bill" });
  }
});

// SERVE HOMEPAGE
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendStatic, 'index.html'));
});

// ==================== SEED DATA ====================
async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany([
        { username: "admin", password: "admin", role: "admin", name: "Admin", email: "admin@pharmaflow.com", phone: "9000000001" },
        { username: "staff", password: "staff", role: "staff", name: "John Doe", email: "john@pharmaflow.com", phone: "9000000002" },
        { username: "staff2", password: "staff2", role: "staff", name: "Jane Smith", email: "jane@pharmaflow.com", phone: "9000000003" }
      ]);
      console.log("✅ Users created");
    }

    const medCount = await Medicine.countDocuments();
    if (medCount === 0) {
      await Medicine.insertMany([
        { name: "Paracetamol 500mg", company: "Acme Pharma", price: 20, quantity: 50, rack: "R1", shelf: "S1" },
        { name: "Amoxicillin 250mg", company: "HealthCorp", price: 45, quantity: 30, rack: "R1", shelf: "S2" },
        { name: "Cough Syrup 100ml", company: "Wellness Ltd", price: 90, quantity: 10, rack: "R2", shelf: "S1" },
        { name: "Aspirin 500mg", company: "Acme Pharma", price: 15, quantity: 25, rack: "R2", shelf: "S2" },
        { name: "Ibuprofen 200mg", company: "HealthCorp", price: 25, quantity: 40, rack: "R3", shelf: "S1" }
      ]);
      console.log("✅ Medicines created");
    }
  } catch (err) {
    console.log("Seed data error:", err.message);
  }
}

// Seed after connection
setTimeout(() => seedDatabase(), 1000);

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
