import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { AppError } from '../../common/errors/AppError';

export class AuthService {
    private authRepository: AuthRepository;

    constructor() {
        this.authRepository = new AuthRepository();
    }

    private signToken(id: string, role: string) {
        return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '1d',
        });
    }

    private signRefreshToken(id: string) {
        return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
            expiresIn: '7d',
        });
    }

    async login(email: string, password: string) {
        const user = await this.authRepository.findByEmail(email);

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

    async register(data: any) {
        const existingUser = await this.authRepository.findByEmail(data.email);

        if (existingUser) {
            throw new AppError('Email already in use', 400);
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await this.authRepository.create({
            ...data,
            password: hashedPassword,
            role: data.role || 'KASIR',
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

    async refreshToken(refreshToken: string) {
        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || 'refresh-secret'
            ) as { id: string };

            const user = await this.authRepository.findById(decoded.id);

            if (!user) {
                throw new AppError('User no longer exists', 404);
            }

            const token = this.signToken(user.id, user.role);
            return { token };
        } catch (error) {
            throw new AppError('Invalid refresh token', 401);
        }
    }
}
