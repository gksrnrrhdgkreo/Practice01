/**
 * Bubble Fighter Web v1.0.0
 * Pure HTML5 Canvas 3rd-Person Shooter (TPS)
 * 외부 라이브러리 및 에셋 없이 순수 자바스크립트로 구현
 */

// ==========================================
// 1. 오디오 합성 엔진 (Web Audio API Synthesizer)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 물총 발사음 (뾱뾱/물방울 톤)
  playPistol() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 샷건 발사음 (묵직한 물살 폭발)
  playShotgun() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 망치 휘두르기 소리
  playHammer() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 버블 갇힘 효과음 (뽀글뽀글)
  playBubble() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [400, 550, 700].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 0.08);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.08);
    });
  }

  // 팡 (PANG!) 처치 효과음 (시원하게 터짐)
  playPang() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.35);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 헬프 (HELP!) 구출 효과음 (경쾌한 차임벨)
  playHelp() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // 피격 효과음
  playHit() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const sounds = new SoundEngine();

// ==========================================
// 2. 3D 투시 투영 (TPS Perspective Math)
// ==========================================
class Camera {
  constructor() {
    this.x = 0;
    this.y = 4.5;
    this.z = -7.5;
    this.yaw = 0;      // 수평 회전각 (라디안)
    this.pitch = 0.15; // 수직 회전각
    this.dist = 6.8;   // 플레이어 뒤 거리
    this.height = 3.0; // 카메라 높이
    this.fov = 480;    // 화각 계수
  }

  update(player) {
    this.yaw = player.yaw;
    // 플레이어 등 뒤 오버숄더 위치 계산 (플레이어가 바라보는 반대 방향에 카메라 배치)
    this.x = player.x - Math.sin(this.yaw) * this.dist;
    this.z = player.z - Math.cos(this.yaw) * this.dist;
    this.y = player.y + this.height;
  }

  // 3D 월드 좌표 -> 2D 캔버스 화면 좌표 변환 (정석 TPS 뷰 행렬)
  project(worldX, worldY, worldZ, canvasWidth, canvasHeight) {
    const dx = worldX - this.x;
    const dy = worldY - this.y;
    const dz = worldZ - this.z;

    // 1. Yaw (수평) 회전 변환: 카메라가 오른쪽으로 돌면 물체는 화면 왼쪽으로 이동
    const cosY = Math.cos(this.yaw);
    const sinY = Math.sin(this.yaw);
    const rx = dx * cosY - dz * sinY;
    const rz1 = dx * sinY + dz * cosY;

    // 2. Pitch (수직) 회전 변환: 카메라가 위를 보면 물체는 화면 아래로 이동
    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);
    const ry = dy * cosP + rz1 * sinP;
    const rz = -dy * sinP + rz1 * cosP;

    // 카메라 뒤에 있는 객체 클리핑
    if (rz <= 0.3) return null;

    const scale = this.fov / rz;
    const screenX = canvasWidth / 2 + rx * scale;
    const screenY = canvasHeight / 2 - ry * scale;

    return {
      x: screenX,
      y: screenY,
      scale: scale,
      depth: rz
    };
  }
}

// ==========================================
// 3. 무기 정의 (Weapon Specs)
// ==========================================
const WEAPONS = {
  1: {
    id: 1,
    name: '샷건',
    maxAmmo: 5,
    cooldown: 0.75,
    reloadTime: 1.6,
    pellets: 6,
    damage: 14,
    spread: 0.12,
    speed: 35,
    range: 22,
    color: '#38bdf8'
  },
  2: {
    id: 2,
    name: '물총',
    maxAmmo: 15,
    cooldown: 0.2,
    reloadTime: 1.1,
    pellets: 1,
    damage: 18,
    spread: 0.02,
    speed: 48,
    range: 40,
    color: '#06b6d4'
  },
  3: {
    id: 3,
    name: '망치',
    maxAmmo: Infinity,
    cooldown: 0.45,
    reloadTime: 0,
    pellets: 0,
    damage: 45,
    range: 3.5, // 근접 사거리
    color: '#f59e0b'
  }
};

// ==========================================
// 4. 탄환 및 파티클 시스템
// ==========================================
class Projectile {
  constructor(x, y, z, vx, vy, vz, damage, range, ownerTeam, owner) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.damage = damage;
    this.maxDist = range;
    this.traveled = 0;
    this.team = ownerTeam;
    this.owner = owner;
    this.alive = true;
    this.radius = 0.25;
  }

  update(dt, mapObstacles) {
    const moveX = this.vx * dt;
    const moveY = this.vy * dt;
    const moveZ = this.vz * dt;
    const dist = Math.hypot(moveX, moveZ);

    this.x += moveX;
    this.y += moveY;
    this.z += moveZ;
    this.traveled += dist;

    // 사거리 초과 또는 바닥 충돌
    if (this.traveled >= this.maxDist || this.y <= 0.1) {
      this.alive = false;
      return;
    }

    // 장애물(상자) 충돌 검사
    for (const obs of mapObstacles) {
      if (
        this.x >= obs.x - obs.size / 2 &&
        this.x <= obs.x + obs.size / 2 &&
        this.z >= obs.z - obs.size / 2 &&
        this.z <= obs.z + obs.size / 2 &&
        this.y <= obs.height
      ) {
        this.alive = false;
        break;
      }
    }
  }
}

class Particle {
  constructor(x, y, z, vx, vy, vz, color, size, life) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;
    this.vy -= 9.8 * dt; // 중력
    if (this.y < 0) {
      this.y = 0;
      this.vy = -this.vy * 0.4;
    }
    this.life -= dt;
  }
}

// 텍스트 플로팅 연출 (PANG!, HELP! 등)
class FloatingText {
  constructor(text, x, y, z, color) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.z = z;
    this.color = color;
    this.life = 1.2;
    this.maxLife = 1.2;
  }

  update(dt) {
    this.y += 1.5 * dt;
    this.life -= dt;
  }
}

