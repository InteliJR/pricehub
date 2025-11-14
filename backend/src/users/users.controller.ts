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
  Res
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
  IsArray,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { Request, Response } from 'express';

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
  // @Type(() => Boolean) // <--- REMOVA ESTA LINHA (ERRADA)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean) // <--- ADICIONE ESTA LINHA (CORREÇÃO)
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

export class ExportUsersDto extends FindAllUsersQueryDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  columns?: string[]; // Ex: ['name', 'email', 'role']
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
  // POST /users/export - Exportar Usuários (ADMIN)
  // ----------------------------------------
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Post('export')
  async export(
    @Body(ValidationPipe) options: ExportUsersDto,
    @Res() res: Response,
  ) {
    const csvData = await this.usersService.exportUsers(options);
    
    // Define os headers para forçar o download no navegador
    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      `attachment; filename="usuarios_${new Date().toISOString()}.csv"`,
    );
    
    // Envia o CSV
    return res.send(csvData);
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
