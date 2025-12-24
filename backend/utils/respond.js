function ok(res, data, meta = {}) {
  return res.json({
    success: true,
    data,
    meta,
    error: null
  });
}

function fail(res, message, status = 500) {
  return res.status(status).json({
    success: false,
    data: null,
    meta: null,
    error: message
  });
}

module.exports = { ok, fail };
