const express= require('express');
const mongoose= require("mongoose");
const app= express();
const port=process.env.PORT || 6000;
const bodyParser= require("body-parser");
const bcrypt= require("bcrypt")
const jwt= require("jsonwebtoken");
const axios = require('axios');
const url='mongodb+srv://Sizwenkala:sizwe123@cluster0.fejtt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
//const url='mongodb://localhost:27017/pathToPeace';
const nodemailer= require('nodemailer')
const crypto= require("crypto");
const fs= require('fs');
const path= require('path');
const cors= require('cors');
const pdfKit = require('pdfkit');


// Middleware
app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());


//connecting to the database
mongoose.connect(url);
const database = mongoose.connection
//checking if our connection to database was successful
database.on('error', (error)=>{
    console.log(error)
})
database.once('open', ()=>{
    console.log("database connected")
});

//database models
const User= require('./models/newUser');
const PasswordResetRequest= require('./models/passwordResetRequest');
const NewJournal= require('./models/newJournal');
const NewEmotionalRating= require('./models/EmotionalRating');

const verifyJWT = (req, res, next) => {
  try {
    const token = req.body.token || req.headers['authorization']; // Check for token in body or headers
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    req.userId = decoded.userId; // Attach decoded user ID to the request object
    next(); // Allow the request to proceed if token is valid
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token expired' });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

//Handling user registration 
app.post('/register', async (req,res)=>{
    const { username, email, password, dateOfBirth } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create and save the user to the database
  const user = new User({
    day: 1,
    username,
    email,
    password: hashedPassword,
    dateOfBirth,
  });

  try {
    await user.save();
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed' });
  }
});

//Handling user login 

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if the password is correct
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ message: 'Incorrect password' });
  }

  if (passwordMatch) {
    const userId = user._id; // Extract user ID from authenticated user

    // Check if day exceeds 30 and update accordingly
    let updatedDay = user.day;
    if (user.day > 30) {
      updatedDay = 0;
    } else {
      updatedDay++;
    }

    // Update user information
    const updatedUser = await User.findByIdAndUpdate(userId, { $set: { day: updatedDay } });

    if (!updatedUser) {
      return res.status(500).json({ message: 'Error fetching user information' });
    }

    // Generate a JWT for authentication
    const username = user.username;
    const token = jwt.sign({ userId: user._id, day: updatedDay, username }, 'your-secret-key', {
      expiresIn: '25m', // Token expiration time
    });

    return res.status(200).json({ token });
  }
});

