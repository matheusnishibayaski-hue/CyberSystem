const { query } = require('../config/db.config');

// Listar sites monitorados do usuário
exports.getSites = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT id, url, name, status, last_scan, vulnerabilities, created_at, updated_at 
       FROM monitored_sites 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      sites: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar sites:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao buscar sites monitorados'
    });
  }
};

// Adicionar novo site
exports.addSite = async (req, res) => {
  try {
    const { url, name } = req.body;
    const userId = req.user.userId;

    if (!url) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'URL é obrigatória'
      });
    }

    // Verificar se o site já existe para este usuário
    const existing = await query(
      'SELECT id FROM monitored_sites WHERE url = $1 AND user_id = $2',
      [url, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Site já existe',
        message: 'Este site já está sendo monitorado'
      });
    }

    const result = await query(
      `INSERT INTO monitored_sites (url, name, user_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, url, name, status, last_scan, vulnerabilities, created_at, updated_at`,
      [url, name || url, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Site adicionado com sucesso',
      site: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao adicionar site:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao adicionar site'
    });
  }
};

// Remover site
exports.deleteSite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verificar se o site pertence ao usuário
    const site = await query(
      'SELECT id FROM monitored_sites WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (site.rows.length === 0) {
      return res.status(404).json({
        error: 'Site não encontrado',
        message: 'Site não encontrado ou você não tem permissão'
      });
    }

    await query('DELETE FROM monitored_sites WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Site removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover site:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao remover site'
    });
  }
};

// Atualizar status do site
exports.updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, name, updateScan, vulnerabilities } = req.body;
    const userId = req.user.userId;

    // Verificar se o site pertence ao usuário
    const site = await query(
      'SELECT id FROM monitored_sites WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (site.rows.length === 0) {
      return res.status(404).json({
        error: 'Site não encontrado',
        message: 'Site não encontrado ou você não tem permissão'
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    // Se updateScan for true, atualizar last_scan com timestamp atual do servidor
    if (updateScan === true) {
      updates.push(`last_scan = CURRENT_TIMESTAMP`);
    }

    if (vulnerabilities !== undefined) {
      updates.push(`vulnerabilities = $${paramCount++}`);
      values.push(vulnerabilities);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Nenhum campo para atualizar'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE monitored_sites 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING id, url, name, status, last_scan, vulnerabilities, created_at, updated_at`,
      values
    );

    res.json({
      success: true,
      message: 'Site atualizado com sucesso',
      site: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar site:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao atualizar site'
    });
  }
};
