import { NextFunction, Request, Response } from 'express';
import { User } from '../models/user.model';
import { PasswordUtils } from '../utils/passwordUtils';
import { JwtUtils } from '../utils/jwtUtils';

export class AuthController {
  static getMe(arg0: string, authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>, getMe: any) {
      throw new Error("Method not implemented.");
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Please provide all required fields',
        });
        return;
      }
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User with this email or username already exists',
        });
        return;
      }

      const hashedPassword = await PasswordUtils.hashPassword(password);

      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      });

      // Generate token
      const token = JwtUtils.generateToken({
        userId: user._id.toString(),
        email: user.email,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
          },
          token,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error registering user',
        error: (error as Error).message,
      });
    }
  }
  
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Please provide email and password',
        });
        return;
      }
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      const isPasswordValid = await PasswordUtils.comparePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      const token = JwtUtils.generateToken({
        userId: user._id.toString(),
        email: user.email,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
          },
          token,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: (error as Error).message,
      });
    }
  }
}
