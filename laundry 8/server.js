const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require("bcryptjs");
const path = require('path'); // Import the path module
const app = express();
const PORT = 3000;
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));
// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));
    
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});
    
const User = mongoose.model('User', userSchema);

// Signup Route
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Save new user to MongoDB
        const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(200).json({ message: 'Signup successful! Please login.' });
    } catch (err) {
        res.status(500).json({ error: 'Error signing up' });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found. Please sign up.' });
        }

        // Check if password matches (plain text for now, use bcrypt in production)
        if (user.password !== password) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successful!' });
    } catch (err) {
        res.status(500).json({ error: 'Error logging in' });
    }
});


const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    zip: String,
    message: String,
    date: { type: Date, default: Date.now }
  });
  
  const Contact = mongoose.model("Contact", contactSchema);
  
  // API Endpoint for Contact Form Submission
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, phone, address, city, zip, message } = req.body;
  
      if (!name || !email || !phone || !message) {
        return res.status(400).json({ success: false, error: "All required fields must be filled" });
      }
  
      const newContact = new Contact({ name, email, phone, address, city, zip, message });
      await newContact.save();
  
      res.status(201).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
      console.error("Error saving contact:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  const Admin = mongoose.model("Admin", new mongoose.Schema({
    name: String,
    email: String,
    password: String
    }));

  app.post("/admin-signup", async (req, res) => {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
        return res.json({ success: false, message: "Admin already exists!" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    await newAdmin.save();

    res.json({ success: true });
});

const Adminlogin = mongoose.model("Adminlogin", new mongoose.Schema({
    name: String,
    email: String,
    password: String
    }));

app.post("/admin-login", async (req, res) => {
    const { email, password } = req.body;
    const user = await Admin.findOne({ email });

    if (!user) {
        return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.json({ success: false, message: "Invalid Email or Password" });
    }

    res.json({ success: true, message: "Login Successful" });
});

const PriceSchema = new mongoose.Schema({
    category: String,
    items: [{ name: String, price: Number }]
});

const PriceModel = mongoose.model("Price", PriceSchema);

// Route to update prices
app.post("/update-prices", async (req, res) => {
    try {
        console.log("Received data:", JSON.stringify(req.body, null, 2)); // Debugging
        const updatedPrices = req.body;

        if (!Array.isArray(updatedPrices)) {
            return res.status(400).json({ success: false, message: "Invalid data format" });
        }

        for (const category of updatedPrices) {
            console.log("Updating category:", category.category);
            await PriceModel.findOneAndUpdate(
                { category: category.category },
                { $set: { items: category.items } },
                { upsert: true, new: true }
            );
        }

        res.json({ success: true, message: "Prices updated successfully" });
    } catch (error) {
        console.error("Error updating prices:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});


// Route to get prices (for user page)
app.get("/get-prices", async (req, res) => {
    try {
        const prices = await PriceModel.find();
        res.json(prices);
    } catch (error) {
        console.error("Error fetching prices:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});


// Save Order ID when user checks status
app.post("/save-order", async (req, res) => {
    const { orderId, status } = req.body;

    if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
    }

    try {
        console.log("Received Order ID:", orderId, "Status:", status);
        const newOrder = new Order({ orderId, status });
        await newOrder.save();
        console.log("Order saved successfully:", newOrder);
        res.status(201).json({ message: "Order saved successfully" });
    } catch (error) {
        console.error("Error saving order:", error);
        res.status(500).json({ message: "Error saving order", error: error.message });
    }
});


// Fetch all orders for admin dashboard
app.get("/get-orders", async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

const OrderSchema = new mongoose.Schema({
	name: String,
	email: String,
	phone: String,
	area: String,
	address: String,
	zip: String,
	deliveryType: String,
	paymentMethod: String,
    clothes: String,
	orderId: String,
	date: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", OrderSchema);

// API Route to Store Form Data
app.post("/book-wash", async (req, res) => {
	try {
		const newOrder = new Order(req.body);
		await newOrder.save();
		res.json({ success: true, message: "Order placed successfully!" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: "Failed to place order!" });
	}
});

app.get("/get-order/:orderId", async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        console.log("Sending Response:", order); // Debugging in terminal
        res.json(order);
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: error.message });
    }
});




// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});
app.get('/admin-dashboard',(req, res)=>{
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
})

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});