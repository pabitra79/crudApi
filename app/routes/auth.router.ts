

import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const Authrouter = Router();

Authrouter.post('/register', AuthController.register);
Authrouter.post('/login', AuthController.login);

export {Authrouter};