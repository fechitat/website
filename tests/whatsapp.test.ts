import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeWhatsAppNumber,
  buildWhatsAppUrl,
} from '../src/lib/whatsapp.ts';

test('normalizeWhatsAppNumber limpia espacios, símbolos y normaliza código país Chile', () => {
  // Caso de bug observado en producción: "+56 9 9270 1908"
  assert.equal(normalizeWhatsAppNumber('+56 9 9270 1908'), '56992701908');
  assert.equal(normalizeWhatsAppNumber('+56 9 7456 4339'), '56974564339');

  // Caso con 56 ya presente sin '+'
  assert.equal(normalizeWhatsAppNumber('56974203512'), '56974203512');

  // Móvil chileno local sin código de país (9 dígitos)
  assert.equal(normalizeWhatsAppNumber('992701908'), '56992701908');

  // Valores inválidos o vacíos
  assert.equal(normalizeWhatsAppNumber(''), null);
  assert.equal(normalizeWhatsAppNumber(null), null);
  assert.equal(normalizeWhatsAppNumber('123'), null); // Demasiado corto
});

test('buildWhatsAppUrl genera enlaces válidos sin espacios ni caracteres prohibidos', () => {
  const urlConMensaje = buildWhatsAppUrl(
    '+56 9 9270 1908',
    'Hola! Me gustaría solicitar información sobre horarios.'
  );
  assert.equal(
    urlConMensaje,
    'https://wa.me/56992701908?text=Hola!%20Me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n%20sobre%20horarios.'
  );

  const urlSinMensaje = buildWhatsAppUrl('56974203512');
  assert.equal(urlSinMensaje, 'https://wa.me/56974203512');

  // Número inválido retorna null
  assert.equal(buildWhatsAppUrl('inválido'), null);
  assert.equal(buildWhatsAppUrl(undefined), null);
});
