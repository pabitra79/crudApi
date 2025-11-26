import { Request, Response } from 'express';
import { Task } from '../models/task.model';
import mongoose from 'mongoose';

export class TaskController {

  static async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, status } = req.body;
      const userId = req.user?.userId;

      // Validation
      if (!title || !description) {
        res.status(400).json({
          success: false,
          message: 'Please provide title and description',
        });
        return;
      }

      const task = await Task.create({
        title,
        description,
        status: status || 'pending',
        userId,
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating task',
        error: (error as Error).message,
      });
    }
  }

  static async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const tasks = await Task.find({ userId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching tasks',
        error: (error as Error).message,
      });
    }
  }


  static async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid task ID',
        });
        return;
      }

      const task = await Task.findOne({ _id: id, userId });

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching task',
        error: (error as Error).message,
      });
    }
  }


  static async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { title, description, status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid task ID',
        });
        return;
      }

      const task = await Task.findOneAndUpdate(
        { _id: id, userId },
        { title, description, status },
        { new: true }
      );

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating task',
        error: (error as Error).message,
      });
    }
  }

  static async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid task ID',
        });
        return;
      }

      const task = await Task.findOneAndDelete({ _id: id, userId });

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
        data: {},
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting task',
        error: (error as Error).message,
      });
    }
  }
}