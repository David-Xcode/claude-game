# Systemic Bug Fix: Event Leaks, Scene-Active Guards, Safe Area Compliance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three verified systemic issues: event listener leaks in Space Shooter, missing scene-active guards across all games, and safe area compliance gaps in Hub/board game scenes.

**Architecture:** Fixes are surgical — no refactoring, no new abstractions. Each task modifies 1-3 files with minimal blast radius. The event leak fix adds `destroy()` to WaveManager and cleanup to BossSpawner/ShooterGameScene. Scene-active guards follow the existing `ShooterPlayer.takeDamage()` pattern. Safe area fixes apply the existing `layout.safeTop + layout.scale()` pattern already used in ShooterHUDScene and PA HUDScene.

**Tech Stack:** Phaser 3, TypeScript, Vite

---

### Task 1: Fix WaveManager `enemyDrop` Listener Leak

**Files:**
- Modify: `src/games/space-shooter/systems/WaveManager.ts:65-68`
- Modify: `src/games/space-shooter/scenes/ShooterGameScene.ts:446-454`

- [ ] **Step 1: Store listener reference and add destroy() to WaveManager**

In `src/games/space-shooter/systems/WaveManager.ts`, change the anonymous arrow function to a stored reference, and add a `destroy()` method:

```typescript
// At the top of the class, add a field (after line 47):
private onEnemyDrop: (x: number, y: number, type: PowerUpType) => void;

// Replace lines 65-68 (the constructor listener registration):
this.onEnemyDrop = (x: number, y: number, type: PowerUpType) => {
  this.spawnPowerUp(x, y, type);
};
this.scene.events.on('enemyDrop', this.onEnemyDrop);

// Add destroy() method at the end of the class (before the closing brace):
destroy(): void {
  this.scene.events.off('enemyDrop', this.onEnemyDrop);
}
```

- [ ] **Step 2: Call WaveManager.destroy() from ShooterGameScene.shutdown()**

In `src/games/space-shooter/scenes/ShooterGameScene.ts`, add cleanup before the existing `Object.values` line (line 452):

```typescript
// Add after line 450 (this.enemyBullets?.clear();):
this.waveManager?.destroy();
```

- [ ] **Step 3: Verify — run dev server and play through Stage 1 → Stage 2 transition**

```bash
lsof -ti :3000 | xargs kill -9 2>/dev/null; npm run dev
```

Open Space Shooter, play through Stage 1, advance to Stage 2, kill an enemy — verify only ONE power-up drops (not two).

- [ ] **Step 4: Commit**

```bash
git add src/games/space-shooter/systems/WaveManager.ts src/games/space-shooter/scenes/ShooterGameScene.ts
git commit -m "$(cat <<'EOF'
fix: prevent enemyDrop listener leak across stage restarts

WaveManager registered an anonymous listener on each scene restart
that was never removed, causing duplicate power-up drops in later stages.
EOF
)"
```

---

### Task 2: Fix BossSpawner `bossExplosion` Listener Leak

**Files:**
- Modify: `src/games/space-shooter/systems/BossSpawner.ts:71-74`
- Modify: `src/games/space-shooter/scenes/ShooterGameScene.ts:446-454`

- [ ] **Step 1: Change `.on()` to `.once()` for bossExplosion forwarding**

The `bossExplosion` listener only needs to live for the duration of one Boss3 fight. Since Boss3 emits this event during its death animation (a one-time sequence), and the scene restarts after the stage clears, using event-name-based cleanup in shutdown is the cleanest fix.

In `src/games/space-shooter/systems/BossSpawner.ts`, replace lines 71-74:

```typescript
// 监听多段爆炸事件（由 Boss3 的死亡动画触发）
// 使用具名事件，在 shutdown 中统一清理
scene.events.on('bossExplosion', (x: number, y: number) => {
  scene.events.emit('explosion', x, y);
});
```

No change to BossSpawner itself — the fix is in ShooterGameScene shutdown.

In `src/games/space-shooter/scenes/ShooterGameScene.ts`, add `bossExplosion` cleanup to `shutdown()`. After the `Object.values(SHOOTER_EVENTS).forEach(...)` line (line 452), add:

```typescript
this.events.removeAllListeners('bossExplosion');
```

- [ ] **Step 2: Commit**

```bash
git add src/games/space-shooter/systems/BossSpawner.ts src/games/space-shooter/scenes/ShooterGameScene.ts
git commit -m "$(cat <<'EOF'
fix: clean up bossExplosion listener on scene shutdown

The ad-hoc bossExplosion event was not in SHOOTER_EVENTS and escaped
the shutdown cleanup loop, accumulating on each Stage 2 restart.
EOF
)"
```

---

### Task 3: Add Scene-Active Guard to Player.takeDamage() (Pixel Adventure)

**Files:**
- Modify: `src/games/pixel-adventure/entities/Player.ts:224-226`

- [ ] **Step 1: Add guard matching ShooterPlayer pattern**