// ==========================================
// 5. 캐릭터 클래스 (플레이어 및 AI 공통 베이스)
// ==========================================
class Character {
  constructor(id, name, team, isPlayer = false) {
    this.id = id;
    this.name = name;
    this.team = team; // 'blue' | 'red'
    this.isPlayer = isPlayer;

    // 위치 및 이동
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.yaw = 0;
    this.speed = 8.5;
    this.radius = 0.8;

    // 상태: 'normal' | 'bubble' | 'defeated'
    this.status = 'normal';
    this.hp = 100;
    this.maxHp = 100;

    // 버블 상태 관련
    this.bubbleTimer = 0;
    this.bubbleMaxTime = 14.0;
    this.bubbleFloatY = 0;

    // 무적 상태 (리스폰 후 5초 무적 보장)
    this.invulnerableTimer = 5.0;

    // 리스폰 타이머
    this.respawnTimer = 0;

    // 무기 및 인벤토리
    this.currentWeaponId = 1;
    this.ammo = {
      1: WEAPONS[1].maxAmmo,
      2: WEAPONS[2].maxAmmo,
      3: WEAPONS[3].maxAmmo
    };
    this.cooldownTimer = 0;
    this.isReloading = false;
    this.reloadTimer = 0;

    // 망치 스윙 모션 연출 타이머
    this.swingAnimTimer = 0;
  }

  resetPosition(spawnX, spawnZ, yaw) {
    this.x = spawnX;
    this.y = 0;
    this.z = spawnZ;
    this.yaw = yaw;
    this.status = 'normal';
    this.hp = this.maxHp;
    this.bubbleTimer = 0;
    this.invulnerableTimer = 5.0; // 리스폰 후 5초간 무적!
    this.isReloading = false;
    this.ammo[1] = WEAPONS[1].maxAmmo;
    this.ammo[2] = WEAPONS[2].maxAmmo;
  }

  takeDamage(amount, attacker, game) {
    if (this.status !== 'normal' || this.invulnerableTimer > 0) return;

    this.hp -= amount;
    sounds.playHit();

    if (this.hp <= 0) {
      this.hp = 0;
      this.enterBubble(game);
    }
  }

  // 버블 상태 진입 (HP가 다했을 때)
  enterBubble(game) {
    this.status = 'bubble';
    this.bubbleTimer = this.bubbleMaxTime;
    sounds.playBubble();
    game.addFloatingText('🫧 BUBBLE!', this.x, this.y + 2.5, this.z, '#38bdf8');
    game.addParticles(this.x, this.y + 1, this.z, '#38bdf8', 15);
  }

  // 팡(PANG) - 버블 상태에서 파괴당해 처치됨
  popPang(killer, game) {
    if (this.status !== 'bubble') return;
    this.status = 'defeated';
    this.respawnTimer = 3.5;
    sounds.playPang();

    game.addFloatingText('💥 PANG! (+1)', this.x, this.y + 2.5, this.z, '#ef4444');
    game.addParticles(this.x, this.y + 1.2, this.z, '#60a5fa', 40);

    // 득점 처리
    game.addScore(killer.team, killer.name, this.name);
  }

  // 헬프(HELP) - 아군이 접촉하여 구출
  rescueHelp(rescuer, game) {
    if (this.status !== 'bubble') return;
    this.status = 'normal';
    this.hp = Math.floor(this.maxHp * 0.55); // 55% 체력 회복
    this.invulnerableTimer = 1.8;
    sounds.playHelp();

    game.addFloatingText('✨ HELP!', this.x, this.y + 2.5, this.z, '#34d399');
    game.addParticles(this.x, this.y + 1.2, this.z, '#34d399', 30);
    game.addFeedMessage(`${rescuer.name}님이 ${this.name}님을 구출(HELP)했습니다!`, 'help');
  }

  switchWeapon(weaponId) {
    if (this.isReloading || this.status !== 'normal') return;
    this.currentWeaponId = weaponId;
  }

  reload() {
    const spec = WEAPONS[this.currentWeaponId];
    if (this.isReloading || spec.id === 3 || this.ammo[spec.id] >= spec.maxAmmo) return;
    this.isReloading = true;
    this.reloadTimer = spec.reloadTime;
  }

  shoot(game) {
    if (this.status !== 'normal' || this.cooldownTimer > 0 || this.isReloading) return false;

    const weapon = WEAPONS[this.currentWeaponId];

    // 3번 망치 (근접 공격 및 버블 팡)
    if (weapon.id === 3) {
      this.cooldownTimer = weapon.cooldown;
      this.swingAnimTimer = 0.3;
      sounds.playHammer();

      // 근접 범위 내 판정
      game.characters.forEach(other => {
        if (other === this || other.status === 'defeated') return;
        const dist = Math.hypot(other.x - this.x, other.z - this.z);

        if (dist <= weapon.range) {
          // 각도 판정 (전방 120도 부채꼴)
          const angleToOther = Math.atan2(other.x - this.x, other.z - this.z);
          let diffAngle = Math.abs(angleToOther - this.yaw);
          while (diffAngle > Math.PI) diffAngle = Math.abs(diffAngle - Math.PI * 2);

          if (diffAngle < Math.PI * 0.4) {
            if (other.team !== this.team) {
              if (other.status === 'bubble') {
                other.popPang(this, game);
              } else {
                other.takeDamage(weapon.damage, this, game);
              }
            }
          }
        }
      });
      return true;
    }

    // 1번, 2번 총기류
    if (this.ammo[weapon.id] <= 0) {
      this.reload();
      return false;
    }

    this.ammo[weapon.id]--;
    this.cooldownTimer = weapon.cooldown;

    if (weapon.id === 1) sounds.playShotgun();
    else sounds.playPistol();

    // 탄환 발사
    const spawnY = this.y + 1.2;
    for (let i = 0; i < weapon.pellets; i++) {
      const spreadAngle = (Math.random() - 0.5) * weapon.spread;
      const spreadPitch = (Math.random() - 0.5) * (weapon.spread * 0.5);
      const bulletYaw = this.yaw + spreadAngle;

      const vx = Math.sin(bulletYaw) * weapon.speed;
      const vz = Math.cos(bulletYaw) * weapon.speed;
      const vy = spreadPitch * weapon.speed;

      game.projectiles.push(
        new Projectile(this.x, spawnY, this.z, vx, vy, vz, weapon.damage, weapon.range, this.team, this)
      );
    }

    return true;
  }

  update(dt, mapObstacles, game) {
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.swingAnimTimer > 0) this.swingAnimTimer -= dt;

