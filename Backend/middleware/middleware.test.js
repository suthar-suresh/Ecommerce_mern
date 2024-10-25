const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User.js');
const checkAdmin = require('../middleware/authAdmin');
const fetchUser = require('../middleware/authUser');

dotenv.config();

// Setup a simple Express app for testing
const app = express();
app.use(express.json());
app.use('/admin', checkAdmin, (req, res) => {
    res.status(200).send("Welcome Admin");
});
app.use('/fetchUser', fetchUser, (req, res) => {
    res.status(200).send(`User ID: ${req.user.id}`);
});

// Mock the User model
jest.mock('../models/User.js');

// Connect to the database (in-memory for testing)
beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test_db', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {
    await mongoose.disconnect();
});

describe('checkAdmin middleware', () => {
    const mockUser = { id: '1', isAdmin: true };
    const token = jwt.sign({ user: mockUser }, process.env.JWT_SECRET);

    it('should allow access for admin users', async () => {
        User.findById.mockResolvedValueOnce(mockUser);
        
        const response = await request(app)
            .get('/admin')
            .set('Authorization', token);
        
        expect(response.status).toBe(200);
        expect(response.text).toBe("Welcome Admin");
    });

    it('should deny access for non-admin users', async () => {
        const nonAdminUser = { id: '2', isAdmin: false };
        User.findById.mockResolvedValueOnce(nonAdminUser);
        
        const response = await request(app)
            .get('/admin')
            .set('Authorization', token);
        
        expect(response.status).toBe(401);
        expect(response.text).toBe("Access denied");
    });

    it('should deny access if no token is provided', async () => {
        const response = await request(app).get('/admin');
        
        expect(response.status).toBe(401);
        expect(response.text).toBe("Access denied");
    });

    it('should deny access if token is invalid', async () => {
        const response = await request(app)
            .get('/admin')
            .set('Authorization', 'InvalidToken');
        
        expect(response.status).toBe(401);
        expect(response.text).toBe("Access denied");
    });
});

describe('fetchUser middleware', () => {
    const mockUser = { id: '1' };
    const token = jwt.sign({ user: mockUser }, process.env.JWT_SECRET);

    it('should fetch user data for valid token', async () => {
        const response = await request(app)
            .get('/fetchUser')
            .set('Authorization', token);
        
        expect(response.status).toBe(200);
        expect(response.text).toBe("User ID: 1");
    });

    it('should deny access if no token is provided', async () => {
        const response = await request(app).get('/fetchUser');
        
        expect(response.status).toBe(400);
        expect(response.text).toBe("Access denied");
    });

    it('should deny access if token is invalid', async () => {
        const response = await request(app)
            .get('/fetchUser')
            .set('Authorization', 'InvalidToken');
        
        expect(response.status).toBe(400);
        expect(response.text).toBe("Access denied");
    });
});
