import bcrypt from 'bcryptjs';
import { query } from './index.js';

export async function seedDatabase() {
  const userCheck = await query('SELECT COUNT(*)::int AS count FROM users');
  if (userCheck.rows[0].count > 0) return;

  const passwordHash = await bcrypt.hash('123456', 10);
  await query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)',
    ['Lorena Corrêa', 'admin@sisinove.com.br', passwordHash, 'ceo']
  );


  const empresa = await query(`
    INSERT INTO empresas (razao_social, nome_fantasia, cnpj, cidade, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, ['SISINOVE TECNOLOGIA LTDA', 'SISINOVE', '12.345.678/0001-99', 'Tucuruí', 'ativa']);

  const empresaId = empresa.rows[0].id;
  console.log(`✅ Empresa inserida: ID ${empresaId}`);

  // 3. Inserir Aprendiz de Teste
  const aprendiz = await query(`
    INSERT INTO aprendizes (empresa_id, nome, cpf, ocupacao, programa, data_inicio_contrato, data_fim_contrato, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    empresaId,
    'João da Silva Aprendiz',
    '000.000.000-00',
    'Auxiliar Administrativo',
    'Programa Jovem Aprendiz',
    '2024-01-01',
    '2025-12-31',
    'ativo'
  ]);

  const aprendizId = aprendiz.rows[0].id;
  console.log(`✅ Aprendiz inserido: ID ${aprendizId}`);

  // 4. Inserir Frequência de Teste
  await query(`
    INSERT INTO frequencias (aprendiz_id, empresa_id, mes_referencia, aulas_previstas, presencas, faltas, percentual_frequencia, situacao)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [aprendizId, empresaId, '2024-05', 20, 18, 2, 90.00, 'regular']);

  // 5. Inserir Desempenho de Teste
  await query(`
    INSERT INTO desempenhos (aprendiz_id, empresa_id, mes_referencia, participacao, pontualidade, avaliacao_geral)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [aprendizId, empresaId, '2024-05', 9, 10, 'excelente']);

  console.log("✨ Seed finalizado com sucesso!");
}
