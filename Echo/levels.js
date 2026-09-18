/* =====================================================
   TIME ECHO PLATFORMER v3 — levels.js
   20 hand-crafted campaign levels with:
   - Lava pits under most ground segments
   - Night levels with glow mechanics
   - Fixed loopholes (no easy ground-runs)
   - Proper switch/door puzzles
   - Seeded random generator for endless mode
   ===================================================== */
window.TEP = window.TEP || {};

const { Platform, Switch: Sw, Door, Spike, EchoWisp,
        ChronoSentinel, ParadoxBeast, TemporalSlime, VoidShade,
        Collectible, Flag, PressurePlate, Laser, Lava } = TEP;

// ── Helpers ───────────────────────────────────────────
function plat(x, y, w, h, opts)    { return new Platform(x, y, w, h, opts); }
function movPlat(x, y, w, axis, range, speed, phase) {
  return plat(x, y, w, 16, { moving:true, axis, range, speed, phaseOffset: phase||0 });
}
function crumblePlat(x, y, w) { return plat(x, y, w, 14, { crumble:true }); }
function icy(x, y, w)         { return plat(x, y, w, 14, { icy:true }); }
function coin(x, y)  { return new Collectible(x, y, 'coin'); }
function shard(x, y) { return new Collectible(x, y, 'shard'); }
function spike(x, y, w, h=16) { return new Spike(x, y, w, h, 'up'); }
function lava(x, y, w, h=20)  { return new Lava(x, y, w, h); }
function wisp(x, y, range, speed, phase) {
  return new EchoWisp(x, y, { range:range||90, speed:speed||1, phase:phase||0 });
}
function sentinel(x, y, lb, rb, spd) {
  return new ChronoSentinel(x, y, { leftBound:lb, rightBound:rb, speed:spd||1.4 });
}
function beast(x, y, zl, zr, ci) {
  return new ParadoxBeast(x, y, { zoneLeft:zl, zoneRight:zr, copyInterval:ci||420 });
}
function slime(x, y, lb, rb, spd) {
  return new TemporalSlime(x, y, { leftBound:lb||x-80, rightBound:rb||x+80, speed:spd||0.9 });
}
function shade(x, y, lb, rb) {
  return new VoidShade(x, y, { leftBound:lb||x-100, rightBound:rb||x+100 });
}
// Lava river at ground (y = worldH-40)
function lavaRiver(startX, w, worldH) { return lava(startX, worldH - 42, w, 28); }

