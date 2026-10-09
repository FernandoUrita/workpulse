import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isProjectUpdateToday,projectUpdateDay} from '../src/utils/projectUpdateFreshness.js';
test('freshness uses Philippine midnight, not UTC date or embedded remarks text',()=>{
 const now='2026-10-09T00:30:00+08:00';
 assert.equal(isProjectUpdateToday({created_at:'2026-10-08T16:05:00Z'},now),true);
 assert.equal(isProjectUpdateToday({created_at:'2026-10-08T15:59:59Z',summary:'As of October 9'},now),false);
 assert.equal(isProjectUpdateToday(undefined,now),false);
 assert.equal(projectUpdateDay('invalid'),'');
});