    // 재장전
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const spec = WEAPONS[this.currentWeaponId];
        this.ammo[spec.id] = spec.maxAmmo;
      }
    }

    // 리스폰 처리
    if (this.status === 'defeated') {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        game.respawnCharacter(this);
      }
      return;
    }

    // 버블 상태 처리
    if (this.status === 'bubble') {
      this.bubbleTimer -= dt;
      this.bubbleFloatY = Math.sin(Date.now() * 0.005) * 0.35 + 0.5;

      // 시간 초과 시 자멸
      if (this.bubbleTimer <= 0) {
        this.status = 'defeated';
        this.respawnTimer = 3.0;
        sounds.playPang();
        game.addFloatingText('POPPED!', this.x, this.y + 2.2, this.z, '#94a3b8');
        game.addParticles(this.x, this.y + 1.2, this.z, '#94a3b8', 25);
      }
      return;
    }

    this.bubbleFloatY = 0;
  }

  // 장애물 충돌 보정 이동
  moveWithCollision(dx, dz, mapObstacles, mapBounds) {
    let nextX = this.x + dx;
    let nextZ = this.z + dz;

    // 맵 경계
    nextX = Math.max(-mapBounds + this.radius, Math.min(mapBounds - this.radius, nextX));
    nextZ = Math.max(-mapBounds + this.radius, Math.min(mapBounds - this.radius, nextZ));

    // 상자 장애물 충돌
    for (const obs of mapObstacles) {
      const half = obs.size / 2 + this.radius;
      if (
        nextX >= obs.x - half &&
        nextX <= obs.x + half &&
        this.z >= obs.z - half &&
        this.z <= obs.z + half
      ) {
        nextX = this.x; // X축 충돌 차단
      }
      if (
        this.x >= obs.x - half &&
        this.x <= obs.x + half &&
        nextZ >= obs.z - half &&
        nextZ <= obs.z + half
      ) {
        nextZ = this.z; // Z축 충돌 차단
      }
    }

    this.x = nextX;
    this.z = nextZ;
  }
}

// ==========================================
// 6. AI 컨트롤러 로직 (2 vs 2 대전)
// ==========================================
class AIController {
  constructor(character) {
    this.char = character;
    this.actionTimer = 0;
    this.strafeDir = 1;
    this.strafeTimer = 0;
  }

  update(dt, game) {
    const me = this.char;
    if (me.status !== 'normal') return;

    this.actionTimer -= dt;
    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeDir = Math.random() < 0.5 ? 1 : -1;
      this.strafeTimer = 1.0 + Math.random() * 1.5;
    }

    // 1순위: 아군이 버블 상태인가? -> 헬프(HELP) 구출하러 이동!
    const allyBubble = game.characters.find(c => c.team === me.team && c !== me && c.status === 'bubble');
    if (allyBubble) {
      this.moveTowards(allyBubble.x, allyBubble.z, dt, game);
      // 아군과 닿으면 헬프는 메인 루프에서 접촉 감지로 자동 발동
      return;
    }

    // 2순위: 적군 중 버블 상태인 적이 있는가? -> 근접해서 팡(PANG!) 시도!
    const enemyBubble = game.characters.find(c => c.team !== me.team && c.status === 'bubble');
    if (enemyBubble) {
      const dist = Math.hypot(enemyBubble.x - me.x, enemyBubble.z - me.z);
      this.lookAt(enemyBubble.x, enemyBubble.z);

      if (dist > 2.0) {
        this.moveTowards(enemyBubble.x, enemyBubble.z, dt, game);
      } else {
        // 근접 시 망치로 스왑하여 확정 팡!
        me.switchWeapon(3);
        me.shoot(game);
      }
      return;
    }

    // 3순위: 일반 전투 -> 가장 가까운 적을 찾아 사격 & 거리 유지
    const livingEnemies = game.characters.filter(c => c.team !== me.team && c.status === 'normal');
    if (livingEnemies.length === 0) return;

    // 가장 가까운 적 탐색
    let target = livingEnemies[0];
    let minDist = Math.hypot(target.x - me.x, target.z - me.z);
    for (let i = 1; i < livingEnemies.length; i++) {
      const d = Math.hypot(livingEnemies[i].x - me.x, livingEnemies[i].z - me.z);
      if (d < minDist) {
        minDist = d;
        target = livingEnemies[i];
      }
    }

    this.lookAt(target.x, target.z);

    // 거리별 무기 스왑 & 이동
    if (minDist > 14) {
      me.switchWeapon(2); // 원거리는 물총
      this.moveTowards(target.x, target.z, dt, game);
    } else if (minDist < 6) {
      me.switchWeapon(1); // 근거리는 샷건
      // 적절한 거리 유지를 위해 좌우 스트레이프 및 약간 후퇴
      const awayX = me.x - target.x;
      const awayZ = me.z - target.z;
      const len = Math.hypot(awayX, awayZ) || 1;
      const strafeX = -awayZ / len * this.strafeDir;
      const strafeZ = awayX / len * this.strafeDir;

      me.moveWithCollision((strafeX * 0.6 + awayX / len * 0.4) * me.speed * dt, (strafeZ * 0.6 + awayZ / len * 0.4) * me.speed * dt, game.mapObstacles, game.mapBounds);
    } else {
      me.switchWeapon(1);
      // 중거리 스트레이프
      const perpX = Math.cos(me.yaw) * this.strafeDir;
      const perpZ = -Math.sin(me.yaw) * this.strafeDir;
      me.moveWithCollision(perpX * me.speed * 0.7 * dt, perpZ * me.speed * 0.7 * dt, game.mapObstacles, game.mapBounds);
    }

    // 사격 시도
    if (this.actionTimer <= 0) {
      me.shoot(game);
      this.actionTimer = 0.25 + Math.random() * 0.35;
    }
  }

  lookAt(tx, tz) {
    this.char.yaw = Math.atan2(tx - this.char.x, tz - this.char.z);
  }

  moveTowards(tx, tz, dt, game) {
    const dx = tx - this.char.x;
    const dz = tz - this.char.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.3) {
      this.lookAt(tx, tz);
      const moveX = (dx / dist) * this.char.speed * dt;
      const moveZ = (dz / dist) * this.char.speed * dt;
      this.char.moveWithCollision(moveX, moveZ, game.mapObstacles, game.mapBounds);
    }
  }
}