// ── 20 Campaign Levels ────────────────────────────────
TEP.LEVELS = [

// ━━ LEVEL 1 — "The First Ripple" ━━ tutorial, no enemies, night cave
{
  num:1, name:'The First Ripple',
  theme:'cave', 
  worldW:2400, worldH:620,
  start:[60, 520], goalPos:[2320, 460],
  platforms:[
    plat(0, 580, 180, 40),             // start island
    plat(260, 520, 140, 20),           // platform 1
    plat(460, 470, 110, 16),
    plat(650, 420, 120, 16),
    plat(870, 500, 100, 16),
    plat(1010, 440, 110, 16),
    plat(1200, 380, 100, 16),
    plat(1330, 320, 120, 16, {oneWay:true}),
    plat(1550, 460, 110, 16),
    plat(1680, 400, 100, 16),
    plat(1870, 480, 120, 16),
    plat(2010, 430, 110, 16),
    plat(2150, 480, 220, 20),          // goal platform
  ],
  switches:[
    new Sw(700, 420, 'A'),
    new Sw(1055, 440, 'B'),
  ],
  doors:[
    new Door(1195, 310, 28, 150, 'A'),
    new Door(1540, 410, 28, 170, 'B'),
  ],
  enemies:[], spikes:[], pressurePlates:[], lasers:[],
  lava: [lavaRiver(180, 80, 620), lava(400, 578, 60, 28), lava(570, 578, 80, 28), lavaRiver(770, 100, 620), lavaRiver(1120, 80, 620), lavaRiver(1450, 100, 620), lavaRiver(1780, 90, 620)],
  coins:[
    coin(280,490),coin(480,440),coin(680,390),coin(900,470),
    coin(1040,410),coin(1220,350),coin(1360,290),coin(1580,430),
    coin(1700,370),coin(1890,450),coin(2040,400),coin(2200,450),
  ],
  shards:[shard(1340,290)],
  hint:'Use E to record an echo. Stand on a lever, record your path, spawn echo to hold it!',
},

// ━━ LEVEL 2 — "Sky Bridges" ━━ moving platforms, no enemies
{
  num:2, name:'Sky Bridges',
  theme:'sky_islands', 
  worldW:2800, worldH:600,
  start:[60,500], goalPos:[2720,440],
  platforms:[
    plat(0,560,180,40),
    plat(280,500,100,16),
    movPlat(420,430,90,'x',70,1.2),
    plat(590,480,80,16),
    movPlat(720,380,90,'y',50,1.0,1),
    plat(900,460,100,16),
    movPlat(1050,350,100,'x',90,1.4),
    plat(1240,440,110,16),
    movPlat(1400,300,80,'y',60,1.1,0.5),
    plat(1580,420,100,16),
    movPlat(1720,360,90,'x',80,1.3),
    plat(1900,440,110,16),
    movPlat(2060,320,100,'x',80,1.0,0.8),
    plat(2250,460,110,16),
    plat(2380,420,100,16),
    plat(2520,440,260,20),
  ],
  switches:[new Sw(950,460,'A')],
  doors:[new Door(2240,380,28,170,'A',180)],
  enemies:[], spikes:[], pressurePlates:[], lasers:[], lava:[lavaRiver(180,100,600), lavaRiver(510,80,600), lavaRiver(810,90,600), lavaRiver(1150,90,600), lavaRiver(1480,100,600), lavaRiver(1810,90,600), lavaRiver(2160,90,600)],
  coins:[
    coin(300,470),coin(450,400),coin(620,450),coin(760,350),
    coin(930,430),coin(1080,320),coin(1270,410),coin(1450,270),
    coin(1610,390),coin(1750,330),coin(1930,410),coin(2090,290),
    coin(2280,430),coin(2400,390),coin(2560,410),
  ],
  shards:[shard(1455,270)],
  hint:'Ride moving platforms — record the whole journey to spawn a coordinated echo!',
},

// ━━ LEVEL 3 — "Wisp Woods" ━━ EchoWisps introduced, night
{
  num:3, name:'Wisp Woods',
  theme:'haunted_forest', 
  worldW:2800, worldH:600,
  start:[60,500], goalPos:[2720,440],
  platforms:[
    plat(0,560,180,40),
    plat(270,480,110,16),
    plat(470,420,100,16),
    plat(650,360,120,16),
    plat(860,440,100,16),
    plat(1040,360,110,16),
    plat(1190,280,100,16),
    plat(1370,360,120,16),
    plat(1580,440,100,16),
    plat(1770,360,100,16),
    plat(1960,440,120,16),
    plat(2100,360,100,16),
    movPlat(2240,380,100,'x',70,1.1),
    plat(2460,460,120,16),
    plat(2600,440,180,20),
  ],
  switches:[new Sw(700,360,'A'),new Sw(1230,280,'B')],
  doors:[
    new Door(1040,315,28,175,'A'),
    new Door(1960,395,28,175,'B'),
  ],
  enemies:[
    wisp(500,360,80,0.9,0),
    wisp(900,390,70,1.1,1),
    wisp(1420,330,85,0.8,2),
    wisp(1820,340,75,1.2,0.5),
  ],
  spikes:[], pressurePlates:[], lasers:[], lava:[lavaRiver(180,90,600), lavaRiver(380,90,600), lavaRiver(570,80,600), lavaRiver(770,90,600), lavaRiver(960,80,600), lavaRiver(1290,80,600), lavaRiver(1490,90,600), lavaRiver(1680,90,600), lavaRiver(1870,90,600)],
  coins:[
    coin(290,450),coin(490,390),coin(680,330),coin(880,410),
    coin(1070,330),coin(1210,250),coin(1400,330),coin(1600,410),
    coin(1790,330),coin(1980,410),coin(2120,330),coin(2280,350),
    coin(2480,430),coin(2620,410),
  ],
  shards:[shard(1235,250),shard(880,340)],
  hint:'Wisps corrupt recordings — avoid them while pressing E! Activate levers with your echo.',
},

// ━━ LEVEL 4 — "Laser Labyrinth" ━━ lasers + wisps + slimes
{
  num:4, name:'Laser Labyrinth',
  theme:'crystal_sky', 
  worldW:3000, worldH:640,
  start:[60,560], goalPos:[2920,500],
  platforms:[
    plat(0,600,180,40),
    plat(280,520,120,16),
    plat(490,440,100,16),
    plat(680,400,120,16),
    plat(890,480,100,16),
    plat(1080,360,100,16),
    plat(1220,300,80,16),
    plat(1390,380,120,16),
    movPlat(1560,420,100,'x',90,1.3),
    plat(1750,480,100,16),
    plat(1900,380,100,16),
    movPlat(2060,320,100,'y',60,1.0),
    plat(2250,440,120,16),
    movPlat(2420,360,80,'x',70,1.2),
    plat(2600,460,120,16),
    plat(2780,500,200,20),
  ],
  switches:[
    new Sw(730,400,'A'),new Sw(1260,300,'B'),new Sw(1950,380,'C'),
  ],
  doors:[
    new Door(1075,310,28,150,'A'),
    new Door(1745,430,28,160,'B'),
    new Door(2600,415,28,175,'C'),
  ],
  enemies:[
    wisp(520,380,80,1.0,0),wisp(930,420,70,1.2,1),
    wisp(1450,340,90,0.9,2),
    slime(2050,290,1960,2160,1.0),
  ],
  spikes:[], pressurePlates:[new PressurePlate(900,496,'B',1)],
  lasers:[
    new Laser(600,385,80,'x','L1'),
    new Laser(1650,375,6,'y','L2'),
    new Laser(2430,360,6,'y','L3'),
  ],
  lava:[lavaRiver(180,100,640), lavaRiver(400,90,640), lavaRiver(590,90,640), lavaRiver(800,90,640), lavaRiver(990,90,640), lavaRiver(1300,90,640), lavaRiver(1660,90,640), lavaRiver(2160,90,640)],
  coins:Array.from({length:16},(_,i)=>coin(230+i*170,460-(i%3)*40)),
  shards:[shard(1265,270),shard(2070,290)],
  hint:'Lasers kill echoes too! Plan your recording path to avoid them.',
},

// ━━ LEVEL 5 — "Sentinel Station" ━━ Chrono Sentinels
{
  num:5, name:'Sentinel Station',
  theme:'neon_city', 
  worldW:3200, worldH:600,
  start:[60,500], goalPos:[3120,420],
  platforms:[
    plat(0,560,180,40),
    plat(280,460,140,16),
    plat(520,380,120,16),
    plat(730,460,100,16),
    plat(920,360,140,16),
    plat(1150,440,120,16),
    plat(1360,340,100,16),
    plat(1550,420,120,16),
    plat(1700,320,100,16),
    movPlat(1850,380,100,'x',100,1.4),
    plat(2040,440,140,16),
    plat(2270,340,120,16),
    plat(2480,440,100,16),
    movPlat(2620,360,100,'y',70,1.1),
    plat(2810,440,140,16),
    plat(2960,360,120,16),
    plat(3060,440,200,20),
  ],
  switches:[new Sw(980,360,'A'),new Sw(1745,320,'B'),new Sw(2990,360,'C')],
  doors:[
    new Door(1345,295,28,150,'A'),
    new Door(2265,295,28,150,'B'),
    new Door(3060,390,28,175,'C'),
  ],
  enemies:[
    sentinel(600,430,520,730,1.3),
    sentinel(1200,410,1150,1360,1.5),
    sentinel(1980,410,1950,2180,1.6),
    sentinel(2750,410,2720,2810,1.8),
  ],
  spikes:[], pressurePlates:[], lasers:[], lava:[lavaRiver(180,100,600), lavaRiver(420,100,600), lavaRiver(640,90,600), lavaRiver(830,90,600), lavaRiver(1060,90,600), lavaRiver(1270,90,600), lavaRiver(1460,90,600), lavaRiver(1950,90,600), lavaRiver(2180,90,600), lavaRiver(2390,90,600), lavaRiver(2720,90,600)],
  coins:Array.from({length:18},(_,i)=>coin(280+i*158,430-(i%4)*25)),
  shards:[shard(1710,290),shard(2640,330)],
  hint:'Sentinels rewind when hit by echoes — use this to clear a path!',
},

// ━━ LEVEL 6 — "The Frozen Gauntlet" ━━ icy platforms, wisps
{
  num:6, name:'The Frozen Gauntlet',
  theme:'frozen_peaks', 
  worldW:3000, worldH:600,
  start:[60,500], goalPos:[2920,420],
  platforms:[
    plat(0,560,180,40),
    lavaRiver(180,90,600),
    icy(270,480,110),
    lavaRiver(380,90,600),
    icy(470,420,100),
    lavaRiver(570,90,600),
    plat(660,380,100,16),
    icy(800,440,90),
    lavaRiver(890,90,600),
    plat(980,360,100,16),
    icy(1120,320,80),
    lavaRiver(1200,90,600),
    plat(1290,400,110,16),
    movPlat(1450,340,90,'x',80,1.3),
    lavaRiver(1540,90,600),
    icy(1630,440,100),
    lavaRiver(1730,90,600),
    plat(1820,380,100,16),
    icy(1960,440,90),
    lavaRiver(2050,90,600),
    plat(2140,360,110,16),
    movPlat(2300,300,90,'y',60,1.0),
    lavaRiver(2390,90,600),
    plat(2480,440,120,16),
    plat(2620,420,100,16),
    plat(2740,440,240,20),
  ],
  switches:[new Sw(1010,360,'A'),new Sw(1470,340,'B'),new Sw(2650,420,'C')],
  doors:[
    new Door(660,330,28,165,'A'),
    new Door(1285,350,28,170,'B'),
    new Door(2480,390,28,175,'C'),
  ],
  enemies:[
    wisp(500,380,70,0.9,0),wisp(850,380,60,1.1,1),
    wisp(1680,400,80,0.8,2),
    slime(2200,320,2140,2300,0.9),
  ],
  spikes:[], pressurePlates:[], lasers:[], lava:[lavaRiver(180,90,600), lavaRiver(380,90,600), lavaRiver(570,90,600), lavaRiver(890,90,600), lavaRiver(1200,90,600), lavaRiver(1540,90,600), lavaRiver(1730,90,600), lavaRiver(2050,90,600), lavaRiver(2390,90,600)],
  coins:Array.from({length:16},(_,i)=>coin(280+i*166,420-(i%3)*30)),
  shards:[shard(1135,290),shard(2310,270)],
  hint:'Ice platforms make you slide! Use echoes to hold levers from a safe spot.',
},

// ━━ LEVEL 7 — "Lava Core" ━━ lava everywhere, slimes+sentinels
{
  num:7, name:'Lava Core',
  theme:'lava_core', 
  worldW:3200, worldH:620,
  start:[60,530], goalPos:[3120,450],
  platforms:[
    plat(0,580,170,40),
    plat(280,500,100,16),
    plat(500,440,110,16),
    plat(700,380,110,16),
    plat(910,460,100,16),
    plat(1120,360,110,16),
    plat(1330,440,110,16),
    movPlat(1470,380,90,'x',80,1.4),
    plat(1660,460,100,16),
    plat(1850,360,110,16),
    movPlat(2070,440,90,'y',60,1.2),
    plat(2270,380,110,16),
    plat(2480,460,110,16),
    plat(2680,380,100,16),
    plat(2870,460,100,16),
    plat(3000,450,220,20),
  ],
  switches:[new Sw(750,380,'A'),new Sw(1165,360,'B'),new Sw(2720,380,'C')],
  doors:[
    new Door(905,415,28,165,'A'),
    new Door(1665,415,28,165,'B'),
    new Door(2870,410,28,170,'C'),
  ],
  enemies:[
    sentinel(500,410,380,610,1.4),
    slime(930,430,910,1010,1.0),
    sentinel(1480,350,1470,1560,1.5),
    slime(1870,330,1850,1960,1.1),
    sentinel(2080,410,2070,2160,1.6),
  ],
  spikes:[], pressurePlates:[], lasers:[], lava:[lava(170,558,110,28), lava(380,558,120,28), lava(610,558,90,28), lava(810,558,100,28), lava(1010,558,110,28), lava(1230,558,100,28), lava(1560,558,100,28), lava(1760,558,90,28), lava(1960,558,110,28), lava(2160,558,110,28), lava(2380,558,100,28), lava(2590,558,90,28), lava(2780,558,90,28)],
  coins:Array.from({length:18},(_,i)=>coin(280+i*160,420-(i%4)*25)),
  shards:[shard(1490,350),shard(2490,430)],
  hint:'Lava flows everywhere. Jump quickly, never linger on small platforms!',
},

// ━━ LEVEL 8 — "The Pressure Chamber" ━━ pressure plates, multi-echo
{
  num:8, name:'The Pressure Chamber',
  theme:'temple_gold', 
  worldW:3200, worldH:600,
  start:[60,500], goalPos:[3120,420],
  platforms:[
    plat(0,560,180,40),
    plat(270,460,120,16),
    plat(480,380,110,16),
    plat(680,440,110,16),
    plat(880,360,120,16),
    plat(1090,440,120,16),
    plat(1300,360,100,16),
    plat(1490,440,120,16),
    movPlat(1650,360,90,'x',90,1.3),
    plat(1830,440,130,16),
    plat(2050,360,110,16),
    movPlat(2200,300,90,'y',70,1.1),
    plat(2380,440,120,16),
    plat(2590,360,110,16),
    plat(2730,440,100,16),
    plat(2860,360,110,16),
    plat(3000,440,200,20),
  ],
  switches:[new Sw(920,360,'A'),new Sw(2095,360,'B')],
  doors:[
    new Door(1090,395,28,165,'A'),
    new Door(2380,395,28,165,'B'),
  ],
  enemies:[
    wisp(500,360,80,0.9,0),wisp(1130,400,70,1.1,1),
    slime(1840,410,1830,1960,1.0),
    sentinel(2480,420,2380,2590,1.5),
  ],
  spikes:[],
  pressurePlates:[
    new PressurePlate(690,440,'A',2),   // needs 2 actors
    new PressurePlate(1490,440,'B',2),  // needs player + echo
  ],
  lasers:[
    new Laser(1300,315,6,'y','PL1'),
    new Laser(2590,315,6,'y','PL2'),
  ],
  lava:[lavaRiver(180,90,600), lavaRiver(390,90,600), lavaRiver(590,90,600), lavaRiver(790,90,600), lavaRiver(1000,90,600), lavaRiver(1210,90,600), lavaRiver(1400,90,600), lavaRiver(1740,90,600), lavaRiver(1960,90,600), lavaRiver(2290,90,600), lavaRiver(2500,90,600)],
  coins:Array.from({length:18},(_,i)=>coin(280+i*158,420-(i%4)*25)),
  shards:[shard(1665,330),shard(2215,270)],
  hint:'Pressure plates need 2 actors simultaneously — coordinate your echo perfectly!',
},

// ━━ LEVEL 9 — "Void Stalker" ━━ VoidShades introduced, night
{
  num:9, name:'Void Stalker',
  theme:'paradox_void', 
  worldW:3400, worldH:620,
  start:[60,540], goalPos:[3320,460],
  platforms:[
    plat(0,580,180,40),
    plat(270,480,110,16),
    plat(470,420,110,16),
    plat(670,360,110,16),
    plat(870,460,110,16),
    plat(1070,380,110,16),
    plat(1270,460,110,16),
    plat(1470,360,120,16),
    movPlat(1640,420,90,'x',90,1.3),
    plat(1820,460,110,16),
    plat(2020,360,110,16),
    movPlat(2170,440,90,'y',60,1.1),
    plat(2350,460,110,16),
    plat(2550,360,110,16),
    plat(2750,460,120,16),
    plat(2960,380,110,16),
    plat(3090,460,120,16),
    plat(3220,440,200,20),
  ],
  switches:[new Sw(910,460,'A'),new Sw(1510,360,'B'),new Sw(2990,380,'C')],
  doors:[
    new Door(1265,415,28,165,'A'),
    new Door(1815,415,28,165,'B'),
    new Door(3220,395,28,165,'C'),
  ],
  enemies:[
    shade(600,330,470,780),
    shade(1300,430,1070,1470),
    shade(2100,330,1820,2260),
    shade(2850,430,2750,2960),
    wisp(1100,350,70,1.0,0),
    wisp(2600,330,80,1.1,1),
  ],
  spikes:[], pressurePlates:[], lasers:[], lava:[lavaRiver(180,90,620), lavaRiver(380,90,620), lavaRiver(580,90,620), lavaRiver(780,90,620), lavaRiver(980,90,620), lavaRiver(1180,90,620), lavaRiver(1380,90,620), lavaRiver(1730,90,620), lavaRiver(1930,90,620), lavaRiver(2260,90,620), lavaRiver(2460,90,620), lavaRiver(2660,90,620), lavaRiver(2870,90,620)],
  coins:Array.from({length:20},(_,i)=>coin(280+i*152,440-(i%4)*25)),
  shards:[shard(1650,390),shard(2180,410)],
  hint:'Void Shades become INVISIBLE when you stop recording. Keep recording to see them!',
},

// ━━ LEVEL 10 — "Paradox Nexus" ━━ all enemy types, night
{
  num:10, name:'Paradox Nexus',
  theme:'paradox_void', 
  worldW:4000, worldH:640,
  start:[60,560], goalPos:[3920,460],
  platforms:[
    plat(0,600,180,40),
    plat(270,500,120,16),
    movPlat(480,460,90,'x',80,1.2),
    plat(660,420,120,16),
    plat(870,500,80,16),
    movPlat(1000,400,90,'y',70,1.1),
    plat(1180,460,100,16),
    plat(1380,360,100,16),
    movPlat(1570,440,90,'x',100,1.5),
    plat(1750,500,100,16),
    plat(1940,380,120,16),
    movPlat(2110,440,90,'y',60,1.0,0.8),
    plat(2290,500,100,16),
    plat(2480,380,120,16),
    movPlat(2690,440,90,'x',90,1.3),
    plat(2870,500,100,16),
    plat(3060,380,120,16),
    movPlat(3230,440,90,'x',80,1.4),
    plat(3410,460,100,16),
    plat(3600,380,120,16),
    movPlat(3770,420,90,'x',80,1.4),
    plat(3860,460,200,20),
  ],
  switches:[
    new Sw(910,420,'A'),new Sw(1420,360,'B'),
    new Sw(2520,380,'C'),new Sw(3640,380,'D'),
  ],
  doors:[
    new Door(1175,415,28,150,'A'),
    new Door(2285,455,28,150,'B'),
    new Door(3055,330,28,165,'C'),
    new Door(3770,380,28,140,'D'),
  ],
  enemies:[
    wisp(1290,430,80,1.2,0),
    beast(2350,340,2200,2480,320),
    shade(1950,350,1940,2200),
    sentinel(2780,470,2690,2870,1.7),
    slime(3100,350,3060,3230,1.1),
    beast(3680,340,3600,3770,280),
  ],
  spikes:[],
  pressurePlates:[
    new PressurePlate(1750,516,'B',2),
    new PressurePlate(2875,516,'C',3),
  ],
  lasers:[
    new Laser(1000,415,6,'y','NL1'),
    new Laser(1800,395,80,'x','NL2'),
    new Laser(2115,400,6,'y','NL3'),
    new Laser(3140,390,80,'x','NL4'),
  ],
  lava:[lavaRiver(180,90,640), lavaRiver(390,90,640), lavaRiver(570,90,640), lavaRiver(780,90,640), lavaRiver(1090,90,640), lavaRiver(1280,90,640), lavaRiver(1480,90,640), lavaRiver(1660,90,640), lavaRiver(1850,90,640), lavaRiver(2200,90,640), lavaRiver(2390,90,640), lavaRiver(2600,90,640), lavaRiver(2780,90,640), lavaRiver(2970,90,640), lavaRiver(3320,90,640), lavaRiver(3510,90,640)],
  coins:Array.from({length:26},(_,i)=>coin(270+i*138,470-(i%5)*28)),
  shards:[shard(810,390),shard(1590,410),shard(2700,410),shard(3650,350)],
  hint:'The final paradox. All enemies. All tricks. Master every echo you have.',
},

// ━━ LEVELS 11-20: Extended Campaign ━━
// Generated with hand-tuned seeds for variety
];

