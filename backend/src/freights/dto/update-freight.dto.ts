import { PartialType } from '@nestjs/mapped-types';
import { CreateFreightDto } from './create-freight.dto';

/**
 * DTO para atualização de frete.
 * Todos os campos são opcionais (herda de PartialType).
 * As validações do CreateFreightDto são mantidas para os campos que forem enviados.
 * 
 * NOTA: Este DTO NÃO atualiza impostos (freightTaxes).
 * Para gerenciar impostos, use endpoints específicos ou crie métodos dedicados.
 */
export class UpdateFreightDto extends PartialType(CreateFreightDto) {}