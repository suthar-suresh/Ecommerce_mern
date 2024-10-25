const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const Product = require('../models/Product');
// const checkOrigin = require('../middleware/apiAuth');
const {
    getAllUsersInfo,
    getSingleUserInfo,
    getUserCart,
    getUserWishlist,
    getUserReview,
    deleteUserReview,
    deleteUserCartItem,
    deleteUserWishlistItem,
    addProduct,
    deleteProduct
} = require('./AdminControl');

dotenv.config();

const app = express();
app.use(express.json());
// app.use(checkOrigin);

// Mock routes for testing
app.get('/api/admin/getusers', getAllUsersInfo);
app.get('/api/admin/geteuser/:userId', getSingleUserInfo);
app.get('/api/admin/getcart/:userId', getUserCart);
app.get('/api/admin/getwishlist/:userId', getUserWishlist);
app.get('/api/admin/getreview/:userId', getUserReview);
app.delete('/api/admin/review/:id', deleteUserReview);
app.delete('/api/admin/usercart/:id', deleteUserCartItem);
app.delete('/api/admin/userwishlist/:id', deleteUserWishlistItem);
app.post('/api/admin/addproduct', addProduct);
app.delete('/api/admin/deleteproduct/:id', deleteProduct);

jest.mock('../models/User');
jest.mock('../models/Cart');
jest.mock('../models/Wishlist');
jest.mock('../models/Review');
jest.mock('../models/Product');

