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
import { ExportUsersDto } from './users.controller';

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
  // POST /users/export — exportar usuários
  // ============================================
  async exportUsers(options: ExportUsersDto): Promise<string> {
    const { columns = ['id', 'name', 'email', 'role', 'isActive'], ...query } =
      options;

    // 1. Busca os dados (sem paginação, mas com filtros)
    const users = await this.prisma.user.findMany({
      where: this.buildWhereClause(query),
      orderBy: {
        [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
      },
      // Aplica o limite de linhas do modal
      take: options.limit ? +options.limit : 1000,
    });

    // 2. Constrói o CSV
    if (!users.length) {
      return 'Nenhum usuário encontrado com os filtros aplicados.';
    }

    // Pega as colunas do primeiro usuário para garantir a ordem (ou usa o DTO)
    const headers = columns.join(',');

    const rows = users.map((user) => {
      return columns
        .map((col) => {
          let value = (user as any)[col];

          // Trata valores booleanos
          if (typeof value === 'boolean') {
            value = value ? 'Ativo' : 'Inativo';
          }

          // Escapa vírgulas e aspas
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',');
    });

    return [headers, ...rows].join('\n');
  }

  // Helper para reutilizar a lógica de filtro
  private buildWhereClause(query: FindAllUsersQueryDto) {
    const { search, role, isActive } = query;
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
    return where;
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
      throw new BadRequestException(
        'Um administrador não pode desativar a si mesmo.',
      );
    }

    // 2. Regra de Negócio: ADMIN não pode mudar a própria role (Teste 8)
    if (id === adminId && data.role && data.role !== user.role) {
      throw new BadRequestException(
        'Um administrador não pode alterar a própria função (role).',
      );
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
      throw new InternalServerErrorException(
        'Usuário autenticado não encontrado no banco de dados.',
      );
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