// validate JWT every time a user navigates to a page 
app.post('/validate-token', async (req, res) => {
  try {
    const {token} = req.body;
    const decoded = jwt.verify(token, 'your-secret-key');

    if(!decoded){
      res.status(401).json({ message: 'Invalid token' });
    }else{
      let username= decoded.username
  
      let day= decoded.day;
      res.status(200).json({ message: 'Token is valid', day: day, username: username });
    }
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

//configuring nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or other service like SendGrid, Mailgun, etc.
  auth: {
    user: "sizwenkala80@gmail.com",
    pass: "nwmxluylxdvtzarr"
  }
})

//handling password request reset

app.post('/reset-password-request', async (req, res) => {

  const { email, } = req.body;
  // Check if the user with the provided email exists
  const user = await User.findOne({email});

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Generate a unique reset token
  const token = crypto.randomBytes(32).toString('hex');

  // Save the reset token in the database
  const resetToken = new PasswordResetRequest({
    userId: user._id,
    token,
  });
 // Send password reset email
 try {
  await resetToken.save();
await sendPasswordResetEmail(user, token);
res.status(200).json({ message: 'Password reset email sent' });
} catch (error) {
  console.error(error);
  res.status(500).send('Error sending email');
}
});

async function sendPasswordResetEmail(user, token) {
  const mailOptions = {
    from: 'sizwenkala80@gmail.com',
    to: user.email,
    subject: 'Password Reset Request',
    html: `<h1> Path To peace </h1>
    <p>Please copy this temporary secret key,navigate to password reset page and paste it in the input </p>
    <h4>Temporay secret key: ${token} </h4>`,
  };

  await transporter.sendMail(mailOptions);
}



app.post('/reset-password/', async (req, res) => {
  const { newPassword, token } = req.body;

  try {
    // Find the reset token in the database
    const resetToken = await PasswordResetRequest.findOne({ token });

    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Find the user associated with the token
    const user = await User.findById(resetToken.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's password (hashed and salted)
    user.password = await bcrypt.hash(newPassword, 10); // Adjust salt rounds as needed
    await user.save();

    // Delete the reset token
    await PasswordResetRequest.deleteOne({ token });


    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});


app.post('/dailyJournal',verifyJWT, async (req,res)=>{
  const {date,dailyAccomplishment,boundariesToBeEnforced,topPriorities,thingsDoneBetter,struggles,
    momentsToRemember,
    moodTriggers,token,day}= req.body;

    let decode = jwt.verify(token, 'your-secret-key');
    let userId= decode.userId;

    
  // Create and save the journal to the database
  const journal = new NewJournal({
    date,
    day,
    userId:userId,
    dailyAccomplishment,
    boundariesToBeEnforced,
    topPriorities,
    thingsDoneBetter,
    struggles,
    momentsToRemember,
    moodTriggers,
  });

  try {
    await journal.save();
    return res.status(201).json({ message: 'Journal saved successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'could not save journal, try again later' });
  }
})



//saving emotional ratings values
app.post('/emotionalRating',verifyJWT, async(req,res)=>{
  const{ date,fatigueAndExhaustion,anxiety,emotionalNumbness,day,isolation,insecurity,AverageEmotion, token}= req.body;
  let decode = jwt.verify(token, 'your-secret-key');
  let userId= decode.userId;
  if(!decode){
    return res.json({message: 'failed'})
  }

  const emotionalRating= new NewEmotionalRating({
    date,
    day,
    userId:userId,
    fatigueAndExhaustion,
    anxiety,
    emotionalNumbness,
    isolation,
    insecurity,
    AverageEmotion
  });

  try {
    await emotionalRating.save();
    return res.status(201).json({message:"success"})
  } catch (error) {
    return res.status(500).json({message: "failed"})
  }
});

//finding the last journal and emotional rating, rendering it to the app
app.post('/findLatestJournalByUserId',verifyJWT, async(req,res)=>{
  try {
    const token=req.body.token
    // Decode the token and extract the userId
    const decoded = jwt.verify(token, 'your-secret-key'); // Replace with your actual secret key
    const userId = decoded.userId;

    // Find all journals with the matching userId
    const journals = await NewJournal.find({ userId });

    // Return the last object in the collection (or null if no journals found)
    return  res.status(200).json({journal:journals.length > 0 ? journals[journals.length - 1] : null});
  } catch (error) {
    return res.status(404).json({message:"your last Journal will appear here"});
  }
})



app.post('/findTheLatestEmotionalRatingByUserId',verifyJWT, async(req,res)=>{
  try {
    const token= req.body.token;
    // Decode the token and extract the userId
    const decoded = jwt.verify(token, 'your-secret-key'); // Replace with your actual secret key
    const userId = decoded.userId;

    // Find all journals with the matching userId
    const ratings = await NewEmotionalRating.find({ userId });

    // Return the last object in the collection (or null if no journals found)
    return  res.status(200).json({rating:ratings.length > 0 ? ratings[ratings.length - 1] : null});
  } catch (error) {
    return res.status(404).json({message:"your Emotional Rating will appear here"});
  }
})


app.post('/generate-pdf',verifyJWT, async (req, res) => {
  const { token } = req.body;
  const decoded = jwt.verify(token, 'your-secret-key');
  const userId = decoded.userId;
  const username= decoded.username;
  
  // Fetch journal entries and ratings, filtering for the past 30 days
  const { entries, ratings } = await getMonthlyReportData(userId);
  
  // Handle potential errors from data retrieval
  if (!entries || !ratings) {
    return res.status(500).json({ message: 'Error fetching data' });
  }
  
  try {
    // Create a new PDFKit document
const doc = new pdfKit({ size: 'A4' });

// Add title and headers
doc.fontSize(18).text('Monthly Journal Report', { align: 'center', bold: true });
doc.moveDown(); // Add some space

entries.forEach((entry, index) => {
  if (index > 0) {
    doc.addPage();
  }

  // Add entry number and daily accomplishment
  doc.fontSize(14).text(`${index + 1}. Day ${entry.day}`, { align: 'justify', bold: true });
  doc.moveDown(); // Add some space

  // Add remaining entry details with line breaks
  const entryDetails = [
    { label: 'Daily accomplishments:', content: entry.dailyAccomplishment },
    { label: 'Boundaries:', content: entry.boundariesToBeEnforced },
    { label: 'Top Priorities:', content: entry.topPriorities },
    { label: 'Things Done Better:', content: entry.thingsDoneBetter },
    { label: 'Struggles:', content: entry.struggles },
    { label: 'Moments To Remember:', content: entry.momentsToRemember },
    { label: 'Mood Triggers:', content: entry.moodTriggers }
  ];

  entryDetails.forEach(detail => {
    doc.fontSize(12).text(`${detail.label} ${detail.content}`, { align: 'justify' });
    doc.moveDown(0.5);
  });
  doc.moveDown(); // Add some space
});

// Add a ratings section
doc.addPage(); // Add a new page for ratings
doc.fontSize(18).text('Ratings:', { align: 'center', bold: true });
doc.moveDown(); // Add some space

ratings.forEach((rating, index) => {
  if (index > 0) {
    doc.addPage();
  }
  doc.fontSize(14).text(`Day: ${rating.day}`, { align: 'justify', bold: true });
  doc.moveDown(); 
  doc.fontSize(12).text(`Fatigue and exhaustion: ${(rating.fatigueAndExhaustion * 10).toFixed(0)}/10`, { align: 'justify' });
  doc.moveDown(); 
  doc.fontSize(12).text(`Anxiety: ${(rating.anxiety* 10).toFixed(0)}/10`, { align: 'justify' });
  doc.moveDown(); 
  doc.fontSize(12).text(`Emotional numbness: ${( rating.emotionalNumbness * 10).toFixed()}/10`, { align: 'justify' });
  doc.moveDown(); 
  doc.fontSize(12).text(`Isolation: ${(rating.isolation * 10).toFixed(0)}/10`, { align: 'justify' });
  doc.moveDown(); 
  doc.fontSize(12).text(`Insecurity: ${(rating.insecurity * 10).toFixed(0)}/10`, { align: 'justify' });
  doc.moveDown(); 
  doc.fontSize(12).text(`Average Emotion: ${(rating.AverageEmotion).toFixed(0)}/10`, { align: 'justify' });
  doc.moveDown(); // Add some space
});

// Save the PDF to a file (replace with your desired path)
const filePath = path.join(__dirname, 'public', `${username}.pdf`);
doc.pipe(fs.createWriteStream(filePath));
doc.end();

// Send a success response after successful generation
res.json({ url: 'http://192.168.43.154:6000/output.pdf' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
});

async function getMonthlyReportData(userId) {
 
  try {
    const entries = await NewJournal.find({ userId});
    const ratings = await NewEmotionalRating.find({ userId,});

    return { entries, ratings }; // Return filtered entries and ratings
  } catch (error) {
    console.error(error);
    throw error; // Re-throw the error for handling in the main function
  }
}


app.listen(port, ()=>{console.log(`server is running on port: ${port}`)})
