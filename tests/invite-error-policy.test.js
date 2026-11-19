import test from 'node:test';
import assert from 'node:assert/strict';
import { messageForInviteError, retryableInviteError } from '../src/invite-error-policy.js';

const e=(status,code,message='API indisponível')=>({status,code,message});
test('A1: limitações, origem rejeitada e validação apresentam orientações diferentes',()=>{
 assert.match(messageForInviteError(e(429,'RATE_LIMITED')),/muitas tentativas|aguarde/i);
 assert.match(messageForInviteError(e(403,'CORS_NOT_ALLOWED')),/origem|CORS/i);
 assert.match(messageForInviteError(e(422,'VALIDATION_ERROR'),{stage:'complete'}),/dados|formulário/i);
 assert.match(messageForInviteError(e(410,'INVITE_UNAVAILABLE')),/expirado|convite/i);
 assert.match(messageForInviteError(e(0,'NETWORK')),/rede|conexão|CORS/i);
});
test('A1: só erros transitórios permitem nova verificação do mesmo convite',()=>{
 assert.equal(retryableInviteError(e(429,'RATE_LIMITED')),true);
 assert.equal(retryableInviteError(e(0,'NETWORK')),true);
 assert.equal(retryableInviteError(e(503,'UNAVAILABLE')),true);
 assert.equal(retryableInviteError(e(410,'INVITE_UNAVAILABLE')),false);
 assert.equal(retryableInviteError(e(422,'VALIDATION_ERROR')),false);
 assert.equal(retryableInviteError(e(403,'CORS_NOT_ALLOWED')),false);
});