// ==========================================
// 7. 메인 게임 클래스 (Game Engine)
// ==========================================
class BubbleFighterGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.camera = new Camera();

    this.mapBounds = 32; // 맵 크기 (-32 ~ +32)
    this.mapObstacles = [
      { x: -10, z: -8, size: 4, height: 3.5, color: '#f59e0b' },
      { x: 10, z: -8, size: 4, height: 3.5, color: '#f59e0b' },
      { x: -10, z: 8, size: 4, height: 3.5, color: '#f59e0b' },
      { x: 10, z: 8, size: 4, height: 3.5, color: '#f59e0b' },
      { x: 0, z: 0, size: 5, height: 4.2, color: '#3b82f6' },
      { x: 0, z: -18, size: 6, height: 3, color: '#10b981' },
      { x: 0, z: 18, size: 6, height: 3, color: '#10b981' },
      { x: -20, z: 0, size: 4, height: 3.5, color: '#8b5cf6' },
      { x: 20, z: 0, size: 4, height: 3.5, color: '#8b5cf6' }
    ];

    // 스코어 및 경기 시간
    this.scoreBlue = 0;
    this.scoreRed = 0;
    this.targetScore = 10;
    this.matchDuration = 180; // 3분
    this.isGameOver = false;
    this.isPlaying = false;

    // 엔티티 목록
    this.player = new Character(1, '나(Player)', 'blue', true);
    this.characters = [
      this.player,
      new Character(2, '봇 다오(AI)', 'blue', false),
      new Character(3, '적 디지니(AI)', 'red', false),
      new Character(4, '적 모스(AI)', 'red', false)
    ];

    this.aiControllers = [
      new AIController(this.characters[1]),
      new AIController(this.characters[2]),
      new AIController(this.characters[3])
    ];

    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    // 입력 상태
    this.keys = {};
    this.mouse = { x: 0, y: 0, leftDown: false };
    this.isPointerLocked = false;

    this.lastTime = performance.now();

    this.initCanvasSize();
    this.initSpawns();
    this.bindEvents();
    this.updateHUD();

    // 렌더 루프 가동
    requestAnimationFrame((t) => this.loop(t));
  }

  initCanvasSize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initSpawns() {
    this.player.resetPosition(-5, -24, 0);
    this.characters[1].resetPosition(5, -24, 0);
    this.characters[2].resetPosition(-5, 24, Math.PI);
    this.characters[3].resetPosition(5, 24, Math.PI);
  }

  respawnCharacter(char) {
    if (char.team === 'blue') {
      const spawnX = char.isPlayer ? -5 : 5;
      char.resetPosition(spawnX + (Math.random() - 0.5) * 4, -24, 0);
    } else {
      const spawnX = char.id === 3 ? -5 : 5;
      char.resetPosition(spawnX + (Math.random() - 0.5) * 4, 24, Math.PI);
    }
    char.invulnerableTimer = 5.0; // 리스폰 시 5초 무적 보장
    this.addFloatingText('🛡️ 5초 무적!', char.x, char.y + 2.5, char.z, '#fbbf24');
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvasSize());

    // 키보드 조작
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.key === '1') this.player.switchWeapon(1);
      if (e.key === '2') this.player.switchWeapon(2);
      if (e.key === '3') this.player.switchWeapon(3);
      if (e.code === 'KeyR') this.player.reload();
      this.updateHUD();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // 마우스 이동 & 포인터 락
    this.canvas.addEventListener('click', () => {
      sounds.init();
      if (!this.isPointerLocked && this.isPlaying) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.canvas);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPlaying) return;
      if (this.isPointerLocked) {
        const sensitivity = 0.0028;
        this.player.yaw += e.movementX * sensitivity;
        this.camera.pitch = Math.max(-0.45, Math.min(0.55, this.camera.pitch + e.movementY * sensitivity * 0.7));
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.isPlaying) {
        sounds.init();
        this.mouse.leftDown = true;
        this.handlePlayerAction();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
    });

    // 시작 및 재시작 버튼
    document.getElementById('btn-start').addEventListener('click', () => {
      sounds.init();
      document.getElementById('start-screen').classList.add('hidden');
      this.isPlaying = true;
      this.canvas.requestPointerLock();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.restartGame();
    });

    // 무기 슬롯 직접 클릭 지원
    [1, 2, 3].forEach(id => {
      const el = document.getElementById(`slot-${id}`);
      if (el) {
        el.addEventListener('click', () => {
          this.player.switchWeapon(id);
          this.updateHUD();
        });
      }
    });
  }

  handlePlayerAction() {
    if (this.player.status !== 'normal') return;

    // 플레이어가 버블 상태인 적에게 근접해 있을 때 좌클릭하면 즉시 '팡(PANG!)'
    let didPang = false;
    this.characters.forEach(other => {
      if (other.team !== this.player.team && other.status === 'bubble') {
        const dist = Math.hypot(other.x - this.player.x, other.z - this.player.z);
        if (dist <= 3.2) {
          other.popPang(this.player, this);
          didPang = true;
        }
      }
    });

    if (!didPang) {
      this.player.shoot(this);
    }
    this.updateHUD();
  }

  addScore(team, killerName, victimName) {
    if (team === 'blue') {
      this.scoreBlue++;
      this.addFeedMessage(`${killerName}님이 ${victimName}님을 팡(PANG) 했습니다!`, 'blue');
    } else {
      this.scoreRed++;
      this.addFeedMessage(`${killerName}님이 ${victimName}님을 팡(PANG) 했습니다!`, 'red');
    }
    this.updateHUD();

    // 승패 체크
    if (this.scoreBlue >= this.targetScore || this.scoreRed >= this.targetScore) {
      this.endGame();
    }
  }

  addFeedMessage(msg, type = 'blue') {
    const feed = document.getElementById('feed-container');
    const item = document.createElement('div');
    item.className = `feed-item ${type}`;
    item.textContent = msg;
    feed.appendChild(item);
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 4000);
  }

  addParticles(x, y, z, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const speed = 2 + Math.random() * 5;
      const angle = Math.random() * Math.PI * 2;
      const vy = 1 + Math.random() * 4;
      this.particles.push(
        new Particle(
          x, y, z,
          Math.cos(angle) * speed,
          vy,
          Math.sin(angle) * speed,
          color,
          0.12 + Math.random() * 0.18,
          0.5 + Math.random() * 0.4
        )
      );
    }
  }

  addFloatingText(text, x, y, z, color) {
    this.floatingTexts.push(new FloatingText(text, x, y, z, color));
  }

  endGame() {
    this.isGameOver = true;
    this.isPlaying = false;
    if (document.exitPointerLock) document.exitPointerLock();

    const modal = document.getElementById('game-over-screen');
    const title = document.getElementById('game-result-title');
    const desc = document.getElementById('game-result-desc');
    const scoreText = document.getElementById('final-score-text');

    scoreText.textContent = `${this.scoreBlue} : ${this.scoreRed}`;
    if (this.scoreBlue >= this.scoreRed) {
      title.textContent = 'VICTORY! 🏆';
      title.style.color = '#38bdf8';
      desc.textContent = '블루팀이 승리했습니다! 환상적인 팡 플레이!';
    } else {
      title.textContent = 'DEFEAT... 💧';
      title.style.color = '#ef4444';
      desc.textContent = '레드팀에 패배했습니다. 다음 판에 도전해보세요!';
    }

    modal.classList.remove('hidden');
  }

  restartGame() {
    this.scoreBlue = 0;
    this.scoreRed = 0;
    this.matchDuration = 180;
    this.isGameOver = false;
    this.isPlaying = true;
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.initSpawns();
    this.updateHUD();

    document.getElementById('game-over-screen').classList.add('hidden');
    this.canvas.requestPointerLock();
  }

  // ==========================================
  // 업데이트 루프
  // ==========================================
  update(dt) {
    if (!this.isPlaying) return;

    // 경기 타이머 감소
    this.matchDuration -= dt;
    if (this.matchDuration <= 0) {
      this.matchDuration = 0;
      this.endGame();
      return;
    }

    // 1. 플레이어 이동 입력
    if (this.player.status === 'normal') {
      let moveX = 0;
      let moveZ = 0;
      if (this.keys['KeyW']) moveZ += 1;
      if (this.keys['KeyS']) moveZ -= 1;
      if (this.keys['KeyA']) moveX -= 1;
      if (this.keys['KeyD']) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const len = Math.hypot(moveX, moveZ);
        const normX = moveX / len;
        const normZ = moveZ / len;

        // 카메라/플레이어 Yaw 기준 방향 벡터
        const sinY = Math.sin(this.player.yaw);
        const cosY = Math.cos(this.player.yaw);

        const worldMoveX = (normX * cosY + normZ * sinY) * this.player.speed * dt;
        const worldMoveZ = (-normX * sinY + normZ * cosY) * this.player.speed * dt;

        this.player.moveWithCollision(worldMoveX, worldMoveZ, this.mapObstacles, this.mapBounds);
      }
    }

    // 연사 무기 좌클릭 유지 지원
    if (this.mouse.leftDown && this.player.currentWeaponId === 2) {
      this.handlePlayerAction();
    }

    // 2. 캐릭터 업데이트
    this.characters.forEach(char => char.update(dt, this.mapObstacles, this));

    // 3. AI 업데이트
    this.aiControllers.forEach(ai => ai.update(dt, this));

    // 4. 헬프(HELP) 자동 접촉 감지
    // 같은 팀 캐릭터끼리 거리 2.4 이내로 붙으면 버블 구출
    for (let i = 0; i < this.characters.length; i++) {
      for (let j = i + 1; j < this.characters.length; j++) {
        const c1 = this.characters[i];
        const c2 = this.characters[j];
        if (c1.team === c2.team) {
          const dist = Math.hypot(c1.x - c2.x, c1.z - c2.z);
          if (dist <= 2.4) {
            if (c1.status === 'normal' && c2.status === 'bubble') {
              c2.rescueHelp(c1, this);
            } else if (c2.status === 'normal' && c1.status === 'bubble') {
              c1.rescueHelp(c2, this);
            }
          }
        }
      }
    }

    // 5. 투사체 업데이트 및 피격 충돌 검사
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this.mapObstacles);

      if (!p.alive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // 적중 검사
      for (const char of this.characters) {
        if (char.team !== p.team && char.status === 'normal' && char.invulnerableTimer <= 0) {
          const dist = Math.hypot(char.x - p.x, char.z - p.z);
          if (dist <= char.radius + p.radius && Math.abs(p.y - (char.y + 1.0)) <= 1.2) {
            char.takeDamage(p.damage, p.owner, this);
            this.addParticles(p.x, p.y, p.z, '#00f7ff', 8);
            p.alive = false;
            break;
          }
        }
      }

      if (!p.alive) {
        this.projectiles.splice(i, 1);
      }
    }

    // 6. 파티클 & 텍스트 업데이트
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update(dt);
      if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1);
    }

    // 카메라 추적
    this.camera.update(this.player);

    this.updateHUD();
  }

  updateHUD() {
    // 체력 바
    const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    const hpBar = document.getElementById('health-bar-fill');
    const hpText = document.getElementById('health-text');
    if (hpBar && hpText) {
      hpBar.style.width = `${hpPercent}%`;
      if (this.player.status === 'bubble') {
        hpText.textContent = `🫧 버블 상태 (${Math.ceil(this.player.bubbleTimer)}s)`;
        hpBar.classList.add('low');
      } else {
        hpText.textContent = `${this.player.hp} / ${this.player.maxHp}`;
        if (hpPercent < 30) hpBar.classList.add('low');
        else hpBar.classList.remove('low');
      }
    }

    // 무기 슬롯 상태
    [1, 2, 3].forEach(id => {
      const slot = document.getElementById(`slot-${id}`);
      const ammoTag = document.getElementById(`ammo-${id}`);
      if (slot && ammoTag) {
        if (this.player.currentWeaponId === id) slot.classList.add('active');
        else slot.classList.remove('active');

        if (id === 3) ammoTag.textContent = '∞';
        else ammoTag.textContent = `${this.player.ammo[id]}/${WEAPONS[id].maxAmmo}`;
      }
    });

    // 스코어보드
    document.getElementById('score-blue').textContent = this.scoreBlue;
    document.getElementById('score-red').textContent = this.scoreRed;

    const min = Math.floor(this.matchDuration / 60).toString().padStart(2, '0');
    const sec = Math.floor(this.matchDuration % 60).toString().padStart(2, '0');
    document.getElementById('match-timer').textContent = `${min}:${sec}`;
  }

  // ==========================================
  // 3D 렌더링 파이프라인
  // ==========================================
  render() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 화사하고 깊이감 있는 아쿠아 그라디언트 배경
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0c1b33');
    bgGrad.addColorStop(0.45, '#132e57');
    bgGrad.addColorStop(0.5, '#1e488f');
    bgGrad.addColorStop(1, '#081226');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 렌더 큐 (깊이 정렬을 위한 렌더 리스트)
    const renderList = [];

    // 바닥 그리드 타일 등록
    const tileSize = 4;
    for (let x = -this.mapBounds; x < this.mapBounds; x += tileSize) {
      for (let z = -this.mapBounds; z < this.mapBounds; z += tileSize) {
        const centerDist = Math.hypot((x + tileSize / 2) - this.camera.x, (z + tileSize / 2) - this.camera.z);
        if (centerDist < 48) {
          renderList.push({
            type: 'tile',
            depth: centerDist,
            x, z, size: tileSize
          });
        }
      }
    }

    // 블루팀 & 레드팀 스폰 패드 룬 등록
    renderList.push({
      type: 'spawnPad',
      depth: Math.hypot(0 - this.camera.x, -24 - this.camera.z),
      x: 0, z: -24, radius: 7, team: 'blue'
    });
    renderList.push({
      type: 'spawnPad',
      depth: Math.hypot(0 - this.camera.x, 24 - this.camera.z),
      x: 0, z: 24, radius: 7, team: 'red'
    });

    // 맵 외곽 네온 펜스 기둥 등록
    const fenceStep = 8;
    for (let i = -this.mapBounds; i <= this.mapBounds; i += fenceStep) {
      // 상하 벽
      [-this.mapBounds, this.mapBounds].forEach(pz => {
        renderList.push({
          type: 'fencePost',
          depth: Math.hypot(i - this.camera.x, pz - this.camera.z),
          x: i, z: pz
        });
      });
      // 좌우 벽
      [-this.mapBounds, this.mapBounds].forEach(px => {
        if (i !== -this.mapBounds && i !== this.mapBounds) {
          renderList.push({
            type: 'fencePost',
            depth: Math.hypot(px - this.camera.x, i - this.camera.z),
            x: px, z: i
          });
        }
      });
    }

    // 엄폐물 상자 등록
    this.mapObstacles.forEach(obs => {
      const d = Math.hypot(obs.x - this.camera.x, obs.z - this.camera.z);
      renderList.push({
        type: 'box',
        depth: d,
        obs
      });
    });

    // 캐릭터 등록
    this.characters.forEach(char => {
      if (char.status === 'defeated') return;
      const d = Math.hypot(char.x - this.camera.x, char.z - this.camera.z);
      renderList.push({
        type: 'character',
        depth: d,
        char
      });
    });

    // 탄환 등록
    this.projectiles.forEach(p => {
      const d = Math.hypot(p.x - this.camera.x, p.z - this.camera.z);
      renderList.push({
        type: 'projectile',
        depth: d,
        p
      });
    });

    // 파티클 등록
    this.particles.forEach(pt => {
      const d = Math.hypot(pt.x - this.camera.x, pt.z - this.camera.z);
      renderList.push({
        type: 'particle',
        depth: d,
        pt
      });
    });

    // 플로팅 텍스트 등록
    this.floatingTexts.forEach(ft => {
      const d = Math.hypot(ft.x - this.camera.x, ft.z - this.camera.z);
      renderList.push({
        type: 'text',
        depth: d,
        ft
      });
    });

    // 3. Z-Sorting (먼 객체부터 가까운 객체 순으로 드로잉)
    renderList.sort((a, b) => b.depth - a.depth);

    // 4. 오브젝트별 절차적 드로잉
    renderList.forEach(item => {
      switch (item.type) {
        case 'tile':
          this.drawTile(item.x, item.z, item.size);
          break;
        case 'spawnPad':
          this.drawSpawnPad(item.x, item.z, item.radius, item.team);
          break;
        case 'fencePost':
          this.drawFencePost(item.x, item.z);
          break;
        case 'box':
          this.drawBox(item.obs);
          break;
        case 'character':
          this.drawCharacter(item.char);
          break;
        case 'projectile':
          this.drawProjectile(item.p);
          break;
        case 'particle':
          this.drawParticle(item.pt);
          break;
        case 'text':
          this.drawFloatingText(item.ft);
          break;
      }
    });
  }

  // 타일 드로잉 (세련된 아쿠아 체스판 패턴)
  drawTile(x, z, size) {
    const p1 = this.camera.project(x, 0, z, this.canvas.width, this.canvas.height);
    const p2 = this.camera.project(x + size, 0, z, this.canvas.width, this.canvas.height);
    const p3 = this.camera.project(x + size, 0, z + size, this.canvas.width, this.canvas.height);
    const p4 = this.camera.project(x, 0, z + size, this.canvas.width, this.canvas.height);

    if (!p1 || !p2 || !p3 || !p4) return;

    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.lineTo(p3.x, p3.y);
    this.ctx.lineTo(p4.x, p4.y);
    this.ctx.closePath();

    const isEven = (Math.floor(x / size) + Math.floor(z / size)) % 2 === 0;
    this.ctx.fillStyle = isEven ? '#1e3860' : '#142542';
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  // 스폰 구역 팀 룬 패드
  drawSpawnPad(x, z, radius, team) {
    const proj = this.camera.project(x, 0.04, z, this.canvas.width, this.canvas.height);
    if (!proj) return;

    const r = radius * (proj.scale / 30) * 12;
    if (r < 5) return;

    const color = team === 'blue' ? '#38bdf8' : '#ef4444';
    this.ctx.save();
    this.ctx.translate(proj.x, proj.y);

    // 바닥 타원 링
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, r, r * 0.45, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = team === 'blue' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    this.ctx.fill();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 10;
    this.ctx.stroke();

    // 내부 회전 룬 서클
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, r * 0.65, r * 0.3, 0, 0, Math.PI * 2);
    this.ctx.setLineDash([6, 6]);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.stroke();
    this.ctx.restore();
  }

  // 외곽 네온 펜스 기둥
  drawFencePost(x, z) {
    const bot = this.camera.project(x, 0, z, this.canvas.width, this.canvas.height);
    const top = this.camera.project(x, 3.5, z, this.canvas.width, this.canvas.height);
    if (!bot || !top) return;

    const { ctx } = this;
    const postWidth = Math.max(2, 6 * (bot.scale / 30));

    // 기둥 몸체
    ctx.beginPath();
    ctx.moveTo(bot.x - postWidth / 2, bot.y);
    ctx.lineTo(top.x - postWidth / 2, top.y);
    ctx.lineTo(top.x + postWidth / 2, top.y);
    ctx.lineTo(bot.x + postWidth / 2, bot.y);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();

    // 상단 네온 발광 구체
    const orbR = Math.max(3, 8 * (top.scale / 30));
    ctx.beginPath();
    ctx.arc(top.x, top.y, orbR, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // 3D 큐브 엄폐물 드로잉 (선물상자 / 아케이드 워터 블록)
  drawBox(obs) {
    const s = obs.size / 2;
    const h = obs.height;
    const corners = [
      { x: obs.x - s, y: 0, z: obs.z - s },
      { x: obs.x + s, y: 0, z: obs.z - s },
      { x: obs.x + s, y: 0, z: obs.z + s },
      { x: obs.x - s, y: 0, z: obs.z + s },
      { x: obs.x - s, y: h, z: obs.z - s },
      { x: obs.x + s, y: h, z: obs.z - s },
      { x: obs.x + s, y: h, z: obs.z + s },
      { x: obs.x - s, y: h, z: obs.z + s }
    ].map(p => this.camera.project(p.x, p.y, p.z, this.canvas.width, this.canvas.height));

    if (corners.some(c => c === null)) return;

    const { ctx } = this;

    // 1. 앞면 (Front Face)
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[4].x, corners[4].y);
    ctx.closePath();
    ctx.fillStyle = obs.color;
    ctx.fill();
    // 명암 섀도우
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. 윗면 (Top Face - 밝고 광택감 있게)
    ctx.beginPath();
    ctx.moveTo(corners[4].x, corners[4].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fillStyle = obs.color;
    ctx.fill();

    // 윗면 하이라이트 베벨 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 상단 십자 리본 장식
    const topCenter = {
      x: (corners[4].x + corners[5].x + corners[6].x + corners[7].x) / 4,
      y: (corners[4].y + corners[5].y + corners[6].y + corners[7].y) / 4
    };
    ctx.beginPath();
    ctx.arc(topCenter.x, topCenter.y, Math.max(3, 8 * (corners[4].scale / 30)), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // 캐릭터 드로잉 (귀여운 캐주얼 SD 3D 스타일)
  drawCharacter(char) {
    const drawY = char.y + (char.status === 'bubble' ? char.bubbleFloatY : 0);
    const proj = this.camera.project(char.x, drawY + 1.1, char.z, this.canvas.width, this.canvas.height);
    if (!proj) return;

    const { ctx } = this;
    const baseRadius = 24 * (proj.scale / 30);
    if (baseRadius < 2) return;

    ctx.save();
    ctx.translate(proj.x, proj.y);

    const isBlue = char.team === 'blue';
    const mainColor = isBlue ? '#38bdf8' : '#ef4444';
    const darkColor = isBlue ? '#0284c7' : '#dc2626';
    const lightColor = isBlue ? '#bae6fd' : '#fecaca';

    // 1. 발밑 부드러운 그림자
    const shadowProj = this.camera.project(char.x, 0.05, char.z, this.canvas.width, this.canvas.height);
    if (shadowProj) {
      ctx.save();
      ctx.translate(shadowProj.x - proj.x, shadowProj.y - proj.y);
      ctx.beginPath();
      ctx.ellipse(0, 0, baseRadius * 1.15, baseRadius * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();
      ctx.restore();
    }

    // 버블 상태일 때 캐릭터가 귀엽게 갸우뚱 흔들리는 모션
    if (char.status === 'bubble') {
      const rockAngle = Math.sin(Date.now() * 0.007) * 0.18;
      ctx.rotate(rockAngle);
    }

    // 2. 등 뒤 물탱크 배낭
    ctx.save();
    const tankWidth = baseRadius * 0.7;
    const tankHeight = baseRadius * 1.1;
    ctx.beginPath();
    ctx.roundRect(-tankWidth / 2, -tankHeight * 0.3, tankWidth, tankHeight, 8);
    ctx.fillStyle = '#334155';
    ctx.fill();
    // 물탱크 내부 차오른 물
    ctx.beginPath();
    ctx.roundRect(-tankWidth / 2 + 2, -tankHeight * 0.1, tankWidth - 4, tankHeight * 0.75, 6);
    ctx.fillStyle = mainColor;
    ctx.fill();
    ctx.restore();

    // 3. 둥글둥글한 몸통
    ctx.beginPath();
    ctx.ellipse(0, baseRadius * 0.42, baseRadius * 0.72, baseRadius * 0.78, 0, 0, Math.PI * 2);
    ctx.fillStyle = darkColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. 머리 (대두 헬멧 + 꼭지)
    // 헬멧 입체 3단 그라디언트
    const headGrad = ctx.createRadialGradient(
      -baseRadius * 0.3, -baseRadius * 0.35, baseRadius * 0.1,
      0, -baseRadius * 0.1, baseRadius * 1.05
    );
    headGrad.addColorStop(0, '#ffffff');
    headGrad.addColorStop(0.25, lightColor);
    headGrad.addColorStop(0.65, mainColor);
    headGrad.addColorStop(1, darkColor);

    ctx.beginPath();
    ctx.arc(0, -baseRadius * 0.1, baseRadius * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = headGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2 * (proj.scale / 30);
    ctx.stroke();

    // 헬멧 꼭대기 귀여운 물방울 꼭지
    ctx.beginPath();
    ctx.arc(0, -baseRadius * 1.08, baseRadius * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 5. 물안경 (고글) 및 눈동자
    const relYaw = char.yaw - this.camera.yaw;
    const eyeOffsetX = Math.sin(relYaw) * baseRadius * 0.55;
    const goggleW = baseRadius * 0.72;
    const goggleH = baseRadius * 0.42;

    // 고글 두툼한 테두리
    ctx.beginPath();
    ctx.ellipse(eyeOffsetX, -baseRadius * 0.08, goggleW * 0.5, goggleH * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 고글 렌즈 안의 귀여운 눈동자
    const pupilX = eyeOffsetX + Math.sin(relYaw) * 3;
    ctx.beginPath();
    ctx.arc(pupilX, -baseRadius * 0.08, baseRadius * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // 눈동자 하이라이트 빛반사 2개
    ctx.beginPath();
    ctx.arc(pupilX - 2, -baseRadius * 0.08 - 2, baseRadius * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pupilX + 2, -baseRadius * 0.08 + 2, baseRadius * 0.03, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 6. 무기 렌더링 (망치 스윙 잔상 또는 총신)
    if (char.status === 'normal') {
      const weapon = WEAPONS[char.currentWeaponId];
      ctx.save();
      const handX = eyeOffsetX + (isBlue ? baseRadius * 0.75 : -baseRadius * 0.75);
      const handY = baseRadius * 0.35;

      if (weapon.id === 3) {
        // 망치 (노란 스트라이프 뿅망치)
        const swingAngle = char.swingAnimTimer > 0 ? (char.swingAnimTimer / 0.3) * Math.PI : 0;
        ctx.translate(handX, handY);
        ctx.rotate(-0.5 + swingAngle);

        // 자루
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-2, -baseRadius * 1.1, 5, baseRadius * 1.1);

        // 뿅망치 헤드
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-baseRadius * 0.5, -baseRadius * 1.4, baseRadius * 1.0, baseRadius * 0.45);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-baseRadius * 0.15, -baseRadius * 1.4, baseRadius * 0.3, baseRadius * 0.45);
      } else {
        // 총기 (두툼한 워터 캐논)
        ctx.fillStyle = weapon.color;
        ctx.fillRect(handX - 5, handY - 6, 10, baseRadius * 0.85);
        // 총구 노즐
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(handX - 3, handY + baseRadius * 0.65, 6, 4);
      }
      ctx.restore();
    }

    // 7. 5초 무적 쉴드 돔 연출 (리스폰 무적)
    if (char.invulnerableTimer > 0) {
      const shieldR = baseRadius * 1.6;
      const shieldPulse = Math.sin(Date.now() * 0.01) * 3;
      const finalR = shieldR + shieldPulse;

      ctx.save();
      // 회전하는 쉴드 돔
      const rot = (Date.now() * 0.003) % (Math.PI * 2);
      ctx.rotate(rot);

      ctx.beginPath();
      ctx.arc(0, 0, finalR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.stroke();

      // 빛나는 쉴드 외곽 오라
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();

      // 무적 시간 카운트다운 텍스트 표시
      ctx.font = `900 ${Math.max(10, 13 * (proj.scale / 30))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(`🛡️ 무적 (${char.invulnerableTimer.toFixed(1)}s)`, 0, -baseRadius * 1.85);
      ctx.shadowBlur = 0;
    }

    // 8. 버블 상태 효과 (초롱초롱한 무지개빛 비눗방울)
    if (char.status === 'bubble') {
      const bubbleR = baseRadius * 1.95;
      const bGrad = ctx.createRadialGradient(
        -bubbleR * 0.35, -bubbleR * 0.35, bubbleR * 0.1,
        0, 0, bubbleR
      );
      bGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      bGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.45)');
      bGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.4)');
      bGrad.addColorStop(1, 'rgba(37, 99, 235, 0.65)');

      ctx.beginPath();
      ctx.arc(0, 0, bubbleR, 0, Math.PI * 2);
      ctx.fillStyle = bGrad;
      ctx.fill();

      // 비눗방울 테두리
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // 3중 하이라이트 반사광
      ctx.beginPath();
      ctx.ellipse(-bubbleR * 0.48, -bubbleR * 0.48, bubbleR * 0.32, bubbleR * 0.14, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bubbleR * 0.45, bubbleR * 0.45, bubbleR * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();

      // 버블 머리 위 안내 뱃지
      ctx.font = `bold ${Math.max(10, 13 * (proj.scale / 30))}px sans-serif`;
      ctx.textAlign = 'center';
      if (char.team === this.player.team) {
        ctx.fillStyle = '#34d399';
        ctx.fillText('⚡ 접촉 시 HELP!', 0, -bubbleR - 12);
      } else {
        ctx.fillStyle = '#f87171';
        ctx.fillText('💥 근접 클릭 PANG!', 0, -bubbleR - 12);
      }
    }

    // 9. 이름 및 HP 게이지 (캐릭터 상단)
    ctx.font = `bold ${Math.max(9, 12 * (proj.scale / 30))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isBlue ? '#7dd3fc' : '#fca5a5';
    ctx.fillText(char.name, 0, -baseRadius * 1.4);

    if (char.status === 'normal') {
      const barW = baseRadius * 1.6;
      const barH = 5;
      const barY = -baseRadius * 1.25;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.roundRect(-barW / 2, barY, barW, barH, 2);
      ctx.fill();

      ctx.fillStyle = isBlue ? '#38bdf8' : '#ef4444';
      ctx.roundRect(-barW / 2, barY, barW * (char.hp / char.maxHp), barH, 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 투사체 드로잉 (영롱한 물방울 형태)
  drawProjectile(p) {
    const proj = this.camera.project(p.x, p.y, p.z, this.canvas.width, this.canvas.height);
    if (!proj) return;

    const r = Math.max(3, 7 * (proj.scale / 30));
    const isBlue = p.team === 'blue';
    const color = isBlue ? '#38bdf8' : '#f87171';

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 10;
    this.ctx.fill();

    // 물방울 반사광
    this.ctx.beginPath();
    this.ctx.arc(proj.x - r * 0.3, proj.y - r * 0.3, r * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    this.ctx.restore();
  }

  // 파티클 드로잉
  drawParticle(pt) {
    const proj = this.camera.project(pt.x, pt.y, pt.z, this.canvas.width, this.canvas.height);
    if (!proj) return;

    const r = Math.max(1, (pt.size * 20) * (proj.scale / 30));
    const alpha = Math.max(0, pt.life / pt.maxLife);

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.beginPath();
    this.ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = pt.color;
    this.ctx.fill();
    this.ctx.restore();
  }

  // 플로팅 텍스트 드로잉
  drawFloatingText(ft) {
    const proj = this.camera.project(ft.x, ft.y, ft.z, this.canvas.width, this.canvas.height);
    if (!proj) return;

    const alpha = Math.max(0, ft.life / ft.maxLife);
    const fontSize = Math.max(12, 22 * (proj.scale / 30));

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.font = `900 ${fontSize}px 'Segoe UI', sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = ft.color;
    this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 6;
    this.ctx.fillText(ft.text, proj.x, proj.y);
    this.ctx.restore();
  }

  // 메인 게임 루프
  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// 윈도우 로드 시 자동 실행
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new BubbleFighterGame();
});

