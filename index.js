module.exports = (req, res) => {
  if (req.url === '/favicon.ico') {
    res.statusCode = 204;
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ 
    status: 'online', 
    app: 'Guardião Pro', 
    message: 'Sistema de segurança e monitorização ativo.' 
  }));
};
