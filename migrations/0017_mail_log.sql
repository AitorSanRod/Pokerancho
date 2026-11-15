-- Correos mandados (confirmar la cuenta, recuperar la contraseña), para no pasar del cupo diario de Brevo ni dejar que
-- una sola conexión mande correos sin parar (worker/db/mailLog.ts). La tarea programada borra los de hace más de un día.
CREATE TABLE mail_log (
  ip TEXT NOT NULL,
  sent_at INTEGER NOT NULL
);
CREATE INDEX mail_log_sent ON mail_log (sent_at);
CREATE INDEX mail_log_ip ON mail_log (ip, sent_at);
