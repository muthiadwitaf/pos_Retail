import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export class AuthService {
    private signToken(id: string, role: string) {
        return jwt.sign({ id, role }, process.env.JWT_SECRET!, {
            expiresIn: '1d',
        });
    }

    private signRefreshToken(id: string) {
        return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
            expiresIn: '7d',
        });
    }

    async login(email: string, password: string) { // Explicitly typed as string
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new AppError('Incorrect email or password', 401);
        }

        const token = this.signToken(user.id, user.role);
        const refreshToken = this.signRefreshToken(user.id);

        return {
            token,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    async register(data: { name: string; email: string; password: string }) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('Email already in use', 400);
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: 'KASIR', // Default role for new signups
            },
        });

        const token = this.signToken(user.id, user.role);
        const refreshToken = this.signRefreshToken(user.id);

        return {
            token,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }

    async refreshToken(refreshToken: string) { // Explicitly typed
        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET!
            ) as { id: string };

            const user = await prisma.user.findUnique({ where: { id: decoded.id } });

            if (!user) {
                throw new AppError('User not found', 404);
            }

            const token = this.signToken(user.id, user.role);

            return { token };
        } catch (error) {
            throw new AppError('Invalid refresh token', 401);
        }
    }
}
