import { Test, TestingModule } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService
  let prismaService: {
    user: {
      create: jest.Mock
      findUnique: jest.Mock
      findMany: jest.Mock
    }
  }

  beforeEach(async () => {
    prismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('throws conflict when prisma returns P2002', async () => {
    prismaService.user.findUnique.mockResolvedValue(null)
    prismaService.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    )

    await expect(
      service.createUser({
        name: 'Pablo',
        email: 'pablo@gmail.com',
        password: '123456',
        role: 'admin',
      }),
    ).rejects.toThrow('El email ya esta registrado')
  })
})
