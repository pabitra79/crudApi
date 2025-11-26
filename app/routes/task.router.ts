import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { authMiddleware } from '../middleware/authMiddleware';

const Taskrouter = Router();

Taskrouter.use(authMiddleware);

Taskrouter.post('/', TaskController.createTask);
Taskrouter.get('/', TaskController.getAllTasks);
Taskrouter.get('/:id', TaskController.getTaskById);
Taskrouter.put('/:id', TaskController.updateTask);
Taskrouter.delete('/:id', TaskController.deleteTask);

export {Taskrouter};