In `src/games/pixel-adventure/entities/Player.ts`, replace the tween `onComplete` (lines 224-226):

```typescript
onComplete: () => {
  if (this.scene?.sys?.isActive()) {
    this.alpha = 1;
  }
},
```

- [ ] **Step 2: Commit**

```bash
git add src/games/pixel-adventure/entities/Player.ts
git commit -m "$(cat <<'EOF'
fix: guard Player tween onComplete against inactive scene

Matches the existing pattern in ShooterPlayer.takeDamage() to prevent
setting alpha on a destroyed sprite after scene shutdown.
EOF
)"
```

---

### Task 4: Add Scene-Active Guard to Boss3 Death Animation

**Files:**
- Modify: `src/games/space-shooter/entities/bosses/Boss3_Mothership.ts:266-280`

- [ ] **Step 1: Guard inner tint-clear callback and final cleanup callback**

In `src/games/space-shooter/entities/bosses/Boss3_Mothership.ts`, replace line 267-268 (the inner tint-clear callback):

```typescript
this.scene.time.delayedCall(80, () => {
  if (this.scene?.sys?.isActive() && this.visible) this.clearTint();
});
```

Replace lines 277-280 (the final cleanup callback):

```typescript
this.scene.time.delayedCall(explosionCount * 350 + 200, () => {
  if (!this.scene?.sys?.isActive()) return;
  this.setActive(false);
  this.setVisible(false);
});
```

- [ ] **Step 2: Commit**

```bash
git add src/games/space-shooter/entities/bosses/Boss3_Mothership.ts
git commit -m "$(cat <<'EOF'
fix: guard Boss3 death animation callbacks against inactive scene

Inner tint-clear and final cleanup timers now check scene active state
to prevent operating on destroyed objects during scene transitions.
EOF
)"
```

---

### Task 5: Add Scene-Active Guard to ShooterPlayer.die()

**Files:**
- Modify: `src/games/space-shooter/entities/ShooterPlayer.ts:362-365`

- [ ] **Step 1: Guard die() tween onComplete**

In `src/games/space-shooter/entities/ShooterPlayer.ts`, replace lines 362-365:

```typescript
onComplete: () => {
  if (!this.scene?.sys?.isActive()) return;
  this.setVisible(false);
  this.onDeath?.();
},
```

- [ ] **Step 2: Commit**

```bash
git add src/games/space-shooter/entities/ShooterPlayer.ts
git commit -m "$(cat <<'EOF'
fix: guard ShooterPlayer die() tween against inactive scene
EOF
)"
```

---

### Task 6: Add Scene-Active Guard to Board Game AI Callbacks

**Files:**
- Modify: `src/games/gomoku/scenes/GomokuGameScene.ts:181-189`
- Modify: `src/games/xiangqi/scenes/XiangqiGameScene.ts:195-206`
- Modify: `src/games/gomoku/scenes/GomokuGameScene.ts:204-216`
- Modify: `src/games/xiangqi/scenes/XiangqiGameScene.ts:214-225`

- [ ] **Step 1: Guard Gomoku scheduleAIMove callback**

In `src/games/gomoku/scenes/GomokuGameScene.ts`, replace line 182:

```typescript
if (this.gameEnded || !this.ai || !this.sys.isActive()) {
```

- [ ] **Step 2: Guard Gomoku handleGameEnd callback**

In `src/games/gomoku/scenes/GomokuGameScene.ts`, replace lines 204-205 (the `delayedCall` in `handleGameEnd`):

```typescript
this.time.delayedCall(GOMOKU.WIN_DELAY, () => {
  if (!this.sys.isActive()) return;
```

- [ ] **Step 3: Guard Xiangqi scheduleAIMove callback**

In `src/games/xiangqi/scenes/XiangqiGameScene.ts`, replace line 196:

```typescript
if (this.gameEnded || !this.ai || !this.sys.isActive()) {
```

- [ ] **Step 4: Guard Xiangqi handleGameEnd callback**

In `src/games/xiangqi/scenes/XiangqiGameScene.ts`, replace lines 214-215:

```typescript
this.time.delayedCall(XIANGQI.WIN_DELAY, () => {
  if (!this.sys.isActive()) return;
```

- [ ] **Step 5: Commit**

```bash
git add src/games/gomoku/scenes/GomokuGameScene.ts src/games/xiangqi/scenes/XiangqiGameScene.ts
git commit -m "$(cat <<'EOF'
fix: guard board game AI and endgame callbacks against inactive scene

Both scheduleAIMove and handleGameEnd now check this.sys.isActive()
to prevent executing game logic after scene shutdown during fast quit.
EOF
)"
```

---

### Task 7: Fix HubScene Title Safe Area

**Files:**
- Modify: `src/hub/HubScene.ts:112-142`

- [ ] **Step 1: Replace hardcoded Y values with safe-area-aware positioning**

In `src/hub/HubScene.ts`, in `createTitle()`, replace the three `.text(...)` calls (lines 113, 125, 136).

