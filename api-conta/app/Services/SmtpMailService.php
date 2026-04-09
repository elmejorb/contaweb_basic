<?php

namespace App\Services;

/**
 * Servicio de envío de correo SMTP nativo (sin dependencias externas).
 * Usa stream_socket_client de PHP para conexión SSL/TLS directa.
 */
class SmtpMailService
{
    private $host;
    private $port;
    private $username;
    private $password;
    private $encryption;
    private $fromAddress;
    private $fromName;

    public function __construct()
    {
        $this->host       = env('MAIL_HOST', 'smtp.hostinger.com');
        $this->port       = (int) env('MAIL_PORT', 465);
        $this->username   = env('MAIL_USERNAME');
        $this->password   = env('MAIL_PASSWORD');
        $this->encryption = env('MAIL_ENCRYPTION', 'ssl');
        $this->fromAddress = env('MAIL_FROM_ADDRESS', 'notificaciones@innovacion-digital.com');
        $this->fromName   = env('MAIL_FROM_NAME', 'ContaRs Pro');
    }

    /**
     * Enviar un correo HTML por SMTP
     */
    public function send(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody = ''): bool
    {
        $socket = null;

        try {
            // Conectar al servidor SMTP
            $protocol = $this->encryption === 'ssl' ? 'ssl://' : '';
            $socket = @stream_socket_client(
                $protocol . $this->host . ':' . $this->port,
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT,
                stream_context_create(['ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ]])
            );

            if (!$socket) {
                \Log::error("SMTP: No se pudo conectar a {$this->host}:{$this->port} - {$errstr} ({$errno})");
                return false;
            }

            // Leer saludo del servidor
            $this->readResponse($socket);

            // EHLO
            $this->sendCommand($socket, "EHLO " . gethostname());

            // STARTTLS si es tls (puerto 587)
            if ($this->encryption === 'tls') {
                $this->sendCommand($socket, "STARTTLS");
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT);
                $this->sendCommand($socket, "EHLO " . gethostname());
            }

            // AUTH LOGIN
            $this->sendCommand($socket, "AUTH LOGIN");
            $this->sendCommand($socket, base64_encode($this->username));
            $this->sendCommand($socket, base64_encode($this->password));

            // MAIL FROM
            $this->sendCommand($socket, "MAIL FROM:<{$this->fromAddress}>");

            // RCPT TO
            $this->sendCommand($socket, "RCPT TO:<{$toEmail}>");

            // DATA
            $this->sendCommand($socket, "DATA");

            // Construir el mensaje con headers MIME
            $boundary = md5(uniqid(time()));
            $message  = "From: {$this->fromName} <{$this->fromAddress}>\r\n";
            $message .= "To: {$toName} <{$toEmail}>\r\n";
            $message .= "Subject: {$subject}\r\n";
            $message .= "MIME-Version: 1.0\r\n";
            $message .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
            $message .= "\r\n";

            // Parte texto plano
            if ($textBody) {
                $message .= "--{$boundary}\r\n";
                $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
                $message .= "Content-Transfer-Encoding: base64\r\n";
                $message .= "\r\n";
                $message .= chunk_split(base64_encode($textBody)) . "\r\n";
            }

            // Parte HTML
            $message .= "--{$boundary}\r\n";
            $message .= "Content-Type: text/html; charset=UTF-8\r\n";
            $message .= "Content-Transfer-Encoding: base64\r\n";
            $message .= "\r\n";
            $message .= chunk_split(base64_encode($htmlBody)) . "\r\n";
            $message .= "--{$boundary}--\r\n";

            // Escapar líneas que empiecen con punto (protocolo SMTP)
            $message = str_replace("\r\n.\r\n", "\r\n..\r\n", $message);

            // Enviar contenido y terminar con punto solo
            $this->sendCommand($socket, $message . "\r\n.");

            // QUIT
            $this->sendCommand($socket, "QUIT");

            fclose($socket);
            return true;

        } catch (\Exception $e) {
            \Log::error('SMTP Error: ' . $e->getMessage());
            if ($socket && is_resource($socket)) {
                fclose($socket);
            }
            return false;
        }
    }

    private function sendCommand($socket, string $command): string
    {
        fwrite($socket, $command . "\r\n");
        return $this->readResponse($socket);
    }

    private function readResponse($socket): string
    {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            // El cuarto carácter es espacio cuando es la última línea de la respuesta
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $response;
    }
}
