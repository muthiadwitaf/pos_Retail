import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class AuthRepository {
    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.UserCreateInput) {
        return prisma.user.create({
            data,
        });
    }
}
