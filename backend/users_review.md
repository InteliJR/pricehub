### `src/users/users.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ValidationPipe,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request } from 'express';

// ========================================
// DTOs
// ========================================

// DTO para criação de usuário (apenas ADMIN)
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

// DTO para atualização de usuário (apenas ADMIN)
export class UpdateUserByAdminDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}

// DTO para atualização de dados próprios (qualquer usuário)
export class UpdateUserMeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}

// DTO para query parameters de listagem
export class FindAllUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @Type(() => Boolean)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  page?: number;
  
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// ========================================
// CONTROLLER
// ========================================
@UseGuards(JwtAuthGuard) // Aplica autenticação em todas as rotas do controller
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ----------------------------------------
  // GET /users - Listar Usuários (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  findAll(@Query(ValidationPipe) query: FindAllUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  // ----------------------------------------
  // GET /users/:id - Obter Usuário por ID (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Get(':id')
  findOne(@Param('id', new ValidationPipe({ transform: true })) id: string) {
    return this.usersService.findById(id);
  }

  // ----------------------------------------
  // POST /users - Criar Usuário (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Post()
  create(@Body(ValidationPipe) data: CreateUserDto) {
    return this.usersService.create(data);
  }

  // ----------------------------------------
  // PATCH /users/:id - Atualizar Usuário (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', new ValidationPipe({ transform: true })) id: string,
    @Body(ValidationPipe) data: UpdateUserByAdminDto,
  ) {
    const adminId = (req.user as any).id;
    return this.usersService.updateByAdmin(id, data, adminId);
  }

  // ----------------------------------------
  // GET /users/me - Obter Dados Próprios (Qualquer Autenticado)
  // ----------------------------------------
  @Get('me')
  getMe(@Req() req: Request) {
    // O token JWT decodificado é injetado no objeto Request pelo JwtAuthGuard
    // Assumindo que o payload do JWT contém o ID do usuário
    const userId = (req.user as any).id;
    return this.usersService.findById(userId);
  }

  // ----------------------------------------
  // PATCH /users/me - Atualizar Dados Próprios (Qualquer Autenticado)
  // ----------------------------------------
  @Patch('me')
  updateMe(@Req() req: Request, @Body(ValidationPipe) data: UpdateUserMeDto) {
    const userId = (req.user as any).id;
    return this.usersService.updateMe(userId, data);
  }
}
```

---

### `src/users/users.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

### `src/users/users.service.ts`

```typescript
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  CreateUserDto,
  FindAllUsersQueryDto,
  UpdateUserByAdminDto,
  UpdateUserMeDto,
} from './users.controller';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly pepper = process.env.PASSWORD_PEPPER || '';

  // ============================================
  // Hash centralizado
  // ============================================
  private async hashPassword(password: string) {
    return argon2.hash(password + this.pepper, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  // ============================================
  // POST /users — cria usuário sempre inativo
  // ============================================
  async create(data: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role ?? UserRole.COMERCIAL,
        isActive: false, // Usuário criado inativo por padrão
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // ============================================
  // GET /users — listar com paginação e filtros
  // ============================================
  async findAll(query: FindAllUsersQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      meta: {
        total,
        page: +page,
        limit: +limit,
        totalPages,
      },
    };
  }

  // ============================================
  // GET /users/:id — obter por ID
  // ============================================
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  // ============================================
  // PATCH /users/:id — atualizar por ADMIN
  // ============================================
  async updateByAdmin(
    id: string,
    data: UpdateUserByAdminDto,
    adminId: string, // ID do ADMIN logado
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 1. Regra de Negócio: ADMIN não pode desativar a si mesmo (Teste 7)
    if (id === adminId && data.isActive === false) {
      throw new BadRequestException('Um administrador não pode desativar a si mesmo.');
    }

    // 2. Regra de Negócio: ADMIN não pode mudar a própria role (Teste 8)
    if (id === adminId && data.role && data.role !== user.role) {
      throw new BadRequestException('Um administrador não pode alterar a própria função (role).');
    }

    const updateData: any = {
      role: data.role,
      isActive: data.isActive,
      name: data.name,
    };

    if (data.password) {
      updateData.password = await this.hashPassword(data.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // ============================================
  // PATCH /users/me — atualizar dados próprios
  // ============================================
  async updateMe(id: string, data: UpdateUserMeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      // Isso não deve acontecer se o JwtAuthGuard estiver funcionando corretamente
      throw new InternalServerErrorException('Usuário autenticado não encontrado no banco de dados.');
    }

    // Validação: Usuário não pode alterar role ou isActive via /me
    // Essa validação é garantida pelo DTO `UpdateUserMeDto` que só tem `name` e `password`.
    // Se o DTO for alterado para incluir role/isActive, essa validação será necessária.
    // Por enquanto, o DTO já restringe os campos.

    const updateData: any = {
      name: data.name,
    };

    if (data.password) {
      updateData.password = await this.hashPassword(data.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // ============================================
  // Métodos de autenticação (mantidos)
  // ============================================
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async validatePassword(user: any, password: string): Promise<boolean> {
    const passwordWithPepper = password + this.pepper;
    return argon2.verify(user.password, passwordWithPepper);
  }
}
```

---

