const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;
const fs = require('fs');
const globalEventPath = './globalEvents.json';
let globalEventData = JSON.parse(fs.readFileSync(globalEventPath));
const path = './users.json';


app.use(express.json());
app.use(express.static('.')); // Serves your HTMLs

let db = JSON.parse(fs.readFileSync(path));
let users = db.users;
let vendorUsers = db.vendors;



app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});


app.post('/forgot-password', (req, res) => {
    const { username } = req.body;
    const user = users[username];

    if (!user) return res.json({ message: 'User not found' });

    res.json({ question: user.securityQuestion });
});

app.post('/verify-security-answer', async (req, res) => {
    const { username, answer } = req.body;
    const user = users[username];

    const match = await bcrypt.compare(answer, user.securityAnswerHash);
    if (match) {
        res.json({ message: 'Verification passed. You may reset your password.' });
    } else {
        res.json({ message: 'Incorrect answer.' });
    }
});

// User Signup
app.post('/signup', async (req, res) => {
    const { username, password, email, securityQuestion, securityAnswer } = req.body;

    if (users[username]) return res.json({ message: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    users[username] = {
        passwordHash,
        email,
        securityQuestion,
        securityAnswerHash: await bcrypt.hash(securityAnswer, 10),
        bookings: [],
        wallet: 500
    };
    fs.writeFileSync(path, JSON.stringify({ users, vendors: vendorUsers }, null, 2));
    res.json({ message: 'Signup successful! You can now log in.' });
});

app.post('/save-booking', (req, res) => {
    const { username, booking } = req.body;
    const user = users[username];

    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!user.bookings) user.bookings = [];
    const ticketCount = parseInt(booking.tickets || 1);
    const ticketPrice = booking.price || 100;

    const totalCost = ticketCount * ticketPrice;

    if (user.wallet < totalCost) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    user.wallet -= totalCost;

    user.bookings.push(booking);

    fs.writeFileSync(path, JSON.stringify({ users, vendors: vendorUsers }, null, 2));
    res.json({ message: 'Booking saved' });
});


// app.post('/profile', (req, res) => {
//     const { username } = req.body;
//     const user = users[username] || vendorUsers[username];

//     if (!user) return res.json({ bookings: [] });

//     res.json({ bookings: user.bookings || [] });
// });

// app.post('/profile', (req, res) => {
//     const { username } = req.body;
//     const user = users[username] || vendorUsers[username];
//     if (!user) return res.json({ bookings: [] });

//     res.json({ bookings: user.bookings || [], wallet: user.wallet || 0 });

// });

app.post('/profile', (req, res) => {
    const { username } = req.body;
    const user = users[username] || vendorUsers[username];

    if (!user) return res.json({ bookings: [], wallet: 0 });

    res.json({
        bookings: user.bookings || [],
        wallet: user.wallet || 0,
        email: user.email || ''
    });
});





// Vendor Signup
// app.post('/vendor-signup', async (req, res) => {
//     const { username, password, email, eventsAdded: [] } = req.body;
//     if (vendorUsers[username]) return res.json({ message: 'Vendor ID already exists' });

//     const passwordHash = await bcrypt.hash(password, 10);
//     vendorUsers[username] = { passwordHash, email };
//     fs.writeFileSync(path, JSON.stringify({ users, vendors: vendorUsers }, null, 2));
//     res.json({ message: 'Vendor signup successful!' });
// });

app.post('/vendor-signup', async (req, res) => {
  const { username, password, email } = req.body;

  if (vendorUsers[username]) return res.json({ message: 'Vendor ID already exists' });

  const passwordHash = await bcrypt.hash(password, 10);

  vendorUsers[username] = {
    passwordHash,
    email,
    bookings: []  // ✅ or eventsAdded: []
  };

  fs.writeFileSync(path, JSON.stringify({ users, vendors: vendorUsers }, null, 2));
  res.json({ message: 'Vendor signup successful!' });
});



app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

app.post('/vendor-login', (req, res) => {
    const { username, password } = req.body;
    const vendor = vendorUsers[username];

    if (vendor && bcrypt.compareSync(password, vendor.passwordHash)) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.post('/save-event-addition', (req, res) => {
    const { username, booking } = req.body;
    const user = vendorUsers[username];
    if (!user) return res.status(400).json({ message: 'Vendor not found' });

    if (!user.bookings) user.bookings = [];
    user.bookings.push(booking);


    globalEventData.events.push(booking);
    fs.writeFileSync(globalEventPath, JSON.stringify(globalEventData, null, 2));
    fs.writeFileSync(path, JSON.stringify({ users, vendors: vendorUsers }, null, 2));

    res.json({ message: 'Event saved' });
});

app.get('/get-events', (req, res) => {
    res.json(globalEventData.events);
});

app.get('/admin-data', (req, res) => {
    res.json({
        users,
        vendors: vendorUsers,
        globalEvents: globalEventData.events
    });
});

app.get('/admin-data', (req, res) => {
    res.json({
        users,
        vendors: vendorUsers,
        globalEvents: globalEventData.events
    });
});





