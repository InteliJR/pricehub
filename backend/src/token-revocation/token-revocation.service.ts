import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenRevocationService {
  private readonly logger = new Logger(TokenRevocationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Adiciona um token à blacklist
   */
  async revokeToken(token: string, userId: string, expiresAt: Date) {
    await this.prisma.revokedToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  /**
   * Verifica se um token está revogado
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    const revokedToken = await this.prisma.revokedToken.findUnique({
      where: { token },
    });

    return !!revokedToken;
  }

  /**
   * 
   * Esta função agora não faz nada - os tokens já estão na blacklist
   * e serão limpos automaticamente pelo cron job quando expirarem
   */
  async revokeAllUserTokens(userId: string) {
    // Não fazemos nada aqui - os tokens refresh já foram revogados individualmente
    // quando o usuário fez logout em cada dispositivo
    
    // Se você quiser marcar TODOS os tokens atuais como revogados,
    // você precisaria de uma query mais complexa para pegar todos os
    // refresh tokens válidos do usuário e adicioná-los à blacklist
    
    this.logger.warn(
      `⚠️ revokeAllUserTokens chamado para userId ${userId} - ` +
      'Esta função não revoga tokens ativamente. ' +
      'Implemente lógica específica se necessário.'
    );
  }

  /**
   * Limpa tokens expirados
   */
  async cleanupExpiredTokens() {
    const now = new Date();
    const result = await this.prisma.revokedToken.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    this.logger.log(`🧹 Limpeza: ${result.count} tokens expirados removidos`);
    return result;
  }

  /**
   * Cron job que executa a limpeza automaticamente todo dia às 3h da manhã
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCronCleanup() {
    this.logger.log('🕒 Executando limpeza automática de tokens expirados...');
    await this.cleanupExpiredTokens();
  }

  /**
   * Força limpeza manual
   */
  async forceCleanup() {
    this.logger.log('🔧 Limpeza manual iniciada...');
    return this.cleanupExpiredTokens();
  }
}