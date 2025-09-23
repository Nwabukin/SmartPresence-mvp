function sendSuccess(res, statusCode, message, data) {
  return res
    .status(statusCode)
    .json({ success: true, message, data, timestamp: new Date().toISOString() });
}

function handleDbError(err, res, customMessages = {}) {
  // Unique violation
  if (err && err.code === '23505') {
    const detail = err.detail || '';
    const match = detail.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/i);
    const field = match ? match[1] : undefined;
    const value = match ? match[2] : undefined;
    return res.status(409).json({
      error: 'Conflict',
      message: customMessages.unique || (field ? `${field} already exists` : 'Unique constraint violated'),
      field,
      value,
    });
  }
  // Foreign key violation
  if (err && err.code === '23503') {
    return res.status(409).json({
      error: 'Conflict',
      message: customMessages.foreignKey || 'Resource is referenced by other records. Remove dependencies first.',
    });
  }
  console.error(err);
  return res.status(500).json({ error: 'Server error' });
}

module.exports = { sendSuccess, handleDbError };