Replace `50` in lines 113 and 125 with `layout.safeTop + layout.scale(30)`:

```typescript
// Line 113 (glow layer):
.text(layout.width / 2, layout.safeTop + layout.scale(30), 'GAME ARCADE', {

// Line 125 (main title):
.text(layout.width / 2, layout.safeTop + layout.scale(30), 'GAME ARCADE', {

// Line 136 (subtitle):
.text(layout.width / 2, layout.safeTop + layout.scale(60), '- Choose Your Game -', {
```

- [ ] **Step 2: Commit**

```bash
git add src/hub/HubScene.ts
git commit -m "$(cat <<'EOF'
fix: use layout.safeTop for Hub title positioning

Hardcoded Y=50/85 was hidden behind notch/Dynamic Island on iOS PWA.
Now uses safeTop + scale() matching the pattern in other scenes.
EOF
)"
```

---

### Task 8: Fix Board Game Title Scene Back Buttons Safe Area

**Files:**
- Modify: `src/games/gomoku/scenes/GomokuTitleScene.ts:116`
- Modify: `src/games/xiangqi/scenes/XiangqiTitleScene.ts:125`

- [ ] **Step 1: Add safeLeft/safeTop to Gomoku back button**

In `src/games/gomoku/scenes/GomokuTitleScene.ts`, replace line 116:

```typescript
const backText = this.add.text(layout.safeLeft + layout.scale(20), layout.safeTop + layout.scale(20), backLabel, {
```

- [ ] **Step 2: Add safeLeft/safeTop to Xiangqi back button**

In `src/games/xiangqi/scenes/XiangqiTitleScene.ts`, replace line 125:

```typescript
const backText = this.add.text(layout.safeLeft + layout.scale(20), layout.safeTop + layout.scale(20), backLabel, {
```

- [ ] **Step 3: Commit**

```bash
git add src/games/gomoku/scenes/GomokuTitleScene.ts src/games/xiangqi/scenes/XiangqiTitleScene.ts
git commit -m "$(cat <<'EOF'
fix: add safe area insets to board game title back buttons

Back buttons used layout.scale(20) without safeLeft/safeTop, causing
overlap with notch/status bar on iOS devices.
EOF
)"
```

---

### Task 9: Fix Board Game HUD Scenes Safe Area

**Files:**
- Modify: `src/games/gomoku/scenes/GomokuHUDScene.ts:126,138`
- Modify: `src/games/xiangqi/scenes/XiangqiHUDScene.ts:153,177`

- [ ] **Step 1: Fix Gomoku HUD top-anchored elements**

In `src/games/gomoku/scenes/GomokuHUDScene.ts`:

Replace line 126 (move counter Y):
```typescript
.text(layout.width / 2, layout.safeTop + layout.scale(16), `Move: ${this.currentMoveCount}`, {
```

Replace line 138 (pause button Y):
```typescript
.text(layout.width - layout.scale(30), layout.safeTop + layout.scale(16), '❚❚', {
```

- [ ] **Step 2: Fix Xiangqi HUD top-anchored elements**

In `src/games/xiangqi/scenes/XiangqiHUDScene.ts`:

Replace line 153 (move counter Y):
```typescript
.text(layout.width / 2, layout.safeTop + layout.scale(16), `Move: ${this.currentMoveCount}`, {
```

Replace line 177 (pause button Y):
```typescript
.text(layout.width - layout.scale(30), layout.safeTop + layout.scale(16), '❚❚', {
```

- [ ] **Step 3: Commit**

```bash
git add src/games/gomoku/scenes/GomokuHUDScene.ts src/games/xiangqi/scenes/XiangqiHUDScene.ts
git commit -m "$(cat <<'EOF'
fix: add safeTop to board game HUD top-anchored elements

Move counter and pause button used layout.scale(16) without safeTop,
rendering inside the unsafe zone on notch devices.
EOF
)"
```

---

### Task 10: Fix ShooterTitleScene Exclusion Zone

**Files:**
- Modify: `src/games/space-shooter/scenes/ShooterTitleScene.ts:142-143`

- [ ] **Step 1: Replace hardcoded pixel guard with layout-aware calculation**

In `src/games/space-shooter/scenes/ShooterTitleScene.ts`, replace lines 142-143:

```typescript
// 排除左上角返回按钮区域（基于 layout 缩放计算）
if (pointer.x < layout.safeLeft + layout.scale(160) && pointer.y < layout.safeTop + layout.scale(50)) return;
```

- [ ] **Step 2: Commit**

```bash
git add src/games/space-shooter/scenes/ShooterTitleScene.ts
git commit -m "$(cat <<'EOF'
fix: use layout-aware exclusion zone for ShooterTitle back button

Hardcoded 150x50 pixel guard broke on different screen sizes and
didn't account for safe area insets on notch devices.
EOF
)"
```

---

### Task 11: Build Verification

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/david/Desktop/game-test && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds, `dist/` output generated.

- [ ] **Step 3: Commit any remaining fixes if tsc found issues**
