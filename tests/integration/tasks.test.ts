import request from 'supertest';
import mongoose from 'mongoose';
import app  from "../../app";
import { User } from '../../app/models/user.model'; 
import { Task } from '../../app/models/task.model'; 

describe('Task CRUD API Tests', () => {
  
  let authToken: string;
  let userId: string;
  let anotherUserToken: string;


  beforeAll(async () => {
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'taskuser',
        email: 'taskuser@example.com',
        password: 'password123'
      });

    authToken = response.body.data.token;
    userId = response.body.data.user.id;

    
    const anotherUser = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123'
      });

    anotherUserToken = anotherUser.body.data.token;
  });

  
  beforeEach(async () => {
    await Task.deleteMany({});
  });

 
  describe('POST /api/tasks', () => {
    
    it('should create a new task with authentication', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task description',
        status: 'pending'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('created successfully');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('title', 'Test Task');
      expect(response.body.data).toHaveProperty('description', 'This is a test task description');
      expect(response.body.data).toHaveProperty('status', 'pending');
      expect(response.body.data).toHaveProperty('userId');
    });

    it('should create a task with default status if not provided', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task without status',
          description: 'Description'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('pending'); 
    });

    it('should fail to create task without authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          description: 'Description'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should fail to create task with invalid token', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer invalid_token_here')
        .send({
          title: 'Test Task',
          description: 'Description'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail to create task without title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Description only'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('title');
    });

    it('should fail to create task without description', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Title only'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('description');
    });

    it('should accept valid status values', async () => {
      const statuses = ['pending', 'in-progress', 'completed'];
      
      for (const status of statuses) {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Task with ${status}`,
            description: 'Description',
            status
          });

        expect(response.status).toBe(201);
        expect(response.body.data.status).toBe(status);
      }
    });

    it('should fail with invalid status', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Description',
          status: 'invalid-status'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    
    beforeEach(async () => {
     
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 1',
          description: 'Description 1'
        });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 2',
          description: 'Description 2'
        });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 3',
          description: 'Description 3'
        });
    });

    it('should get all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(response.body.data).toHaveLength(3);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return empty array if user has no tasks', async () => {
     
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    it('should fail to get tasks without authentication', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should only return tasks belonging to the authenticated user', async () => {
  
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          title: 'Another users task',
          description: 'Should not be visible'
        });

     
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3); 
      
      const titles = response.body.data.map((task: any) => task.title);
      expect(titles).not.toContain('Another users task');
    });

    it('should return tasks sorted by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      const tasks = response.body.data;
      expect(tasks[0].title).toBe('Task 3'); 
      expect(tasks[2].title).toBe('Task 1'); 
    });
  });


  describe('GET /api/tasks/:id', () => {
    
    let taskId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Single Task',
          description: 'Test single task retrieval'
        });

      taskId = response.body.data._id;
    });

    it('should get a single task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id', taskId);
      expect(response.body.data).toHaveProperty('title', 'Single Task');
      expect(response.body.data).toHaveProperty('description');
    });

    it('should return 404 for non-existent task ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid task ID format', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-id-format')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid task ID');
    });

    it('should not allow access to another users task', async () => {
      // Try to access first user's task with another user's token
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  
  describe('PUT /api/tasks/:id', () => {
    
    let taskId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Title',
          description: 'Original Description',
          status: 'pending'
        });

      taskId = response.body.data._id;
    });

    it('should update a task successfully', async () => {
      const updatedData = {
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'completed'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.data).toHaveProperty('title', 'Updated Title');
      expect(response.body.data).toHaveProperty('description', 'Updated Description');
      expect(response.body.data).toHaveProperty('status', 'completed');
    });

    it('should update only the title', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Only Title Updated'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Only Title Updated');
      expect(response.body.data.description).toBe('Original Description');
    });

    it('should update only the status', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'in-progress'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('in-progress');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await request(app)
        .put('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not allow updating another users task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          title: 'Trying to update'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    
    let taskId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Delete',
          description: 'This task will be deleted'
        });

      taskId = response.body.data._id;
    });

    it('should delete a task successfully', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify task is actually deleted
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid task ID', async () => {
      const response = await request(app)
        .delete('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not allow deleting another users task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

    
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should permanently delete task from database', async () => {
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

   
      const task = await Task.findById(taskId);
      expect(task).toBeNull();
    });
  });
});