describe('Admin Control API Tests', () => {
    const mockAdmin = { id: '6708f6d665221a66070bb6d6' };
    const adminToken = jwt.sign({ user: mockAdmin }, process.env.JWT_SECRET);

    beforeEach(() => {
        jest.resetAllMocks(); 
    });
    it('should return all users info', async () => {
        const mockUsers = [
            { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', isAdmin: true, phoneNumber: 1234567890, createdAt: "2024-10-11T09:58:46.579Z", updatedAt: "2024-10-11T09:58:46.579Z" },
            { id: 'user2', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', isAdmin: true, phoneNumber: 1234567890, createdAt: "2024-10-11T09:58:46.579Z", updatedAt: "2024-10-11T09:58:46.579Z" }
        ];
    
        // Mock the User.find() method
        User.find.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUsers) 
        });

       const response = await request(app)
           .get('/api/admin/getusers');
       
       console.log(response.body);  // Should show your response body
       console.log(response.status);  // Should be 200

       expect(response.status).toBe(200);
       expect(response.body).toEqual({ success: true, data: mockUsers }); // Adjust your expectation
   });
    
    

    it('should return single user info', async () => {
        const mockUser =  { id: '6708f6d665221a66070bb6d6', firstName: 'test', lastName: 'test', email: 'test@gmail.com',isAdmin: true,phoneNumber: 1234567890,createdAt: "2024-10-11T09:58:46.579Z",updatedAt :"2024-10-11T09:58:46.579Z" }
        User.findById.mockImplementation(() => ({
            select: jest.fn().mockResolvedValue(mockUser),
          }));

        const response = await request(app)
            .get('/api/admin/geteuser/6708f6d665221a66070bb6d6')
            .set('Authorization', adminToken);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining(mockUser));
    });

    it('should return user cart items', async () => {
        const userId = 'user1';
        const mockUser = {
            _id: userId,
            firstName: 'Test',
            lastName: 'User',
            email: 'test@gmail.com'
        };

        const mockCartItems = [
            { user: userId, productId: 'prod1', quantity: 1 },
            { user: userId, productId: 'prod2', quantity: 2 }
        ];

        // Mocking User.findById to return the mock user
        User.findById.mockResolvedValue(mockUser);

        // Mocking Cart.find with chained populate calls
        Cart.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockCartItems) // Resolves with mock cart items
            })
        });

        // Sending request to the endpoint
        const response = await request(app)
            .get(`/api/admin/getcart/${userId}`)
            .set('Authorization', adminToken); // Use a valid token for authentication

        // Assertions to verify response status and body
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.arrayContaining(mockCartItems)); // Adjust based on actual response structure
    });

    it('should return user wishlist items', async () => {
        const userId = 'user1';
        const mockUser = {
            _id: userId,
            firstName: 'Test',
            lastName: 'User',
            email: 'test@gmail.com'
        };

        const mockWishlistItems = [
            { user: userId, productId: 'prod1' },
            { user: userId, productId: 'prod2' }
        ];

        // Mocking User.findById to return the mock user
        User.findById.mockResolvedValue(mockUser);

        // Mocking Wishlist.find with chained populate call
        Wishlist.find.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockWishlistItems) // Resolves with mock wishlist items
        });

        // Sending request to the endpoint
        const response = await request(app)
            .get(`/api/admin/getwishlist/${userId}`)
            .set('Authorization', 'Bearer your_valid_token'); // Use a valid token for authentication

        // Assertions to verify response status and body
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.arrayContaining(mockWishlistItems)); // Adjust based on actual response structure
    });


    it('should return user reviews', async () => {
        const userId = 'user1';
        const mockUser = {
            _id: userId,
            firstName: 'Test',
            lastName: 'User',
            email: 'test@gmail.com'
        };

        const mockReviews = [
            { user: userId, productId: 'prod1', review: 'Great product!', rating: 5 },
            { user: userId, productId: 'prod2', review: 'Good value for money.', rating: 4 }
        ];

        // Mocking User.findById to return the mock user
        User.findById.mockResolvedValue(mockUser);

        // Mocking Review.find with chained populate calls
        Review.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockReviews) // Resolves with mock reviews
            })
        });

        // Sending request to the endpoint
        const response = await request(app)
            .get(`/api/admin/getreview/${userId}`)
            .set('Authorization', 'Bearer your_valid_token'); // Use a valid token for authentication

        // Assertions to verify response status and body
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.arrayContaining(mockReviews)); // Adjust based on actual response structure
    });


    it('should delete user review', async () => {
        const mockReviewId = 'reviewId';
        Review.findByIdAndDelete.mockResolvedValueOnce({ id: mockReviewId });

        const response = await request(app)
            .delete(`/api/admin/review/${mockReviewId}`)
            .set('Authorization', adminToken);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ msg: 'Review deleted successfully' });
    });

    it('should delete user cart item', async () => {
        const mockCartItemId = 'cartItemId';
        Cart.findByIdAndDelete.mockResolvedValueOnce({ id: mockCartItemId });

        const response = await request(app)
            .delete(`/api/admin/usercart/${mockCartItemId}`)
            .set('Authorization', adminToken);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ msg: 'Review deleted successfully',success:true });
    });

    it('should delete user wishlist item', async () => {
        const mockWishlistItemId = 'wishlistItemId';
        Wishlist.findByIdAndDelete.mockResolvedValueOnce({ id: mockWishlistItemId });

        const response = await request(app)
            .delete(`/api/admin/userwishlist/${mockWishlistItemId}`)
            .set('Authorization', adminToken);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ msg: 'Review deleted successfully',success:true });
    });

    it('should add a product', async () => {
        const newProduct = { name: 'New Product', price: 29.99, category: 'Category' };
        Product.create.mockResolvedValueOnce(newProduct);

        const response = await request(app)
            .post('/api/admin/addproduct')
            .set('Authorization', adminToken)
            .send(newProduct);
        
        expect(response.status).toBe(201);
        expect(response.body).toEqual(true);
    });

    it('should delete a product', async () => {
        const mockProductId = 'prod1';
        Product.findById.mockResolvedValueOnce({ id: mockProductId });
        Product.findByIdAndDelete.mockResolvedValueOnce(true);

        const response = await request(app)
            .delete(`/api/admin/deleteproduct/${mockProductId}`)
            .set('Authorization', adminToken);
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual(true);
    });
});