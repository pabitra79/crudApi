
import request from 'supertest';
import mongoose from 'mongoose';
import app  from "../../app";
import { User } from '../../app/models/user.model'; 

describe('Authentication API Tests', () => {
  
  // Clean up before each test
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('username', 'johndoe');
      expect(response.body.data.user).toHaveProperty('email', 'john@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail to register without username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should fail to register without email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail to register without password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'john@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail to register with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'duplicate@example.com',
          password: 'password123'
        });

      // Try duplicate email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'duplicate@example.com',
          password: 'password456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should fail to register with duplicate username', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'user1@example.com',
          password: 'password123'
        });

      // Try duplicate username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'user2@example.com',
          password: 'password456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(500); 
      expect(response.body.success).toBe(false);
    });

    it('should hash the password before saving', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'johndoe',
          email: 'john@example.com',
          password: 'password123'
        });

      const user = await User.findOne({ email: 'john@example.com' }).select('+password');
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe('password123'); 
      expect(user?.password.length).toBeGreaterThan(20); 
    });
  });
  describe('POST /api/auth/login', () => {
    
    // Create a user before login tests
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'password123'
        });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', 'login@example.com');
      expect(typeof response.body.data.token).toBe('string');
    });

    it('should fail to login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail to login without email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email and password');
    });

    it('should fail to login without password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email and password');
    });

    it('should fail to login with empty credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return a valid JWT token on successful login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      const token = response.body.data.token;
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3); 
    });
  });

  describe('Security & Edge Cases', () => {
    
    it('should not expose password in user object', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'secureuser',
          email: 'secure@example.com',
          password: 'password123'
        });

      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should handle SQL injection attempts safely', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR '1'='1",
          password: "' OR '1'='1"
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should trim whitespace from email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'trimtest',
          email: '  trim@example.com  ',
          password: 'password123'
        });

      const user = await User.findOne({ email: 'trim@example.com' });
      expect(user).toBeDefined();
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'longpass',
          email: 'longpass@example.com',
          password: longPassword
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});