import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTheme,nextTheme} from '../src/utils/themes.js';
test('all three saved themes remain valid and invalid storage falls back to light',()=>{
 for(const value of ['light','dark','pink'])assert.equal(normalizeTheme(value),value);
 for(const value of [null,'invalid','',undefined])assert.equal(normalizeTheme(value),'light');
});
test('quick theme control cycles through light, dark and pink without getting stuck',()=>{
 assert.equal(nextTheme('light'),'dark');assert.equal(nextTheme('dark'),'pink');assert.equal(nextTheme('pink'),'light');
});
