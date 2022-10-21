class App {
  mineStruct: MineStruct;

  constructor() {
    const outputElement = document.createElement('div');
    outputElement.id = 'debug';
    document.body.appendChild(outputElement);

    const bombCount = 60;
    const width = 30;
    const height = 18;

    this.mineStruct = new MineStruct(width, height);
    this.mineStruct.AssignDebug(outputElement);
    this.mineStruct.RandomizeBombs(bombCount);
    this.mineStruct.CalculateBombs();
    this.mineStruct.FillMask(1);

    const sizeX = 22 * this.mineStruct.width;
    const sizeY = 21 * this.mineStruct.height;
    outputElement.oncontextmenu = (e) => false;

    outputElement.onmousedown = (e) => {
      if (this.mineStruct.failed || this.mineStruct.win) {
        this.mineStruct.failed = false;
        this.mineStruct.win = false;

        this.mineStruct.ClearField();
        this.mineStruct.RandomizeBombs(bombCount);
        this.mineStruct.CalculateBombs();
        this.mineStruct.FillMask(1);
        return;
      }

      const x = e.clientX / (sizeX / this.mineStruct.width) >> 0;
      const y = e.clientY / (sizeY / this.mineStruct.height) >> 0;
      if (e.button === 0)
        this.mineStruct.OpenCell(x, y);
      else if (e.button === 1)
        this.mineStruct.OpenAccord(x, y);
      else
        this.mineStruct.ChangeFlag(x, y);
    }
  }

  Init() {

  }
} 