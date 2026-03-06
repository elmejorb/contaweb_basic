<?php

namespace App\Helpers;

class EncodingHelper
{
    /**
     * Corrige la codificación de texto que viene de VB6 (Latin-1/Windows-1252)
     * y asegura que el resultado sea UTF-8 válido para JSON.
     *
     * @param mixed $value El valor a corregir (string o null)
     * @return mixed El valor corregido en UTF-8 válido
     */
    public static function fixEncoding($value)
    {
        if (!is_string($value) || empty($value)) {
            return $value;
        }

        // Si ya es UTF-8 válido sin problemas de doble codificación, retornarlo
        if (mb_check_encoding($value, 'UTF-8') && !preg_match('/\xC3[\x80-\xBF]/', $value)) {
            return $value;
        }

        // Detectar y corregir UTF-8 doble codificado (común en VB6)
        // Esto ocurre cuando texto Latin-1 se codifica a UTF-8 dos veces
        if (preg_match('/\xC3[\x80-\xBF]/', $value)) {
            // Convertir de UTF-8 a Latin-1, luego de Latin-1 a UTF-8
            $decoded = @mb_convert_encoding($value, 'ISO-8859-1', 'UTF-8');
            if ($decoded !== false) {
                // Verificar que el resultado sea UTF-8 válido
                $reencoded = @mb_convert_encoding($decoded, 'UTF-8', 'ISO-8859-1');
                if ($reencoded !== false && mb_check_encoding($reencoded, 'UTF-8')) {
                    return $reencoded;
                }
            }
        }

        // Si viene como Windows-1252 o Latin-1 puro, convertir a UTF-8
        $detected = mb_detect_encoding($value, ['UTF-8', 'Windows-1252', 'ISO-8859-1'], true);

        if ($detected === 'Windows-1252' || $detected === 'ISO-8859-1') {
            $converted = @mb_convert_encoding($value, 'UTF-8', $detected);
            if ($converted !== false && mb_check_encoding($converted, 'UTF-8')) {
                return $converted;
            }
        }

        // Último recurso: limpiar caracteres inválidos
        $cleaned = @iconv('UTF-8', 'UTF-8//IGNORE', $value);
        if ($cleaned !== false) {
            return $cleaned;
        }

        return $value;
    }

    /**
     * Corrige la codificación de todos los campos de texto en un array.
     *
     * @param array $data Array con los datos a corregir
     * @param array|null $fields Campos específicos a corregir (null = todos los strings)
     * @return array Array con los datos corregidos
     */
    public static function fixArrayEncoding(array $data, ?array $fields = null): array
    {
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                if ($fields === null || in_array($key, $fields)) {
                    $data[$key] = self::fixEncoding($value);
                }
            } elseif (is_array($value)) {
                $data[$key] = self::fixArrayEncoding($value, $fields);
            }
        }

        return $data;
    }

    /**
     * Limpia un string asegurando que sea UTF-8 válido.
     *
     * @param mixed $value
     * @return string
     */
    public static function cleanString($value): string
    {
        if (!is_string($value)) {
            return (string)$value;
        }

        $value = self::fixEncoding($value);

        // Eliminar caracteres de control excepto saltos de línea y tabs
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);

        return trim($value);
    }
}
