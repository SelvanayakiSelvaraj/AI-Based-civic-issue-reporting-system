const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const recover = async () => {
    // Manually clean the URI in case the file hasn't been fixed yet
    const uri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : null;

    if (!uri) {
        console.error('ERROR: MONGODB_URI not found in .env');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected successfully!\n');

        const users = await User.find({}).select('name email role createdAt');
        
        if (users.length === 0) {
            console.log('No users found in the database.');
        } else {
            console.log('--- REGISTERED USERS ---');
            users.forEach((u, i) => {
                console.log(`${i + 1}. [${u.role}] ${u.name} - Email: ${u.email} (Joined: ${u.createdAt.toLocaleDateString()})`);
            });
            console.log('------------------------');
        }

        process.exit(0);
    } catch (error) {
        console.error('CONNECTION ERROR:', error.message);
        process.exit(1);
    }
};

recover();
