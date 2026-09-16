// Gestionnaire de routes non trouvées (404)
export const notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Gestionnaire d'erreurs global
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Une erreur interne est survenue.';

  // Erreur PostgreSQL clé unique dupliquée (ex: email déjà existant)
  if (err.code === '23505') {
    statusCode = 400;
    message = 'Cette valeur existe déjà dans la base de données (valeur dupliquée).';
    if (err.detail) {
      message += ` ${err.detail}`;
    }
  }

  // Erreur PostgreSQL contrainte de clé étrangère
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Référence introuvable pour une entité liée.';
  }

  // Erreur syntaxe/type numérique PostgreSQL (ex: ID non entier)
  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Format d’identifiant invalide.';
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