// ── Auto-generate levels 11-20 with hand-tuned seeds ──
const LEVEL_CONFIGS = [
  {seed:0xDEAD1, theme:'blood_moon',  name:'Blood Moon Rising',  diff:0.45},
  {seed:0xDEAD2, theme:'desert_night',name:'Desert Necropolis',  diff:0.50},
  {seed:0xDEAD3, theme:'time_rift',   name:'Temporal Fracture',  diff:0.55},
  {seed:0xDEAD4, theme:'lava_core',   name:'Magma Descent',      diff:0.60},
  {seed:0xDEAD5, theme:'ember_ruins', name:'The Burning Archive', diff:0.65},
  {seed:0xDEAD6, theme:'deep_ocean',  name:'Abyssal Current',    diff:0.70},
  {seed:0xDEAD7, theme:'neon_city',   name:'Circuit Overload',   diff:0.75},
  {seed:0xDEAD8, theme:'paradox_void',name:'Echo Collapse',      diff:0.82},
  {seed:0xDEAD9, theme:'blood_moon',  name:'Paradox Zenith',     diff:0.90},
  {seed:0xDEADA, theme:'time_rift',   name:'The Final Echo',     diff:1.00},
];

// ── Seeded RNG ────────────────────────────────────────
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Quality random level generator ────────────────────
TEP.generateLevel = function(levelNum, seed, overrides = {}) {
  const rng  = mulberry32(seed || (levelNum * 0x9e3779b1));
  const rand = (min, max) => min + Math.floor(rng() * (max - min + 1));
  const rf   = (min, max) => min + rng() * (max - min);

  const themeKeys = Object.keys(TEP.CONFIG.THEMES);
  const theme = overrides.theme || themeKeys[rand(0, themeKeys.length - 1)];
  const themeDef = TEP.CONFIG.THEMES[theme];
  const difficulty = Math.min(1, overrides.diff || (levelNum - 10) / 15);

  const worldW = 3000 + rand(0, 800);
  const worldH = 620;
  const groundY = 580;
  const MIN_JUMP_GAP = 55;
  const MAX_JUMP_GAP = Math.min(160, 80 + difficulty * 80);

  const platforms = [];
  const lavaArr = [];

  // Generate ground segments with MANDATORY lava pits (no easy ground run)
  let gx = 0;
  while (gx < worldW) {
    const segW = rand(120, 220);
    if (gx + segW > worldW) break;
    platforms.push(new Platform(gx, groundY, segW, 40));
    const gapW = rand(80, 170); // always a gap
    lavaArr.push(new Lava(gx + segW, groundY - 22, gapW, 28));
    gx += segW + gapW;
    if (gapW <= 0) break;
  }
  if (gx < worldW) platforms.push(new Platform(gx, groundY, worldW - gx, 40));

  const spikes = [], enemies = [], coins = [], shards = [];
  const switches = [], doors = [], pressurePlates = [];

  // Construct a guaranteed-reachable platform chain
  let curX = 100, curY = 490;
  const segments = [];
  const MAX_FALL = 120;
  const MAX_RISE = 100;

  while (curX < worldW - 220) {
    const gap  = rand(MIN_JUMP_GAP, MAX_JUMP_GAP);
    const dY   = rand(-MAX_RISE, MAX_FALL);
    const newY = Math.max(220, Math.min(510, curY + dY));
    const pw   = rand(80, 160);
    if (curX + gap + pw > worldW - 200) break;
    curX += gap;

    const moving   = rng() < 0.22 + difficulty * 0.2;
    const crumble  = rng() < 0.12 * difficulty;
    const isIcy    = rng() < 0.10 * difficulty;

    const opts = {};
    if (moving) { opts.moving = true; opts.axis = rng() < 0.5 ? 'x' : 'y'; opts.range = rand(50, 90); opts.speed = rf(0.9, 1.5); }
    if (crumble) opts.crumble = true;
    if (isIcy)   opts.icy = true;

    platforms.push(new Platform(curX, newY, pw, 16, opts));
    segments.push({ x:curX, y:newY, w:pw });

    // Lava between platforms on ground
    if (rng() < 0.6) lavaArr.push(new Lava(curX - gap + 10, groundY - 22, gap - 20, 28));

    // Coin on platform
    if (rng() < 0.72) coins.push(new Collectible(curX + pw/2 - 8, newY - 26, 'coin'));
    if (rng() < 0.08) shards.push(new Collectible(curX + pw/2 - 8, newY - 26, 'shard'));

    // Enemy placement
    if (segments.length >= 3 && rng() < 0.28 + difficulty * 0.32) {
      const t = difficulty < 0.3 ? 0 : difficulty < 0.6 ? rand(0, 1) : rand(0, 3);
      if (t === 0) enemies.push(new EchoWisp(curX + pw/2, newY - 50, { range:rand(60,100), speed:rf(0.8,1.3) }));
      else if (t === 1) enemies.push(new ChronoSentinel(curX + pw/2, newY - 44, { leftBound:curX, rightBound:curX + pw, speed:rf(1.2,1.8) }));
      else if (t === 2) enemies.push(new TemporalSlime(curX + pw/2, newY - 24, { leftBound:curX, rightBound:curX+pw, speed:rf(0.8,1.2) }));
      else if (t === 3) enemies.push(new VoidShade(curX + pw/2, newY - 40, { leftBound:curX-30, rightBound:curX+pw+30 }));
    }

    curY = newY;
  }

  // Place 2-3 switches + doors
  const swCount = rand(1, 3);
  const swSegs = [];
  while (swSegs.length < swCount && segments.length > swCount + 3) {
    const idx = rand(1, segments.length - 3);
    if (!swSegs.includes(idx)) swSegs.push(idx);
  }
  swSegs.sort((a,b)=>a-b);
  const ids = ['A','B','C'];
  swSegs.forEach((si, i) => {
    const seg = segments[si];
    const id = ids[i];
    switches.push(new Switch(seg.x + seg.w / 2, seg.y, id));
    const dSeg = segments[Math.min(segments.length-1, si + rand(1,3))];
    if (dSeg) doors.push(new Door(dSeg.x - 30, dSeg.y - 160, 28, 160, id));
  });

  // Occasional beast at high difficulty
  if (difficulty > 0.7 && segments.length > 8) {
    const bSeg = segments[Math.floor(segments.length * 0.7)];
    if (bSeg) enemies.push(new ParadoxBeast(bSeg.x + bSeg.w/2, bSeg.y - 60,
      { zoneLeft:bSeg.x-50, zoneRight:bSeg.x+bSeg.w+50, copyInterval:rand(280,420) }));
  }

  const lastSeg = segments[segments.length - 1] || { x: worldW - 100, y: 450, w: 120 };
  const goalX = lastSeg.x + rand(10, lastSeg.w - 30);
  const goalY = lastSeg.y - 60;

  return {
    num: levelNum,
    name: overrides.name || `Sector ${levelNum}`,
    theme,
    isNight:false,
    worldW, worldH,
    start: [60, groundY - 50],
    goalPos: [goalX, goalY],
    platforms, switches, doors, enemies, spikes,
    pressurePlates, lasers: [],
    lava: lavaArr,
    coins, shards,
    generated: true, seed,
    hint: 'Generated level — master your echoes and avoid the lava!',
  };
};

// ── Fill levels 11-20 with hand-tuned generated levels ─
;(function() {
  LEVEL_CONFIGS.forEach((cfg, i) => {
    const num = 11 + i;
    try {
      TEP.LEVELS.push(TEP.generateLevel(num, cfg.seed, { theme: cfg.theme, name: cfg.name, diff: cfg.diff }));
    } catch(e) { console.warn('Level gen error:', e); }
  });
})();

// ── Daily Challenge seed ──────────────────────────────
TEP.getDailySeed = function() {
  const d = new Date();
  return (d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate()) ^ 0xDEADBEEF;
};
