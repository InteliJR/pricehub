import {
  PrismaClient,
  UserRole,
  Currency,
  MeasurementUnit,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const pepper = process.env.PASSWORD_PEPPER || '';
  const passwordWithPepper = password + pepper;
  return await argon2.hash(passwordWithPepper, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ============================================
  // 1. USUÁRIOS (todas as roles)
  // ============================================
  console.log('\n👥 Criando usuários...');

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
      update: {},
      create: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        name: process.env.ADMIN_NAME || 'Administrador',
        password: await hashPassword(
          process.env.ADMIN_PASSWORD || 'Admin@123456',
        ),
        role: UserRole.ADMIN,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'comercial@example.com' },
      update: {},
      create: {
        email: 'comercial@example.com',
        name: 'Gerente Comercial',
        password: await hashPassword('Comercial@123'),
        role: UserRole.COMERCIAL,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'logistica@example.com' },
      update: {},
      create: {
        email: 'logistica@example.com',
        name: 'Gerente de Logística',
        password: await hashPassword('Logistica@123'),
        role: UserRole.LOGISTICA,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'imposto@example.com' },
      update: {},
      create: {
        email: 'imposto@example.com',
        name: 'Analista Fiscal',
        password: await hashPassword('Imposto@123'),
        role: UserRole.IMPOSTO,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${users.length} usuários criados/atualizados`);

  // ============================================
  // 2. IMPOSTOS (Taxes e TaxItems)
  // ============================================
  console.log('\n💰 Criando impostos e premissas fiscais...');

  const tax1 = await prisma.tax.create({
    data: {
      name: 'Regime Simples Nacional',
      description: 'Tributação simplificada para empresas de pequeno porte',
      taxItems: {
        create: [
          { name: 'SIMPLES', rate: 8.0, recoverable: false },
          { name: 'COMISSÕES', rate: 5.0, recoverable: false },
        ],
      },
    },
  });

  const tax2 = await prisma.tax.create({
    data: {
      name: 'Regime Lucro Real',
      description: 'Tributação baseada no lucro real da empresa',
      taxItems: {
        create: [
          { name: 'PIS', rate: 1.65, recoverable: true },
          { name: 'COFINS', rate: 7.6, recoverable: true },
          { name: 'ICMS', rate: 18.0, recoverable: true },
          { name: 'IPI', rate: 5.0, recoverable: false },
          { name: 'IR e CSLL', rate: 9.0, recoverable: false },
          { name: 'COMISSÕES', rate: 5.0, recoverable: false },
        ],
      },
    },
  });

  const tax3 = await prisma.tax.create({
    data: {
      name: 'Regime Lucro Presumido',
      description: 'Tributação com base presumida de lucro',
      taxItems: {
        create: [
          { name: 'PIS', rate: 0.65, recoverable: false },
          { name: 'COFINS', rate: 3.0, recoverable: false },
          { name: 'ICMS', rate: 18.0, recoverable: true },
          { name: 'IR e CSLL', rate: 5.93, recoverable: false },
          { name: 'COMISSÕES', rate: 5.0, recoverable: false },
        ],
      },
    },
  });

  console.log('✅ Impostos criados com sucesso');

  // ============================================
  // 3. FRETES (Freights e FreightTaxes)
  // ============================================
  console.log('\n🚚 Criando opções de frete...');

  const freight1 = await prisma.freight.create({
    data: {
      name: 'Frete Rodoviário Nacional',
      description: 'Transporte rodoviário dentro do Brasil',
      paymentTerm: 30,
      unitPrice: 150.0,
      currency: Currency.BRL,
      additionalCosts: 25.0,
      freightTaxes: {
        create: [
          { name: 'ICMS', rate: 12.0 },
          { name: 'PIS', rate: 1.65 },
          { name: 'COFINS', rate: 7.6 },
        ],
      },
    },
  });

  const freight2 = await prisma.freight.create({
    data: {
      name: 'Frete Marítimo Internacional',
      description: 'Transporte marítimo para importação',
      paymentTerm: 60,
      unitPrice: 2500.0,
      currency: Currency.USD,
      additionalCosts: 500.0,
      freightTaxes: {
        create: [
          { name: 'II (Imposto de Importação)', rate: 14.0 },
          { name: 'PIS', rate: 2.1 },
          { name: 'COFINS', rate: 9.65 },
        ],
      },
    },
  });

  const freight3 = await prisma.freight.create({
    data: {
      name: 'Frete Expresso',
      description: 'Entrega rápida para regiões metropolitanas',
      paymentTerm: 15,
      unitPrice: 280.0,
      currency: Currency.BRL,
      additionalCosts: 40.0,
      freightTaxes: {
        create: [
          { name: 'ICMS', rate: 12.0 },
          { name: 'PIS', rate: 1.65 },
          { name: 'COFINS', rate: 7.6 },
        ],
      },
    },
  });

  console.log('✅ Fretes criados com sucesso');

  // ============================================
  // 4. MATÉRIAS-PRIMAS
  // ============================================
  console.log('\n📦 Criando matérias-primas...');

  const rawMaterials = await Promise.all([
    prisma.rawMaterial.create({
      data: {
        code: 'MP001',
        name: 'Aço Carbono 1020',
        description: 'Aço carbono laminado a quente',
        measurementUnit: MeasurementUnit.KG,
        inputGroup: 'Metais',
        paymentTerm: 30,
        acquisitionPrice: 8.5,
        currency: Currency.BRL,
        priceConvertedBrl: 8.5,
        additionalCost: 0.5,
        taxId: tax2.id,
        freightId: freight1.id,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        code: 'MP002',
        name: 'Polietileno de Alta Densidade',
        description: 'PEAD virgem para embalagens',
        measurementUnit: MeasurementUnit.KG,
        inputGroup: 'Plásticos',
        paymentTerm: 45,
        acquisitionPrice: 12.0,
        currency: Currency.BRL,
        priceConvertedBrl: 12.0,
        additionalCost: 0.8,
        taxId: tax2.id,
        freightId: freight1.id,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        code: 'MP003',
        name: 'Resina Epóxi',
        description: 'Resina epóxi bi-componente',
        measurementUnit: MeasurementUnit.L,
        inputGroup: 'Químicos',
        paymentTerm: 60,
        acquisitionPrice: 45.0,
        currency: Currency.USD,
        priceConvertedBrl: 225.0, // Cotação aproximada
        additionalCost: 15.0,
        taxId: tax2.id,
        freightId: freight2.id,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        code: 'MP004',
        name: 'Parafuso Sextavado M8',
        description: 'Parafuso sextavado inox M8x30mm',
        measurementUnit: MeasurementUnit.UN,
        inputGroup: 'Fixação',
        paymentTerm: 30,
        acquisitionPrice: 0.85,
        currency: Currency.BRL,
        priceConvertedBrl: 0.85,
        additionalCost: 0.05,
        taxId: tax1.id,
        freightId: freight3.id,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        code: 'MP005',
        name: 'Tinta Automotiva Base Água',
        description: 'Tinta automotiva ecológica',
        measurementUnit: MeasurementUnit.L,
        inputGroup: 'Acabamento',
        paymentTerm: 45,
        acquisitionPrice: 89.0,
        currency: Currency.BRL,
        priceConvertedBrl: 89.0,
        additionalCost: 5.0,
        taxId: tax3.id,
        freightId: freight1.id,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        code: 'MP006',
        name: 'Caixa de Papelão 40x30x20',
        description: 'Embalagem papelão ondulado',
        measurementUnit: MeasurementUnit.UN,
        inputGroup: 'Embalagens',
        paymentTerm: 30,
        acquisitionPrice: 2.5,
        currency: Currency.BRL,
        priceConvertedBrl: 2.5,
        additionalCost: 0.15,
        taxId: tax1.id,
        freightId: freight1.id,
      },
    }),
  ]);

  console.log(`✅ ${rawMaterials.length} matérias-primas criadas`);

  // ============================================
  // 5. CUSTOS FIXOS (Overhead)
  // ============================================
  console.log('\n💼 Criando custos fixos...');

  const fixedCost1 = await prisma.fixedCost.create({
    data: {
      code: 'CF001',
      description: 'Custos Fixos Mensais - Janeiro 2025',
      personnelExpenses: 45000.0,
      generalExpenses: 18000.0,
      proLabore: 12000.0,
      depreciation: 5000.0,
      totalCost: 80000.0,
      considerationPercentage: 100.0,
      salesVolume: 10000.0, // Volume de vendas esperado
      overheadPerUnit: 8.0, // 80000 / 10000
      calculationDate: new Date('2025-01-01'),
    },
  });

  const fixedCost2 = await prisma.fixedCost.create({
    data: {
      code: 'CF002',
      description: 'Custos Fixos Mensais - Fevereiro 2025',
      personnelExpenses: 47000.0,
      generalExpenses: 19500.0,
      proLabore: 12000.0,
      depreciation: 5000.0,
      totalCost: 83500.0,
      considerationPercentage: 100.0,
      salesVolume: 12000.0,
      overheadPerUnit: 6.96,
      calculationDate: new Date('2025-02-01'),
    },
  });

  console.log('✅ Custos fixos criados');

  // ============================================
  // 5.5. GRUPOS DE PRODUTOS (NOVO!)
  // ============================================
  console.log('\n📂 Criando grupos de produtos...');

  const productGroup1 = await prisma.productGroup.create({
    data: {
      name: 'Componentes Estruturais',
      description: 'Produtos para aplicações estruturais e suporte',
    },
  });

  const productGroup2 = await prisma.productGroup.create({
    data: {
      name: 'Containers e Embalagens',
      description: 'Soluções de armazenamento e embalagem',
    },
  });

  const productGroup3 = await prisma.productGroup.create({
    data: {
      name: 'Kits e Conjuntos',
      description: 'Kits completos para diversas aplicações',
    },
  });

  console.log('✅ Grupos de produtos criados');

  // ============================================
  // 6. PRODUTOS (COM GRUPOS!)
  // ============================================
  console.log('\n📦 Criando produtos...');

  const product1 = await prisma.product.create({
    data: {
      code: '10001',
      name: 'Suporte Metálico Modelo A',
      description: 'Suporte estrutural em aço carbono com acabamento pintado',
      creatorId: users[0].id, // Admin
      fixedCostId: fixedCost1.id,
      productGroupId: productGroup1.id, // <- NOVO!
      priceWithoutTaxesAndFreight: 125.5,
      priceWithTaxesAndFreight: 185.75,
      productRawMaterials: {
        create: [
          { rawMaterialId: rawMaterials[0].id, quantity: 5.0 }, // Aço Carbono
          { rawMaterialId: rawMaterials[3].id, quantity: 8.0 }, // Parafusos
          { rawMaterialId: rawMaterials[4].id, quantity: 0.5 }, // Tinta
          { rawMaterialId: rawMaterials[5].id, quantity: 1.0 }, // Embalagem
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      code: '10002',
      name: 'Container Plástico Premium',
      description: 'Container de armazenamento em PEAD alta resistência',
      creatorId: users[1].id, // Comercial
      fixedCostId: fixedCost1.id,
      productGroupId: productGroup2.id, // <- NOVO!
      priceWithoutTaxesAndFreight: 78.0,
      priceWithTaxesAndFreight: 112.5,
      productRawMaterials: {
        create: [
          { rawMaterialId: rawMaterials[1].id, quantity: 2.5 }, // PEAD
          { rawMaterialId: rawMaterials[5].id, quantity: 1.0 }, // Embalagem
        ],
      },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      code: '10003',
      name: 'Peça Composta Industrial',
      description: 'Peça industrial com revestimento epóxi',
      creatorId: users[0].id, // Admin
      fixedCostId: fixedCost2.id,
      productGroupId: productGroup1.id, // <- NOVO!
      priceWithoutTaxesAndFreight: 385.0,
      priceWithTaxesAndFreight: 520.0,
      productRawMaterials: {
        create: [
          { rawMaterialId: rawMaterials[0].id, quantity: 12.0 }, // Aço
          { rawMaterialId: rawMaterials[2].id, quantity: 1.5 }, // Resina Epóxi
          { rawMaterialId: rawMaterials[3].id, quantity: 24.0 }, // Parafusos
          { rawMaterialId: rawMaterials[5].id, quantity: 2.0 }, // Embalagem
        ],
      },
    },
  });

  const product4 = await prisma.product.create({
    data: {
      code: '10004',
      name: 'Kit Fixação Completo',
      description: 'Kit com componentes de fixação diversos',
      creatorId: users[1].id, // Comercial
      productGroupId: productGroup3.id, // <- NOVO!
      priceWithoutTaxesAndFreight: 45.0,
      priceWithTaxesAndFreight: 58.5,
      productRawMaterials: {
        create: [
          { rawMaterialId: rawMaterials[3].id, quantity: 50.0 }, // Parafusos
          { rawMaterialId: rawMaterials[5].id, quantity: 1.0 }, // Embalagem
        ],
      },
    },
  });

  // Produto sem grupo (para demonstrar que é opcional)
  const product5 = await prisma.product.create({
    data: {
      code: '10005',
      name: 'Produto Sem Grupo',
      description: 'Produto avulso sem categoria definida',
      creatorId: users[0].id,
      fixedCostId: fixedCost1.id,
      // productGroupId: null, <- Não precisa especificar, já é null por padrão
      priceWithoutTaxesAndFreight: 35.0,
      priceWithTaxesAndFreight: 48.0,
      productRawMaterials: {
        create: [
          { rawMaterialId: rawMaterials[5].id, quantity: 1.0 }, // Embalagem
        ],
      },
    },
  });

  console.log('✅ Produtos criados com sucesso');

  // ============================================
  // 7. LOGS DE ALTERAÇÃO (exemplo)
  // ============================================
  console.log('\n📝 Criando logs de exemplo...');

  await prisma.rawMaterialChangeLog.create({
    data: {
      rawMaterialId: rawMaterials[0].id,
      field: 'acquisitionPrice',
      oldValue: '8.00',
      newValue: '8.50',
      changedBy: users[3].id, // Analista Fiscal
      changedAt: new Date(),
    },
  });

  console.log('✅ Logs criados');

  // ============================================
  // RESUMO FINAL
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
  console.log('='.repeat(50));
  console.log('\n📊 Resumo dos dados criados:');
  console.log(`   👥 Usuários: ${users.length}`);
  console.log(`   💰 Regimes tributários: 3`);
  console.log(`   🚚 Opções de frete: 3`);
  console.log(`   📦 Matérias-primas: ${rawMaterials.length}`);
  console.log(`   💼 Custos fixos: 2`);
  console.log(`   📂 Grupos de produtos: 3`);
  console.log(`   📦 Produtos: 5 (4 com grupo, 1 sem grupo)`);
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   ADMIN:      admin@example.com / Admin@123456');
  console.log('   COMERCIAL:  comercial@example.com / Comercial@123');
  console.log('   LOGISTICA:  logistica@example.com / Logistica@123');
  console.log('   IMPOSTO:    imposto@example.com / Imposto@123');
  console.log(
    '\n⚠️  IMPORTANTE: Altere as senhas padrão após o primeiro login!',
  );
  console.log('='.repeat(50) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });