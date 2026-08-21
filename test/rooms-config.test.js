const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { test, describe } = require('node:test');

// Load and parse the rooms config
const configPath = path.join(__dirname, '..', 'rooms-config.json');
const raw = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(raw);

describe('Vessel Room Navigator — rooms-config.json', () => {
  describe('Structure', () => {
    test('config has rooms object', () => {
      assert.strictEqual(typeof config.rooms, 'object');
      assert.notStrictEqual(config.rooms, null);
    });

    test('config has startRoom', () => {
      assert.ok(config.startRoom, 'startRoom should be defined');
      assert.strictEqual(typeof config.startRoom, 'string');
    });

    test('startRoom exists in rooms', () => {
      assert.ok(config.rooms[config.startRoom],
        `startRoom "${config.startRoom}" must exist in rooms`);
    });

    test('has at least 4 rooms', () => {
      const roomCount = Object.keys(config.rooms).length;
      assert.ok(roomCount >= 4, `Expected at least 4 rooms, got ${roomCount}`);
    });
  });

  describe('Room definitions', () => {
    const requiredFields = ['name', 'type', 'description'];

    for (const [roomId, room] of Object.entries(config.rooms)) {
      describe(`Room: ${roomId}`, () => {
        for (const field of requiredFields) {
          test(`has required field: ${field}`, () => {
            assert.ok(room[field],
              `Room "${roomId}" missing required field: ${field}`);
          });
        }

        test('has adjacent or warp array', () => {
          const hasAdjacent = Array.isArray(room.adjacent);
          const hasWarp = Array.isArray(room.warp);
          assert.ok(hasAdjacent || hasWarp,
            `Room "${roomId}" must have adjacent or warp array`);
        });

        test('adjacent entries reference valid rooms', () => {
          if (!room.adjacent) return;
          for (const adj of room.adjacent) {
            assert.ok(config.rooms[adj],
              `Room "${roomId}" adjacent reference "${adj}" does not exist`);
          }
        });

        test('warp entries reference valid rooms', () => {
          if (!room.warp) return;
          for (const w of room.warp) {
            assert.ok(config.rooms[w],
              `Room "${roomId}" warp reference "${w}" does not exist`);
          }
        });

        test('type is valid value', () => {
          const validTypes = ['physical', 'virtual', 'overlay', 'special', 'composite'];
          if (room.type) {
            assert.ok(validTypes.includes(room.type),
              `Room "${roomId}" has unknown type: ${room.type}`);
          }
        });

        test('directions object has valid structure if present', () => {
          if (!room.directions) return;
          assert.strictEqual(typeof room.directions, 'object');
          for (const [dir, info] of Object.entries(room.directions)) {
            assert.ok(info.label,
              `Direction "${dir}" in "${roomId}" needs a label`);
          }
        });

        test('cameras array has valid structure if present', () => {
          if (!room.cameras) return;
          for (const cam of room.cameras) {
            assert.ok(cam.id, `Camera in "${roomId}" needs an id`);
            assert.ok(cam.label,
              `Camera "${cam.id}" in "${roomId}" needs a label`);
          }
        });
      });
    }
  });

  describe('Adjacency symmetry', () => {
    for (const [roomId, room] of Object.entries(config.rooms)) {
      if (!room.adjacent) continue;
      for (const adj of room.adjacent) {
        test(`${roomId} ↔ ${adj} adjacency is symmetric`, () => {
          const back = config.rooms[adj];
          if (!back || !back.adjacent) return;
          assert.ok(back.adjacent.includes(roomId),
            `${adj} should list ${roomId} as adjacent (asymmetric adjacency)`);
        });
      }
    }
  });

  describe('Navigation graph', () => {
    test('all physical rooms reachable from startRoom', () => {
      const visited = new Set();
      const queue = [config.startRoom];
      while (queue.length > 0) {
        const rid = queue.shift();
        if (visited.has(rid)) continue;
        visited.add(rid);
        const room = config.rooms[rid];
        if (!room) continue;
        const neighbors = [...(room.adjacent || []), ...(room.warp || [])];
        for (const n of neighbors) {
          if (!visited.has(n)) queue.push(n);
        }
      }
      const unreachable = Object.keys(config.rooms)
        .filter(r => !visited.has(r))
        .filter(r => config.rooms[r].type === 'physical'); // Only physical rooms must be reachable
      assert.strictEqual(unreachable.length, 0,
        `Unreachable physical rooms from startRoom: ${unreachable.join(', ')}`);
    });

    test('physical rooms are not isolated', () => {
      for (const [roomId, room] of Object.entries(config.rooms)) {
        // Skip virtual/composite/special rooms — they may be overlay-only
        if (room.type !== 'physical') continue;
        const adjCount = (room.adjacent || []).length;
        const warpCount = (room.warp || []).length;
        assert.ok(adjCount + warpCount > 0,
          `Physical room "${roomId}" is isolated (no connections)`);
      }
    });

    test('isolated rooms are documented as non-physical', () => {
      // alarm_center and four_cam are intentionally isolated (composite/virtual)
      // This test documents that isolation is by design, not oversight
      for (const [roomId, room] of Object.entries(config.rooms)) {
        const adjCount = (room.adjacent || []).length;
        const warpCount = (room.warp || []).length;
        if (adjCount + warpCount === 0) {
          assert.notStrictEqual(room.type, 'physical',
            `Room "${roomId}" is isolated but typed as physical — should be virtual/composite/special`);
        }
      }
    });

    test('warp destinations can navigate back', () => {
      for (const [roomId, room] of Object.entries(config.rooms)) {
        if (!room.warp) continue;
        for (const w of room.warp) {
          const visited = new Set();
          const queue = [w];
          let found = false;
          while (queue.length > 0 && !found) {
            const rid = queue.shift();
            if (visited.has(rid)) continue;
            visited.add(rid);
            if (rid === roomId) { found = true; break; }
            const r = config.rooms[rid];
            if (!r) continue;
            const neighbors = [...(r.adjacent || []), ...(r.warp || [])];
            for (const n of neighbors) {
              if (!visited.has(n)) queue.push(n);
            }
          }
          assert.ok(found,
            `Cannot navigate back from warp target "${w}" to "${roomId}"`);
        }
      }
    });
  });

  describe('Color definitions', () => {
    for (const [roomId, room] of Object.entries(config.rooms)) {
      test(`${roomId} has valid color if present`, () => {
        if (!room.color) return;
        assert.ok(/^#[0-9a-fA-F]{6}$/.test(room.color),
          `Room "${roomId}" color "${room.color}" is not valid hex`);
      });
    }
  });

  describe('JSON format', () => {
    test('config is valid JSON', () => {
      assert.strictEqual(typeof raw, 'string');
      assert.doesNotThrow(() => JSON.parse(raw));
    });

    test('no duplicate room IDs', () => {
      const ids = Object.keys(config.rooms);
      const unique = new Set(ids);
      assert.strictEqual(ids.length, unique.size, 'Duplicate room IDs');
    });
  });
});
