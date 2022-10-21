class MineStruct {
  width: number;
  height: number;
  cells: number[]; // 2 | 4

  bombCount: number;
  maskedCount: number;
  failed: boolean;
  win: boolean;

  debug: HTMLElement;

  constructor(width: number, height: number) {
    width >>= 0;
    height >>= 0;
    this.width = width < 1 ? 1 : width;
    this.height = height < 1 ? 1 : height;
    this.maskedCount = 0;
    this.failed = false;
    this.win = false;

    const n = this.width * this.height;
    this.cells = new Array<number>(n).fill(0);
  }

  RandomizeBombs(count: number) {
    count >>= 0;

    const n = this.width * this.height;
    if (count < 0 || count >= n)
      return;

    this.bombCount = count;

    const dict = new Array<number>(n);
    for (let i = 0; i < n; i++)
      dict[i] = i;

    for (let i = 0; i < count; i++) {
      const r = Math.random() * dict.length >> 0;
      const selectedIndex = dict.splice(r, 1)[0];
      this.cells[selectedIndex] = 0xF;
    }

    this.Update();
  }

  FillMask(mask: number) {
    mask >>= 0;

    mask = (mask & 0x3) << 4;
    const n = this.width * this.height;
    for (let i = 0; i < n; i++)
      this.cells[i] = this.cells[i] & 0xF | mask;

    if (mask !== 0)
      this.maskedCount = this.width * this.height;

    this.Update();
  }

  CalculateBombs() {
    for (let y = 0, i = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++, i++) {
        if ((this.cells[i] & 0xF) === 0xF)
          continue;

        let bombCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0)
              continue;

            const tx = x + dx;
            const ty = y + dy;
            if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height)
              continue;

            const ti = ty * this.width + tx;
            if ((this.cells[ti] & 0xF) === 0xF)
              bombCount++;
          }
        }

        this.cells[i] |= bombCount;
      }
    }

    this.Update();
  }

  ClearField() {
    const n = this.width * this.height;
    for (let i = 0; i < n; i++)
      this.cells[i] &= 0x30;
    this.Update();
  }

  // Gameplay
  ChangeFlag(x: number, y: number) {
    x >>= 0;
    y >>= 0;

    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return;

    const i = y * this.width + x;
    const currentFlag = (this.cells[i] & 0x30) >> 4;
    console.log('currentFlag:', currentFlag);
    this.cells[i] = this.cells[i] & 0xF | [0x00, 0x20, 0x30, 0x10][currentFlag];

    this.Update();
  }

  private OpenCellRecursive(x: number, y: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return;

    const i = y * this.width + x;
    const currentMask = (this.cells[i] & 0x30) >> 4;
    if (currentMask === 2 || currentMask === 0) // If flagged or empty
      return;

    this.cells[i] &= 0xF;
    this.maskedCount--;
    this.UpdateWin();

    if (this.cells[i] === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0)
            continue;
          this.OpenCellRecursive(x + dx, y + dy);
        }
      }
    }
  }

  UpdateWin() {
    this.win = this.maskedCount === this.bombCount;
  }

  OpenCell(x: number, y: number): boolean {
    x >>= 0;
    y >>= 0;

    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return true;

    if (this.failed)
      return false;

    const i = y * this.width + x;

    const currentMask = (this.cells[i] & 0x30) >> 4;
    if (currentMask === 2 || currentMask === 0)
      return true;

    if ((this.cells[i] & 0xF) === 0xF) {
      this.cells = this.cells.map(e => (e & 0xF) === 0xF ? 0xF : e);
      this.failed = true;
      this.Update();
      return false;
    }

    this.OpenCellRecursive(x, y);
    this.Update();
    return true;
  }

  OpenAccord(x: number, y: number): boolean {
    x >>= 0;
    y >>= 0;

    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return true;

    const i = y * this.width + x;

    const currentMask = (this.cells[i] & 0x30) >> 4;
    if (currentMask !== 0)
      return true;

    let maskCount = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0)
          continue;

        const tx = x + dx;
        const ty = y + dy;
        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height)
          continue;

        const ti = ty * this.width + tx;

        if ((this.cells[ti] & 0x30) !== 0)
          maskCount++;
      }
    }

    // Flag Accord
    if (maskCount === (this.cells[i] & 0xF)) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0)
            continue;

          const tx = x + dx;
          const ty = y + dy;
          if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height)
            continue;

          const ti = ty * this.width + tx;
          if ((this.cells[ti] & 0x30) !== 0)
            this.cells[ti] = (this.cells[ti] & 0xF) | 0x20;
        }
      }
      this.Update();
      return true;
    }

    let flagCount = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0)
          continue;

        const tx = x + dx;
        const ty = y + dy;
        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height)
          continue;

        const ti = ty * this.width + tx;
        if ((this.cells[ti] & 0x30) === 0x20)
          flagCount++;
      }
    }

    // Standard Accord
    if (flagCount === (this.cells[i] & 0xF)) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0)
            continue;

          const tx = x + dx;
          const ty = y + dy;
          if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height)
            continue;

          if (!this.OpenCell(tx, ty))
            return false;
        }
      }
    }

    return true;
  }

  // End Gameplay

  AssignDebug(debugElement: HTMLElement) {
    this.debug = debugElement;
  }

  Update() {
    if (!this.debug)
      return;

    let str = '';
    for (let y = 0, i = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++, i++) {
        const cell = this.cells[i];
        const mask = (cell & 0x30) >> 4;
        const value = cell & 0xF;
        if (mask !== 0)
          str += [undefined, '⬜️', '🟥', '#️⃣'][mask];
        else
          str += value === 0xF ? '💣' : value === 0 ? '🟦' : String.fromCharCode(48 + value, 65039, 8419);
      }
      str += '<br>';
    }

    if (this.failed)
      str += "Failed!<br>";
    if (this.win)
      str += "Win!<br>";

    this.debug.innerHTML = str;
  }
}